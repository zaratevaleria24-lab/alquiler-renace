// Configuración canónica del sitio. Todo lo de SEO (metadata, sitemap, robots,
// JSON-LD) sale de acá para que no haya dos versiones de la misma verdad.

export const SITE = {
  url: 'https://margaritarenace.com.ve',
  name: 'Margarita Renace',
  /** es-VE, no es-ES: es una señal geográfica real para Venezuela. */
  locale: 'es-VE',
  ogLocale: 'es_VE',
  shortDescription:
    'Alquiler de apartamentos y autos en Isla de Margarita, Venezuela.',
  description:
    'Alquila apartamentos y autos en Isla de Margarita, Venezuela. Alojamientos verificados en Pampatar, Porlamar, Playa El Yaque, Juan Griego y más zonas de la isla, con precios en dólares y reserva directa con el anfitrión.',
  currency: 'USD',
  /** Centro de la Isla de Margarita (Nueva Esparta). */
  geo: { lat: 11.0, lng: -63.9167 },
  region: {
    state: 'Nueva Esparta',
    country: 'VE',
    countryName: 'Venezuela',
    island: 'Isla de Margarita',
  },
} as const;

/**
 * DATOS DE CONTACTO — PENDIENTES DE LA DUEÑA.
 *
 * El SEO local (Google Business Profile, LocalBusiness schema, paquete local
 * de resultados) depende de un NAP consistente: mismo nombre, dirección y
 * teléfono en el sitio, en Google y en cualquier directorio.
 *
 * No se inventan: un teléfono o dirección falsos en datos estructurados es
 * exactamente lo que Google penaliza, y además rompe la confianza del usuario.
 * Cuando existan los reales, ponerlos acá y se propagan solos al JSON-LD, al
 * footer y a las páginas de zona.
 */
export const CONTACT = {
  /** Formato internacional, ej. '+58 295 000 0000'. */
  phone: null as string | null,
  /** Solo dígitos con código de país, ej. '584140000000'. */
  whatsapp: null as string | null,
  email: null as string | null,
  streetAddress: null as string | null,
  /** Perfiles oficiales (Instagram, Facebook, Google Business…). */
  sameAs: [] as string[],
};

export const hasContactInfo = Boolean(
  CONTACT.phone || CONTACT.whatsapp || CONTACT.email,
);

/** URL absoluta a partir de una ruta relativa. */
export function absoluteUrl(path = '/'): string {
  return new URL(path, SITE.url).toString();
}
