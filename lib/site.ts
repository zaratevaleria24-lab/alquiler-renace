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

// LOS DATOS DE CONTACTO YA NO VIVEN ACÁ.
//
// Eran una constante con todo en null que solo se podía cambiar editando este
// archivo, compilando y reiniciando. Desde el 2026-08-03 están en la base
// (site_settings) y se editan en /admin/contenido: ver lib/settings.ts, que
// expone getContacto() con la misma forma que tenía CONTACT.
//
// Este módulo se queda con lo que de verdad es constante del sitio: dominio,
// idioma, moneda y geografía de la isla.

/** URL absoluta a partir de una ruta relativa. */
export function absoluteUrl(path = '/'): string {
  return new URL(path, SITE.url).toString();
}
