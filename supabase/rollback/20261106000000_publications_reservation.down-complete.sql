-- Migration inverse COMPLÈTE de 20261106000000_publications_reservation.sql.
-- ATTENTION : DESTRUCTIVE. Supprime le journal détaillé des publications (les lignes
-- restent, avec user_email et ok). À lancer seulement après
-- 20261106000000_publications_reservation.down.sql, et sur décision explicite.
alter table public.publications
  drop column if exists cle, drop column if exists statut, drop column if exists actif,
  drop column if exists user_id, drop column if exists jeton_hash, drop column if exists bloque_jusqua,
  drop column if exists lance_le, drop column if exists termine_le, drop column if exists http_status,
  drop column if exists job_id, drop column if exists detail;
