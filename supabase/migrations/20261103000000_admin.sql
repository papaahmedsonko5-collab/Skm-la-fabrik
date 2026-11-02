-- SKM La Fabrik : base de l'espace d'administration.
-- Demandes du formulaire, actualités, projets, textes des pages, réglages et médias.
-- Sécurité : RLS sur toutes les tables. Le public ne lit que le contenu publié
-- et ne peut écrire qu'une demande, via la fonction submit_demande.

-- ---------------------------------------------------------------------------
-- Administrateurs
-- ---------------------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create policy "admins lisent la liste" on public.admins
  for select to authenticated using ((select public.is_admin()));

-- Mise à jour automatique de updated_at
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Demandes reçues par le formulaire de contact
-- ---------------------------------------------------------------------------
create type public.demande_statut as enum ('nouvelle', 'en_cours', 'traitee', 'archivee');

create table public.demandes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  objet text not null check (objet in ('contact', 'partenariat', 'prestation', 'formation', 'production')),
  detail text not null default '' check (char_length(detail) <= 120),
  nom text not null check (char_length(nom) between 2 and 120),
  organisation text not null default '' check (char_length(organisation) <= 160),
  email text not null check (char_length(email) <= 254 and email ~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  telephone text not null default '' check (char_length(telephone) <= 30),
  message text not null check (char_length(message) between 10 and 4000),
  statut public.demande_statut not null default 'nouvelle',
  note_interne text not null default '' check (char_length(note_interne) <= 4000)
);
create index demandes_created_at_idx on public.demandes (created_at desc);
create index demandes_statut_idx on public.demandes (statut);
create trigger demandes_touch before update on public.demandes
  for each row execute function public.touch_updated_at();
alter table public.demandes enable row level security;

create policy "admins lisent les demandes" on public.demandes
  for select to authenticated using ((select public.is_admin()));
create policy "admins modifient les demandes" on public.demandes
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins suppriment les demandes" on public.demandes
  for delete to authenticated using ((select public.is_admin()));

-- Seule porte d'entrée publique : une fonction qui n'insère qu'une demande,
-- avec les contrôles de la table. Elle ne renvoie que l'identifiant.
create or replace function public.submit_demande(
  p_objet text, p_detail text, p_nom text, p_organisation text,
  p_email text, p_telephone text, p_message text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  -- Limite anti-abus : 20 demandes par adresse e-mail et par jour.
  if (select count(*) from public.demandes
      where lower(email) = lower(p_email) and created_at > now() - interval '1 day') >= 20 then
    raise exception 'limite' using errcode = 'P0001';
  end if;
  insert into public.demandes (objet, detail, nom, organisation, email, telephone, message)
  values (p_objet, coalesce(p_detail, ''), p_nom, coalesce(p_organisation, ''), p_email, coalesce(p_telephone, ''), p_message)
  returning id into new_id;
  return new_id;
end;
$$;
revoke all on function public.submit_demande(text, text, text, text, text, text, text) from public;
grant execute on function public.submit_demande(text, text, text, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Actualités
-- ---------------------------------------------------------------------------
create table public.actualites (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 3 and 200),
  type text not null check (type in ('Actualité', 'Annonce', 'Reportage', 'Événement')),
  date date,
  period text not null default '',
  summary text not null check (char_length(summary) <= 220),
  body text not null default '',
  cover_path text,
  cover_alt text not null default '',
  cover_position text not null default 'center' check (cover_position ~ '^[a-z0-9% .]+$'),
  featured boolean not null default false,
  draft boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger actualites_touch before update on public.actualites
  for each row execute function public.touch_updated_at();
alter table public.actualites enable row level security;

create policy "public lit les actualités publiées" on public.actualites
  for select to anon, authenticated using (draft = false or (select public.is_admin()));
create policy "admins écrivent les actualités" on public.actualites
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Projets (portfolio)
-- ---------------------------------------------------------------------------
create table public.projets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 2 and 200),
  category text not null check (category in ('Festivals', 'Événements', 'Productions musicales', 'Formations', 'Initiatives communautaires')),
  period text not null default '',
  year int check (year between 2000 and 2100),
  place text not null default '',
  partners text[] not null default '{}',
  summary text not null check (char_length(summary) <= 180),
  body text not null default '',
  cover_path text,
  cover_alt text not null default '',
  gallery jsonb not null default '[]'::jsonb,
  videos jsonb not null default '[]'::jsonb,
  related_page text check (related_page is null or related_page like '/%'),
  missing text[] not null default '{}',
  featured boolean not null default false,
  draft boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger projets_touch before update on public.projets
  for each row execute function public.touch_updated_at();
alter table public.projets enable row level security;

create policy "public lit les projets publiés" on public.projets
  for select to anon, authenticated using (draft = false or (select public.is_admin()));
create policy "admins écrivent les projets" on public.projets
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Textes des pages et réglages du site (clé / valeur)
-- ---------------------------------------------------------------------------
create table public.contenus (
  key text primary key check (key ~ '^[a-z0-9_.-]+$'),
  page text not null,
  label text not null,
  value text not null default '',
  multiline boolean not null default false,
  position int not null default 0,
  updated_at timestamptz not null default now()
);
create trigger contenus_touch before update on public.contenus
  for each row execute function public.touch_updated_at();
alter table public.contenus enable row level security;

create policy "public lit les contenus" on public.contenus
  for select to anon, authenticated using (true);
create policy "admins écrivent les contenus" on public.contenus
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Journal des publications (bouton « Publier »)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Médias : photos en lecture publique, écriture réservée aux admins
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('medias', 'medias', true, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "admins ajoutent des médias" on storage.objects
  for insert to authenticated with check (bucket_id = 'medias' and (select public.is_admin()));
create policy "admins modifient des médias" on storage.objects
  for update to authenticated using (bucket_id = 'medias' and (select public.is_admin()));
create policy "admins suppriment des médias" on storage.objects
  for delete to authenticated using (bucket_id = 'medias' and (select public.is_admin()));
