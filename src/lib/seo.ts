import { site } from '@/data/site';

/** Données structurées schema.org de l'organisation, présentes sur toutes les pages. */
export function organizationJsonLd(base: URL | undefined): Record<string, unknown> {
  const url = base?.toString() ?? '';
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    alternateName: 'Sunu Kaddu',
    description: site.description,
    url,
    logo: new URL('/apple-touch-icon.png', base).toString(),
    foundingDate: String(site.foundingYear),
    founder: { '@type': 'Person', name: 'Paul Pissety Sagna', alternateName: 'PPS the Writah' },
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressCountry: site.address.countryCode,
    },
    ...(site.contact.emailConfirmed ? { email: site.contact.email } : {}),
    sameAs: site.social.flatMap((s) => (s.href ? [s.href] : [])),
    ...(site.contact.whatsapp
      ? { contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', telephone: site.contact.whatsapp.display, availableLanguage: ['fr', 'wo'] } }
      : {}),
  };
}

export interface EventInput {
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  image: string;
}

export function eventJsonLd(e: EventInput, base: URL | undefined): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Festival',
    name: e.name,
    startDate: e.startDate,
    endDate: e.endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    description: e.description,
    image: new URL(e.image, base).toString(),
    location: {
      '@type': 'Place',
      name: e.location,
      address: { '@type': 'PostalAddress', addressLocality: 'Rufisque', addressCountry: 'SN' },
    },
    organizer: { '@type': 'Organization', name: site.name, url: base?.toString() },
  };
}
