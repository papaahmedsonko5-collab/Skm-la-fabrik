-- Simulation minimale de Supabase pour tester la migration des publications
-- sur un Postgres 16 LOCAL et jetable. Ne jamais lancer sur Supabase.
-- is_admin() et la table publications sont des copies des migrations du dépôt
-- (20261103020000_double_authentification.sql, 20261103000000_admin.sql) ;
-- tests/migrations.test.ts vérifie que la copie de is_admin() reste identique.
do $$ begin if not exists (select 1 from pg_roles where rolname = $q$anon$q$) then create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls; create role proprio login; end if; end $$;
grant usage on schema public to anon, authenticated, service_role;
grant create on schema public to proprio;
create schema auth authorization proprio;
grant usage on schema auth to anon, authenticated, service_role;
set role proprio;
-- Définitions identiques à celles de Supabase
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
                  (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim', true), ''),
                  nullif(current_setting('request.jwt.claims', true), ''))::jsonb $$;
-- Droits par défaut de Supabase sur les nouveaux objets de public
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

-- Extraits des migrations du dépôt
create table public.admins (user_id uuid primary key);
alter table public.admins enable row level security;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2'
     and exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table public.publications (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_email text not null,
  ok boolean not null
);
alter table public.publications enable row level security;
create policy "admins lisent les publications" on public.publications
  for select to authenticated using ((select public.is_admin()));
create policy "admins ajoutent une publication" on public.publications
  for insert to authenticated with check ((select public.is_admin()));

insert into public.admins values ('11111111-1111-1111-1111-111111111111'), ('22222222-2222-2222-2222-222222222222');
-- Anciennes lignes
insert into public.publications (user_email, ok, created_at) values ('a@x.sn', true, now() - interval '2 days'), ('a@x.sn', false, now() - interval '1 day');
reset role;
