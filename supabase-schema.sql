create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('admin', 'org');
  end if;

  if not exists (select 1 from pg_type where typname = 'donation_type') then
    create type donation_type as enum ('cash', 'goods');
  end if;

  if not exists (select 1 from pg_type where typname = 'donation_status') then
    create type donation_status as enum ('pending', 'approved');
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
  status donation_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.distributions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.users (id) on delete cascade,
  item_name text not null,
  quantity numeric(12,2) not null check (quantity >= 0),
  location text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email, role, organization_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'org'),
    coalesce(new.raw_user_meta_data ->> 'organization_name', 'Barangay')
  )
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    role = excluded.role,
    organization_name = excluded.organization_name;

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

drop policy if exists "users self or admin read" on public.users;
create policy "users self or admin read"
on public.users for select
using (
  auth.uid() = id or
  exists (
    select 1 from public.users admin_user
    where admin_user.id = auth.uid() and admin_user.role = 'admin'
  )
);

drop policy if exists "users admin write" on public.users;
create policy "users admin write"
on public.users for all
using (
  exists (
    select 1 from public.users admin_user
    where admin_user.id = auth.uid() and admin_user.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.users admin_user
    where admin_user.id = auth.uid() and admin_user.role = 'admin'
  )
);


drop policy if exists "donations public approved read" on public.donations;
create policy "donations public approved read"
on public.donations for select
using (
  status = 'approved' or
  exists (
    select 1 from public.users current_user
    where current_user.id = auth.uid()
      and (
        current_user.role = 'admin' or
        current_user.id = organization_id
      )
  )
);

drop policy if exists "donations org insert or admin" on public.donations;
create policy "donations org insert or admin"
on public.donations for insert
with check (
  exists (
    select 1 from public.users current_user
    where current_user.id = auth.uid()
      and (
        current_user.role = 'admin' or
        current_user.id = organization_id
      )
  )
);

drop policy if exists "donations org update or admin" on public.donations;
create policy "donations org update or admin"
on public.donations for update
using (
  exists (
    select 1 from public.users current_user
    where current_user.id = auth.uid()
      and (
        current_user.role = 'admin' or
        current_user.id = organization_id
      )
  )
)
with check (
  exists (
    select 1 from public.users current_user
    where current_user.id = auth.uid()
      and (
        current_user.role = 'admin' or
        current_user.id = organization_id
      )
  )
);

drop policy if exists "distributions public read" on public.distributions;
create policy "distributions public read"
on public.distributions for select
using (true);

drop policy if exists "distributions org insert or admin" on public.distributions;
create policy "distributions org insert or admin"
on public.distributions for insert
with check (
  exists (
    select 1 from public.users current_user
    where current_user.id = auth.uid()
      and (
        current_user.role = 'admin' or
        current_user.id = organization_id
      )
  )
);

drop policy if exists "distributions org update or admin" on public.distributions;
create policy "distributions org update or admin"
on public.distributions for update
using (
  exists (
    select 1 from public.users current_user
    where current_user.id = auth.uid()
      and (
        current_user.role = 'admin' or
        current_user.id = organization_id
      )
  )
)
with check (
  exists (
    select 1 from public.users current_user
    where current_user.id = auth.uid()
      and (
        current_user.role = 'admin' or
        current_user.id = organization_id
      )
  )
);

alter publication supabase_realtime add table public.users;
alter publication supabase_realtime add table public.donations;
alter publication supabase_realtime add table public.distributions;
