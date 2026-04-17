create extension if not exists pgcrypto;

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  period text not null check (period in ('weekly', 'monthly', 'yearly')),
  limit_amount numeric(14, 2) not null check (limit_amount >= 0),
  spent_amount numeric(14, 2) not null default 0 check (spent_amount >= 0),
  currency_code char(3) not null,
  starts_at date not null,
  ends_at date not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint budgets_date_window_check check (starts_at <= ends_at)
);

create index if not exists budgets_period_status_idx
  on public.budgets (period, status);

create index if not exists budgets_category_idx
  on public.budgets (category);

create or replace function public.set_budget_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists budgets_set_updated_at on public.budgets;

create trigger budgets_set_updated_at
before update on public.budgets
for each row
execute function public.set_budget_updated_at();

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
begin
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
begin
  select * into current_budget
  from public.budgets
  where id = p_id;

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
  returning * into updated_budget;

  return updated_budget;
end;
$$;
