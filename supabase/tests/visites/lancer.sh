#!/bin/bash
# Tests SQL de l'étape G (limite de visites sans course).
#
# À lancer UNIQUEMENT contre un Postgres 16 local et jetable, jamais contre Supabase :
#   PGHOST=/chemin/du/socket PGUSER=postgres supabase/tests/visites/lancer.sh
# Le script crée une base temporaire, y applique la simulation de Supabase, la
# migration d'origine des visites, puis vérifie le défaut avant G, la correction
# après G, la migration inverse et la réapplication.
set -u
ICI=$(cd "$(dirname "$0")" && pwd)
RACINE=$(cd "$ICI/../../.." && pwd)
SIMU=$RACINE/supabase/tests/publication/supabase-simule.sql
ORIGINE=$RACINE/supabase/migrations/20261103040000_visites.sql
MIGRATION=$RACINE/supabase/migrations/20261108000000_visites_limite_atomique.sql
INVERSE=$RACINE/supabase/rollback/20261108000000_visites_limite_atomique.down.sql

# Garde-fou : uniquement une base locale (socket Unix ou localhost).
case "${PGHOST:-}" in
  /*|localhost|127.0.0.1|::1) ;;
  *) echo "Refusé : PGHOST doit désigner un Postgres local (socket, localhost)." >&2; exit 2 ;;
esac
if [[ "${PGHOST:-}${PGDATABASE:-}${DATABASE_URL:-}" == *supabase* ]]; then
  echo "Refusé : une adresse Supabase est configurée." >&2; exit 2
fi

export PGOPTIONS="-c client_min_messages=warning"
P="psql -X -q -v ON_ERROR_STOP=1"
DB=test_visites_$$; T=$(mktemp -d)
ok=0; ko=0
check() { if [[ "$2" =~ $3 ]]; then ok=$((ok+1)); echo "OK   $1"; else ko=$((ko+1)); echo "ECHEC $1 : obtenu [$2], attendu /$3/"; fi; }
appliquer() { $P -d $DB -c "set role proprio" -f "$1" >/dev/null; }
own() { $P -d $DB -Atc "set role proprio" -c "$1" 2>&1; }
# Appel public, comme le site (rôle anon).
anon() { $P -d $DB -Atc "set role anon" -c "$1" 2>&1; }
E1=$(printf 'a%.0s' {1..64}); E2=$(printf 'b%.0s' {1..64})
appel() { echo "select public.enregistrer_visite('/x', '', 'mobile', '$1');"; }
vues() { own "select count(*) from public.visites v join public.visites_sels s on s.jour = v.jour
              where v.visiteur = encode(sha256(convert_to(s.sel || '$1', 'UTF8')), 'hex')"; }
# Amène le visiteur à 299 vues aujourd'hui (une vraie visite + 298 copies).
remplir() {
  own "delete from public.visites" >/dev/null
  anon "$(appel $1)" >/dev/null
  own "insert into public.visites (jour, chemin, provenance, appareil, visiteur)
       select jour, chemin, provenance, appareil, visiteur from public.visites, generate_series(1, 298)" >/dev/null
}
# A garde sa transaction ouverte 2 s après son appel ; B appelle pendant ce temps.
course() {
  $P -d $DB -Atc "set role anon" -c "begin" -c "$(appel $1)" -c "select pg_sleep(2)" -c "commit" >/dev/null 2>&1 & sleep 0.5
  local t0=$(date +%s%N); anon "$(appel $2)" >/dev/null; local t1=$(date +%s%N); wait
  echo $(( (t1 - t0) / 1000000 ))
}

$P -d postgres -c "drop database if exists $DB" -c "create database $DB" >/dev/null 2>&1 || { echo "Base impossible à créer"; exit 1; }
$P -d $DB -f "$SIMU" >/dev/null && appliquer "$ORIGINE" || { echo "Simulation impossible à appliquer"; exit 1; }

echo "== G0 avant G : le défaut est reproduit"
remplir $E1; course $E1 $E1 >/dev/null
check "deux appels simultanés à 299 → 301 vues (dépassement)" "$(vues $E1)" '^301$'

appliquer "$MIGRATION" || { echo "Migration G impossible à appliquer"; exit 1; }

echo "== G1 après G : même course, limite exacte"
remplir $E1; ms=$(course $E1 $E1)
check "deux appels simultanés à 299 → 300 vues" "$(vues $E1)" '^300$'
check "le second appel a attendu la fin du premier (≥ 1 s)" "$ms" '^[0-9]{4,}$'

echo "== G2 20 appels parallèles à partir de 290 vues"
own "delete from public.visites" >/dev/null; anon "$(appel $E1)" >/dev/null
own "insert into public.visites (jour, chemin, provenance, appareil, visiteur)
     select jour, chemin, provenance, appareil, visiteur from public.visites, generate_series(1, 289)" >/dev/null
for i in $(seq 20); do anon "$(appel $E1)" >/dev/null & done; wait
check "jamais plus de 300 vues" "$(vues $E1)" '^300$'

echo "== G3 un autre visiteur n'est pas bloqué"
remplir $E1; ms=$(course $E1 $E2)
check "visiteur B servi sans attendre le verrou de A (< 1 s)" "$ms" '^[0-9]{1,3}$'
check "visiteur B compté" "$(vues $E2)" '^1$'

echo "== G4 nettoyage de secours : une fois par jour, par l'appel qui crée le sel"
vieux() { own "insert into public.visites (jour, chemin, provenance, appareil, visiteur)
               values ((now() at time zone 'Africa/Dakar')::date - interval '$1', '/vieux-$2', '', 'mobile', repeat('c', 64))" >/dev/null; }
nb() { own "select count(*) from public.visites where chemin = '/vieux-$1'"; }
# Le sel du jour existe déjà : aucun effacement pendant la journée.
vieux '14 months' a
anon "$(appel $E2)" >/dev/null
check "sel déjà créé : la vieille visite reste (pas d'effacement à chaque visite)" "$(nb a)" '^1$'
# Nouveau jour simulé : le sel est retiré, le prochain appel le recrée et nettoie.
vieux '13 months' limite
vieux '13 months 1 day' b
own "delete from public.visites_sels" >/dev/null
anon "$(appel $E2)" >/dev/null
check "premier appel du jour : visites de plus de 13 mois effacées" "$(nb a)$(nb b)" '^00$'
check "limite exacte : une visite d'il y a 13 mois jour pour jour est gardée" "$(nb limite)" '^1$'
check "les visites récentes ne sont pas touchées" "$(own "select count(*) > 0 from public.visites where chemin = '/x'")" '^t$'
# Deux premiers appels simultanés : un seul crée le sel, un seul nettoie, aucun ne échoue.
vieux '20 months' c
own "delete from public.visites_sels" >/dev/null
r1=$T/r1; r2=$T/r2
$P -d $DB -Atc "set role anon" -c "begin" -c "$(appel $E1)" -c "select pg_sleep(1)" -c "commit" >$r1 2>&1 & sleep 0.3
anon "$(appel $E2)" >$r2 2>&1; wait
check "deux premiers appels simultanés : aucune erreur" "$(cat $r1 $r2)" '^$'
check "deux premiers appels simultanés : un seul sel" "$(own "select count(*) from public.visites_sels")" '^1$'
check "deux premiers appels simultanés : vieille visite effacée" "$(nb c)" '^0$'
own "delete from public.visites where chemin like '/vieux-%'" >/dev/null

echo "== G5 contrôles et droits inchangés"
check "empreinte invalide refusée" "$(anon "select public.enregistrer_visite('/x', '', 'mobile', 'zz');")" 'empreinte invalide'
check "un seul sel, celui du jour" "$(own "select count(*) || ' ' || bool_and(jour = (now() at time zone 'Africa/Dakar')::date) from public.visites_sels")" '^1 true$'
check "anon peut appeler" "$(own "select has_function_privilege('anon', 'public.enregistrer_visite(text,text,text,text)', 'execute')")" '^t$'
check "authenticated peut appeler" "$(own "select has_function_privilege('authenticated', 'public.enregistrer_visite(text,text,text,text)', 'execute')")" '^t$'
check "security definer et search_path vide" "$(own "select prosecdef || ' ' || array_to_string(proconfig, ',') from pg_proc where proname = 'enregistrer_visite'")" '^true search_path=""$'

echo "== G6 migration inverse puis réapplication"
appliquer "$INVERSE"
check "inverse : fonction d'origine (13 mois à chaque visite, sans verrou)" "$(own "select (prosrc like '%13 months%') || ' ' || (prosrc like '%advisory%') from pg_proc where proname = 'enregistrer_visite'")" '^true false$'
check "inverse : droits conservés" "$(own "select has_function_privilege('anon', 'public.enregistrer_visite(text,text,text,text)', 'execute')")" '^t$'
appliquer "$MIGRATION"
check "réapplication : verrou et nettoyage conditionné au sel du jour" "$(own "select (prosrc like '%v_sel_cree = 1%') || ' ' || (prosrc like '%pg_advisory_xact_lock%') from pg_proc where proname = 'enregistrer_visite'")" '^true true$'
remplir $E1; course $E1 $E1 >/dev/null
check "réapplication : limite exacte" "$(vues $E1)" '^300$'

rm -rf "$T"
$P -d postgres -c "drop database if exists $DB" >/dev/null 2>&1
echo "$ok réussis, $ko échoués"
[ $ko -eq 0 ] && echo "TOUS LES TESTS SQL RÉUSSIS" || echo "DES TESTS SQL ONT ÉCHOUÉ"
[ $ko -eq 0 ]
