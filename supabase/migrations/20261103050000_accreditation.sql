-- Demandes d'accréditation (presse, photographes, vidéastes, créateurs,
-- partenaires) : elles arrivent dans la même boîte que les autres demandes.
alter table public.demandes drop constraint if exists demandes_objet_check;
alter table public.demandes add constraint demandes_objet_check
  check (objet in ('contact', 'partenariat', 'prestation', 'formation', 'production', 'accreditation'));
