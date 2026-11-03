-- Vidéos YouTube affichées sur la page Actualités, gérées depuis /admin/videos.
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  titre text not null check (char_length(titre) between 2 and 160),
  youtube_id text not null check (youtube_id ~ '^[A-Za-z0-9_-]{10,64}$'),
  type text not null default 'video' check (type in ('video', 'playlist')),
  categorie text not null check (categorie in ('Festivals', 'Concerts', 'Formations', 'Communauté', 'Studio', 'Événements')),
  position int not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (type, youtube_id)
);
create index videos_position_idx on public.videos (position);
create trigger videos_touch before update on public.videos
  for each row execute function public.touch_updated_at();
alter table public.videos enable row level security;

create policy "public lit les vidéos visibles" on public.videos
  for select to anon, authenticated using (visible = true or (select public.is_admin()));
create policy "admins ajoutent des vidéos" on public.videos
  for insert to authenticated with check ((select public.is_admin()));
create policy "admins modifient les vidéos" on public.videos
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins suppriment les vidéos" on public.videos
  for delete to authenticated using ((select public.is_admin()));

-- Playlist officielle du Rio Fresco Fest 2026 (citée dans le rapport d'impact).
insert into public.videos (titre, youtube_id, type, categorie, position)
values ('Playlist officielle du Rio Fresco Fest 2026', 'PLkj6oueoO2k9cF5I8iaKtyo2pfF_pCf23', 'playlist', 'Festivals', 1);
