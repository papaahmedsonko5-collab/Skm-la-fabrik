-- Inverse de l'étape G : remet enregistrer_visite() exactement comme dans
-- 20261103040000_visites.sql (sans verrou, avec l'effacement des 13 mois).
-- Non destructif : aucune donnée n'est touchée, les droits sont conservés.

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
