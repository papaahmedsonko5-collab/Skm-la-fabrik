#!/bin/bash
# Tests SQL de la réservation des publications (étape E).
#
# À lancer UNIQUEMENT contre un Postgres 16 local et jetable, jamais contre Supabase :
#   PGHOST=/chemin/du/socket PGUSER=postgres supabase/tests/publication/lancer.sh
# Le script crée une base temporaire, y applique une simulation de Supabase puis la
# migration du dépôt, lance les tests, vérifie les migrations inverses et supprime la base.
set -u
ICI=$(cd "$(dirname "$0")" && pwd)
RACINE=$(cd "$ICI/../../.." && pwd)
MIGRATION=$RACINE/supabase/migrations/20261106000000_publications_reservation.sql
INVERSE=$RACINE/supabase/rollback/20261106000000_publications_reservation.down.sql
INVERSE_COMPLETE=$RACINE/supabase/rollback/20261106000000_publications_reservation.down-complete.sql

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
echec=0
base() { # base <nom> : base neuve avec la simulation
  $P -d postgres -c "drop database if exists $1" -c "create database $1" >/dev/null 2>&1 || return 1
  $P -d "$1" -f "$ICI/supabase-simule.sql" >/dev/null
}
appliquer() { $P -d "$1" -c "set role proprio" -f "$2" >/dev/null; }

DB=test_publication_$$
base $DB && appliquer $DB "$MIGRATION" || { echo "Migration impossible à appliquer"; exit 1; }
for t in regles concurrence horloge; do
  echo "### $t"
  DB=$DB bash "$ICI/$t.sh" || echec=1
done

echo "### migrations inverses"
I=test_publication_inverse_$$
base $I
$P -d $I -Atc "\d public.publications" > /tmp/avant_$$.txt
if appliquer $I "$MIGRATION" && appliquer $I "$INVERSE" \
  && [ "$($P -d $I -Atc "select count(*) from pg_proc where proname in ('reserver_publication','terminer_publication')")" = 0 ] \
  && [ "$($P -d $I -Atc "select count(*) from pg_indexes where indexname = 'publications_une_active'")" = 0 ] \
  && appliquer $I "$MIGRATION" && appliquer $I "$INVERSE" && appliquer $I "$INVERSE_COMPLETE" \
  && $P -d $I -Atc "\d public.publications" > /tmp/apres_$$.txt && diff -q /tmp/avant_$$.txt /tmp/apres_$$.txt >/dev/null; then
  echo "OK   inverse, réapplication, inverse complète : table identique à l'origine"
else
  echo "ECHEC migrations inverses"; echec=1
fi
rm -f /tmp/avant_$$.txt /tmp/apres_$$.txt
$P -d postgres -c "drop database if exists $DB" -c "drop database if exists $I" >/dev/null 2>&1
[ $echec -eq 0 ] && echo "TOUS LES TESTS SQL RÉUSSIS" || echo "DES TESTS SQL ONT ÉCHOUÉ"
exit $echec
