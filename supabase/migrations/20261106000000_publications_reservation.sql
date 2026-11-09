-- E1 : réservation persistante avant l'appel au Deploy Hook (étape E).
-- À exécuter AVANT de déployer le code qui appelle reserver_publication / terminer_publication.
-- Compatible avec l'ancien code : son insert {user_email, ok} donne une ligne
-- 'historique', inactive, qui ne bloque rien. Aucune ligne existante n'est modifiée.
-- Horloge : clock_timestamp() (heure réelle), jamais now() qui reste figé au début
-- de la transaction, même après une attente de verrou.

alter table public.publications
  add column if not exists cle uuid,
  add column if not exists statut text not null default 'historique',
  add column if not exists actif boolean not null default false,
  add column if not exists user_id uuid,
  add column if not exists jeton_hash bytea,
  add column if not exists bloque_jusqua timestamptz,
  add column if not exists lance_le timestamptz,
  add column if not exists termine_le timestamptz,
  add column if not exists http_status smallint,
  add column if not exists job_id text,
  add column if not exists detail text;

alter table public.publications
  add constraint publications_cle_unique unique (cle),
  add constraint publications_statut_check
    check (statut in ('historique', 'reservee', 'lancee', 'echec', 'incertaine', 'expiree')),
  -- Une ligne active a toujours une fin de blocage et un statut qui peut bloquer.
  add constraint publications_actif_coherent
    check (not actif or (bloque_jusqua is not null and statut in ('reservee', 'lancee', 'incertaine'))),
  -- reservee et incertaine sont toujours actives (elles deviennent expiree en fin de blocage).
  add constraint publications_attente_active
    check (statut not in ('reservee', 'incertaine') or actif),
  -- Toute ligne du nouveau système a sa clé, son auteur et son jeton.
  add constraint publications_operation_complete
    check (statut = 'historique' or (cle is not null and user_id is not null and jeton_hash is not null)),
  add constraint publications_detail_court check (detail is null or length(detail) <= 300),
  add constraint publications_job_court check (job_id is null or length(job_id) <= 100);

-- Au plus une ligne active : demande en cours, réponse incertaine,
-- ou publication lancée depuis moins de 60 secondes.
create unique index publications_une_active on public.publications (actif) where actif;

create or replace function public.reserver_publication(p_cle uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v public.publications%rowtype;
  v_uid uuid := auth.uid();
  v_jeton uuid := gen_random_uuid();
  v_essai integer;
  v_contrainte text;
begin
  if not public.is_admin() then
    raise exception 'réservé aux admins' using errcode = '42501';
  end if;
  if p_cle is null then
    raise exception 'clé manquante' using errcode = '22004';
  end if;

  -- Rejeu : l'auteur reçoit l'état de sa demande (jamais le jeton) ; un autre admin
  -- apprend seulement que la clé est prise.
  select * into v from public.publications p where p.cle = p_cle;
  if found then
    if v.user_id = v_uid then
      return jsonb_build_object('resultat', 'deja_traitee', 'statut', v.statut, 'bloque_jusqua', v.bloque_jusqua);
    end if;
    return jsonb_build_object('resultat', 'cle_deja_utilisee');
  end if;

  -- Deux essais : si l'occupant expire pendant qu'on attend l'index unique, on reprend une fois.
  for v_essai in 1..2 loop
    -- Fin des blocages échus, à l'heure réelle. Rien n'est supprimé.
    update public.publications p
       set actif = false,
           statut = case when p.statut in ('reservee', 'incertaine') then 'expiree' else p.statut end,
           termine_le = case when p.statut in ('reservee', 'incertaine') then clock_timestamp() else p.termine_le end,
           detail = case when p.statut in ('reservee', 'incertaine')
                         then left(coalesce(p.detail || ' ; ', '') || 'expirée sans issue connue', 300)
                         else p.detail end
     where p.actif and p.bloque_jusqua <= clock_timestamp();

    begin
      insert into public.publications (created_at, cle, statut, actif, user_email, user_id, jeton_hash, ok, bloque_jusqua)
      values (clock_timestamp(), p_cle, 'reservee', true, coalesce(auth.jwt() ->> 'email', ''), v_uid,
              sha256(convert_to(v_jeton::text, 'UTF8')), false, clock_timestamp() + interval '10 minutes')
      returning * into v;
      -- Le jeton n'est rendu qu'ici, une seule fois, à la requête qui a réservé.
      return jsonb_build_object('resultat', 'reservee', 'id', v.id, 'statut', v.statut,
                                'bloque_jusqua', v.bloque_jusqua, 'jeton', v_jeton);
    exception when unique_violation then
      -- Seules deux contraintes uniques peuvent être heurtées par cette insertion
      -- (id est généré par la base). Toute autre violation est remontée telle quelle.
      get stacked diagnostics v_contrainte = constraint_name;
      if v_contrainte = 'publications_cle_unique' then
        -- Même clé envoyée en parallèle : la ligne gagnante est validée, on la relit.
        select * into v from public.publications p where p.cle = p_cle;
        if v.user_id = v_uid then
          return jsonb_build_object('resultat', 'deja_traitee', 'statut', v.statut, 'bloque_jusqua', v.bloque_jusqua);
        end if;
        return jsonb_build_object('resultat', 'cle_deja_utilisee');
      elsif v_contrainte is distinct from 'publications_une_active' then
        raise;
      end if;
      -- Index publications_une_active : une autre ligne est active.
      -- Refus tant qu'elle n'est pas échue à l'heure réelle.
      select * into v from public.publications p where p.actif;
      if found and v.bloque_jusqua > clock_timestamp() then
        return jsonb_build_object(
          'resultat', case when v.statut = 'lancee' then 'trop_tot' else 'occupee' end,
          'statut', v.statut, 'bloque_jusqua', v.bloque_jusqua);
      end if;
      -- L'occupant a expiré pendant l'attente (ou a disparu) : nouvel essai.
    end;
  end loop;

  return jsonb_build_object('resultat', 'occupee');
end;
$$;

create or replace function public.terminer_publication(
  p_id bigint, p_jeton uuid, p_issue text,
  p_http integer default null, p_job text default null, p_detail text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v public.publications%rowtype;
  v_hash bytea := sha256(convert_to(coalesce(p_jeton::text, ''), 'UTF8'));
  n integer;
begin
  if not public.is_admin() then
    raise exception 'réservé aux admins' using errcode = '42501';
  end if;
  if p_id is null or p_jeton is null or p_issue is null or p_issue not in ('lancee', 'echec', 'incertaine') then
    raise exception 'paramètres invalides' using errcode = '22023';
  end if;

  -- 1. Verrouiller la ligne de cette opération (id + jeton + auteur). Après une attente,
  --    FOR UPDATE rend la dernière version validée de la ligne.
  select * into v from public.publications p
   where p.id = p_id and p.jeton_hash = v_hash and p.user_id = auth.uid()
   for update;
  if not found then
    return jsonb_build_object('resultat', 'refusee');
  end if;

  -- 2. Contrôles APRÈS le verrou, à l'heure réelle. Une ligne échue n'est pas modifiée.
  if v.statut = 'expiree' then
    return jsonb_build_object('resultat', 'expiree');
  elsif v.statut <> 'reservee' then
    return jsonb_build_object('resultat', 'deja_terminee', 'statut', v.statut);
  elsif not v.actif or v.bloque_jusqua <= clock_timestamp() then
    return jsonb_build_object('resultat', 'expiree');
  end if;

  -- 3. Transition conditionnelle, résultat vérifié.
  update public.publications p
     set statut = p_issue,
         ok = (p_issue = 'lancee'),
         actif = (p_issue <> 'echec'),
         bloque_jusqua = case p_issue
                           when 'lancee' then clock_timestamp() + interval '60 seconds'
                           when 'incertaine' then p.bloque_jusqua
                         end,
         lance_le = case when p_issue = 'lancee' then clock_timestamp() end,
         termine_le = case when p_issue = 'incertaine' then null else clock_timestamp() end,
         http_status = case when p_http between 100 and 599 then p_http end,
         job_id = left(p_job, 100),
         detail = left(p_detail, 300)
   where p.id = v.id and p.statut = 'reservee' and p.actif;
  get diagnostics n = row_count;
  if n <> 1 then
    -- Impossible tant que la ligne est verrouillée par cette transaction : on refuse plutôt que d'ignorer.
    raise exception 'transition non appliquée' using errcode = '40001';
  end if;
  return jsonb_build_object('resultat', 'enregistree');
end;
$$;

-- Supabase donne par défaut EXECUTE à anon, authenticated et service_role sur toute nouvelle fonction de public.
revoke all on function public.reserver_publication(uuid) from public, anon, service_role;
revoke all on function public.terminer_publication(bigint, uuid, text, integer, text, text) from public, anon, service_role;
grant execute on function public.reserver_publication(uuid) to authenticated;
grant execute on function public.terminer_publication(bigint, uuid, text, integer, text, text) to authenticated;
