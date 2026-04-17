create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('manual', 'gmail')),
  direction text not null check (direction in ('income', 'expense', 'transfer')),
  amount numeric(14, 2) not null check (amount >= 0),
  currency_code char(3) not null default 'PHP',
  bank_name text not null,
  merchant text not null,
  description text not null,
  category text not null,
  reference_number text,
  notes text,
  status text not null default 'completed' check (status in ('completed', 'pending', 'flagged')),
  happened_at timestamptz not null,
  gmail_message_id text unique,
  gmail_thread_id text,
  raw_payload jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists transactions_happened_at_idx
  on public.transactions (happened_at desc);

create index if not exists transactions_bank_name_idx
  on public.transactions (bank_name);

create index if not exists transactions_category_idx
  on public.transactions (category);

create index if not exists transactions_direction_idx
  on public.transactions (direction);

create or replace function public.set_transaction_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists transactions_set_updated_at on public.transactions;

create trigger transactions_set_updated_at
before update on public.transactions
for each row
execute function public.set_transaction_updated_at();

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
  p_status text default 'completed',
  p_happened_at timestamptz default timezone('utc', now())
)
returns public.transactions
language plpgsql
as $$
declare
  created_transaction public.transactions;
begin
  if p_direction not in ('income', 'expense', 'transfer') then
    raise exception 'Invalid transaction direction';
  end if;

  if p_amount is null or p_amount < 0 then
    raise exception 'Transaction amount must be non-negative';
  end if;

  if upper(coalesce(p_currency_code, '')) !~ '^[A-Z]{3}$' then
    raise exception 'Currency code must be a 3-letter ISO code';
  end if;

  if p_status not in ('completed', 'pending', 'flagged') then
    raise exception 'Invalid transaction status';
  end if;

  if p_bank_name is null or btrim(p_bank_name) = '' then
    raise exception 'Bank name is required';
  end if;

  if p_merchant is null or btrim(p_merchant) = '' then
    raise exception 'Merchant is required';
  end if;

  if p_description is null or btrim(p_description) = '' then
    raise exception 'Description is required';
  end if;

  if p_category is null or btrim(p_category) = '' then
    raise exception 'Category is required';
  end if;

  if p_happened_at is null then
    raise exception 'Transaction date is required';
  end if;

  insert into public.transactions (
    source,
    direction,
    amount,
    currency_code,
    bank_name,
    merchant,
    description,
    category,
    reference_number,
    notes,
    status,
    happened_at
  )
  values (
    'manual',
    p_direction,
    p_amount,
    upper(p_currency_code),
    btrim(p_bank_name),
    btrim(p_merchant),
    btrim(p_description),
    lower(btrim(p_category)),
    nullif(btrim(coalesce(p_reference_number, '')), ''),
    nullif(btrim(coalesce(p_notes, '')), ''),
    p_status,
    p_happened_at
  )
  returning * into created_transaction;

  return created_transaction;
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
  p_status text default 'completed',
  p_gmail_thread_id text default null,
  p_raw_payload jsonb default null
)
returns public.transactions
language plpgsql
as $$
declare
  upserted_transaction public.transactions;
begin
  if p_gmail_message_id is null or btrim(p_gmail_message_id) = '' then
    raise exception 'Gmail message id is required';
  end if;

  if p_direction not in ('income', 'expense', 'transfer') then
    raise exception 'Invalid transaction direction';
  end if;

  if p_amount is null or p_amount < 0 then
    raise exception 'Transaction amount must be non-negative';
  end if;

  if upper(coalesce(p_currency_code, '')) !~ '^[A-Z]{3}$' then
    raise exception 'Currency code must be a 3-letter ISO code';
  end if;

  if p_status not in ('completed', 'pending', 'flagged') then
    raise exception 'Invalid transaction status';
  end if;

  if p_bank_name is null or btrim(p_bank_name) = '' then
    raise exception 'Bank name is required';
  end if;

  if p_merchant is null or btrim(p_merchant) = '' then
    raise exception 'Merchant is required';
  end if;

  if p_description is null or btrim(p_description) = '' then
    raise exception 'Description is required';
  end if;

  if p_category is null or btrim(p_category) = '' then
    raise exception 'Category is required';
  end if;

  if p_happened_at is null then
    raise exception 'Transaction date is required';
  end if;

  insert into public.transactions (
    source,
    direction,
    amount,
    currency_code,
    bank_name,
    merchant,
    description,
    category,
    reference_number,
    status,
    happened_at,
    gmail_message_id,
    gmail_thread_id,
    raw_payload
  )
  values (
    'gmail',
    p_direction,
    p_amount,
    upper(p_currency_code),
    btrim(p_bank_name),
    btrim(p_merchant),
    btrim(p_description),
    lower(btrim(p_category)),
    nullif(btrim(coalesce(p_reference_number, '')), ''),
    p_status,
    p_happened_at,
    btrim(p_gmail_message_id),
    nullif(btrim(coalesce(p_gmail_thread_id, '')), ''),
    p_raw_payload
  )
  on conflict (gmail_message_id)
  do update set
    direction = excluded.direction,
    amount = excluded.amount,
    currency_code = excluded.currency_code,
    bank_name = excluded.bank_name,
    merchant = excluded.merchant,
    description = excluded.description,
    category = excluded.category,
    reference_number = excluded.reference_number,
    status = excluded.status,
    happened_at = excluded.happened_at,
    gmail_thread_id = excluded.gmail_thread_id,
    raw_payload = excluded.raw_payload
  returning * into upserted_transaction;

  return upserted_transaction;
end;
$$;
