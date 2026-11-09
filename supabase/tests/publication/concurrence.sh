#!/bin/bash
# Courses réelles : plusieurs sessions psql en parallèle sur le Postgres local jetable.
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

echo "== C1 deux clés différentes, A garde sa transaction ouverte 2 s"
liberer; KA=$(K); KB=$(K)
q $A1 "begin; select public.reserver_publication('$KA'); select pg_sleep(2); commit;" > $T/a & sleep 0.5
RB=$(q $A2 "select public.reserver_publication('$KB');"); wait
check "A réserve"  "$(cat $T/a)" '"resultat": "reservee"'
check "B attend puis reçoit occupee" "$RB" '"resultat": "occupee"'

echo "== C2 même clé envoyée deux fois en parallèle"
liberer; KC=$(K)
q $A1 "begin; select public.reserver_publication('$KC'); select pg_sleep(2); commit;" > $T/a & sleep 0.5
RB=$(q $A1 "select public.reserver_publication('$KC');"); wait
check "première → reservee" "$(cat $T/a)" '"resultat": "reservee"'
check "seconde → deja_traitee" "$RB" '"resultat": "deja_traitee"'
check "une seule ligne pour la clé" "$(own "select count(*) from public.publications where cle = '$KC'")" '^1$'

echo "== C3 fin « lancee » en cours pendant une nouvelle demande (pause de 60 s atomique)"
liberer; R=$(q $A1 "select public.reserver_publication('$(K)');"); ID=$(champ "$R" id); J=$(champ "$R" jeton)
q $A1 "begin; select public.terminer_publication($ID, '$J', 'lancee', 201); select pg_sleep(2); commit;" > $T/a & sleep 0.5
RB=$(q $A2 "select public.reserver_publication('$(K)');"); wait
check "terminer enregistré" "$(cat $T/a)" 'enregistree'
check "nouvelle demande → trop_tot, pas reservee" "$RB" '"resultat": "trop_tot"'

echo "== C4 vieille requête qui termine pendant l'expiration de sa réservation"
liberer; R=$(q $A1 "select public.reserver_publication('$(K)');"); ID=$(champ "$R" id); J=$(champ "$R" jeton)
own "update public.publications set bloque_jusqua = now() - interval '1 second' where id = $ID" >/dev/null
q $A2 "begin; select public.reserver_publication('$(K)'); select pg_sleep(2); commit;" > $T/a & sleep 0.5
RB=$(q $A1 "select public.terminer_publication($ID, '$J', 'lancee', 200);"); wait
check "nouvelle réservation passe" "$(cat $T/a)" '"resultat": "reservee"'
check "vieille fin refusée → expiree" "$RB" '"resultat": "expiree"'
check "vieille ligne reste expiree, ok=false" "$(own "select statut||','||ok from public.publications where id = $ID")" '^expiree,false$'

echo "== C5 rafales : 8 demandes simultanées, 25 fois"
bad=0
for i in $(seq 25); do
  liberer
  for j in $(seq 8); do q $A1 "select public.reserver_publication('$(K)');" > $T/r$j & done; wait
  n=$(cat $T/r* | grep -c '"resultat": "reservee"'); e=$(cat $T/r* | grep -c ERROR)
  [[ $n == 1 && $e == 0 ]] || { bad=$((bad+1)); echo "  tour $i : $n reservee, $e erreurs"; }
done
check "toujours exactement 1 reservee, 0 erreur" "$bad" '^0$'
check "jamais plus d'une ligne active" "$(own "select count(*) from public.publications where actif")" '^[01]$'
rm -rf $T; echo "RESULTAT: $ok OK, $ko ECHEC"
[ "$ko" -eq 0 ]
