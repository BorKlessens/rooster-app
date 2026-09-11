-- ============================================================================
-- Rooster App - volledig databaseschema
-- ============================================================================
--
-- Voer dit bestand in zijn geheel uit in de Supabase SQL Editor van een leeg
-- project. Het script is idempotent: opnieuw uitvoeren op een bestaande
-- database is veilig en verandert niets aan de data.
--
-- Wachtwoorden staan NIET in dit schema. Die worden beheerd door Supabase Auth
-- in de tabel auth.users. public.users bevat alleen het profiel en de rol.
--
-- Volgorde: extensies -> tabellen -> functies -> triggers -> RLS -> grants
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ============================================================================
-- 1. Tabellen
-- ============================================================================

-- Profiel van een medewerker. De id is dezelfde als die van het bijbehorende
-- account in auth.users, zodat auth.uid() direct naar dit profiel wijst.
create table if not exists public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text        not null,
  full_name   text,
  role        text        not null default 'user',
  email       text,
  phone       text,
  birthday    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint users_role_check     check (role in ('user', 'admin')),
  constraint users_username_check check (username = lower(username) and length(username) between 2 and 50)
);

-- Gebruikersnamen zijn hoofdletterongevoelig uniek. De app slaat ze altijd in
-- kleine letters op, dus een index op de kolom zelf volstaat.
create unique index if not exists users_username_key on public.users (username);

comment on table  public.users          is 'Profiel per medewerker, gekoppeld aan auth.users';
comment on column public.users.username is 'Inlognaam, altijd lowercase, uniek';
comment on column public.users.email    is 'Contact e-mailadres, niet het interne auth-adres';
comment on column public.users.role     is 'user of admin';

-- Een ingeplande dienst.
create table if not exists public.shifts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid        not null references public.users (id) on delete cascade,
  username    text        not null,
  date        date        not null,
  start_time  time        not null,
  end_time    time        not null,
  role        text,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint shifts_user_date_start_key unique (user_id, date, start_time)
);

create index if not exists shifts_date_idx         on public.shifts (date);
create index if not exists shifts_user_id_date_idx on public.shifts (user_id, date);

comment on table  public.shifts          is 'Ingeplande diensten per medewerker per dag';
comment on column public.shifts.username is 'Kopie van users.username, automatisch bijgehouden door trigger';

-- Beschikbaarheid van een medewerker voor een dag.
create table if not exists public.availability (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid        not null references public.users (id) on delete cascade,
  username    text        not null,
  date        date        not null,
  status      text,
  time_slots  text[]      not null default '{}',
  locked      boolean     not null default false,
  message     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint availability_user_date_key   unique (user_id, date),
  constraint availability_status_check    check (status is null or status = 'available'),
  constraint availability_slots_check     check (time_slots <@ array['morning', 'afternoon', 'evening']::text[]),
  constraint availability_message_check   check (message is null or length(message) <= 500)
);

create index if not exists availability_date_idx on public.availability (date);

comment on table  public.availability            is 'Opgegeven beschikbaarheid per medewerker per dag';
comment on column public.availability.time_slots is 'Subset van morning, afternoon, evening';
comment on column public.availability.locked     is 'Medewerker heeft de dag vastgezet';

-- ============================================================================
-- 2. Functies
-- ============================================================================

-- Houdt updated_at bij op elke wijziging.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Is de huidige gebruiker admin?
--
-- security definer omzeilt RLS op public.users. Dat is hier noodzakelijk: de
-- policies op users roepen deze functie aan, dus zonder definer zou de check
-- zichzelf recursief aanroepen.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  );
$$;

-- Maakt automatisch een profiel aan zodra er een account in auth.users komt.
-- De app zet username, full_name en role in de user metadata bij het aanmaken.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.users (id, username, full_name, role, email, phone, birthday)
  values (
    new.id,
    lower(coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), split_part(new.email, '@', 1))),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'role', ''), 'user'),
    nullif(new.raw_user_meta_data ->> 'contact_email', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'birthday', '')::date
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Vult shifts.username en availability.username altijd vanuit het profiel.
-- Zo kan een client geen afwijkende naam meesturen bij een insert.
create or replace function public.sync_row_username()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  select u.username into new.username
  from public.users u
  where u.id = new.user_id;

  if new.username is null then
    raise exception 'Onbekende user_id: %', new.user_id;
  end if;

  return new;
end;
$$;

-- Houdt de gekopieerde usernames gelijk wanneer een profiel hernoemd wordt.
create or replace function public.propagate_username_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.shifts       set username = new.username where user_id = new.id;
  update public.availability set username = new.username where user_id = new.id;
  return new;
end;
$$;

-- ============================================================================
-- 3. Triggers
-- ============================================================================

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists shifts_set_updated_at on public.shifts;
create trigger shifts_set_updated_at
  before update on public.shifts
  for each row execute function public.set_updated_at();

drop trigger if exists availability_set_updated_at on public.availability;
create trigger availability_set_updated_at
  before update on public.availability
  for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists shifts_sync_username on public.shifts;
create trigger shifts_sync_username
  before insert or update of user_id on public.shifts
  for each row execute function public.sync_row_username();

drop trigger if exists availability_sync_username on public.availability;
create trigger availability_sync_username
  before insert or update of user_id on public.availability
  for each row execute function public.sync_row_username();

drop trigger if exists users_propagate_username on public.users;
create trigger users_propagate_username
  after update of username on public.users
  for each row
  when (old.username is distinct from new.username)
  execute function public.propagate_username_change();

-- ============================================================================
-- 4. Row Level Security
-- ============================================================================
--
-- Uitgangspunten:
--   users        persoonsgegevens, alleen jezelf en admins
--   shifts       het rooster is teaminformatie, iedereen leest, admin schrijft
--   availability alleen jezelf en admins, iedereen beheert zijn eigen rijen
--
-- De service role key omzeilt RLS volledig. Die wordt uitsluitend in
-- server-side API-routes gebruikt, nooit in de browser.

alter table public.users        enable row level security;
alter table public.shifts       enable row level security;
alter table public.availability enable row level security;

-- --- users ------------------------------------------------------------------

drop policy if exists users_select_self_or_admin on public.users;
create policy users_select_self_or_admin on public.users
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists users_insert_admin on public.users;
create policy users_insert_admin on public.users
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists users_update_admin on public.users;
create policy users_update_admin on public.users
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists users_delete_admin on public.users;
create policy users_delete_admin on public.users
  for delete to authenticated
  using (public.is_admin());

-- --- shifts -----------------------------------------------------------------

drop policy if exists shifts_select_authenticated on public.shifts;
create policy shifts_select_authenticated on public.shifts
  for select to authenticated
  using (true);

drop policy if exists shifts_insert_admin on public.shifts;
create policy shifts_insert_admin on public.shifts
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists shifts_update_admin on public.shifts;
create policy shifts_update_admin on public.shifts
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists shifts_delete_admin on public.shifts;
create policy shifts_delete_admin on public.shifts
  for delete to authenticated
  using (public.is_admin());

-- --- availability -----------------------------------------------------------

drop policy if exists availability_select_own_or_admin on public.availability;
create policy availability_select_own_or_admin on public.availability
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists availability_insert_own_or_admin on public.availability;
create policy availability_insert_own_or_admin on public.availability
  for insert to authenticated
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists availability_update_own_or_admin on public.availability;
create policy availability_update_own_or_admin on public.availability
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists availability_delete_own_or_admin on public.availability;
create policy availability_delete_own_or_admin on public.availability
  for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ============================================================================
-- 5. Rechten
-- ============================================================================
--
-- Niet-ingelogde bezoekers (anon) krijgen geen enkele toegang. Ingelogde
-- gebruikers krijgen toegang op tabelniveau; wat ze daadwerkelijk zien wordt
-- door de policies hierboven bepaald.

revoke all on public.users        from anon;
revoke all on public.shifts       from anon;
revoke all on public.availability from anon;

grant select, insert, update, delete on public.users        to authenticated;
grant select, insert, update, delete on public.shifts       to authenticated;
grant select, insert, update, delete on public.availability to authenticated;

revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;
