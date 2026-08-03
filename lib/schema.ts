// Constructores de JSON-LD (schema.org).
//
// ═══════════════════════════════════════════════════════════════════════════
// REGLA QUE NO SE ROMPE: acá NO se emite `aggregateRating`, `Review` ni
// `Offer` para los listados de relleno.
//
// De los 12 listados del dataset, solo "Los Geranios A" es real (anfitrión
// "Margarita Renace", foto propia en public/properties/, precio a consultar).
// Los otros 11 tienen anfitriones inventados, fotos de stock y ratings entre
// 4.6 y 4.97 que no vienen de ninguna reseña.
//
// Marcar esos ratings como datos estructurados sería markup de reseñas
// fabricadas: lo prohíben las políticas de datos estructurados de Google, se
// castiga con acción manual (pérdida de TODOS los rich results del dominio, no
// solo del marcado infractor), y además haría que el sitio prometa en
// buscadores propiedades que nadie puede reservar.
//
// Cuando los listados sean reales y tengan reseñas verificables, entonces sí
// corresponde agregar aggregateRating con su reviewCount real.
// ═══════════════════════════════════════════════════════════════════════════

import { CONTACT, SITE, absoluteUrl } from './site';
import type { Property, Zone } from './types';

type Json = Record<string, unknown>;

/** Organización + negocio local. Base de la identidad de entidad del sitio. */
export function organizationSchema(): Json {
  const schema: Json = {
    '@type': ['Organization', 'LocalBusiness'],
    '@id': absoluteUrl('/#organizacion'),
    name: SITE.name,
    url: SITE.url,
    logo: absoluteUrl('/logo.png'),
    image: absoluteUrl('/logo.png'),
    description: SITE.description,
    knowsLanguage: ['es-VE', 'es'],
    currenciesAccepted: SITE.currency,
    areaServed: {
      '@type': 'Place',
      name: `${SITE.region.island}, ${SITE.region.state}, ${SITE.region.countryName}`,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: SITE.geo.lat,
        longitude: SITE.geo.lng,
      },
    },
    address: {
      '@type': 'PostalAddress',
      addressRegion: SITE.region.state,
      addressCountry: SITE.region.country,
      // streetAddress y postalCode se agregan cuando existan los datos reales
      // (ver CONTACT en lib/site.ts). Sin dirección verificable, el paquete
      // local de Google no aplica igual: hace falta Google Business Profile.
      ...(CONTACT.streetAddress ? { streetAddress: CONTACT.streetAddress } : {}),
    },
  };

  if (CONTACT.phone) schema.telephone = CONTACT.phone;
  if (CONTACT.email) schema.email = CONTACT.email;
  if (CONTACT.sameAs.length) schema.sameAs = CONTACT.sameAs;

  return schema;
}

/** El sitio como entidad. Sin SearchAction: la búsqueda del home es solo
 *  client-side y no tiene URL propia, así que declararla sería falso. */
export function websiteSchema(): Json {
  return {
    '@type': 'WebSite',
    '@id': absoluteUrl('/#sitio'),
    url: SITE.url,
    name: SITE.name,
    description: SITE.description,
    inLanguage: SITE.locale,
    publisher: { '@id': absoluteUrl('/#organizacion') },
  };
}

export function breadcrumbSchema(
  trail: { name: string; path: string }[],
): Json {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/**
 * Lista de alojamientos de una zona. Refleja lo que se ve en la página:
 * nombre, zona y foto. Sin precio ni rating, por la regla de arriba.
 */
export function zoneItemListSchema(zone: Zone, path: string): Json {
  return {
    '@type': 'ItemList',
    name: `Alojamientos en ${zone.name}, Isla de Margarita`,
    numberOfItems: zone.properties.length,
    itemListOrder: 'https://schema.org/ItemListUnordered',
    itemListElement: zone.properties.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Accommodation',
        name: p.name,
        description: p.description,
        image: absoluteUrl(p.image),
        url: absoluteUrl(path),
        occupancy: {
          '@type': 'QuantitativeValue',
          value: p.guestsAllowed.adults + p.guestsAllowed.children,
          unitText: 'huéspedes',
        },
        amenityFeature: p.amenities.map((a) => ({
          '@type': 'LocationFeatureSpecification',
          name: a.name,
          value: true,
        })),
        address: {
          '@type': 'PostalAddress',
          addressLocality: p.zone,
          addressRegion: SITE.region.state,
          addressCountry: SITE.region.country,
        },
      },
    })),
  };
}

/**
 * Un alojamiento con página propia (/propiedad/<slug>). Misma regla de arriba:
 * sin aggregateRating, Review ni Offer mientras el listado no sea real con
 * reseñas verificables. El precio va como texto visible en la página, no como
 * dato estructurado.
 */
export function propertySchema(p: Property, path: string): Json {
  return {
    '@type': 'Accommodation',
    '@id': absoluteUrl(`${path}#alojamiento`),
    name: p.name,
    description: p.description,
    url: absoluteUrl(path),
    image: p.images.map((img) => absoluteUrl(img.path)),
    occupancy: {
      '@type': 'QuantitativeValue',
      value: p.guestsAllowed.adults + p.guestsAllowed.children,
      unitText: 'huéspedes',
    },
    amenityFeature: p.amenities.map((a) => ({
      '@type': 'LocationFeatureSpecification',
      name: a.name,
      value: true,
    })),
    address: {
      '@type': 'PostalAddress',
      addressLocality: p.zone,
      addressRegion: SITE.region.state,
      addressCountry: SITE.region.country,
    },
    containedInPlace: {
      '@type': 'Place',
      name: `${p.zone}, ${SITE.region.island}`,
    },
  };
}

/** Un lugar de la isla, para anclar geográficamente la landing de zona. */
export function zonePlaceSchema(zone: Zone, copy: { coast: string }): Json {
  return {
    '@type': 'Place',
    name: `${zone.name}, ${SITE.region.island}`,
    description: copy.coast,
    address: {
      '@type': 'PostalAddress',
      addressLocality: zone.name,
      addressRegion: SITE.region.state,
      addressCountry: SITE.region.country,
    },
    containedInPlace: {
      '@type': 'Place',
      name: `${SITE.region.island}, ${SITE.region.state}`,
    },
  };
}

export function faqSchema(items: { q: string; a: string }[]): Json {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

/** Envuelve varios nodos en un solo @graph: un script por página. */
export function graph(...nodes: Json[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes });
}

export type { Property };
