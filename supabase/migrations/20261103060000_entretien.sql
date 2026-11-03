-- Entretien quotidien, appelé chaque jour par la tâche planifiée Vercel
-- (/api/entretien). Cet appel garde aussi le projet Supabase actif.
-- Efface les demandes dont le dernier échange (dernière mise à jour)
-- date de plus de 12 mois, comme annoncé dans la politique de
-- confidentialité, et les visites de plus de 13 mois.
create or replace function public.entretien_quotidien()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_demandes integer;
  v_visites integer;
begin
  delete from public.demandes where updated_at < now() - interval '12 months';
  get diagnostics v_demandes = row_count;
  delete from public.visites where jour < (now() at time zone 'Africa/Dakar')::date - interval '13 months';
  get diagnostics v_visites = row_count;
  return jsonb_build_object('demandes_effacees', v_demandes, 'visites_effacees', v_visites);
end;
$$;
revoke all on function public.entretien_quotidien() from public;
grant execute on function public.entretien_quotidien() to anon, authenticated;
