// Datos ORIGINALES del anuncio de Airbnb, leídos de su propia página. SOLO SERVIDOR.
//
// Airbnb sirve en el HTML (sin JavaScript) la etiqueta og:title con exactamente
// lo que muestra su widget: «Condo in Pampatar · ★5.0 · 2 bedrooms · 3 beds ·
// 2 baths», y el número de reseñas aparece como «N reviews». Se lee eso, se
// traduce al español y se guarda en `properties` (airbnb_detalle, airbnb_rating,
// airbnb_resenas). Se refresca al guardar la propiedad y, como mucho, una vez al
// día al abrir /enlaces. Sin scripts de Airbnb en nuestra página.
import { query, rows } from './db';

const DICC: [RegExp, string][] = [
  [/\bin\b/g, '·'], [/\bbedrooms\b/g, 'habitaciones'], [/\bbedroom\b/g, 'habitación'],
  [/\bbeds\b/g, 'camas'], [/\bbed\b/g, 'cama'], [/\bbaths\b/g, 'baños'], [/\bbath\b/g, 'baño'], [/\bshared baths?\b/g, 'baño compartido'],
  [/\bCondo\b/g, 'Apartamento'], [/\bEntire (rental unit|home|condo|apartment)\b/g, 'Alojamiento entero'], [/\bRental unit\b/g, 'Apartamento'],
  [/\bApartment\b/g, 'Apartamento'], [/\bHome\b/g, 'Casa'], [/\bVilla\b/g, 'Villa'], [/\bLoft\b/g, 'Loft'], [/\bTownhouse\b/g, 'Casa adosada'],
  [/\bguests?\b/g, 'huéspedes'], [/\bstudio\b/gi, 'estudio'],
];
export function traducir(t: string): string {
  let s = t;
  for (const [re, rep] of DICC) s = s.replace(re, rep);
  return s.replace(/\s*·\s*/g, ' · ').trim();
}

export interface DatosAirbnb { detalle: string; rating: number | null; resenas: number }

export async function leerAnuncioAirbnb(url: string): Promise<DatosAirbnb | null> {
  const m = url.match(/\/rooms\/(\d+)/); if (!m) return null;
  try {
    const r = await fetch(`https://www.airbnb.com/rooms/${m[1]}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36', Accept: 'text/html' },
      signal: AbortSignal.timeout(12000), cache: 'no-store',
    });
    if (!r.ok) return null;
    const html = await r.text();
    const og = html.match(/<meta property="og:title" content="([^"]*)"/)?.[1]?.replace(/&amp;/g, '&');
    if (!og) return null;
    const rating = og.match(/★\s*([\d.]+)/)?.[1];
    // Reseñas: primero el JSON-LD del anuncio (aggregateRating.ratingCount);
    // si no está, el «N reviews» más repetido del HTML.
    const ld = html.match(/"aggregateRating":\{[^}]*"ratingCount":"?(\d+)"?/)?.[1];
    let resenas = ld ? Number(ld) : 0;
    if (!resenas) {
      const conteo = new Map<number, number>();
      for (const x of html.matchAll(/(\d+)\s+reviews?\b/g)) { const n = Number(x[1]); conteo.set(n, (conteo.get(n) ?? 0) + 1); }
      resenas = [...conteo.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
    }
    const detalle = traducir(og.replace(/\s*·\s*★\s*[\d.]+/, ''));
    return { detalle, rating: rating ? Math.round(Number(rating) * 10) / 10 : null, resenas };
  } catch { return null; }
}

/** Sincroniza una propiedad; devuelve true si Airbnb respondió. */
export async function sincronizarAirbnb(propertyId: string, url: string): Promise<boolean> {
  const d = await leerAnuncioAirbnb(url);
  if (!d) { await query(`UPDATE properties SET airbnb_sync_at = now() WHERE id = $1`, [propertyId]); return false; }
  await query(`UPDATE properties SET airbnb_detalle = $2, airbnb_rating = $3, airbnb_resenas = $4, airbnb_sync_at = now() WHERE id = $1`, [propertyId, d.detalle, d.rating, d.resenas]);
  return true;
}

/** Refresca los anuncios con más de 24 h (o nunca leídos). Se llama desde /enlaces. */
export async function refrescarAirbnbSiHaceFalta(): Promise<void> {
  const viejos = await rows<{ id: string; airbnb_url: string }>(
    `SELECT id, airbnb_url FROM properties WHERE is_published AND airbnb_url <> '' AND (airbnb_sync_at IS NULL OR airbnb_sync_at < now() - interval '24 hours') LIMIT 4`);
  await Promise.all(viejos.map((v) => sincronizarAirbnb(v.id, v.airbnb_url)));
}
