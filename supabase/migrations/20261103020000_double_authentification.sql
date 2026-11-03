-- Double authentification obligatoire pour l'espace admin.
-- is_admin() n'est vrai qu'avec une session validée par le code de
-- l'application d'authentification (niveau aal2) : sans ce code, la base
-- refuse lectures privées et écritures, même avec le bon mot de passe.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2'
     and exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

-- Avant le code : sait seulement si le compte connecté est dans la liste des
-- admins (pour l'envoyer vers l'étape du code). Ne donne accès à rien.
create or replace function public.est_admin_inscrit()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke all on function public.est_admin_inscrit() from public, anon;
grant execute on function public.est_admin_inscrit() to authenticated;
