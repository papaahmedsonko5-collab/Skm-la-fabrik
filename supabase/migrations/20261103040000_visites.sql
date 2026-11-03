-- Mesure d'audience maison, sans cookie.
-- Le site envoie le chemin de la page vue, la provenance (nom du site d'où
-- vient le visiteur) et le type d'appareil. Le serveur du site transmet aussi
-- une empreinte (hachage de l'adresse IP et du navigateur) : la base la
-- re-hache avec un sel tiré au hasard chaque jour puis effacé le lendemain.
-- Aucune adresse IP n'est conservée, et un visiteur ne peut pas être suivi
-- d'un jour à l'autre. Les visites sont effacées au bout de 13 mois.

create table public.visites (
  id bigint generated always as identity primary key,
  jour date not null,
  cree_le timestamptz not null default now(),
  chemin text not null check (char_length(chemin) between 1 and 200 and left(chemin, 1) = '/'),
  provenance text not null default '' check (char_length(provenance) <= 100),
  appareil text not null check (appareil in ('mobile', 'tablette', 'ordinateur')),
  visiteur text not null check (char_length(visiteur) = 64)
);
create index visites_jour_idx on public.visites (jour);
create index visites_visiteur_idx on public.visites (jour, visiteur);
alter table public.visites enable row level security;

create policy "admins lisent les visites" on public.visites
  for select to authenticated using ((select public.is_admin()));

-- Sel du jour : jamais lisible depuis l'API (aucune règle RLS).
create table public.visites_sels (
  jour date primary key,
  sel text not null
);
alter table public.visites_sels enable row level security;

create or replace function public.enregistrer_visite(
  p_chemin text, p_provenance text, p_appareil text, p_empreinte text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_jour date := (now() at time zone 'Africa/Dakar')::date;
  v_sel text;
  v_visiteur text;
begin
  if p_empreinte is null or p_empreinte !~ '^[0-9a-f]{64}$' then
    raise exception 'empreinte invalide' using errcode = '22023';
  end if;

  delete from public.visites_sels where jour < v_jour;
  insert into public.visites_sels (jour, sel)
  values (v_jour, replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
  on conflict (jour) do nothing;
  select sel into v_sel from public.visites_sels where jour = v_jour;

  v_visiteur := encode(sha256(convert_to(v_sel || p_empreinte, 'UTF8')), 'hex');

  -- Anti-abus : au-delà de 300 pages vues par visiteur et par jour, on ignore.
  if (select count(*) from public.visites where jour = v_jour and visiteur = v_visiteur) >= 300 then
    return;
  end if;

  insert into public.visites (jour, chemin, provenance, appareil, visiteur)
  values (v_jour, p_chemin, coalesce(p_provenance, ''), p_appareil, v_visiteur);

  delete from public.visites where jour < v_jour - interval '13 months';
end;
$$;
revoke all on function public.enregistrer_visite(text, text, text, text) from public;
grant execute on function public.enregistrer_visite(text, text, text, text) to anon, authenticated;

-- Statistiques pour l'admin, calculées dans la base (règles RLS appliquées).
create or replace function public.stats_visites(p_jours integer)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with periode as (
    select * from public.visites
    where (select public.is_admin())
      and jour > (now() at time zone 'Africa/Dakar')::date - least(greatest(p_jours, 1), 400)
  )
  select jsonb_build_object(
    'vues', (select count(*) from periode),
    'visiteurs', (select count(distinct (jour, visiteur)) from periode),
    'par_jour', coalesce((
      select jsonb_agg(jsonb_build_object('jour', jour, 'vues', vues, 'visiteurs', visiteurs) order by jour)
      from (select jour, count(*) as vues, count(distinct visiteur) as visiteurs from periode group by jour) j
    ), '[]'::jsonb),
    'pages', coalesce((
      select jsonb_agg(jsonb_build_object('chemin', chemin, 'vues', vues, 'visiteurs', visiteurs) order by vues desc, chemin)
      from (
        select chemin, count(*) as vues, count(distinct (jour, visiteur)) as visiteurs
        from periode group by chemin order by vues desc, chemin limit 30
      ) p
    ), '[]'::jsonb),
    'provenances', coalesce((
      select jsonb_agg(jsonb_build_object('provenance', provenance, 'visiteurs', visiteurs) order by visiteurs desc, provenance)
      from (
        select provenance, count(distinct (jour, visiteur)) as visiteurs
        from periode group by provenance order by visiteurs desc, provenance limit 10
      ) s
    ), '[]'::jsonb),
    'appareils', coalesce((
      select jsonb_agg(jsonb_build_object('appareil', appareil, 'visiteurs', visiteurs) order by visiteurs desc)
      from (select appareil, count(distinct (jour, visiteur)) as visiteurs from periode group by appareil) a
    ), '[]'::jsonb)
  );
$$;
revoke all on function public.stats_visites(integer) from public, anon;
grant execute on function public.stats_visites(integer) to authenticated;
