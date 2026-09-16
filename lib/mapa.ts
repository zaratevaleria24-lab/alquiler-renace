import { unstable_cache } from 'next/cache';
import { rows } from './db';
import { TAG_GUIA, getLugares, miniatura, portadaDe } from './guia';
import type { PuntoMapa } from './mapa-comun';

export * from './mapa-comun';

// Datos del mapa de la isla (/mapa). Se arman en el servidor y bajan al cliente
// como props: el mapa no consulta nada por su cuenta.
//
// POR QUÉ UN MÓDULO APARTE Y NO DENTRO DE lib/guia.ts: el mapa mezcla dos
// tablas —la guía y los alojamientos— y necesita de cada lugar lo mínimo para
// pintar un punto y su ficha corta. Meter esto en getLugares() haría más pesada
// la consulta de /guia, que es la que más se usa desde el teléfono.

const recorta = (t: string, max = 150) => (t.length <= max ? t : `${t.slice(0, max - 1).replace(/[\s,;:.]+\S*$/, '')}…`);

export const getPuntosMapa = unstable_cache(
  async (): Promise<PuntoMapa[]> => {
    const lugares = (await getLugares())
      .filter((l) => l.latitud != null && l.longitud != null)
      .map((l): PuntoMapa => {
        const portada = portadaDe(l);
        return {
          tipo: 'lugar',
          slug: l.slug,
          nombre: l.nombre,
          categoria: l.categoria,
          lat: l.latitud as number,
          lng: l.longitud as number,
          foto: portada ? miniatura(portada.src) : null,
          zona: l.municipio || l.zone || '',
          rating: l.rating,
          resenas: l.resenas,
          telefono: l.telefono,
          consejo: recorta(l.consejo || l.descripcion),
          aliado: l.aliado,
        };
      });

    // Los alojamientos van con coordenadas APROXIMADAS (migración 027): el
    // punto de la urbanización, nunca la puerta. Dos apartamentos de la misma
    // urbanización comparten punto a propósito; el mapa los separa al dibujar.
    const casas = await rows<Record<string, unknown>>(
      `SELECT p.slug, p.name, p.location, p.zone_slug, p.latitud, p.longitud, p.price_per_night,
              p.guests_adults + p.guests_children AS personas, p.airbnb_rating, p.airbnb_resenas,
              (SELECT path FROM property_images i WHERE i.property_id = p.id ORDER BY i.is_cover DESC, i.sort_order LIMIT 1) AS foto
         FROM properties p
        WHERE p.is_published AND p.is_real AND p.latitud IS NOT NULL
        ORDER BY p.sort_order`,
    );

    return [
      ...lugares,
      ...casas.map((c): PuntoMapa => ({
        tipo: 'alojamiento',
        slug: String(c.slug),
        nombre: String(c.name),
        categoria: 'alojamiento',
        lat: Number(c.latitud),
        lng: Number(c.longitud),
        foto: c.foto ? miniatura(String(c.foto)) : null,
        zona: String(c.location ?? ''),
        rating: c.airbnb_rating == null ? null : Number(c.airbnb_rating),
        resenas: c.airbnb_resenas == null ? null : Number(c.airbnb_resenas),
        telefono: null,
        consejo: '',
        aliado: false,
        precio: Number(c.price_per_night ?? 0),
        personas: Number(c.personas ?? 0),
      })),
    ];
  },
  ['mapa-puntos'],
  // Misma etiqueta que la guía: al editar un lugar en el panel, el mapa se
  // regenera con él. Los alojamientos no tienen etiqueta propia todavía —sus
  // acciones invalidan por ruta—, así que un cambio de precio o de foto entra
  // acá cuando vence la hora.
  { tags: [TAG_GUIA], revalidate: 3600 },
);
