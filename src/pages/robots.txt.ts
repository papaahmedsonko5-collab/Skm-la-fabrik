import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('/sitemap-index.xml', site).toString();
  const body = ['User-agent: *', 'Allow: /', 'Disallow: /api/', '', `Sitemap: ${sitemap}`, ''].join('\n');
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
