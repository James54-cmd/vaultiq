alter table public.budgets
  add column if not exists alert_threshold_percent numeric(5, 2) not null default 80;

update public.budgets
set alert_threshold_percent = 80
where alert_threshold_percent is null;

create or replace function public.create_budget(
  p_category text,
  p_period text,
  p_limit_amount numeric,
  p_spent_amount numeric default 0,
  p_currency_code text default 'PHP',
  p_starts_at date default null,
  p_ends_at date default null,
  p_status text default 'active',
  p_notes text default null,
  p_alert_threshold_percent numeric default 80
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

  if p_alert_threshold_percent is null or p_alert_threshold_percent < 0 or p_alert_threshold_percent > 100 then
    raise exception 'Alert threshold percent must be between 0 and 100';
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
    notes,
    alert_threshold_percent
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
    nullif(btrim(coalesce(p_notes, '')), ''),
    p_alert_threshold_percent
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
  p_notes text default null,
  p_alert_threshold_percent numeric default null
)
returns public.budgets
language plpgsql
as $$
declare
  updated_budget public.budgets;
  current_user_id uuid;
  next_starts_at date;
  next_ends_at date;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select starts_at, ends_at
  into next_starts_at, next_ends_at
  from public.budgets
  where id = p_id
    and user_id = current_user_id;

  if not found then
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

  if p_alert_threshold_percent is not null and (p_alert_threshold_percent < 0 or p_alert_threshold_percent > 100) then
    raise exception 'Alert threshold percent must be between 0 and 100';
  end if;

  if p_currency_code is not null and upper(p_currency_code) !~ '^[A-Z]{3}$' then
    raise exception 'Currency code must be a 3-letter ISO code';
  end if;

  next_starts_at := coalesce(p_starts_at, next_starts_at);
  next_ends_at := coalesce(p_ends_at, next_ends_at);

  if next_starts_at > next_ends_at then
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
    end,
    alert_threshold_percent = coalesce(p_alert_threshold_percent, alert_threshold_percent)
  where id = p_id
    and user_id = current_user_id
  returning * into updated_budget;

  return updated_budget;
end;
$$;

create table if not exists public.recurring_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  category text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  currency_code char(3) not null default 'PHP',
  cadence text not null check (cadence in ('monthly', 'quarterly', 'yearly')),
  anchor_date date not null,
  reminder_days_before integer not null default 3 check (reminder_days_before between 0 and 30),
  autopay boolean not null default false,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists recurring_bills_user_id_idx
  on public.recurring_bills (user_id);

create index if not exists recurring_bills_status_idx
  on public.recurring_bills (status);

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  target_amount numeric(14, 2) not null check (target_amount >= 0),
  saved_amount numeric(14, 2) not null default 0 check (saved_amount >= 0),
  currency_code char(3) not null default 'PHP',
  target_date date,
  status text not null default 'active' check (status in ('active', 'archived')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists savings_goals_user_id_idx
  on public.savings_goals (user_id);

create index if not exists savings_goals_status_idx
  on public.savings_goals (status);

create table if not exists public.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  institution_name text not null,
  account_type text not null check (
    account_type in (
      'cash',
      'checking',
      'savings',
      'credit_card',
      'ewallet',
      'investment',
      'loan',
      'property',
      'other'
    )
  ),
  kind text not null check (kind in ('asset', 'liability')),
  source text not null default 'manual' check (source in ('manual', 'synced')),
  currency_code char(3) not null default 'PHP',
  current_balance numeric(14, 2) not null check (current_balance >= 0),
  credit_limit numeric(14, 2) check (credit_limit is null or credit_limit >= 0),
  include_in_net_worth boolean not null default true,
  status text not null default 'active' check (status in ('active', 'syncing', 'error', 'archived')),
  last_synced_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists financial_accounts_user_id_idx
  on public.financial_accounts (user_id);

create index if not exists financial_accounts_status_idx
  on public.financial_accounts (status);

create table if not exists public.user_preferences (
  user_id uuid primary key references public.users (id) on delete cascade,
  primary_currency_code char(3) not null default 'PHP',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_planning_entity_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists recurring_bills_set_updated_at on public.recurring_bills;
create trigger recurring_bills_set_updated_at
before update on public.recurring_bills
for each row
execute function public.set_planning_entity_updated_at();

drop trigger if exists savings_goals_set_updated_at on public.savings_goals;
create trigger savings_goals_set_updated_at
before update on public.savings_goals
for each row
execute function public.set_planning_entity_updated_at();

drop trigger if exists financial_accounts_set_updated_at on public.financial_accounts;
create trigger financial_accounts_set_updated_at
before update on public.financial_accounts
for each row
execute function public.set_planning_entity_updated_at();

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row
execute function public.set_planning_entity_updated_at();

alter table public.recurring_bills enable row level security;
alter table public.savings_goals enable row level security;
alter table public.financial_accounts enable row level security;
alter table public.user_preferences enable row level security;

drop policy if exists "Users can view their recurring bills" on public.recurring_bills;
create policy "Users can view their recurring bills"
  on public.recurring_bills
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their recurring bills" on public.recurring_bills;
create policy "Users can insert their recurring bills"
  on public.recurring_bills
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their recurring bills" on public.recurring_bills;
create policy "Users can update their recurring bills"
  on public.recurring_bills
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their recurring bills" on public.recurring_bills;
create policy "Users can delete their recurring bills"
  on public.recurring_bills
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view their savings goals" on public.savings_goals;
create policy "Users can view their savings goals"
  on public.savings_goals
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their savings goals" on public.savings_goals;
create policy "Users can insert their savings goals"
  on public.savings_goals
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their savings goals" on public.savings_goals;
create policy "Users can update their savings goals"
  on public.savings_goals
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their savings goals" on public.savings_goals;
create policy "Users can delete their savings goals"
  on public.savings_goals
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view their financial accounts" on public.financial_accounts;
create policy "Users can view their financial accounts"
  on public.financial_accounts
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their financial accounts" on public.financial_accounts;
create policy "Users can insert their financial accounts"
  on public.financial_accounts
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their financial accounts" on public.financial_accounts;
create policy "Users can update their financial accounts"
  on public.financial_accounts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their financial accounts" on public.financial_accounts;
create policy "Users can delete their financial accounts"
  on public.financial_accounts
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view their user preferences" on public.user_preferences;
create policy "Users can view their user preferences"
  on public.user_preferences
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their user preferences" on public.user_preferences;
create policy "Users can insert their user preferences"
  on public.user_preferences
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their user preferences" on public.user_preferences;
create policy "Users can update their user preferences"
  on public.user_preferences
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their user preferences" on public.user_preferences;
create policy "Users can delete their user preferences"
  on public.user_preferences
  for delete
  using (auth.uid() = user_id);
