-- Migration inverse de 20261106000000_publications_reservation.sql (recommandée, NON destructive).
-- Ordre : remettre d'abord l'ancien code de publication, puis lancer ce fichier
-- à un moment où aucune publication n'est en cours.
-- Retire les fonctions, l'index et les contraintes ; garde les colonnes et leurs données
-- (sans effet sur l'ancien code). La migration peut ensuite être réappliquée.
drop function if exists public.terminer_publication(bigint, uuid, text, integer, text, text);
drop function if exists public.reserver_publication(uuid);
drop index if exists public.publications_une_active;
alter table public.publications
  drop constraint if exists publications_cle_unique,
  drop constraint if exists publications_statut_check,
  drop constraint if exists publications_actif_coherent,
  drop constraint if exists publications_attente_active,
  drop constraint if exists publications_operation_complete,
  drop constraint if exists publications_detail_court,
  drop constraint if exists publications_job_court;
