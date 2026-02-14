-- TurfTown schema for Supabase PostgreSQL
create extension if not exists "pgcrypto";

create type public.skill_level as enum ('Rookie', 'Pro', 'Elite');
create type public.participant_status as enum ('confirmed', 'waitlist');
create type public.match_status as enum ('open', 'full', 'completed', 'cancelled');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 3 and 24),
  avatar_url text,
  bio text,
  skill_level public.skill_level not null default 'Rookie',
  rep_score integer not null default 0 check (rep_score between 0 and 100),
  favorite_sports text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lat numeric(9, 6) not null,
  long numeric(9, 6) not null,
  price_hr numeric(10, 2) not null check (price_hr >= 0),
  amenities text[] not null default '{}',
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete restrict,
  start_time timestamptz not null,
  sport_type text not null,
  max_players integer not null check (max_players > 1),
  cost_per_head numeric(10, 2) not null check (cost_per_head >= 0),
  status public.match_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.participants (
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.participant_status not null default 'waitlist',
  created_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

create index if not exists idx_profiles_rep_score on public.profiles(rep_score desc);
create index if not exists idx_venues_location on public.venues(lat, long);
create index if not exists idx_matches_start_time on public.matches(start_time);
create index if not exists idx_matches_sport_type on public.matches(sport_type);
create index if not exists idx_participants_user_id on public.participants(user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists venues_set_updated_at on public.venues;
create trigger venues_set_updated_at
before update on public.venues
for each row
execute function public.set_updated_at();

drop trigger if exists matches_set_updated_at on public.matches;
create trigger matches_set_updated_at
before update on public.matches
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.venues enable row level security;
alter table public.matches enable row level security;
alter table public.participants enable row level security;

create policy "Profiles are viewable by everyone"
on public.profiles for select
using (true);

create policy "Users can insert their own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Venues are viewable by everyone"
on public.venues for select
using (true);

create policy "Matches are viewable by everyone"
on public.matches for select
using (true);

create policy "Authenticated users can create matches"
on public.matches for insert
to authenticated
with check (auth.uid() = host_id);

create policy "Hosts can update their own matches"
on public.matches for update
using (auth.uid() = host_id)
with check (auth.uid() = host_id);

create policy "Participants are viewable by everyone"
on public.participants for select
using (true);

create policy "Users can join matches for themselves"
on public.participants for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their participation"
on public.participants for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
