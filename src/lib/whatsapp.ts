/** Lien wa.me vers le WhatsApp officiel, avec un message prérempli facultatif. */
export function whatsappLink(international: string, text?: string): string {
  const digits = international.replace(/\D/g, '');
  const url = new URL(`https://wa.me/${digits}`);
  if (text) url.searchParams.set('text', text);
  return url.toString();
}
