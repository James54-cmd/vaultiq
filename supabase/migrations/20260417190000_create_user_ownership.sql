create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_public_user_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;

create trigger users_set_updated_at
before update on public.users
for each row
execute function public.set_public_user_updated_at();

create or replace function public.sync_public_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    id,
    email,
    full_name,
    avatar_url
  )
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'avatar_url', '')), '')
  )
  on conflict (id)
  do update set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert or update on auth.users
for each row
execute function public.sync_public_user();

insert into public.users (id, email, full_name, avatar_url)
select
  id,
  email,
  nullif(trim(coalesce(raw_user_meta_data ->> 'full_name', '')), ''),
  nullif(trim(coalesce(raw_user_meta_data ->> 'avatar_url', '')), '')
from auth.users
on conflict (id)
do update set
  email = excluded.email,
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url,
  updated_at = timezone('utc', now());

create table if not exists public.gmail_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  provider text not null default 'google' check (provider in ('google')),
  provider_user_id text,
  email text not null,
  refresh_token text,
  access_token text,
  token_expiry_at timestamptz,
  scopes text[] not null default '{}'::text[],
  last_synced_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint gmail_connections_user_provider_unique unique (user_id, provider),
  constraint gmail_connections_email_unique unique (email)
);

create index if not exists gmail_connections_user_id_idx
  on public.gmail_connections (user_id);

create or replace function public.set_gmail_connection_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists gmail_connections_set_updated_at on public.gmail_connections;

create trigger gmail_connections_set_updated_at
before update on public.gmail_connections
for each row
execute function public.set_gmail_connection_updated_at();

alter table public.budgets
  add column if not exists user_id uuid references public.users (id) on delete cascade;

create index if not exists budgets_user_id_idx
  on public.budgets (user_id);

alter table public.transactions
  add column if not exists user_id uuid references public.users (id) on delete cascade;

create index if not exists transactions_user_id_idx
  on public.transactions (user_id);

alter table public.transactions
  drop constraint if exists transactions_gmail_message_id_key;

create unique index if not exists transactions_user_id_gmail_message_id_idx
  on public.transactions (user_id, gmail_message_id)
  where gmail_message_id is not null;

create or replace function public.create_budget(
  p_category text,
  p_period text,
  p_limit_amount numeric,
  p_spent_amount numeric default 0,
  p_currency_code text default 'PHP',
  p_starts_at date default null,
  p_ends_at date default null,
  p_status text default 'active',
  p_notes text default null
)
returns public.budgets
language plpgsql
as $$
declare
  created_budget public.budgets;
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_category is null or btrim(p_category) = '' then
    raise exception 'Category is required';
  end if;

  if p_period not in ('weekly', 'monthly', 'yearly') then
    raise exception 'Invalid budget period';
  end if;

  if p_status not in ('active', 'archived') then
    raise exception 'Invalid budget status';
  end if;

  if p_limit_amount is null or p_limit_amount < 0 then
    raise exception 'Limit amount must be non-negative';
  end if;

  if p_spent_amount is null or p_spent_amount < 0 then
    raise exception 'Spent amount must be non-negative';
  end if;

  if upper(coalesce(p_currency_code, '')) !~ '^[A-Z]{3}$' then
    raise exception 'Currency code must be a 3-letter ISO code';
  end if;

  if p_starts_at is null or p_ends_at is null or p_starts_at > p_ends_at then
    raise exception 'Budget date range is invalid';
  end if;

  insert into public.budgets (
    user_id,
    category,
    period,
    limit_amount,
    spent_amount,
    currency_code,
    starts_at,
    ends_at,
    status,
    notes
  )
  values (
    current_user_id,
    btrim(p_category),
    p_period,
    p_limit_amount,
    p_spent_amount,
    upper(p_currency_code),
    p_starts_at,
    p_ends_at,
    p_status,
    nullif(btrim(coalesce(p_notes, '')), '')
  )
  returning * into created_budget;

  return created_budget;
end;
$$;

create or replace function public.update_budget(
  p_id uuid,
  p_category text default null,
  p_period text default null,
  p_limit_amount numeric default null,
  p_spent_amount numeric default null,
  p_currency_code text default null,
  p_starts_at date default null,
  p_ends_at date default null,
  p_status text default null,
  p_notes text default null
)
returns public.budgets
language plpgsql
as $$
declare
  current_budget public.budgets;
  updated_budget public.budgets;
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into current_budget
  from public.budgets
  where id = p_id
    and user_id = current_user_id;

  if current_budget is null then
    raise exception 'Budget not found';
  end if;

  if p_period is not null and p_period not in ('weekly', 'monthly', 'yearly') then
    raise exception 'Invalid budget period';
  end if;

  if p_status is not null and p_status not in ('active', 'archived') then
    raise exception 'Invalid budget status';
  end if;

  if p_limit_amount is not null and p_limit_amount < 0 then
    raise exception 'Limit amount must be non-negative';
  end if;

  if p_spent_amount is not null and p_spent_amount < 0 then
    raise exception 'Spent amount must be non-negative';
  end if;

  if p_currency_code is not null and upper(p_currency_code) !~ '^[A-Z]{3}$' then
    raise exception 'Currency code must be a 3-letter ISO code';
  end if;

  if coalesce(p_starts_at, current_budget.starts_at) > coalesce(p_ends_at, current_budget.ends_at) then
    raise exception 'Budget date range is invalid';
  end if;

  update public.budgets
  set
    category = coalesce(nullif(btrim(p_category), ''), category),
    period = coalesce(p_period, period),
    limit_amount = coalesce(p_limit_amount, limit_amount),
    spent_amount = coalesce(p_spent_amount, spent_amount),
    currency_code = coalesce(upper(p_currency_code), currency_code),
    starts_at = coalesce(p_starts_at, starts_at),
    ends_at = coalesce(p_ends_at, ends_at),
    status = coalesce(p_status, status),
    notes = case
      when p_notes is null then notes
      else nullif(btrim(p_notes), '')
    end
  where id = p_id
    and user_id = current_user_id
  returning * into updated_budget;

  return updated_budget;
end;
$$;

create or replace function public.delete_budget(
  p_id uuid
)
returns boolean
language plpgsql
as $$
declare
  deleted_count integer;
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  delete from public.budgets
  where id = p_id
    and user_id = current_user_id;

  get diagnostics deleted_count = row_count;

  if deleted_count = 0 then
    raise exception 'Budget not found';
  end if;

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
  p_status text default 'completed',
  p_happened_at timestamptz default timezone('utc', now())
)
returns public.transactions
language plpgsql
as $$
declare
  created_transaction public.transactions;
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required';
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
    notes,
    status,
    happened_at
  )
  values (
    current_user_id,
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

alter table public.users enable row level security;
alter table public.gmail_connections enable row level security;
alter table public.budgets enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "Users can view themselves" on public.users;
create policy "Users can view themselves"
  on public.users
  for select
  using (auth.uid() = id);

drop policy if exists "Users can update themselves" on public.users;
create policy "Users can update themselves"
  on public.users
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can view their gmail connections" on public.gmail_connections;
create policy "Users can view their gmail connections"
  on public.gmail_connections
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their gmail connections" on public.gmail_connections;
create policy "Users can insert their gmail connections"
  on public.gmail_connections
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their gmail connections" on public.gmail_connections;
create policy "Users can update their gmail connections"
  on public.gmail_connections
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their gmail connections" on public.gmail_connections;
create policy "Users can delete their gmail connections"
  on public.gmail_connections
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view their budgets" on public.budgets;
create policy "Users can view their budgets"
  on public.budgets
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their budgets" on public.budgets;
create policy "Users can insert their budgets"
  on public.budgets
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their budgets" on public.budgets;
create policy "Users can update their budgets"
  on public.budgets
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their budgets" on public.budgets;
create policy "Users can delete their budgets"
  on public.budgets
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view their transactions" on public.transactions;
create policy "Users can view their transactions"
  on public.transactions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their transactions" on public.transactions;
create policy "Users can insert their transactions"
  on public.transactions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their transactions" on public.transactions;
create policy "Users can update their transactions"
  on public.transactions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their transactions" on public.transactions;
create policy "Users can delete their transactions"
  on public.transactions
  for delete
  using (auth.uid() = user_id);
