-- ============================================================
-- Tour HQ -- Full Supabase Schema (idempotent / re-runnable)
-- Run this in: https://edxiwaduxwaitxlahkzl.supabase.co > SQL Editor
-- ============================================================

create extension if not exists pgcrypto;

-- ---- Tables -----------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  username text unique not null,
  full_name text,
  role text not null default 'crew' check (role in ('tour_manager', 'crew')),
  tour_id uuid references public.tours(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tours (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  artist_name text not null,
  start_date date not null,
  end_date date not null,
  tm_name text,
  tm_email text,
  booking_agent text,
  vehicle_type text not null default 'bus' check (vehicle_type in ('bus', 'van', 'suv', 'other')),
  drive_speed_mph integer not null default 55,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tour_dates (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  date date not null,
  venue text,
  city text,
  type text not null default 'SHOW' check (type in ('SHOW', 'TRAVEL', 'OFF', 'REHEARSAL')),
  status text not null default 'PENDING' check (status in ('CONFIRMED', 'PENDING', 'OFF', 'CANCELLED')),
  notes text,
  from_city text,
  to_city text,
  distance text,
  drive_time text,
  next_city text,
  next_distance text,
  next_drive_time text,
  stopover jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tour_id, date)
);

create table if not exists public.day_sheets (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  day_date date not null,
  city text,
  venue_name text,
  venue_address text,
  promoter_contact text,
  hotel_info text,
  notes text,
  is_show boolean not null default true,
  entries jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tour_id, day_date)
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tour_id uuid references public.tours(id) on delete set null,
  file_name text not null,
  file_path text not null,
  file_size bigint,
  mime_type text,
  bucket text not null default 'tour-hq-docs',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guest_list_requests (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  guest_name text not null,
  guest_email text,
  guest_count integer not null default 1,
  pass_type text not null default 'guest' check (pass_type in ('guest', 'industry', 'comp', 'vip')),
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tour_invitations (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  role text not null default 'crew' check (role in ('tour_manager', 'crew')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique(tour_id, email)
);

-- ---- Trigger function --------------------------------------

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---- Triggers (drop + recreate for idempotency) -----------

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute procedure public.handle_updated_at();

drop trigger if exists tours_set_updated_at on public.tours;
create trigger tours_set_updated_at before update on public.tours
for each row execute procedure public.handle_updated_at();

drop trigger if exists tour_dates_set_updated_at on public.tour_dates;
create trigger tour_dates_set_updated_at before update on public.tour_dates
for each row execute procedure public.handle_updated_at();

drop trigger if exists day_sheets_set_updated_at on public.day_sheets;
create trigger day_sheets_set_updated_at before update on public.day_sheets
for each row execute procedure public.handle_updated_at();

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at before update on public.documents
for each row execute procedure public.handle_updated_at();

drop trigger if exists guest_list_requests_set_updated_at on public.guest_list_requests;
create trigger guest_list_requests_set_updated_at before update on public.guest_list_requests
for each row execute procedure public.handle_updated_at();

drop trigger if exists tour_invitations_set_updated_at on public.tour_invitations;
create trigger tour_invitations_set_updated_at before update on public.tour_invitations
for each row execute procedure public.handle_updated_at();

-- ---- RLS ------------------------------------------------

alter table public.profiles enable row level security;
alter table public.tours enable row level security;
alter table public.tour_dates enable row level security;
alter table public.day_sheets enable row level security;
alter table public.documents enable row level security;
alter table public.guest_list_requests enable row level security;
alter table public.tour_invitations enable row level security;

-- ---- Policies (drop + recreate for idempotency) -----------

drop policy if exists "users can view own profile" on public.profiles;
create policy "users can view own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "users can view own tours" on public.tours;
create policy "users can view own tours" on public.tours for select using (auth.uid() = user_id);

drop policy if exists "users can create own tours" on public.tours;
create policy "users can create own tours" on public.tours for insert with check (auth.uid() = user_id);

drop policy if exists "users can update own tours" on public.tours;
create policy "users can update own tours" on public.tours for update using (auth.uid() = user_id);

drop policy if exists "users can view own tour dates" on public.tour_dates;
create policy "users can view own tour dates" on public.tour_dates for select using (
  exists (select 1 from public.tours where tours.id = tour_dates.tour_id and tours.user_id = auth.uid())
);

drop policy if exists "users can insert own tour dates" on public.tour_dates;
create policy "users can insert own tour dates" on public.tour_dates for insert with check (
  exists (select 1 from public.tours where tours.id = tour_dates.tour_id and tours.user_id = auth.uid())
);

drop policy if exists "users can update own tour dates" on public.tour_dates;
create policy "users can update own tour dates" on public.tour_dates for update using (
  exists (select 1 from public.tours where tours.id = tour_dates.tour_id and tours.user_id = auth.uid())
);

drop policy if exists "users can view own day sheets" on public.day_sheets;
create policy "users can view own day sheets" on public.day_sheets for select using (
  exists (select 1 from public.tours where tours.id = day_sheets.tour_id and tours.user_id = auth.uid())
);

drop policy if exists "users can create own day sheets" on public.day_sheets;
create policy "users can create own day sheets" on public.day_sheets for insert with check (
  exists (select 1 from public.tours where tours.id = day_sheets.tour_id and tours.user_id = auth.uid())
);

drop policy if exists "users can update own day sheets" on public.day_sheets;
create policy "users can update own day sheets" on public.day_sheets for update using (
  exists (select 1 from public.tours where tours.id = day_sheets.tour_id and tours.user_id = auth.uid())
);

drop policy if exists "users can view own documents" on public.documents;
create policy "users can view own documents" on public.documents for select using (auth.uid() = user_id);

drop policy if exists "users can insert own documents" on public.documents;
create policy "users can insert own documents" on public.documents for insert with check (auth.uid() = user_id);

drop policy if exists "users can update own documents" on public.documents;
create policy "users can update own documents" on public.documents for update using (auth.uid() = user_id);

drop policy if exists "users can delete own documents" on public.documents;
create policy "users can delete own documents" on public.documents for delete using (auth.uid() = user_id);

drop policy if exists "users can view own tour guest requests" on public.guest_list_requests;
create policy "users can view own tour guest requests" on public.guest_list_requests for select using (
  exists (select 1 from public.profiles where id = auth.uid() and tour_id = guest_list_requests.tour_id)
);

drop policy if exists "crew can submit guest requests" on public.guest_list_requests;
create policy "crew can submit guest requests" on public.guest_list_requests for insert with check (auth.uid() = requested_by);

drop policy if exists "tour managers can update guest requests" on public.guest_list_requests;
create policy "tour managers can update guest requests" on public.guest_list_requests for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'tour_manager' and tour_id = guest_list_requests.tour_id)
);

drop policy if exists "users can view own invitations" on public.tour_invitations;
create policy "users can view own invitations" on public.tour_invitations for select using (
  auth.uid() = invited_by or email = (select email from public.profiles where id = auth.uid())
);

drop policy if exists "tour managers can create invitations" on public.tour_invitations;
create policy "tour managers can create invitations" on public.tour_invitations for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'tour_manager')
);

drop policy if exists "users can update own invitations" on public.tour_invitations;
create policy "users can update own invitations" on public.tour_invitations for update using (
  auth.uid() = invited_by or email = (select email from public.profiles where id = auth.uid())
);

-- ---- Storage bucket ----------------------------------------
-- Create this manually in Supabase > Storage > New Bucket:
-- Name: tour-hq-docs  (private, not public)
-- Then uncomment and run:
-- insert into storage.buckets (id, name, public) values ('tour-hq-docs', 'tour-hq-docs', false) on conflict do nothing;
