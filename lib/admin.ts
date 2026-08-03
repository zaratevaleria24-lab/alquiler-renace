// Consultas del PANEL. SOLO SERVIDOR, detrás del guardia de sesión.
//
// Separadas de lib/queries.ts a propósito: las consultas públicas filtran por
// is_published y alimentan páginas estáticas; estas ven TODO el inventario
// (borradores incluidos) y corren en cada visita al panel. Mezclarlas invita a
// que un filtro de un lado se cuele en el otro.

import { rows } from './db';

export interface PropiedadFila {
  id: string;
  slug: string;
  name: string;
  zoneName: string;
  priceText: string;
  isPublished: boolean;
  isReal: boolean;
  cover: string | null;
}

export async function listarPropiedadesAdmin(): Promise<PropiedadFila[]> {
  const rs = await rows<{
    id: string; slug: string; name: string; zone_name: string;
    price_text: string; is_published: boolean; is_real: boolean;
    cover: string | null;
  }>(`
    SELECT
      p.id, p.slug, p.name, z.name AS zone_name, p.price_text,
      p.is_published, p.is_real,
      (SELECT i.path FROM property_images i
       WHERE i.property_id = p.id
       ORDER BY i.is_cover DESC, i.sort_order LIMIT 1) AS cover
    FROM properties p
    JOIN zones z ON z.slug = p.zone_slug
    ORDER BY p.sort_order, p.name
  `);
  return rs.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    zoneName: r.zone_name,
    priceText: r.price_text,
    isPublished: r.is_published,
    isReal: r.is_real,
    cover: r.cover,
  }));
}

export interface PropiedadEdicion {
  id: string;
  slug: string;
  name: string;
  zoneSlug: string;
  location: string;
  description: string;
  pricePerNight: number;
  priceOnRequest: boolean;
  guestsAdults: number;
  guestsChildren: number;
  isReal: boolean;
  isPublished: boolean;
  categoryKeys: string[];
  amenityKeys: string[];
}

export async function getPropiedadAdmin(
  id: string,
): Promise<PropiedadEdicion | undefined> {
  const [p] = await rows<{
    id: string; slug: string; name: string; zone_slug: string; location: string;
    description: string; price_per_night: number; price_on_request: boolean;
    guests_adults: number; guests_children: number;
    is_real: boolean; is_published: boolean;
  }>(
    `SELECT id, slug, name, zone_slug, location, description,
            price_per_night, price_on_request, guests_adults, guests_children,
            is_real, is_published
     FROM properties WHERE id = $1`,
    [id],
  );
  if (!p) return undefined;

  const [cats, ams] = await Promise.all([
    rows<{ category_key: string }>(
      `SELECT category_key FROM property_categories WHERE property_id = $1`,
      [id],
    ),
    rows<{ amenity_key: string }>(
      `SELECT amenity_key FROM property_amenities
       WHERE property_id = $1 ORDER BY sort_order`,
      [id],
    ),
  ]);

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    zoneSlug: p.zone_slug,
    location: p.location,
    description: p.description,
    pricePerNight: p.price_per_night,
    priceOnRequest: p.price_on_request,
    guestsAdults: p.guests_adults,
    guestsChildren: p.guests_children,
    isReal: p.is_real,
    isPublished: p.is_published,
    categoryKeys: cats.map((c) => c.category_key),
    amenityKeys: ams.map((a) => a.amenity_key),
  };
}

/** Catálogos completos para los selects del formulario. A diferencia del sitio
 *  público, acá se listan TODAS las zonas, tengan inventario o no. */
export async function getCatalogosAdmin() {
  const [zonas, categorias, amenidades] = await Promise.all([
    rows<{ slug: string; name: string }>(
      `SELECT slug, name FROM zones ORDER BY sort_order, name`,
    ),
    rows<{ key: string; label: string }>(
      `SELECT key, label FROM categories ORDER BY sort_order, label`,
    ),
    rows<{ key: string; name: string }>(
      `SELECT key, name FROM amenities ORDER BY name`,
    ),
  ]);
  return { zonas, categorias, amenidades };
}
