#!/bin/bash
# Courses liées à l'horloge : attente de verrou au-delà de l'expiration.
DB=${DB:?base de test}; T=$(mktemp -d)
A1='11111111-1111-1111-1111-111111111111'; A2='22222222-2222-2222-2222-222222222222'
ok=0; ko=0
q() { psql -d $DB -Atq 2>&1 <<SQL
select set_config('request.jwt.claims', '{"sub":"$1","aal":"aal2","email":"t@x.sn"}', false) \g /dev/null
set role authenticated;
$2
SQL
}
own() { psql -d $DB -Atq -c "set role proprio" -c "$1" 2>&1; }
check() { if [[ "$2" =~ $3 ]]; then ok=$((ok+1)); echo "OK   $1"; else ko=$((ko+1)); echo "ECHEC $1 : obtenu [$2], attendu /$3/"; fi; }
champ() { echo "$1" | sed -n "s/.*\"$2\": *\"\{0,1\}\([^\",}]*\).*/\1/p"; }
K() { cat /proc/sys/kernel/random/uuid; }
liberer() { own "update public.publications set actif = false, statut = case when statut in ('reservee','incertaine') then 'expiree' else statut end where actif;" >/dev/null; }
etat() { own "select statut||','||actif||','||ok||','||coalesce(http_status::text,'-')||','||coalesce(lance_le::text,'-') from public.publications where id = $1"; }

echo "== H1 terminer attend un verrou jusqu'après l'expiration, puis tente de terminer"
liberer; R=$(q $A1 "select public.reserver_publication('$(K)');"); ID=$(champ "$R" id); J=$(champ "$R" jeton)
own "update public.publications set bloque_jusqua = clock_timestamp() + interval '2 seconds' where id = $ID" >/dev/null
AVANT=$(etat $ID)
# Une autre transaction tient le verrou de la ligne pendant 4 s (ex. une édition dans l'éditeur SQL).
psql -d $DB -Atq -c "begin; select id from public.publications where id = $ID for update; select pg_sleep(4); commit;" >/dev/null & sleep 0.5
RB=$(q $A1 "select public.terminer_publication($ID, '$J', 'lancee', 201);"); wait
check "H1 terminer refusé (expiree)" "$RB" '"resultat": "expiree"'
check "H1 ligne non modifiée" "$(etat $ID)" "^$(printf '%s' "$AVANT" | sed 's/[][\.*^$+?(){}|]/\\&/g')\$"

echo "== H2 la réservation active expire pendant qu'une autre demande attend l'index unique"
liberer
psql -d $DB -Atq <<SQL > $T/c &
select set_config('request.jwt.claims', '{"sub":"$A2","aal":"aal2","email":"c@x.sn"}', false) \g /dev/null
begin;
set local role authenticated;
select public.reserver_publication('$(K)') \g /dev/null
reset role;
set local role proprio;
update public.publications set bloque_jusqua = clock_timestamp() + interval '1 second' where actif;
select pg_sleep(3);
commit;
SQL
sleep 0.5
RB=$(q $A1 "select public.reserver_publication('$(K)');"); wait
check "H2 la demande en attente obtient la place libérée" "$RB" '"resultat": "reservee"'
check "H2 l'occupant échu est devenu expiree" "$(own "select string_agg(statut||','||actif, ' ' order by id) from (select * from public.publications order by id desc limit 2) x")" '^expiree,false reservee,true$'
check "H2 une seule ligne active" "$(own "select count(*) from public.publications where actif")" '^1$'

echo "== H4 même attente de verrou, mais la réservation est encore valide à la fin"
liberer; R=$(q $A1 "select public.reserver_publication('$(K)');"); ID=$(champ "$R" id); J=$(champ "$R" jeton)
psql -d $DB -Atq -c "begin; select id from public.publications where id = $ID for update; select pg_sleep(2); commit;" >/dev/null & sleep 0.5
RB=$(q $A1 "select public.terminer_publication($ID, '$J', 'lancee', 201);"); wait
check "H4 terminer accepté après l'attente" "$RB" '"resultat": "enregistree"'
check "H4 ligne lancee, active 60 s" "$(own "select statut||','||actif||','||(bloque_jusqua > clock_timestamp() + interval '55 seconds') from public.publications where id = $ID")" '^lancee,true,true$'

echo "== H3 rejeu d'une clé par un autre admin"
liberer; KC=$(K); q $A1 "select public.reserver_publication('$KC');" >/dev/null
R=$(q $A2 "select public.reserver_publication('$KC');")
check "H3 autre admin : ni statut, ni id, ni jeton" "$R" '^\{"resultat": "cle_deja_utilisee"\}$'
R=$(q $A1 "select public.reserver_publication('$KC');")
check "H3 auteur : deja_traitee avec statut, sans jeton" "$( [[ $R == *deja_traitee* && $R == *\"statut\":\ \"reservee\"* && $R != *jeton* ]] && echo oui)" "^oui$"
rm -rf $T; echo "RESULTAT: $ok OK, $ko ECHEC"
[ "$ko" -eq 0 ]
