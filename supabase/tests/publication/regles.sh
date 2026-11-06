#!/bin/bash
# Règles de la migration des publications. Postgres 16 LOCAL et jetable, jamais Supabase.
DB=${DB:?base de test}
A1='11111111-1111-1111-1111-111111111111'; A2='22222222-2222-2222-2222-222222222222'; X='33333333-3333-3333-3333-333333333333'
ok=0; ko=0
q() { # q <role> <sub> <aal> <sql>
  psql -d $DB -Atq -v ON_ERROR_STOP=1 2>&1 <<SQL
select set_config('request.jwt.claims', '{"sub":"$2","aal":"$3","email":"$2@x.sn","role":"$1"}', false) \g /dev/null
set role $1;
$4
SQL
}
own() { psql -d $DB -Atq -v ON_ERROR_STOP=1 -c "set role proprio" -c "$1" 2>&1; }
check() { # check <nom> <obtenu> <motif attendu (regex)>
  if [[ "$2" =~ $3 ]]; then ok=$((ok+1)); echo "OK   $1"; else ko=$((ko+1)); echo "ECHEC $1 : obtenu [$2], attendu /$3/"; fi; }
rpc_r() { q authenticated "$1" aal2 "select public.reserver_publication('$2');"; }
champ() { echo "$1" | sed -n "s/.*\"$2\": *\"\{0,1\}\([^\",}]*\).*/\1/p"; }
vieillir() { own "update public.publications set bloque_jusqua = now() - interval '1 second' where id = $1;"; }
K() { cat /proc/sys/kernel/random/uuid; }

echo "== Droits"
check "anon ne peut pas réserver"        "$(q anon $A1 aal2 "select public.reserver_publication('$(K)');")" "permission denied for function reserver_publication"
check "service_role ne peut pas réserver" "$(q service_role $A1 aal2 "select public.reserver_publication('$(K)');")" "permission denied"
check "anon ne peut pas terminer"        "$(q anon $A1 aal2 "select public.terminer_publication(1, '$(K)', 'lancee');")" "permission denied for function terminer_publication"
check "non-admin refusé (is_admin)"      "$(rpc_r $X $(K))" "réservé aux admins"
check "admin sans code (aal1) refusé"    "$(q authenticated $A1 aal1 "select public.reserver_publication('$(K)');")" "réservé aux admins"
check "clé nulle refusée"                "$(q authenticated $A1 aal2 "select public.reserver_publication(null);")" "clé manquante"

echo "== Réservation, idempotence, propriété"
C1=$(K); R=$(rpc_r $A1 $C1); ID=$(champ "$R" id); J=$(champ "$R" jeton)
check "réservation"                      "$R" '"resultat": "reservee"'
check "jeton rendu à la réservation"     "$J" '^[0-9a-f-]{36}$'
R2=$(rpc_r $A1 $C1)
check "rejeu même clé → deja_traitee"    "$R2" '"resultat": "deja_traitee"'
check "rejeu sans jeton" "$( [[ $R2 == *'"jeton"'* ]] && echo present || echo absent)" '^absent$'
check "autre clé → occupee"              "$(rpc_r $A2 $(K))" '"resultat": "occupee"'
check "jeton absent de la table"         "$(own "select count(*) from public.publications where jeton_hash::text like '%$J%' or detail like '%$J%'")" '^0$'
check "autre admin avec id+jeton → refusee" "$(q authenticated $A2 aal2 "select public.terminer_publication($ID, '$J', 'lancee');")" '"resultat": "refusee"'
check "mauvais jeton → refusee"          "$(q authenticated $A1 aal2 "select public.terminer_publication($ID, '$(K)', 'lancee');")" '"resultat": "refusee"'
check "ligne intacte après refus"        "$(own "select statut||','||actif from public.publications where id=$ID")" '^reservee,true$'
check "issue inconnue refusée"           "$(q authenticated $A1 aal2 "select public.terminer_publication($ID, '$J', 'ok');")" "paramètres invalides"
check "auteur + jeton → enregistree"     "$(q authenticated $A1 aal2 "select public.terminer_publication($ID, '$J', 'lancee', 201, 'job1', null);")" '"resultat": "enregistree"'
check "état lancee, actif 60 s"          "$(own "select statut||','||actif||','||ok||','||(bloque_jusqua between now()+interval '59 s' and now()+interval '61 s') from public.publications where id=$ID")" '^lancee,true,true,true$'
check "second terminer → deja_terminee"  "$(q authenticated $A1 aal2 "select public.terminer_publication($ID, '$J', 'echec');")" '"resultat": "deja_terminee"'

echo "== Pause de 60 s"
check "nouvelle demande < 60 s → trop_tot" "$(rpc_r $A2 $(K))" '"resultat": "trop_tot"'
vieillir $ID
R=$(rpc_r $A2 $(K)); ID2=$(champ "$R" id); J2=$(champ "$R" jeton)
check "après la pause → reservee"        "$R" '"resultat": "reservee"'
check "ancienne lancee reste lancee, inactive" "$(own "select statut||','||actif from public.publications where id=$ID")" '^lancee,false$'

echo "== Échec certain : libère tout de suite"
check "terminer echec"                   "$(q authenticated $A2 aal2 "select public.terminer_publication($ID2, '$J2', 'echec', null, null, 'ENOTFOUND');")" 'enregistree'
R=$(rpc_r $A1 $(K)); ID3=$(champ "$R" id); J3=$(champ "$R" jeton)
check "nouvelle demande après echec"     "$R" '"resultat": "reservee"'

echo "== Réponse incertaine et expiration"
check "terminer incertaine"              "$(q authenticated $A1 aal2 "select public.terminer_publication($ID3, '$J3', 'incertaine', null, null, 'timeout');")" 'enregistree'
check "incertaine bloque"                "$(rpc_r $A2 $(K))" '"resultat": "occupee"'
check "incertaine garde 10 min"          "$(own "select statut||','||actif||','||(bloque_jusqua > now()+interval '9 min') from public.publications where id=$ID3")" '^incertaine,true,true$'
vieillir $ID3
R=$(rpc_r $A2 $(K)); ID4=$(champ "$R" id); J4=$(champ "$R" jeton)
check "après 10 min → reservee"          "$R" '"resultat": "reservee"'
check "incertaine devenue expiree"       "$(own "select statut||','||actif||','||detail from public.publications where id=$ID3")" '^expiree,false,timeout ; expirée sans issue connue$'
check "vieille requête sur ligne expirée → expiree" "$(q authenticated $A1 aal2 "select public.terminer_publication($ID3, '$J3', 'lancee', 200);")" '"resultat": "expiree"'
check "ligne expirée inchangée"          "$(own "select statut||','||ok||','||coalesce(http_status::text,'-') from public.publications where id=$ID3")" '^expiree,false,-$'
check "vieux jeton ne touche pas la plus récente" "$(q authenticated $A1 aal2 "select public.terminer_publication($ID4, '$J3', 'lancee');")" '"resultat": "refusee"'
vieillir $ID4
check "reservee échue mais non nettoyée → expiree" "$(q authenticated $A2 aal2 "select public.terminer_publication($ID4, '$J4', 'lancee');")" '"resultat": "expiree"'
check "et reste reservee jusqu'au nettoyage" "$(own "select statut||','||ok from public.publications where id=$ID4")" '^reservee,false$'
R=$(rpc_r $A1 $(K)); ID5=$(champ "$R" id); J5=$(champ "$R" jeton)
check "nettoyage à la réservation suivante" "$(own "select statut from public.publications where id=$ID4")" '^expiree$'
q authenticated $A1 aal2 "select public.terminer_publication($ID5, '$J5', 'echec');" >/dev/null

echo "== Ancien code et RLS"
check "ancien insert admin OK → historique" "$(q authenticated $A1 aal2 "insert into public.publications (user_email, ok) values ('a@x.sn', true) returning statut||','||actif;")" '^historique,false'
check "ancien insert ne bloque pas"      "$(rpc_r $A1 $(K))" '"resultat": "reservee"'
check "ancien insert non-admin refusé"   "$(q authenticated $X aal2 "insert into public.publications (user_email, ok) values ('x', true);")" "row-level security"
check "UPDATE direct sans effet (pas de règle)" "$(q authenticated $A1 aal2 "update public.publications set actif=false where actif returning id;")" '^$'
check "insert direct d'une ligne active non historique refusé" "$(q authenticated $A1 aal2 "insert into public.publications (user_email, ok, statut, actif, bloque_jusqua) values ('a', false, 'reservee', true, now());")" "publications_operation_complete|duplicate key"
check "anciennes lignes intactes"        "$(own "select string_agg(statut||','||ok, ' ' order by id) from public.publications where id <= 2")" '^historique,true historique,false$'

echo "== Violation d'une autre contrainte unique : remontée, jamais prise pour « occupee »"
A3='44444444-4444-4444-4444-444444444444'
own "insert into public.admins values ('$A3'); insert into public.publications (user_email, ok) values ('$A3@x.sn', true); create unique index test_autre_unique on public.publications (user_email) where user_email = '$A3@x.sn';" >/dev/null
own "update public.publications set actif = false, statut = case when statut in ('reservee','incertaine') then 'expiree' else statut end where actif;" >/dev/null
check "autre violation remontée en erreur" "$(rpc_r $A3 $(K))" 'duplicate key value violates unique constraint "test_autre_unique"'
check "aucune ligne active créée" "$(own "select count(*) from public.publications where actif")" '^0$'
own "drop index public.test_autre_unique;" >/dev/null
echo "RESULTAT: $ok OK, $ko ECHEC"
[ "$ko" -eq 0 ]
