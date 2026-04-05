create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('admin', 'org');
  end if;

  if not exists (select 1 from pg_type where typname = 'donation_type') then
    create type donation_type as enum ('cash', 'goods');
  end if;

  if not exists (select 1 from pg_type where typname = 'record_status') then
    create type record_status as enum ('pending', 'approved');
  end if;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  role user_role not null default 'org',
  organization_name text not null default 'Barangay',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.users (id) on delete cascade,
  item_name text not null,
  quantity numeric(12,2) not null check (quantity >= 0),
  type donation_type not null,
  status record_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.distributions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.users (id) on delete cascade,
  item_name text not null,
  quantity numeric(12,2) not null check (quantity >= 0),
  location text not null,
  status record_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_first_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (select 1 from public.users);
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role user_role;
begin
  assigned_role := case
    when public.is_first_user() then 'admin'::user_role
    when new.raw_user_meta_data ->> 'role' in ('admin', 'org')
      then (new.raw_user_meta_data ->> 'role')::user_role
    else 'org'::user_role
  end;

  insert into public.users (id, name, email, role, organization_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    assigned_role,
    coalesce(new.raw_user_meta_data ->> 'organization_name', 'Barangay')
  )
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    role = excluded.role,
    organization_name = excluded.organization_name;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object('role', assigned_role::text)
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.users enable row level security;
alter table public.donations enable row level security;
alter table public.distributions enable row level security;

drop policy if exists "users can read own row" on public.users;
drop policy if exists "users can update own row" on public.users;
drop policy if exists "users can insert own row" on public.users;

create policy "users self or admin read"
on public.users
for select
using (auth.uid() = id or public.is_admin());

create policy "users self insert"
on public.users
for insert
with check (auth.uid() = id);

create policy "users self or admin update"
on public.users
for update
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

drop policy if exists "donations public approved read" on public.donations;
drop policy if exists "donations org insert or admin" on public.donations;
drop policy if exists "donations org update or admin" on public.donations;

create policy "donations approved or scoped read"
on public.donations
for select
using (
  status = 'approved'
  or auth.uid() = organization_id
  or public.is_admin()
);

create policy "donations org insert or admin"
on public.donations
for insert
with check (
  auth.uid() = organization_id
  or public.is_admin()
);

create policy "donations org update or admin"
on public.donations
for update
using (
  auth.uid() = organization_id
  or public.is_admin()
)
with check (
  auth.uid() = organization_id
  or public.is_admin()
);

drop policy if exists "distributions public read" on public.distributions;
drop policy if exists "distributions org insert or admin" on public.distributions;
drop policy if exists "distributions org update or admin" on public.distributions;

create policy "distributions approved or scoped read"
on public.distributions
for select
using (
  status = 'approved'
  or auth.uid() = organization_id
  or public.is_admin()
);

create policy "distributions org insert or admin"
on public.distributions
for insert
with check (
  auth.uid() = organization_id
  or public.is_admin()
);

create policy "distributions org update or admin"
on public.distributions
for update
using (
  auth.uid() = organization_id
  or public.is_admin()
)
with check (
  auth.uid() = organization_id
  or public.is_admin()
);

do $$
begin
  begin
    alter publication supabase_realtime add table public.users;
  exception
    when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.donations;
  exception
    when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.distributions;
  exception
    when duplicate_object then null;
  end;
end $$;
