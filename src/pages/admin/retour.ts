import type { APIRoute } from 'astro';

export const prerender = false;

// Arrivée depuis l'e-mail « mot de passe oublié » : tout est traité par le
// middleware (src/middleware.ts). Cette route n'existe que pour qu'il s'exécute.
export const GET: APIRoute = ({ redirect }) => redirect('/admin', 303);
