-- Galerie photo du site (page Actualités › Galerie), gérée depuis /admin/photos.
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  alt text not null default '' check (char_length(alt) <= 200),
  categorie text not null check (categorie in ('Festivals', 'Concerts', 'Formations', 'Communauté', 'Studio', 'Événements')),
  position int not null default 0,
  visible boolean not null default true,
  large boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index photos_position_idx on public.photos (position);
create trigger photos_touch before update on public.photos
  for each row execute function public.touch_updated_at();
alter table public.photos enable row level security;

create policy "public lit les photos visibles" on public.photos
  for select to anon, authenticated using (visible = true or (select public.is_admin()));
create policy "admins ajoutent des photos" on public.photos
  for insert to authenticated with check ((select public.is_admin()));
create policy "admins modifient les photos" on public.photos
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins suppriment les photos" on public.photos
  for delete to authenticated using ((select public.is_admin()));
