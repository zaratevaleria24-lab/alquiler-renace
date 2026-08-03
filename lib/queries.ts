// Consultas de lectura del sitio público. SOLO SERVIDOR.
//
// DECISIÓN: cada función hace UNA consulta y agrega en SQL con json_agg, en vez
// de traer las propiedades y luego pedir fotos, amenidades y categorías por
// cada una. Eso último es el problema N+1: con 12 propiedades serían 37
// consultas en lugar de 1. Hoy no se notaría, pero el sitio se regenera en cada
// publicación del panel y la diferencia crece con el inventario.
//
// Las funciones devuelven exactamente los tipos de lib/types.ts, así que las
// vistas no saben —ni les importa— si los datos vienen de la base o de un array.

import { rows } from './db';
import type { Property, Vehicle, Zone } from './types';

// ── Propiedades ─────────────────────────────────────────────────────────────

// FILTER (WHERE ...) en los json_agg evita que una propiedad sin fotos devuelva
// un array con un solo elemento nulo, que es lo que pasa si se omite.
const PROPERTY_SELECT = `
  SELECT
    p.id, p.slug, p.name, p.location, p.description,
    p.price_text, p.price_per_night, p.price_on_request, p.nights_count,
    p.rating, p.guests_adults, p.guests_children, p.is_real,
    z.slug AS zone_slug, z.name AS zone_name,
    COALESCE(json_agg(
      DISTINCT jsonb_build_object('path', i.path, 'alt', i.alt, 'isCover', i.is_cover, 'ord', i.sort_order)
    ) FILTER (WHERE i.id IS NOT NULL), '[]') AS images,
    COALESCE(json_agg(
      DISTINCT jsonb_build_object('key', a.key, 'name', a.name, 'iconKey', a.icon_key, 'ord', pa.sort_order)
    ) FILTER (WHERE a.key IS NOT NULL), '[]') AS amenities,
    COALESCE(json_agg(DISTINCT c.key) FILTER (WHERE c.key IS NOT NULL), '[]') AS categories,
    h.name AS host_name, h.tagline AS host_tagline, h.avatar_path AS host_avatar
  FROM properties p
  JOIN zones z ON z.slug = p.zone_slug
  LEFT JOIN property_images i     ON i.property_id = p.id
  LEFT JOIN property_amenities pa ON pa.property_id = p.id
  LEFT JOIN amenities a           ON a.key = pa.amenity_key
  LEFT JOIN property_categories pc ON pc.property_id = p.id
  LEFT JOIN categories c          ON c.key = pc.category_key
  LEFT JOIN hosts h               ON h.id = p.host_id
  WHERE p.is_published
  GROUP BY p.id, z.slug, z.name, h.name, h.tagline, h.avatar_path
  ORDER BY p.sort_order, p.name
`;

type PropertyRow = {
  id: string; slug: string; name: string; location: string; description: string;
  price_text: string; price_per_night: number; price_on_request: boolean;
  nights_count: number; rating: string | null;
  guests_adults: number; guests_children: number; is_real: boolean;
  zone_slug: string; zone_name: string;
  images: { path: string; alt: string; isCover: boolean; ord: number }[];
  amenities: { key: string; name: string; iconKey: string; ord: number }[];
  categories: string[];
  host_name: string | null; host_tagline: string | null; host_avatar: string | null;
};

function toProperty(r: PropertyRow): Property {
  // json_agg no garantiza el orden, así que se ordena acá con el campo `ord`
  // que se arrastró a propósito en el jsonb_build_object.
  const images = [...r.images].sort((a, b) => a.ord - b.ord);
  const cover = images.find((i) => i.isCover) ?? images[0];

  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    zone: r.zone_name,
    zoneSlug: r.zone_slug,
    location: r.location,
    description: r.description,
    priceText: r.price_text,
    pricePerNight: r.price_per_night,
    priceOnRequest: r.price_on_request,
    nightsCount: r.nights_count,
    // numeric llega como string desde pg: si no se convierte, las comparaciones
    // numéricas del filtro de la web fallan en silencio.
    rating: r.rating === null ? null : Number(r.rating),
    guestsAllowed: { adults: r.guests_adults, children: r.guests_children },
    isReal: r.is_real,
    image: cover?.path ?? '',
    gallery: images.map((i) => i.path),
    images: images.map(({ path, alt, isCover }) => ({ path, alt, isCover })),
    categories: r.categories,
    amenities: [...r.amenities]
      .sort((a, b) => a.ord - b.ord)
      .map(({ key, name, iconKey }) => ({ key, name, iconKey })),
    host: r.host_name
      ? {
          name: r.host_name,
          tagline: r.host_tagline ?? '',
          avatarPath: r.host_avatar,
        }
      : null,
  };
}

export async function getProperties(): Promise<Property[]> {
  return (await rows<PropertyRow>(PROPERTY_SELECT)).map(toProperty);
}

/** Una propiedad por su slug, para /propiedad/<slug>. Mismo patrón que
 *  getZone(): filtra en memoria porque solo corre en build/revalidación y el
 *  inventario es pequeño; la consulta ya viene agregada. */
export async function getProperty(slug: string): Promise<Property | undefined> {
  return (await getProperties()).find((p) => p.slug === slug);
}

// ── Zonas ───────────────────────────────────────────────────────────────────

type ZoneRow = {
  slug: string; name: string; coast: string; summary: string;
  body: string[]; nearby: string[]; best_for: string;
};

/**
 * Zonas con sus propiedades. Se traen las dos tablas en dos consultas y se
 * agrupa en memoria: hacerlo en una sola con json_agg anidado duplicaría todo
 * el bloque de propiedades por zona y sería más difícil de leer que de mantener.
 */
export async function getZones(): Promise<Zone[]> {
  const [zoneRows, properties] = await Promise.all([
    rows<ZoneRow>(
      `SELECT slug, name, coast, summary, body, nearby, best_for
       FROM zones ORDER BY sort_order, name`,
    ),
    getProperties(),
  ]);

  const byZone = new Map<string, Property[]>();
  for (const p of properties) {
    const list = byZone.get(p.zoneSlug) ?? [];
    list.push(p);
    byZone.set(p.zoneSlug, list);
  }

  return zoneRows
    .map((z) => {
      const props = byZone.get(z.slug) ?? [];
      const prices = props
        .filter((p) => !p.priceOnRequest && p.pricePerNight > 0)
        .map((p) => p.pricePerNight);
      return {
        slug: z.slug,
        name: z.name,
        coast: z.coast,
        summary: z.summary,
        body: z.body,
        nearby: z.nearby,
        bestFor: z.best_for,
        properties: props,
        minPrice: prices.length ? Math.min(...prices) : null,
      };
    })
    // Zonas sin inventario publicado no se muestran: una landing vacía es
    // contenido pobre y Google la penaliza. Vuelven solas al publicar algo.
    .filter((z) => z.properties.length > 0)
    .sort(
      (a, b) => b.properties.length - a.properties.length || a.name.localeCompare(b.name),
    );
}

export async function getZone(slug: string): Promise<Zone | undefined> {
  return (await getZones()).find((z) => z.slug === slug);
}

// ── Catálogos ───────────────────────────────────────────────────────────────

export async function getCategories() {
  return rows<{ key: string; label: string; icon_key: string }>(
    `SELECT key, label, icon_key FROM categories ORDER BY sort_order, label`,
  ).then((rs) => rs.map((r) => ({ key: r.key, label: r.label, iconKey: r.icon_key })));
}

// ── Vehículos ───────────────────────────────────────────────────────────────

type VehicleRow = {
  id: string; slug: string; brand: string; model: string; year: number | null;
  display_name: string; transmission: 'automatica' | 'sincronica';
  seats: number; doors: number; has_ac: boolean; fuel: string; body_type: string;
  description: string; price_text: string; price_per_day: number;
  price_on_request: boolean; deposit_text: string; min_days: number;
  pickup_zone_slug: string | null; pickup_note: string; is_available: boolean;
  images: { path: string; alt: string; isCover: boolean; ord: number }[];
  features: { key: string; name: string; iconKey: string; ord: number }[];
};

export async function getVehicles(): Promise<Vehicle[]> {
  const rs = await rows<VehicleRow>(`
    SELECT
      v.id, v.slug, v.brand, v.model, v.year, v.display_name, v.transmission,
      v.seats, v.doors, v.has_ac, v.fuel, v.body_type, v.description,
      v.price_text, v.price_per_day, v.price_on_request, v.deposit_text,
      v.min_days, v.pickup_zone_slug, v.pickup_note, v.is_available,
      COALESCE(json_agg(
        DISTINCT jsonb_build_object('path', i.path, 'alt', i.alt, 'isCover', i.is_cover, 'ord', i.sort_order)
      ) FILTER (WHERE i.id IS NOT NULL), '[]') AS images,
      COALESCE(json_agg(
        DISTINCT jsonb_build_object('key', f.key, 'name', f.name, 'iconKey', f.icon_key, 'ord', vf.sort_order)
      ) FILTER (WHERE f.key IS NOT NULL), '[]') AS features
    FROM vehicles v
    LEFT JOIN vehicle_images i ON i.vehicle_id = v.id
    LEFT JOIN vehicle_vehicle_features vf ON vf.vehicle_id = v.id
    LEFT JOIN vehicle_features f ON f.key = vf.feature_key
    WHERE v.is_published
    GROUP BY v.id
    ORDER BY v.sort_order, v.display_name
  `);

  return rs.map((r) => {
    const images = [...r.images].sort((a, b) => a.ord - b.ord);
    const cover = images.find((i) => i.isCover) ?? images[0];
    return {
      id: r.id, slug: r.slug, brand: r.brand, model: r.model, year: r.year,
      displayName: r.display_name, transmission: r.transmission,
      seats: r.seats, doors: r.doors, hasAc: r.has_ac, fuel: r.fuel,
      bodyType: r.body_type, description: r.description,
      priceText: r.price_text, pricePerDay: r.price_per_day,
      priceOnRequest: r.price_on_request, depositText: r.deposit_text,
      minDays: r.min_days, pickupZoneSlug: r.pickup_zone_slug,
      pickupNote: r.pickup_note, isAvailable: r.is_available,
      image: cover?.path ?? null,
      images: images.map(({ path, alt, isCover }) => ({ path, alt, isCover })),
      features: [...r.features]
        .sort((a, b) => a.ord - b.ord)
        .map(({ key, name, iconKey }) => ({ key, name, iconKey })),
    };
  });
}

// ── Salud del inventario, para el dashboard ─────────────────────────────────

export async function getInventoryHealth() {
  const [r] = await rows<{
    total: string; publicadas: string; reales: string; relleno: string;
    sin_foto_propia: string; sin_rating: string; zonas_con_inventario: string;
    vehiculos: string;
  }>(`
    SELECT
      (SELECT count(*) FROM properties) AS total,
      (SELECT count(*) FROM properties WHERE is_published) AS publicadas,
      (SELECT count(*) FROM properties WHERE is_real) AS reales,
      -- Listados de relleno PUBLICADOS: el aviso más importante del panel.
      (SELECT count(*) FROM properties WHERE is_published AND NOT is_real) AS relleno,
      (SELECT count(*) FROM properties p WHERE NOT EXISTS (
         SELECT 1 FROM property_images i
         WHERE i.property_id = p.id AND i.path LIKE '/properties/%'
       )) AS sin_foto_propia,
      (SELECT count(*) FROM properties WHERE rating IS NULL) AS sin_rating,
      (SELECT count(DISTINCT zone_slug) FROM properties WHERE is_published) AS zonas_con_inventario,
      (SELECT count(*) FROM vehicles WHERE is_published) AS vehiculos
  `);

  // Todos los count() de Postgres llegan como string (bigint). Convertirlos acá
  // evita el clásico "1" + 1 = "11" en el dashboard.
  return {
    total: Number(r.total),
    publicadas: Number(r.publicadas),
    reales: Number(r.reales),
    relleno: Number(r.relleno),
    sinFotoPropia: Number(r.sin_foto_propia),
    sinRating: Number(r.sin_rating),
    zonasConInventario: Number(r.zonas_con_inventario),
    vehiculos: Number(r.vehiculos),
  };
}
