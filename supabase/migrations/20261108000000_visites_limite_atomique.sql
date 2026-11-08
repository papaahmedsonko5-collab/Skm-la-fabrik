-- Étape G : limite de 300 pages vues par visiteur et par jour, sans course.
-- Avant : deux appels simultanés du même visiteur lisaient le même total et
-- pouvaient tous deux insérer au-delà de la limite. Désormais un verrou
-- transactionnel propre au visiteur (pg_advisory_xact_lock) fait passer ces
-- appels l'un après l'autre ; il se libère seul à la fin de l'appel et ne
-- bloque jamais les autres visiteurs.
-- L'effacement des visites de plus de 13 mois est retiré d'ici : la tâche
-- quotidienne entretien_quotidien() le fait déjà.
-- Inchangés : signature, sel du jour, contrôles, droits (create or replace
-- conserve les droits existants : anon et authenticated).

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

  -- Un appel à la fois par visiteur (le visiteur change chaque jour avec le sel).
  -- 7301 : espace réservé aux visites, pour ne croiser aucun autre verrou.
  perform pg_advisory_xact_lock(7301, hashtext(v_visiteur));

  -- Anti-abus : au-delà de 300 pages vues par visiteur et par jour, on ignore.
  if (select count(*) from public.visites where jour = v_jour and visiteur = v_visiteur) >= 300 then
    return;
  end if;

  insert into public.visites (jour, chemin, provenance, appareil, visiteur)
  values (v_jour, p_chemin, coalesce(p_provenance, ''), p_appareil, v_visiteur);
end;
$$;
