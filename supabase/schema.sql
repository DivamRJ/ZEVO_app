create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

create type public.user_role as enum ('PLAYER', 'OWNER', 'ADMIN');
create type public.booking_status as enum ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
create type public.skill_level as enum ('Beginner', 'Intermediate', 'Advanced');
create type public.public_message_type as enum ('text', 'meetup');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  display_name text not null,
  role public.user_role not null default 'PLAYER',
  wallet_balance numeric(12,2) not null default 0 check (wallet_balance >= 0),
  city text,
  skill_level public.skill_level not null default 'Beginner',
  interests text[] not null default '{}',
  avatar_url text,
  bio text,
  rep_score integer not null default 0 check (rep_score >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.public_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  username text not null,
  avatar_url text,
  city text,
  skill_level public.skill_level not null default 'Beginner',
  interests text[] not null default '{}',
  bio text,
  rep_score integer not null default 0 check (rep_score >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.turfs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  name text not null default 'Demo Turf',
  price_per_hour numeric(12,2) not null check (price_per_hour >= 0),
  location text not null,
  time_zone text not null default 'UTC',
  operating_hours jsonb not null default '{}'::jsonb,
  latitude double precision,
  longitude double precision,
  amenities text[] not null default '{}',
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint turfs_operating_hours_is_object check (jsonb_typeof(operating_hours) = 'object')
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  turf_id uuid not null references public.turfs (id) on delete restrict,
  start_time timestamptz not null,
  end_time timestamptz not null,
  total_price numeric(12,2) not null default 0 check (total_price >= 0),
  status public.booking_status not null default 'PENDING',
  lock_expires_at timestamptz,
  confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_minimum_duration check (end_time >= start_time + interval '1 hour'),
  constraint bookings_pending_has_lock check (status <> 'PENDING' or lock_expires_at is not null)
);

create table public.public_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  sender_name text not null,
  message_type public.public_message_type not null default 'text',
  body text not null,
  meetup_venue text,
  meetup_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.arena_chat_rooms (
  id uuid primary key default gen_random_uuid(),
  arena_id uuid not null references public.turfs (id) on delete cascade,
  arena_name text not null,
  sport text not null,
  topic text not null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.arena_chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.arena_chat_rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  sender_name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.help_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index turfs_owner_id_idx on public.turfs (owner_id);
create index turfs_active_idx on public.turfs (is_active);
create index bookings_turf_time_idx on public.bookings (turf_id, start_time, end_time);
create index bookings_user_time_idx on public.bookings (user_id, start_time, end_time);
create index bookings_status_idx on public.bookings (status, lock_expires_at);
create index public_chat_messages_created_at_idx on public.public_chat_messages (created_at desc);
create index arena_chat_rooms_arena_id_idx on public.arena_chat_rooms (arena_id);
create index arena_chat_messages_room_id_idx on public.arena_chat_messages (room_id, created_at desc);
create index help_requests_user_id_idx on public.help_requests (user_id);

alter table public.bookings
  add constraint turf_booking_no_overlap
  exclude using gist (
    turf_id with =,
    tstzrange(start_time, end_time, '[)') with &&
  )
  where (status in ('PENDING', 'CONFIRMED'));

alter table public.bookings
  add constraint confirmed_user_booking_no_overlap
  exclude using gist (
    user_id with =,
    tstzrange(start_time, end_time, '[)') with &&
  )
  where (status = 'CONFIRMED');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'ADMIN', false)
$$;

create or replace function public.sync_public_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.public_profiles (
    user_id,
    username,
    avatar_url,
    city,
    skill_level,
    interests,
    bio,
    rep_score,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.display_name,
    new.avatar_url,
    new.city,
    new.skill_level,
    new.interests,
    new.bio,
    new.rep_score,
    new.created_at,
    new.updated_at
  )
  on conflict (user_id) do update
  set
    username = excluded.username,
    avatar_url = excluded.avatar_url,
    city = excluded.city,
    skill_level = excluded.skill_level,
    interests = excluded.interests,
    bio = excluded.bio,
    rep_score = excluded.rep_score,
    updated_at = excluded.updated_at;

  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_role text;
  safe_role public.user_role;
  display_name text;
begin
  raw_role := upper(coalesce(new.raw_user_meta_data ->> 'role', 'PLAYER'));
  safe_role := case
    when raw_role in ('PLAYER', 'OWNER', 'ADMIN') then raw_role::public.user_role
    else 'PLAYER'::public.user_role
  end;

  display_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'name', ''),
    split_part(coalesce(new.email, ''), '@', 1),
    'ZEVO User'
  );

  insert into public.profiles (
    id,
    email,
    display_name,
    role
  )
  values (
    new.id,
    lower(new.email),
    display_name,
    safe_role
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name);

  return new;
end;
$$;

create or replace function public.prepare_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  hourly_rate numeric(12,2);
begin
  if new.start_time <= now() then
    raise exception 'start_time must be in the future';
  end if;

  if new.end_time < new.start_time + interval '1 hour' then
    raise exception 'end_time must be at least 60 minutes after start_time';
  end if;

  select price_per_hour
  into hourly_rate
  from public.turfs
  where id = new.turf_id;

  if hourly_rate is null then
    raise exception 'turf not found';
  end if;

  new.total_price := round(
    ((extract(epoch from (new.end_time - new.start_time)) / 3600)::numeric) * hourly_rate,
    2
  );

  if new.status = 'PENDING' and (new.lock_expires_at is null or new.lock_expires_at <= now()) then
    new.lock_expires_at := now() + interval '10 minutes';
  elsif new.status <> 'PENDING' then
    new.lock_expires_at := null;
  end if;

  if new.status = 'CONFIRMED' and new.confirmed_at is null then
    new.confirmed_at := now();
  end if;

  if new.status = 'COMPLETED' and new.completed_at is null then
    new.completed_at := now();
  end if;

  if new.status = 'CANCELLED' and new.cancelled_at is null then
    new.cancelled_at := now();
  end if;

  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger public_profiles_sync_from_profiles
after insert or update on public.profiles
for each row
execute function public.sync_public_profile();

create trigger turfs_set_updated_at
before update on public.turfs
for each row
execute function public.set_updated_at();

create trigger bookings_set_updated_at
before update on public.bookings
for each row
execute function public.set_updated_at();

create trigger bookings_prepare_before_write
before insert or update on public.bookings
for each row
execute function public.prepare_booking();

create trigger public_chat_messages_set_updated_at
before update on public.public_chat_messages
for each row
execute function public.set_updated_at();

create trigger arena_chat_rooms_set_updated_at
before update on public.arena_chat_rooms
for each row
execute function public.set_updated_at();

create trigger arena_chat_messages_set_updated_at
before update on public.arena_chat_messages
for each row
execute function public.set_updated_at();

create trigger help_requests_set_updated_at
before update on public.help_requests
for each row
execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

insert into public.profiles (id, email, display_name, role)
select
  u.id,
  lower(u.email),
  coalesce(nullif(u.raw_user_meta_data ->> 'name', ''), split_part(u.email, '@', 1), 'ZEVO User'),
  case
    when upper(coalesce(u.raw_user_meta_data ->> 'role', 'PLAYER')) in ('PLAYER', 'OWNER', 'ADMIN')
      then upper(coalesce(u.raw_user_meta_data ->> 'role', 'PLAYER'))::public.user_role
    else 'PLAYER'::public.user_role
  end
from auth.users u
on conflict (id) do nothing;

insert into public.public_profiles (
  user_id,
  username,
  avatar_url,
  city,
  skill_level,
  interests,
  bio,
  rep_score,
  created_at,
  updated_at
)
select
  p.id,
  p.display_name,
  p.avatar_url,
  p.city,
  p.skill_level,
  p.interests,
  p.bio,
  p.rep_score,
  p.created_at,
  p.updated_at
from public.profiles p
on conflict (user_id) do nothing;

alter table public.profiles enable row level security;
alter table public.public_profiles enable row level security;
alter table public.turfs enable row level security;
alter table public.bookings enable row level security;
alter table public.public_chat_messages enable row level security;
alter table public.arena_chat_rooms enable row level security;
alter table public.arena_chat_messages enable row level security;
alter table public.help_requests enable row level security;

create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (auth.uid() = id or public.is_admin());

create policy "profiles_insert_own_or_admin"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id or public.is_admin());

create policy "profiles_update_own_or_admin"
on public.profiles
for update
to authenticated
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

create policy "profiles_delete_own_or_admin"
on public.profiles
for delete
to authenticated
using (auth.uid() = id or public.is_admin());

create policy "public_profiles_read_all"
on public.public_profiles
for select
to anon, authenticated
using (true);

create policy "turfs_read_all"
on public.turfs
for select
to anon, authenticated
using (is_active = true or auth.uid() = owner_id or public.is_admin());

create policy "turfs_insert_owner_or_admin"
on public.turfs
for insert
to authenticated
with check (
  (auth.uid() = owner_id and public.current_user_role() in ('OWNER', 'ADMIN'))
  or public.is_admin()
);

create policy "turfs_update_owner_or_admin"
on public.turfs
for update
to authenticated
using (auth.uid() = owner_id or public.is_admin())
with check (
  (auth.uid() = owner_id and public.current_user_role() in ('OWNER', 'ADMIN'))
  or public.is_admin()
);

create policy "turfs_delete_owner_or_admin"
on public.turfs
for delete
to authenticated
using (auth.uid() = owner_id or public.is_admin());

create policy "bookings_read_parties"
on public.bookings
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin()
  or exists (
    select 1
    from public.turfs t
    where t.id = bookings.turf_id
      and t.owner_id = auth.uid()
  )
);

create policy "bookings_insert_own"
on public.bookings
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "bookings_update_parties"
on public.bookings
for update
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin()
  or exists (
    select 1
    from public.turfs t
    where t.id = bookings.turf_id
      and t.owner_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  or public.is_admin()
  or exists (
    select 1
    from public.turfs t
    where t.id = bookings.turf_id
      and t.owner_id = auth.uid()
  )
);

create policy "bookings_delete_own_pending_or_admin"
on public.bookings
for delete
to authenticated
using (
  public.is_admin()
  or (auth.uid() = user_id and status in ('PENDING', 'CANCELLED'))
);

create policy "public_chat_read_all"
on public.public_chat_messages
for select
to anon, authenticated
using (true);

create policy "public_chat_insert_own"
on public.public_chat_messages
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "public_chat_update_own_or_admin"
on public.public_chat_messages
for update
to authenticated
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

create policy "public_chat_delete_own_or_admin"
on public.public_chat_messages
for delete
to authenticated
using (auth.uid() = user_id or public.is_admin());

create policy "arena_rooms_read_all"
on public.arena_chat_rooms
for select
to anon, authenticated
using (true);

create policy "arena_rooms_insert_own"
on public.arena_chat_rooms
for insert
to authenticated
with check (auth.uid() = created_by);

create policy "arena_rooms_update_own_or_admin"
on public.arena_chat_rooms
for update
to authenticated
using (auth.uid() = created_by or public.is_admin())
with check (auth.uid() = created_by or public.is_admin());

create policy "arena_rooms_delete_own_or_admin"
on public.arena_chat_rooms
for delete
to authenticated
using (auth.uid() = created_by or public.is_admin());

create policy "arena_messages_read_all"
on public.arena_chat_messages
for select
to anon, authenticated
using (true);

create policy "arena_messages_insert_own"
on public.arena_chat_messages
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "arena_messages_update_own_or_admin"
on public.arena_chat_messages
for update
to authenticated
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

create policy "arena_messages_delete_own_or_admin"
on public.arena_chat_messages
for delete
to authenticated
using (auth.uid() = user_id or public.is_admin());

create policy "help_requests_insert_public"
on public.help_requests
for insert
to anon, authenticated
with check (user_id is null or auth.uid() = user_id);

create policy "help_requests_read_own_or_admin"
on public.help_requests
for select
to authenticated
using (auth.uid() = user_id or public.is_admin());

create policy "help_requests_update_admin_only"
on public.help_requests
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "help_requests_delete_admin_only"
on public.help_requests
for delete
to authenticated
using (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.public_profiles to anon, authenticated;
grant select on public.turfs to anon, authenticated;
grant select on public.public_chat_messages to anon, authenticated;
grant select on public.arena_chat_rooms to anon, authenticated;
grant select on public.arena_chat_messages to anon, authenticated;
grant insert on public.help_requests to anon, authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.bookings to authenticated;
grant select, insert, update, delete on public.public_chat_messages to authenticated;
grant select, insert, update, delete on public.arena_chat_rooms to authenticated;
grant select, insert, update, delete on public.arena_chat_messages to authenticated;
grant select, insert, update, delete on public.turfs to authenticated;
grant select on public.help_requests to authenticated;
