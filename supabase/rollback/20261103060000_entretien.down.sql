-- Migration inverse de l'alignement des droits de entretien_quotidien().
-- ATTENTION : rétablit l'ancien réglage, moins sûr (exécution par anon et
-- authenticated). À n'utiliser qu'en cas de retour arrière volontaire.
-- Ne pas lancer tant que /api/entretien utilise la clé service_role.
revoke all on function public.entretien_quotidien() from service_role;
grant execute on function public.entretien_quotidien() to anon, authenticated;
