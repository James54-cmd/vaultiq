create table if not exists public.gmail_transaction_review_items (
  id uuid primary key default gen_random_uuid(),
  review_batch_id uuid not null,
  user_id uuid not null references public.users (id) on delete cascade,
  gmail_message_id text not null,
  gmail_thread_id text,
  direction text not null check (direction in ('income', 'expense', 'transfer')),
  amount numeric(14, 2) not null check (amount >= 0),
  currency_code char(3) not null default 'PHP',
  bank_name text not null,
  merchant text not null,
  description text not null,
  category text not null,
  reference_number text,
  status text not null default 'completed' check (status in ('completed', 'pending', 'flagged')),
  review_status text not null default 'pending' check (review_status in ('pending', 'confirmed', 'declined')),
  happened_at timestamptz not null,
  raw_payload jsonb not null default '{}'::jsonb,
  transaction_id uuid references public.transactions (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint gmail_transaction_review_items_user_message_unique unique (user_id, gmail_message_id)
);

create index if not exists gmail_transaction_review_items_user_batch_idx
  on public.gmail_transaction_review_items (user_id, review_batch_id);

create index if not exists gmail_transaction_review_items_user_status_idx
  on public.gmail_transaction_review_items (user_id, review_status);

create or replace function public.set_gmail_transaction_review_item_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists gmail_transaction_review_items_set_updated_at on public.gmail_transaction_review_items;

create trigger gmail_transaction_review_items_set_updated_at
before update on public.gmail_transaction_review_items
for each row
execute function public.set_gmail_transaction_review_item_updated_at();

alter table public.gmail_transaction_review_items enable row level security;

drop policy if exists "Users can view their gmail transaction review items"
  on public.gmail_transaction_review_items;
create policy "Users can view their gmail transaction review items"
  on public.gmail_transaction_review_items
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their gmail transaction review items"
  on public.gmail_transaction_review_items;
create policy "Users can insert their gmail transaction review items"
  on public.gmail_transaction_review_items
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their gmail transaction review items"
  on public.gmail_transaction_review_items;
create policy "Users can update their gmail transaction review items"
  on public.gmail_transaction_review_items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
