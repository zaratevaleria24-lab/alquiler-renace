// Guía turística de la isla: lugares para visitar y cosas para hacer.
//
// Tres fuentes, tres reglas (ver db/migrations/012-guia.sql):
//   · El TEXTO es nuestro, con la voz de IDENTIDAD.md.
//   · Los DATOS (rating, horario, teléfono, coordenadas) vienen de Google
//     Places y se refrescan: Google permite guardar el place_id para siempre y
//     el resto hasta 30 días.
//   · Las FOTOS guardadas son propias o de Wikimedia Commons con licencia libre
//     (con crédito). Las de Google no se guardan: se sirven al vuelo con su
//     atribución por /api/guia/foto.

import { readFileSync } from 'fs';
import { unstable_cache } from 'next/cache';
import { query, rows } from './db';

export type Categoria =
  | 'playa' | 'historia' | 'naturaleza' | 'mirador' | 'museo' | 'comer'
  | 'actividad' | 'aventura' | 'nocturna' | 'compras' | 'familia'
  // Servicios: lo que un huésped necesita RESOLVER desde el apartamento.
  | 'delivery' | 'supermercado' | 'licores' | 'agua' | 'salud' | 'transporte';

export type Grupo = 'descubrir' | 'resolver';

export const CATEGORIAS: { key: Categoria; label: string; plural: string; emoji: string; grupo: Grupo; sub: string }[] = [
  { key: 'playa', label: 'Playa', plural: 'Playas', emoji: '🏖', grupo: 'descubrir', sub: 'Dónde bañarte hoy' },
  { key: 'actividad', label: 'Paseos', plural: 'Paseos y tours', emoji: '🪁', grupo: 'descubrir', sub: 'Lanchas, islas, excursiones' },
  { key: 'aventura', label: 'Aventura', plural: 'Aventura y deporte', emoji: '🥾', grupo: 'descubrir', sub: 'Senderismo, kite, buceo, surf' },
  { key: 'comer', label: 'Comer', plural: 'Dónde comer', emoji: '🍽', grupo: 'descubrir', sub: 'Los más recomendados' },
  { key: 'historia', label: 'Historia', plural: 'Historia', emoji: '🏰', grupo: 'descubrir', sub: 'Castillos, fortines, iglesias' },
  { key: 'naturaleza', label: 'Naturaleza', plural: 'Naturaleza', emoji: '🌿', grupo: 'descubrir', sub: 'Lagunas, cerros, manglares' },
  { key: 'mirador', label: 'Mirador', plural: 'Miradores', emoji: '🌅', grupo: 'descubrir', sub: 'Para el atardecer' },
  { key: 'museo', label: 'Museo', plural: 'Museos', emoji: '🖼', grupo: 'descubrir', sub: 'Una hora fuera del sol' },
  { key: 'familia', label: 'Con niños', plural: 'Con niños', emoji: '🎡', grupo: 'descubrir', sub: 'Parques y planes' },
  { key: 'nocturna', label: 'Noche', plural: 'De noche', emoji: '🌙', grupo: 'descubrir', sub: 'Bares y música' },
  { key: 'compras', label: 'Compras', plural: 'Compras', emoji: '🛍', grupo: 'descubrir', sub: 'Centros comerciales y mercados' },
  { key: 'delivery', label: 'A domicilio', plural: 'Pedir a domicilio', emoji: '🛵', grupo: 'resolver', sub: 'Comida hasta tu puerta' },
  { key: 'supermercado', label: 'Supermercado', plural: 'Supermercados', emoji: '🛒', grupo: 'resolver', sub: 'Sigo, Río, mercados' },
  { key: 'licores', label: 'Licores', plural: 'Licores y bebidas', emoji: '🍾', grupo: 'resolver', sub: 'Guuao, Prolicor, delivery' },
  { key: 'agua', label: 'Agua y gas', plural: 'Agua y gas', emoji: '💧', grupo: 'resolver', sub: 'Botellones, cisterna, bombonas' },
  { key: 'salud', label: 'Salud', plural: 'Farmacias y clínicas', emoji: '➕', grupo: 'resolver', sub: 'Farmacias 24 h y clínicas' },
  { key: 'transporte', label: 'Moverse', plural: 'Moverse', emoji: '🚕', grupo: 'resolver', sub: 'Taxis, apps, alquiler de carros' },
];
export const esServicio = (c: string) => CATEGORIAS.find((x) => x.key === c)?.grupo === 'resolver';
export const categoriaLabel = (c: string) => CATEGORIAS.find((x) => x.key === c)?.label ?? c;
export const categoriaPlural = (c: string) => CATEGORIAS.find((x) => x.key === c)?.plural ?? c;

export interface FotoGuia { path: string; alt: string; credito: string; licencia: string; fuente: 'propia' | 'commons' | 'duena' | 'instagram' }
export interface FotoGoogle { name: string; autor: string }

export interface Lugar {
  id: string; slug: string; nombre: string; categoria: Categoria;
  zoneSlug: string | null; zone: string | null; municipio: string;
  descripcion: string; consejo: string; mejorMomento: string; duracion: string; costo: string;
  googlePlaceId: string | null; rating: number | null; resenas: number | null;
  latitud: number | null; longitud: number | null; direccion: string;
  telefono: string | null; web: string | null; instagram: string | null; mapsUrl: string | null;
  horario: string[] | null; nivelPrecio: string | null; resumenGoogle: string | null;
  fotosGoogle: FotoGoogle[]; datosActualizados: string | null;
  fotos: FotoGuia[]; destacado: boolean; aliado: boolean; orden: number; publicado: boolean;
}

export interface Consejo { id: string; tema: string; titulo: string; texto: string; orden: number; publicado: boolean }

// ── Claves de Google (fuera del repo) ───────────────────────────────────────
function leerGoogle(): { places: string | null; maps: string | null } {
  try {
    const t = readFileSync('/etc/margarita-renace/google.env', 'utf8');
    return {
      places: process.env.PLACES_KEY ?? t.match(/^PLACES_KEY=(.+)$/m)?.[1]?.trim() ?? null,
      maps: process.env.MAPS_JS_KEY ?? t.match(/^MAPS_JS_KEY=(.+)$/m)?.[1]?.trim() ?? null,
    };
  } catch { return { places: process.env.PLACES_KEY ?? null, maps: process.env.MAPS_JS_KEY ?? null }; }
}
export const clavePlaces = () => leerGoogle().places;
export const claveMaps = () => leerGoogle().maps;

// ── Lectura ─────────────────────────────────────────────────────────────────
const lugarDesde = (r: Record<string, unknown>): Lugar => ({
  id: String(r.id), slug: String(r.slug), nombre: String(r.nombre), categoria: r.categoria as Categoria,
  zoneSlug: (r.zone_slug as string) ?? null, zone: (r.zone_name as string) ?? null, municipio: String(r.municipio ?? ''),
  descripcion: String(r.descripcion ?? ''), consejo: String(r.consejo ?? ''), mejorMomento: String(r.mejor_momento ?? ''),
  duracion: String(r.duracion ?? ''), costo: String(r.costo ?? ''),
  googlePlaceId: (r.google_place_id as string) ?? null, rating: r.rating == null ? null : Number(r.rating),
  resenas: r.resenas == null ? null : Number(r.resenas), latitud: r.latitud == null ? null : Number(r.latitud),
  longitud: r.longitud == null ? null : Number(r.longitud), direccion: String(r.direccion ?? ''),
  telefono: (r.telefono as string) ?? null, web: (r.web as string) ?? null, instagram: (r.instagram as string) ?? null,
  mapsUrl: (r.maps_url as string) ?? null, horario: (r.horario as string[]) ?? null, nivelPrecio: (r.nivel_precio as string) ?? null,
  resumenGoogle: (r.resumen_google as string) ?? null, fotosGoogle: (r.fotos_google as FotoGoogle[]) ?? [],
  datosActualizados: r.datos_actualizados ? new Date(r.datos_actualizados as string).toISOString() : null,
  fotos: (r.fotos as FotoGuia[]) ?? [], destacado: Boolean(r.destacado), aliado: Boolean(r.aliado), orden: Number(r.orden ?? 0), publicado: Boolean(r.publicado),
});

const SELECT = `SELECT g.*, z.name AS zone_name FROM guia_lugares g LEFT JOIN zones z ON z.slug = g.zone_slug`;
export const TAG_GUIA = 'guia';

export const getLugares = unstable_cache(
  async (): Promise<Lugar[]> =>
    (await rows<Record<string, unknown>>(`${SELECT} WHERE g.publicado ORDER BY g.aliado DESC, g.destacado DESC, g.orden, g.resenas DESC NULLS LAST, g.nombre`)).map(lugarDesde),
  ['guia-lugares'], { tags: [TAG_GUIA], revalidate: 3600 },
);
export async function getLugar(slug: string): Promise<Lugar | undefined> {
  return (await getLugares()).find((l) => l.slug === slug);
}
export const getConsejos = unstable_cache(
  async (): Promise<Consejo[]> =>
    (await rows<Record<string, unknown>>(`SELECT * FROM guia_consejos WHERE publicado ORDER BY orden, titulo`)).map((r) => ({
      id: String(r.id), tema: String(r.tema), titulo: String(r.titulo), texto: String(r.texto), orden: Number(r.orden), publicado: Boolean(r.publicado),
    })),
  ['guia-consejos'], { tags: [TAG_GUIA], revalidate: 3600 },
);
export async function listarLugaresAdmin(): Promise<Lugar[]> {
  return (await rows<Record<string, unknown>>(`${SELECT} ORDER BY g.publicado DESC, g.categoria, g.orden, g.nombre`)).map(lugarDesde);
}
export async function getLugarAdmin(id: string): Promise<Lugar | undefined> {
  const [r] = await rows<Record<string, unknown>>(`${SELECT} WHERE g.id = $1`, [id]);
  return r ? lugarDesde(r) : undefined;
}

/** Versión chica (480px) de una foto guardada: `x.webp` → `x-s.webp`. Las de
 *  Google van por el proxy con `?w=480`. Para tarjetas y mapa; la galería usa la grande. */
export function miniatura(src: string): string {
  if (src.startsWith('/api/guia/foto/')) return `${src}?w=480`;
  return src.replace(/\.webp$/, '-s.webp');
}

/** Foto de portada: propia/Commons primero; si no hay, la primera de Google vía proxy. */
export function portadaDe(l: Lugar): { src: string; alt: string; credito: string } | null {
  if (l.fotos[0]) return { src: l.fotos[0].path, alt: l.fotos[0].alt, credito: l.fotos[0].credito };
  if (l.fotosGoogle[0]) return { src: `/api/guia/foto/${l.id}/0`, alt: `${l.nombre}, Isla de Margarita`, credito: `Foto: ${l.fotosGoogle[0].autor} · Google` };
  return null;
}
export function galeriaDe(l: Lugar): { src: string; alt: string; credito: string }[] {
  const propias = l.fotos.map((f) => ({ src: f.path, alt: f.alt, credito: f.credito }));
  const google = l.fotosGoogle.slice(0, 6).map((f, k) => ({ src: `/api/guia/foto/${l.id}/${k}`, alt: `${l.nombre}, Isla de Margarita — foto ${k + 1}`, credito: `Foto: ${f.autor} · Google` }));
  return [...propias, ...google].slice(0, 8);
}

/** Horario de hoy, si Places lo trajo. */
export function horarioHoy(l: Lugar): string | null {
  if (!l.horario?.length) return null;
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const hoy = dias[new Date().getDay()];
  const linea = l.horario.find((h) => h.toLowerCase().startsWith(hoy));
  return linea ? linea.replace(/^[^:]+:\s*/, '') : null;
}

// ── Google Places: refresco de datos ────────────────────────────────────────
const CAMPOS = ['id', 'displayName', 'rating', 'userRatingCount', 'location', 'shortFormattedAddress', 'nationalPhoneNumber', 'websiteUri',
  'googleMapsUri', 'regularOpeningHours.weekdayDescriptions', 'priceLevel', 'editorialSummary', 'photos.name', 'photos.authorAttributions'].map((c) => 'places.' + c).join(',');

export async function buscarEnPlaces(texto: string): Promise<Record<string, unknown> | null> {
  const key = clavePlaces();
  if (!key) return null;
  const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': CAMPOS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ textQuery: texto, languageCode: 'es', regionCode: 'VE', maxResultCount: 1,
      locationBias: { circle: { center: { latitude: 11.0, longitude: -63.92 }, radius: 45000 } } }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) return null;
  const d = await r.json();
  return d.places?.[0] ?? null;
}

/** Vuelca los datos de un lugar de Places en la fila. Se usa al importar y al refrescar. */
export async function aplicarPlaces(id: string, p: Record<string, unknown>): Promise<void> {
  // Dos lugares de la guía pueden apuntar al mismo sitio de Google (una
  // actividad y su cerro): el place_id es único, así que el segundo se queda
  // sin datos de Google en vez de romper la importación.
  const [dup] = await rows<{ id: string }>(`SELECT id FROM guia_lugares WHERE google_place_id = $1 AND id <> $2`, [p.id, id]);
  if (dup) return;
  const g = (o: unknown, ...k: string[]) => k.reduce<unknown>((a, x) => (a && typeof a === 'object' ? (a as Record<string, unknown>)[x] : undefined), o);
  const fotos = ((p.photos as Record<string, unknown>[]) ?? []).slice(0, 8).map((f) => ({
    name: String(f.name), autor: String(g(f, 'authorAttributions', '0', 'displayName') ?? 'Google'),
  }));
  await query(
    `UPDATE guia_lugares SET google_place_id = $2, rating = $3, resenas = $4, latitud = COALESCE($5, latitud), longitud = COALESCE($6, longitud),
       direccion = COALESCE($7, direccion), telefono = $8, web = COALESCE(web, $9), maps_url = $10, horario = $11, nivel_precio = $12,
       resumen_google = $13, fotos_google = $14, datos_actualizados = now(), updated_at = now()
     WHERE id = $1`,
    [id, p.id, p.rating ?? null, p.userRatingCount ?? null, g(p, 'location', 'latitude') ?? null, g(p, 'location', 'longitude') ?? null,
     p.shortFormattedAddress ?? null, p.nationalPhoneNumber ?? null, p.websiteUri ?? null, p.googleMapsUri ?? null,
     JSON.stringify(g(p, 'regularOpeningHours', 'weekdayDescriptions') ?? null), p.priceLevel ?? null,
     g(p, 'editorialSummary', 'text') ?? null, JSON.stringify(fotos)],
  );
}

/** Bytes de una foto de Google para el proxy. Se cachea unos minutos en memoria. */
const cacheFotos = new Map<string, { t: number; tipo: string; datos: Buffer }>();
export async function fotoGoogle(name: string, ancho = 1200): Promise<{ tipo: string; datos: Buffer } | null> {
  const key = clavePlaces();
  if (!key) return null;
  const k = `${name}@${ancho}`;
  const c = cacheFotos.get(k);
  if (c && Date.now() - c.t < 6 * 3600e3) return c;
  const r = await fetch(`https://places.googleapis.com/v1/${name}/media?maxWidthPx=${ancho}&key=${key}`, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) return null;
  const datos = Buffer.from(await r.arrayBuffer());
  const tipo = r.headers.get('content-type') ?? 'image/jpeg';
  if (cacheFotos.size > 300) cacheFotos.clear();
  cacheFotos.set(k, { t: Date.now(), tipo, datos });
  return { tipo, datos };
}
