alter table public.transactions
  add column if not exists type text,
  add column if not exists source_id text,
  add column if not exists source_metadata jsonb,
  add column if not exists account_id uuid,
  add column if not exists from_account_id uuid,
  add column if not exists to_account_id uuid,
  add column if not exists original_transaction_id uuid,
  add column if not exists merchant_name text,
  add column if not exists transaction_date timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.transactions'::regclass
      and conname = 'transactions_account_id_fkey'
  ) then
    alter table public.transactions
      add constraint transactions_account_id_fkey
      foreign key (account_id) references public.financial_accounts (id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.transactions'::regclass
      and conname = 'transactions_from_account_id_fkey'
  ) then
    alter table public.transactions
      add constraint transactions_from_account_id_fkey
      foreign key (from_account_id) references public.financial_accounts (id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.transactions'::regclass
      and conname = 'transactions_to_account_id_fkey'
  ) then
    alter table public.transactions
      add constraint transactions_to_account_id_fkey
      foreign key (to_account_id) references public.financial_accounts (id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.transactions'::regclass
      and conname = 'transactions_original_transaction_id_fkey'
  ) then
    alter table public.transactions
      add constraint transactions_original_transaction_id_fkey
      foreign key (original_transaction_id) references public.transactions (id) on delete set null;
  end if;
end
$$;

alter table public.transactions
  drop constraint if exists transactions_source_check,
  drop constraint if exists transactions_status_check,
  drop constraint if exists transactions_amount_check,
  drop constraint if exists transactions_type_check,
  drop constraint if exists transactions_amount_lifecycle_check,
  drop constraint if exists transactions_transfer_accounts_check;

update public.transactions
set
  type = case
    when type in ('income', 'expense', 'transfer', 'adjustment', 'refund') then type
    when direction in ('income', 'expense', 'transfer') then direction
    when amount < 0 then 'expense'
    else 'income'
  end,
  status = case status
    when 'completed' then 'confirmed'
    when 'flagged' then 'needs_review'
    when 'pending' then 'pending'
    when 'confirmed' then 'confirmed'
    when 'declined' then 'declined'
    when 'duplicate' then 'duplicate'
    when 'needs_review' then 'needs_review'
    else 'confirmed'
  end,
  source = case
    when source in ('manual', 'gmail', 'csv', 'bank_import', 'system') then source
    else 'manual'
  end,
  source_id = coalesce(source_id, gmail_message_id),
  source_metadata = coalesce(source_metadata, raw_payload),
  merchant_name = coalesce(nullif(btrim(merchant_name), ''), merchant),
  transaction_date = coalesce(transaction_date, happened_at, created_at, timezone('utc', now()));

with transaction_lifecycle_text as (
  select
    id,
    concat_ws(
      ' ',
      merchant_name,
      merchant,
      description,
      category,
      reference_number,
      raw_payload::text,
      source_metadata::text
    ) as haystack
  from public.transactions
)
update public.transactions as transactions
set
  type = 'expense',
  direction = 'expense',
  category = case
    when transactions.category = 'transfers' then 'uncategorized'
    else transactions.category
  end
from transaction_lifecycle_text
where transactions.id = transaction_lifecycle_text.id
  and transactions.type = 'transfer'
  and transaction_lifecycle_text.haystack ~* '(bills?[[:space:]]+pay([[:space:]]+receipt)?|bill[[:space:]]+payment([[:space:]]+receipt)?|amount[[:space:]]+paid|total[[:space:]]+paid|paid[[:space:]]+by|purchase[[:space:]]+receipt|official[[:space:]]+receipt|e-?receipt|payment[[:space:]]+of[[:space:]]*(PHP|USD|[$]|P)?[[:space:]]*[0-9][0-9,]*(\.[0-9]{1,2})?[[:space:]]+for[[:space:]]+)'
  and transaction_lifecycle_text.haystack !~* '(your[[:space:]]+transfer|transfer[[:space:]]+sent|successful[[:space:]]+transfer[[:space:]]+to|you[[:space:]]+sent|sent[[:space:]]+to|outgoing[[:space:]]+transfer|transfer[[:space:]]+from|transfer[[:space:]]+to|transfer[[:space:]]+amount|instapay|pesonet|wallet[[:space:]]+top-up|fund[[:space:]]+transfer|bank[[:space:]]+transfer)';

alter table public.transactions
  alter column type set not null,
  alter column type set default 'expense',
  alter column status set default 'confirmed',
  alter column source set default 'manual',
  alter column merchant_name set not null,
  alter column transaction_date set not null,
  alter column transaction_date set default timezone('utc', now());

alter table public.transactions
  add constraint transactions_source_check
    check (source in ('manual', 'gmail', 'csv', 'bank_import', 'system')),
  add constraint transactions_status_check
    check (status in ('confirmed', 'pending', 'declined', 'duplicate', 'needs_review')),
  add constraint transactions_type_check
    check (type in ('income', 'expense', 'transfer', 'adjustment', 'refund')),
  add constraint transactions_amount_lifecycle_check
    check (
      (type = 'adjustment' and amount <> 0)
      or (type <> 'adjustment' and amount > 0)
    ) not valid,
  add constraint transactions_transfer_accounts_check
    check (
      type <> 'transfer'
      or from_account_id is null
      or to_account_id is null
      or from_account_id <> to_account_id
    );

alter table public.gmail_transaction_review_items
  drop constraint if exists gmail_transaction_review_items_status_check;

update public.gmail_transaction_review_items
set status = case status
  when 'completed' then 'needs_review'
  when 'flagged' then 'needs_review'
  when 'pending' then 'pending'
  when 'confirmed' then 'confirmed'
  when 'declined' then 'declined'
  when 'duplicate' then 'duplicate'
  when 'needs_review' then 'needs_review'
  else 'needs_review'
end;

with review_lifecycle_text as (
  select
    id,
    concat_ws(
      ' ',
      merchant,
      description,
      category,
      reference_number,
      raw_payload::text
    ) as haystack
  from public.gmail_transaction_review_items
)
update public.gmail_transaction_review_items as review_items
set
  direction = 'expense',
  category = case
    when review_items.category = 'transfers' then 'uncategorized'
    else review_items.category
  end
from review_lifecycle_text
where review_items.id = review_lifecycle_text.id
  and review_items.direction = 'transfer'
  and review_lifecycle_text.haystack ~* '(bills?[[:space:]]+pay([[:space:]]+receipt)?|bill[[:space:]]+payment([[:space:]]+receipt)?|amount[[:space:]]+paid|total[[:space:]]+paid|paid[[:space:]]+by|purchase[[:space:]]+receipt|official[[:space:]]+receipt|e-?receipt|payment[[:space:]]+of[[:space:]]*(PHP|USD|[$]|P)?[[:space:]]*[0-9][0-9,]*(\.[0-9]{1,2})?[[:space:]]+for[[:space:]]+)'
  and review_lifecycle_text.haystack !~* '(your[[:space:]]+transfer|transfer[[:space:]]+sent|successful[[:space:]]+transfer[[:space:]]+to|you[[:space:]]+sent|sent[[:space:]]+to|outgoing[[:space:]]+transfer|transfer[[:space:]]+from|transfer[[:space:]]+to|transfer[[:space:]]+amount|instapay|pesonet|wallet[[:space:]]+top-up|fund[[:space:]]+transfer|bank[[:space:]]+transfer)';

alter table public.gmail_transaction_review_items
  add constraint gmail_transaction_review_items_status_check
    check (status in ('confirmed', 'pending', 'declined', 'duplicate', 'needs_review'));

create index if not exists transactions_transaction_date_idx
  on public.transactions (transaction_date desc);

create index if not exists transactions_account_id_idx
  on public.transactions (account_id);

create index if not exists transactions_status_idx
  on public.transactions (status);

create index if not exists transactions_type_idx
  on public.transactions (type);

create index if not exists transactions_source_idx
  on public.transactions (source);

create index if not exists transactions_source_id_idx
  on public.transactions (source_id);

do $$
begin
  if not exists (
    select 1
    from public.transactions
    where user_id is not null
      and source_id is not null
    group by user_id, source, source_id
    having count(*) > 1
  ) then
    create unique index if not exists transactions_user_source_id_unique_idx
      on public.transactions (user_id, source, source_id)
      where user_id is not null and source_id is not null;
  else
    raise notice 'Skipped transactions_user_source_id_unique_idx because duplicate source ids already exist.';
  end if;
end
$$;

create or replace function public.normalize_transaction_status(p_status text)
returns text
language plpgsql
immutable
as $$
begin
  return case coalesce(p_status, 'confirmed')
    when 'completed' then 'confirmed'
    when 'flagged' then 'needs_review'
    when 'confirmed' then 'confirmed'
    when 'pending' then 'pending'
    when 'declined' then 'declined'
    when 'duplicate' then 'duplicate'
    when 'needs_review' then 'needs_review'
    else 'confirmed'
  end;
end;
$$;

create or replace function public.get_legacy_transaction_direction(
  p_type text,
  p_amount numeric
)
returns text
language plpgsql
immutable
as $$
begin
  if p_type = 'transfer' then
    return 'transfer';
  end if;

  if p_type in ('income', 'refund') then
    return 'income';
  end if;

  if p_type = 'adjustment' and p_amount > 0 then
    return 'income';
  end if;

  return 'expense';
end;
$$;

create or replace function public.adjust_financial_account_balance(
  p_user_id uuid,
  p_account_id uuid,
  p_delta numeric
)
returns void
language plpgsql
as $$
declare
  current_balance_value numeric;
  account_status text;
  next_balance numeric;
begin
  if p_account_id is null then
    raise exception 'Account is required for confirmed transactions.';
  end if;

  select current_balance, status
    into current_balance_value, account_status
  from public.financial_accounts
  where id = p_account_id
    and user_id = p_user_id
  for update;

  if not found then
    raise exception 'Account not found.';
  end if;

  if account_status = 'archived' then
    raise exception 'Archived accounts cannot be used for confirmed transactions.';
  end if;

  next_balance := current_balance_value + p_delta;

  if next_balance < 0 then
    raise exception 'Transaction would make account balance negative.';
  end if;

  update public.financial_accounts
  set current_balance = next_balance
  where id = p_account_id
    and user_id = p_user_id;
end;
$$;

create or replace function public.apply_transaction_account_effect(
  p_user_id uuid,
  p_type text,
  p_status text,
  p_amount numeric,
  p_account_id uuid,
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_multiplier numeric
)
returns void
language plpgsql
as $$
begin
  if p_status <> 'confirmed' then
    return;
  end if;

  if p_type in ('income', 'refund') then
    perform public.adjust_financial_account_balance(p_user_id, p_account_id, p_amount * p_multiplier);
    return;
  end if;

  if p_type = 'expense' then
    perform public.adjust_financial_account_balance(p_user_id, p_account_id, p_amount * -1 * p_multiplier);
    return;
  end if;

  if p_type = 'adjustment' then
    perform public.adjust_financial_account_balance(p_user_id, p_account_id, p_amount * p_multiplier);
    return;
  end if;

  if p_type = 'transfer' then
    perform public.adjust_financial_account_balance(p_user_id, p_from_account_id, p_amount * -1 * p_multiplier);
    perform public.adjust_financial_account_balance(p_user_id, p_to_account_id, p_amount * p_multiplier);
  end if;
end;
$$;

create or replace function public.validate_transaction_shape(
  p_user_id uuid,
  p_type text,
  p_status text,
  p_source text,
  p_amount numeric,
  p_account_id uuid,
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_original_transaction_id uuid,
  p_notes text
)
returns void
language plpgsql
as $$
declare
  original_owner uuid;
begin
  if p_type not in ('income', 'expense', 'transfer', 'adjustment', 'refund') then
    raise exception 'Invalid transaction type.';
  end if;

  if p_status not in ('confirmed', 'pending', 'declined', 'duplicate', 'needs_review') then
    raise exception 'Invalid transaction status.';
  end if;

  if p_source not in ('manual', 'gmail', 'csv', 'bank_import', 'system') then
    raise exception 'Invalid transaction source.';
  end if;

  if p_type = 'adjustment' then
    if p_amount is null or p_amount = 0 then
      raise exception 'Adjustment amount must be non-zero.';
    end if;

    if nullif(btrim(coalesce(p_notes, '')), '') is null then
      raise exception 'Adjustment note is required.';
    end if;
  elsif p_amount is null or p_amount <= 0 then
    raise exception 'Transaction amount must be greater than zero.';
  end if;

  if p_account_id is not null and not exists (
    select 1
    from public.financial_accounts
    where id = p_account_id
      and user_id = p_user_id
      and status <> 'archived'
  ) then
    raise exception 'Account not found.';
  end if;

  if p_from_account_id is not null and not exists (
    select 1
    from public.financial_accounts
    where id = p_from_account_id
      and user_id = p_user_id
      and status <> 'archived'
  ) then
    raise exception 'Source account not found.';
  end if;

  if p_to_account_id is not null and not exists (
    select 1
    from public.financial_accounts
    where id = p_to_account_id
      and user_id = p_user_id
      and status <> 'archived'
  ) then
    raise exception 'Destination account not found.';
  end if;

  if p_status = 'confirmed' then
    if p_type = 'transfer' then
      if p_from_account_id is null or p_to_account_id is null then
        raise exception 'Transfers require source and destination accounts.';
      end if;

      if p_from_account_id = p_to_account_id then
        raise exception 'Transfer accounts must be different.';
      end if;
    elsif p_account_id is null then
      raise exception 'Account is required for confirmed transactions.';
    end if;
  end if;

  if p_original_transaction_id is not null then
    select user_id into original_owner
    from public.transactions
    where id = p_original_transaction_id;

    if original_owner is null or original_owner <> p_user_id then
      raise exception 'Original transaction not found.';
    end if;
  end if;
end;
$$;

create or replace function public.create_transaction(
  p_type text,
  p_amount numeric,
  p_merchant_name text,
  p_transaction_date timestamptz default timezone('utc', now()),
  p_currency_code text default 'PHP',
  p_bank_name text default null,
  p_category text default 'uncategorized',
  p_description text default null,
  p_notes text default null,
  p_status text default 'confirmed',
  p_source text default 'manual',
  p_source_id text default null,
  p_source_metadata jsonb default null,
  p_account_id uuid default null,
  p_from_account_id uuid default null,
  p_to_account_id uuid default null,
  p_original_transaction_id uuid default null,
  p_reference_number text default null
)
returns public.transactions
language plpgsql
as $$
declare
  created_transaction public.transactions;
  current_user_id uuid;
  normalized_type text;
  normalized_status text;
  normalized_source text;
  normalized_amount numeric;
  normalized_account_id uuid;
  normalized_from_account_id uuid;
  normalized_to_account_id uuid;
  normalized_source_id text;
  normalized_merchant_name text;
  normalized_description text;
  normalized_category text;
  normalized_currency_code text;
  normalized_bank_name text;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required.';
  end if;

  normalized_type := lower(btrim(coalesce(p_type, '')));
  normalized_status := public.normalize_transaction_status(p_status);
  normalized_source := lower(btrim(coalesce(p_source, 'manual')));
  normalized_amount := case
    when normalized_type = 'adjustment' then p_amount
    else abs(p_amount)
  end;
  normalized_account_id := p_account_id;
  normalized_from_account_id := p_from_account_id;
  normalized_to_account_id := p_to_account_id;
  normalized_source_id := nullif(btrim(coalesce(p_source_id, '')), '');
  normalized_merchant_name := nullif(btrim(coalesce(p_merchant_name, '')), '');
  normalized_description := coalesce(nullif(btrim(coalesce(p_description, '')), ''), normalized_merchant_name);
  normalized_category := lower(coalesce(nullif(btrim(coalesce(p_category, '')), ''), 'uncategorized'));
  normalized_currency_code := upper(coalesce(nullif(btrim(coalesce(p_currency_code, '')), ''), 'PHP'));
  normalized_bank_name := coalesce(nullif(btrim(coalesce(p_bank_name, '')), ''), normalized_merchant_name);

  if normalized_merchant_name is null then
    raise exception 'Merchant name is required.';
  end if;

  if normalized_currency_code !~ '^[A-Z]{3}$' then
    raise exception 'Currency code must be a 3-letter ISO code.';
  end if;

  if normalized_type = 'transfer' then
    normalized_account_id := coalesce(normalized_account_id, normalized_from_account_id);
  else
    normalized_from_account_id := null;
    normalized_to_account_id := null;
  end if;

  perform public.validate_transaction_shape(
    current_user_id,
    normalized_type,
    normalized_status,
    normalized_source,
    normalized_amount,
    normalized_account_id,
    normalized_from_account_id,
    normalized_to_account_id,
    p_original_transaction_id,
    p_notes
  );

  if normalized_source_id is not null and exists (
    select 1
    from public.transactions
    where user_id = current_user_id
      and source = normalized_source
      and source_id = normalized_source_id
  ) then
    raise exception 'Duplicate source transaction.';
  end if;

  insert into public.transactions (
    user_id,
    source,
    source_id,
    source_metadata,
    type,
    direction,
    amount,
    currency_code,
    account_id,
    from_account_id,
    to_account_id,
    original_transaction_id,
    bank_name,
    merchant_name,
    merchant,
    description,
    category,
    reference_number,
    notes,
    status,
    transaction_date,
    happened_at,
    gmail_message_id,
    gmail_thread_id,
    raw_payload
  )
  values (
    current_user_id,
    normalized_source,
    normalized_source_id,
    p_source_metadata,
    normalized_type,
    public.get_legacy_transaction_direction(normalized_type, normalized_amount),
    normalized_amount,
    normalized_currency_code,
    normalized_account_id,
    normalized_from_account_id,
    normalized_to_account_id,
    p_original_transaction_id,
    normalized_bank_name,
    normalized_merchant_name,
    normalized_merchant_name,
    normalized_description,
    normalized_category,
    nullif(btrim(coalesce(p_reference_number, '')), ''),
    nullif(btrim(coalesce(p_notes, '')), ''),
    normalized_status,
    p_transaction_date,
    p_transaction_date,
    case when normalized_source = 'gmail' then normalized_source_id else null end,
    case when normalized_source = 'gmail' then (p_source_metadata ->> 'gmailThreadId') else null end,
    p_source_metadata
  )
  returning * into created_transaction;

  perform public.apply_transaction_account_effect(
    current_user_id,
    created_transaction.type,
    created_transaction.status,
    created_transaction.amount,
    created_transaction.account_id,
    created_transaction.from_account_id,
    created_transaction.to_account_id,
    1
  );

  return created_transaction;
end;
$$;

create or replace function public.update_transaction(
  p_transaction_id uuid,
  p_type text,
  p_amount numeric,
  p_merchant_name text,
  p_transaction_date timestamptz,
  p_currency_code text default 'PHP',
  p_category text default 'uncategorized',
  p_description text default null,
  p_notes text default null,
  p_status text default 'confirmed',
  p_account_id uuid default null,
  p_from_account_id uuid default null,
  p_to_account_id uuid default null,
  p_original_transaction_id uuid default null,
  p_reference_number text default null
)
returns public.transactions
language plpgsql
as $$
declare
  existing_transaction public.transactions;
  updated_transaction public.transactions;
  current_user_id uuid;
  normalized_type text;
  normalized_status text;
  normalized_amount numeric;
  normalized_account_id uuid;
  normalized_from_account_id uuid;
  normalized_to_account_id uuid;
  normalized_merchant_name text;
  normalized_description text;
  normalized_category text;
  normalized_currency_code text;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required.';
  end if;

  select * into existing_transaction
  from public.transactions
  where id = p_transaction_id
    and user_id = current_user_id
  for update;

  if not found then
    raise exception 'Transaction not found.';
  end if;

  normalized_type := lower(btrim(coalesce(p_type, '')));
  normalized_status := public.normalize_transaction_status(p_status);
  normalized_amount := case
    when normalized_type = 'adjustment' then p_amount
    else abs(p_amount)
  end;
  normalized_account_id := p_account_id;
  normalized_from_account_id := p_from_account_id;
  normalized_to_account_id := p_to_account_id;
  normalized_merchant_name := nullif(btrim(coalesce(p_merchant_name, '')), '');
  normalized_description := coalesce(nullif(btrim(coalesce(p_description, '')), ''), normalized_merchant_name);
  normalized_category := lower(coalesce(nullif(btrim(coalesce(p_category, '')), ''), 'uncategorized'));
  normalized_currency_code := upper(coalesce(nullif(btrim(coalesce(p_currency_code, '')), ''), 'PHP'));

  if normalized_merchant_name is null then
    raise exception 'Merchant name is required.';
  end if;

  if normalized_currency_code !~ '^[A-Z]{3}$' then
    raise exception 'Currency code must be a 3-letter ISO code.';
  end if;

  if normalized_type = 'transfer' then
    normalized_account_id := coalesce(normalized_account_id, normalized_from_account_id);
  else
    normalized_from_account_id := null;
    normalized_to_account_id := null;
  end if;

  perform public.validate_transaction_shape(
    current_user_id,
    normalized_type,
    normalized_status,
    existing_transaction.source,
    normalized_amount,
    normalized_account_id,
    normalized_from_account_id,
    normalized_to_account_id,
    p_original_transaction_id,
    p_notes
  );

  perform public.apply_transaction_account_effect(
    current_user_id,
    existing_transaction.type,
    existing_transaction.status,
    existing_transaction.amount,
    existing_transaction.account_id,
    existing_transaction.from_account_id,
    existing_transaction.to_account_id,
    -1
  );

  update public.transactions
  set
    type = normalized_type,
    direction = public.get_legacy_transaction_direction(normalized_type, normalized_amount),
    amount = normalized_amount,
    currency_code = normalized_currency_code,
    account_id = normalized_account_id,
    from_account_id = normalized_from_account_id,
    to_account_id = normalized_to_account_id,
    original_transaction_id = p_original_transaction_id,
    bank_name = existing_transaction.bank_name,
    merchant_name = normalized_merchant_name,
    merchant = normalized_merchant_name,
    description = normalized_description,
    category = normalized_category,
    reference_number = nullif(btrim(coalesce(p_reference_number, '')), ''),
    notes = nullif(btrim(coalesce(p_notes, '')), ''),
    status = normalized_status,
    transaction_date = p_transaction_date,
    happened_at = p_transaction_date
  where id = existing_transaction.id
    and user_id = current_user_id
  returning * into updated_transaction;

  perform public.apply_transaction_account_effect(
    current_user_id,
    updated_transaction.type,
    updated_transaction.status,
    updated_transaction.amount,
    updated_transaction.account_id,
    updated_transaction.from_account_id,
    updated_transaction.to_account_id,
    1
  );

  return updated_transaction;
end;
$$;

create or replace function public.delete_transaction(p_transaction_id uuid)
returns boolean
language plpgsql
as $$
declare
  existing_transaction public.transactions;
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required.';
  end if;

  select * into existing_transaction
  from public.transactions
  where id = p_transaction_id
    and user_id = current_user_id
  for update;

  if not found then
    return false;
  end if;

  perform public.apply_transaction_account_effect(
    current_user_id,
    existing_transaction.type,
    existing_transaction.status,
    existing_transaction.amount,
    existing_transaction.account_id,
    existing_transaction.from_account_id,
    existing_transaction.to_account_id,
    -1
  );

  delete from public.transactions
  where id = existing_transaction.id
    and user_id = current_user_id;

  return true;
end;
$$;

create or replace function public.create_manual_transaction(
  p_direction text,
  p_amount numeric,
  p_bank_name text,
  p_merchant text,
  p_description text,
  p_category text,
  p_currency_code text default 'PHP',
  p_reference_number text default null,
  p_notes text default null,
  p_status text default 'confirmed',
  p_happened_at timestamptz default timezone('utc', now())
)
returns public.transactions
language plpgsql
as $$
begin
  return public.create_transaction(
    p_type := p_direction,
    p_amount := p_amount,
    p_merchant_name := p_merchant,
    p_transaction_date := p_happened_at,
    p_currency_code := p_currency_code,
    p_bank_name := p_bank_name,
    p_category := p_category,
    p_description := p_description,
    p_notes := p_notes,
    p_status := p_status,
    p_source := 'manual',
    p_reference_number := p_reference_number
  );
end;
$$;

create or replace function public.ingest_gmail_transaction(
  p_direction text,
  p_amount numeric,
  p_bank_name text,
  p_merchant text,
  p_description text,
  p_category text,
  p_happened_at timestamptz,
  p_gmail_message_id text,
  p_currency_code text default 'PHP',
  p_reference_number text default null,
  p_status text default 'needs_review',
  p_gmail_thread_id text default null,
  p_raw_payload jsonb default null
)
returns public.transactions
language plpgsql
as $$
declare
  upserted_transaction public.transactions;
  current_user_id uuid;
  lifecycle_haystack text;
  normalized_status text;
  normalized_type text;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if p_gmail_message_id is null or btrim(p_gmail_message_id) = '' then
    raise exception 'Gmail message id is required.';
  end if;

  normalized_type := case
    when p_direction in ('income', 'expense', 'transfer') then p_direction
    else 'expense'
  end;
  normalized_status := public.normalize_transaction_status(p_status);
  lifecycle_haystack := concat_ws(
    ' ',
    p_merchant,
    p_description,
    p_category,
    p_reference_number,
    p_raw_payload::text
  );

  if normalized_type = 'transfer'
    and lifecycle_haystack ~* '(bills?[[:space:]]+pay([[:space:]]+receipt)?|bill[[:space:]]+payment([[:space:]]+receipt)?|amount[[:space:]]+paid|total[[:space:]]+paid|paid[[:space:]]+by|purchase[[:space:]]+receipt|official[[:space:]]+receipt|e-?receipt|payment[[:space:]]+of[[:space:]]*(PHP|USD|[$]|P)?[[:space:]]*[0-9][0-9,]*(\.[0-9]{1,2})?[[:space:]]+for[[:space:]]+)'
    and lifecycle_haystack !~* '(your[[:space:]]+transfer|transfer[[:space:]]+sent|successful[[:space:]]+transfer[[:space:]]+to|you[[:space:]]+sent|sent[[:space:]]+to|outgoing[[:space:]]+transfer|transfer[[:space:]]+from|transfer[[:space:]]+to|transfer[[:space:]]+amount|instapay|pesonet|wallet[[:space:]]+top-up|fund[[:space:]]+transfer|bank[[:space:]]+transfer)'
  then
    normalized_type := 'expense';
  end if;

  if normalized_status = 'confirmed' then
    normalized_status := 'needs_review';
  end if;

  insert into public.transactions (
    user_id,
    source,
    source_id,
    source_metadata,
    type,
    direction,
    amount,
    currency_code,
    bank_name,
    merchant_name,
    merchant,
    description,
    category,
    reference_number,
    status,
    transaction_date,
    happened_at,
    gmail_message_id,
    gmail_thread_id,
    raw_payload
  )
  values (
    current_user_id,
    'gmail',
    btrim(p_gmail_message_id),
    p_raw_payload,
    normalized_type,
    public.get_legacy_transaction_direction(normalized_type, abs(p_amount)),
    abs(p_amount),
    upper(coalesce(p_currency_code, 'PHP')),
    btrim(p_bank_name),
    btrim(p_merchant),
    btrim(p_merchant),
    btrim(p_description),
    lower(btrim(p_category)),
    nullif(btrim(coalesce(p_reference_number, '')), ''),
    normalized_status,
    p_happened_at,
    p_happened_at,
    btrim(p_gmail_message_id),
    nullif(btrim(coalesce(p_gmail_thread_id, '')), ''),
    p_raw_payload
  )
  on conflict (user_id, gmail_message_id)
  do update set
    source_id = excluded.source_id,
    source_metadata = excluded.source_metadata,
    type = case
      when public.transactions.status = 'confirmed' and public.transactions.account_id is not null
        then public.transactions.type
      else excluded.type
    end,
    direction = case
      when public.transactions.status = 'confirmed' and public.transactions.account_id is not null
        then public.transactions.direction
      else excluded.direction
    end,
    amount = case
      when public.transactions.status = 'confirmed' and public.transactions.account_id is not null
        then public.transactions.amount
      else excluded.amount
    end,
    currency_code = case
      when public.transactions.status = 'confirmed' and public.transactions.account_id is not null
        then public.transactions.currency_code
      else excluded.currency_code
    end,
    bank_name = excluded.bank_name,
    merchant_name = excluded.merchant_name,
    merchant = excluded.merchant,
    description = excluded.description,
    category = excluded.category,
    reference_number = excluded.reference_number,
    transaction_date = excluded.transaction_date,
    happened_at = excluded.happened_at,
    gmail_thread_id = excluded.gmail_thread_id,
    raw_payload = excluded.raw_payload
  returning * into upserted_transaction;

  return upserted_transaction;
end;
$$;
