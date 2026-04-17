alter table public.transactions
  add column if not exists user_id uuid references public.users (id) on delete cascade;

alter table public.transactions
  drop constraint if exists transactions_gmail_message_id_key;

drop index if exists public.transactions_user_id_gmail_message_id_idx;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.transactions'::regclass
      and conname = 'transactions_user_id_gmail_message_id_key'
  ) then
    alter table public.transactions
      add constraint transactions_user_id_gmail_message_id_key unique (user_id, gmail_message_id);
  end if;
end
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
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

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
    user_id,
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
    current_user_id,
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
  on conflict (user_id, gmail_message_id)
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
