// Inmuebles en venta + prospectos de Facebook Marketplace.
//
// DOS MUNDOS QUE NO SE MEZCLAN (ver db/migrations/010-ventas.sql):
//   · prospectos_venta: anuncios AJENOS traídos por el scraper. Solo para el
//     panel: la dueña llama al vendedor y le ofrece representar la propiedad.
//     Jamás se publican: es contenido copiado (Google lo ignora o castiga), las
//     fotos son enlaces a Facebook que caducan en horas y que Venezuela
//     bloquea, y los precios que pone la gente son falsos la mitad de las veces.
//   · inmuebles_venta: lo que Margarita Renace representa, con sus fotos y su
//     texto. Esto sí sale en /en-venta.
//
// EL HALLAZGO QUE HACE ÚTIL EL SCRAPER: Facebook no entrega datos del vendedor
// (el campo viene vacío siempre), pero los vendedores los escriben en la
// descripción: "Ref, 45000 $ / 0424/8839740". De ahí se leen teléfono, precio
// real en dólares, m², habitaciones y baños. Sin eso, un anuncio es solo un
// título y un precio de "VEF1".

import { readFileSync } from 'fs';
import { query, rows, withTransaction } from './db';
import { guardarFotoRemota } from './uploads';
import { ZONE_GEO } from './schema';
import { slugify } from './listings';

// ── Tipos ───────────────────────────────────────────────────────────────────

export type EstadoProspecto = 'nuevo' | 'contactado' | 'descartado' | 'captado';
export const ESTADOS: { key: EstadoProspecto; label: string }[] = [
  { key: 'nuevo', label: 'Nuevo' },
  { key: 'contactado', label: 'Contactado' },
  { key: 'captado', label: 'Captado' },
  { key: 'descartado', label: 'Descartado' },
];

export interface Prospecto {
  fbId: string; url: string; titulo: string; tituloLimpio: string; descripcion: string;
  precioFb: number | null; monedaFb: string | null; precioUsd: number | null;
  telefono: string | null; m2: number | null; habitaciones: number | null; banos: number | null;
  municipio: string; ciudad: string; latitud: number | null; longitud: number | null;
  zoneSlug: string | null; zoneName: string | null;
  fotoUrl: string | null; fotos: number; vivo: boolean; vendido: boolean;
  estado: EstadoProspecto; notas: string;
  vistoPrimero: Date; vistoUltimo: Date;
  /** Sale en /en-venta (además tiene que estar vivo, no vendido y no descartado). */
  publicado: boolean;
  slug: string | null;
  /** Fotos copiadas al servidor: las de Facebook caducan en horas. */
  fotosLocales: string[];
}

export type TipoInmueble = 'apartamento' | 'casa' | 'terreno' | 'local';
export const TIPOS: { key: TipoInmueble; label: string; plural: string }[] = [
  { key: 'apartamento', label: 'Apartamento', plural: 'Apartamentos' },
  { key: 'casa', label: 'Casa', plural: 'Casas' },
  { key: 'terreno', label: 'Terreno', plural: 'Terrenos' },
  { key: 'local', label: 'Local comercial', plural: 'Locales' },
];

export interface InmuebleVenta {
  id: string; slug: string; titulo: string; tipo: TipoInmueble;
  zoneSlug: string; zone: string; ubicacion: string; descripcion: string;
  precioUsd: number; precioAConsultar: boolean;
  m2Construccion: number | null; m2Terreno: number | null;
  habitaciones: number | null; banos: number | null; estacionamientos: number | null;
  latitud: number | null; longitud: number | null;
  isPublished: boolean; prospectoFbId: string | null;
  image: string; images: { id: string; path: string; alt: string; isCover: boolean }[];
  updatedAt: Date;
}

export interface Corrida {
  id: string; corridaApify: string | null; urlBusqueda: string; pedidos: number;
  conDetalle: boolean; traidos: number; nuevos: number; costoUsd: number | null;
  error: string | null; createdAt: Date;
}

// ── Lectura del texto del anuncio ───────────────────────────────────────────

/** "𝑪𝑨𝑺𝑨 𝑬𝑵 𝑽𝑬𝑵𝑻𝑨 🟡" → "Casa En Venta". Las letras "en negrita" de Instagram
 *  son símbolos matemáticos Unicode; NFKD los vuelve letras normales. */
export function limpiarTitulo(t: string): string {
  const plano = t
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, (m) => m) // se conservan las tildes reales
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}️]/gu, ' ')
    .replace(/[|•·*_~]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Todo en mayúsculas → Título Con Mayúsculas Iniciales; si no, se respeta.
  if (plano.length > 3 && plano === plano.toUpperCase()) {
    return plano.toLowerCase().replace(/(^|\s)(\p{L})/gu, (m, sp, l) => sp + l.toUpperCase());
  }
  return plano;
}

/** Teléfonos venezolanos como los escribe la gente: 0424/8839740, 0424-883.97.40,
 *  +58 424 8839740, 04248839740, 0295 2631234. Devuelve dígitos con 58 delante. */
export function extraerTelefono(texto: string): string | null {
  const t = texto.replace(/[ ]/g, ' ');
  const re = /(?:\+?58[\s.-]?)?0?(4(?:12|14|16|24|26|22)|2(?:12|4[1-9]|5[1-9]|6[1-9]|7[1-9]|8[1-9]|9[1-9]))[\s./-]*(\d{3})[\s./-]*(\d{2})[\s./-]*(\d{2})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const num = `58${m[1]}${m[2]}${m[3]}${m[4]}`;
    if (num.length === 12) return num;
  }
  return null;
}

/** Precio en dólares leído del texto. Cubre "45000 $", "$ 45.000", "45.000$",
 *  "USD 45000", "45mil$", "45k", "45 mil dólares", "Ref 45000". Ignora montos
 *  absurdos para un inmueble (< 3.000 o > 5.000.000). */
export function extraerPrecioUSD(texto: string): number | null {
  const t = texto.replace(/ /g, ' ');
  const candidatos: number[] = [];
  const empujar = (crudo: string, mult = 1) => {
    const n = Number(crudo.replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.'));
    if (Number.isFinite(n)) {
      const v = Math.round(n * mult);
      if (v >= 3000 && v <= 5_000_000) candidatos.push(v);
    }
  };
  // "85 mil $" tiene dos dígitos; "45000 $" tiene cinco: el mínimo depende de si
  // viene el multiplicador.
  for (const m of t.matchAll(/(?:\$|usd|us\$|d[oó]lares?|ref\.?|precio)[\s:]*([\d][\d.,]*)\s*(mil|k)?\b/gi)) empujar(m[1], m[2] ? 1000 : 1);
  for (const m of t.matchAll(/([\d][\d.,]*)\s*(mil|k)?\s*(?:\$|usd|us\$|d[oó]lares?|verdes)/gi)) empujar(m[1], m[2] ? 1000 : 1);
  if (!candidatos.length) return null;
  // Si hay varios (precio y "antes"), el mayor suele ser el precio pedido.
  return Math.max(...candidatos);
}

const num = (texto: string, re: RegExp): number | null => {
  const m = re.exec(texto);
  if (!m) return null;
  const n = Number(m[1].replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};
export const extraerM2 = (t: string) => num(t, /(\d{2,4}(?:[.,]\d+)?)\s*(?:m2|m²|mts?2|mts?²|metros)/i);
export const extraerHabitaciones = (t: string) =>
  num(t, /(\d{1,2})\s*(?:hab|habitaci|cuartos?|dormitorios?|rec[aá]maras?)/i);
export const extraerBanos = (t: string) => num(t, /(\d{1,2})\s*(?:ba[ñn]os?)/i);

/**
 * El texto del anuncio tal como se muestra al público: SIN el teléfono, correo
 * ni enlaces del vendedor. Ese contacto es el activo del negocio y queda solo
 * en el panel; el visitante escribe a Margarita Renace.
 */
export function textoPublico(texto: string): string {
  return texto
    .replace(/(?:\+?58[\s.-]?)?0?(?:4(?:12|14|16|24|26|22)|2\d\d)[\s./-]*\d{3}[\s./-]*\d{2}[\s./-]*\d{2}/g, '')
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '')
    .replace(/https?:\/\/\S+|www\.\S+|wa\.me\S*/gi, '')
    .replace(/^\s*(?:contacto|contáctanos|llamar|llama|escríbenos|whatsapp|wsp|tel[eé]fono|cel)\b[^\n]*$/gim, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Slug público de un prospecto: título limpio + cola del id, para que dos
 *  "Casa en venta" no choquen. */
export function slugProspecto(tituloLimpio: string, fbId: string): string {
  const base = slugify(tituloLimpio).slice(0, 50).replace(/-+$/, '') || 'inmueble';
  return `${base}-${fbId.slice(-6)}`;
}

/**
 * Facebook cuela en «inmuebles en venta» neveras, juegos de dormitorio y carros.
 * Lo que claramente no es un inmueble nace descartado y oculto; la dueña puede
 * rescatarlo desde el panel si el filtro se equivocó.
 */
const NO_ES_INMUEBLE = /\b(nevera|refrigerador|lavadora|secadora|cocina el[eé]ctrica|colch[oó]n|juego de (dormitorio|comedor|sala|cuarto)|sof[aá]|mueble|escritorio|televisor|tv\b|aire acondicionado|split|moto|carro|camioneta|toyota|chevrolet|ford|bicicleta|celular|iphone|laptop|ropa|zapatos|perro|gato|cachorro)\b/i;
export const esInmueble = (titulo: string, descripcion: string): boolean =>
  !NO_ES_INMUEBLE.test(titulo) || /\b(casa|apartamento|apto|terreno|parcela|local|posada|quinta|villa|townhouse|penthouse|oficina|galp[oó]n)\b/i.test(titulo + ' ' + descripcion.slice(0, 200));

/** Zona del sitio más cercana a unas coordenadas (radio máximo 12 km). */
export function zonaPorCoordenadas(lat: number | null, lng: number | null): string | null {
  if (lat == null || lng == null) return null;
  let mejor: { slug: string; d: number } | null = null;
  for (const [slug, g] of Object.entries(ZONE_GEO)) {
    const dLat = (g.lat - lat) * 111;
    const dLng = (g.lng - lng) * 111 * Math.cos((lat * Math.PI) / 180);
    const d = Math.hypot(dLat, dLng);
    if (!mejor || d < mejor.d) mejor = { slug, d };
  }
  return mejor && mejor.d <= 12 ? mejor.slug : null;
}

// ── Apify ───────────────────────────────────────────────────────────────────

const ACTOR = 'apify~facebook-marketplace-scraper';
/** Centro de la isla, 40 km: cubre Margarita entera y deja fuera tierra firme. */
export const URL_BUSQUEDA =
  'https://www.facebook.com/marketplace/category/propertyforsale?exact=false&latitude=10.98&longitude=-63.85&radius=40';
/** Tarifa publicada del actor (US$ por anuncio) más margen de cómputo. */
export const COSTO_ESTIMADO_POR_ANUNCIO = 0.0062 * 1.6;

function leerToken(): string | null {
  if (process.env.APIFY_TOKEN) return process.env.APIFY_TOKEN;
  // pm2 no relee el entorno con un restart: el token vive en un archivo 600
  // de root que se lee al momento. Ver DESPLIEGUE.md.
  try {
    const m = readFileSync('/etc/margarita-renace/apify.env', 'utf8').match(/^APIFY_TOKEN=(.+)$/m);
    return m ? m[1].trim() : null;
  } catch { return null; }
}
export const hayToken = () => leerToken() !== null;

export async function saldoApify(): Promise<{ usado: number; limite: number } | null> {
  const token = leerToken();
  if (!token) return null;
  try {
    const r = await fetch(`https://api.apify.com/v2/users/me/limits?token=${token}`, { signal: AbortSignal.timeout(10000) });
    const d = (await r.json()).data;
    return { usado: Number(d.current?.monthlyUsageUsd ?? 0), limite: Number(d.limits?.maxMonthlyUsageUsd ?? 0) };
  } catch { return null; }
}

type Crudo = Record<string, unknown>;
const g = (o: unknown, ...ruta: string[]): unknown => ruta.reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Crudo)[k] : undefined), o);

/** Normaliza un anuncio, venga en modo lista (snake_case) o detalle (camelCase). */
function normalizar(x: Crudo) {
  const id = String(x.id ?? '');
  const titulo = String(x.listingTitle ?? x.marketplace_listing_title ?? '');
  const descripcion = String(g(x, 'description', 'text') ?? '');
  const precioFb = Number(g(x, 'listingPrice', 'amount') ?? g(x, 'listing_price', 'amount'));
  const monedaFb = (g(x, 'listingPrice', 'currency') as string) ?? (String(g(x, 'listing_price', 'formatted_amount') ?? '').match(/^[A-Z]{3}/)?.[0] ?? null);
  const lat = g(x, 'location', 'latitude'); const lng = g(x, 'location', 'longitude');
  const fotosDet = (x.listingPhotos as Crudo[] | undefined) ?? [];
  const texto = `${titulo}\n${descripcion}`;
  return {
    fbId: id,
    url: String(x.itemUrl ?? x.listingUrl ?? `https://www.facebook.com/marketplace/item/${id}/`),
    titulo, tituloLimpio: limpiarTitulo(titulo), descripcion,
    precioFb: Number.isFinite(precioFb) ? precioFb : null, monedaFb,
    // El precio de Facebook solo vale como dólares dentro del rango de un
    // inmueble (3.000 – 5.000.000): la gente escribe US$ en el campo de Bs. Por
    // encima son bolívares de verdad o basura, y publicar «US$ 270.000.000» es
    // peor que «consultar precio».
    precioUsd: extraerPrecioUSD(texto) ?? (Number.isFinite(precioFb) && precioFb >= 3000 && precioFb <= 5_000_000 ? Math.round(precioFb) : null),
    telefono: extraerTelefono(texto),
    m2: extraerM2(descripcion), habitaciones: extraerHabitaciones(texto), banos: extraerBanos(texto),
    municipio: String(g(x, 'location', 'reverse_geocode_detailed', 'city') ?? g(x, 'location', 'reverse_geocode', 'city') ?? ''),
    ciudad: String(g(x, 'location', 'reverse_geocode', 'city_page', 'display_name') ?? '').split(',')[0],
    latitud: typeof lat === 'number' ? lat : null, longitud: typeof lng === 'number' ? lng : null,
    zoneSlug: zonaPorCoordenadas(typeof lat === 'number' ? lat : null, typeof lng === 'number' ? lng : null),
    fotoUrl: (g(x, 'primaryListingPhoto', 'photo_image_url') ?? g(x, 'primary_listing_photo', 'photo_image_url') ?? g(fotosDet[0], 'image', 'uri') ?? null) as string | null,
    fotos: fotosDet.length || (g(x, 'primary_listing_photo', 'photo_image_url') ? 1 : 0),
    vivo: Boolean(x.isLive ?? x.is_live ?? true), vendido: Boolean(x.isSold ?? x.is_sold ?? false),
    urlsFotos: [
      ...fotosDet.map((f) => g(f, 'image', 'uri') as string | undefined),
      (g(x, 'primaryListingPhoto', 'photo_image_url') ?? g(x, 'primary_listing_photo', 'photo_image_url')) as string | undefined,
    ].filter((u): u is string => typeof u === 'string' && u.startsWith('http')),
  };
}

/**
 * Corre el scraper y guarda los prospectos. Síncrono: espera el resultado
 * (unos 20-60 s). Cada corrida queda registrada con su costo real.
 */
export async function buscarEnMarketplace(limite: number, conDetalle = true): Promise<Corrida> {
  const token = leerToken();
  if (!token) throw new Error('Falta el token de Apify (/etc/margarita-renace/apify.env).');
  const pedidos = Math.min(60, Math.max(1, Math.trunc(limite)));

  const [fila] = await rows<{ id: string }>(
    `INSERT INTO ventas_corridas (url_busqueda, pedidos, con_detalle) VALUES ($1, $2, $3) RETURNING id`,
    [URL_BUSQUEDA, pedidos, conDetalle],
  );
  try {
    const r = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${token}&memory=1024&timeout=280&clean=true`,
      {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeListingDetails: conDetalle, resultsLimit: pedidos, startUrls: [{ url: URL_BUSQUEDA }] }),
        signal: AbortSignal.timeout(295_000),
      },
    );
    const items = (await r.json()) as unknown;
    if (!r.ok || !Array.isArray(items)) {
      throw new Error((g(items, 'error', 'message') as string) || `Apify respondió ${r.status}`);
    }
    let nuevos = 0;
    for (const crudo of items as Crudo[]) {
      const p = normalizar(crudo);
      if (!p.fbId) continue;
      const [res] = await rows<{ nuevo: boolean }>(
        `INSERT INTO prospectos_venta (fb_id, url, titulo, titulo_limpio, descripcion, precio_fb, moneda_fb,
           precio_usd, telefono, m2, habitaciones, banos, municipio, ciudad, latitud, longitud, zone_slug,
           foto_url, fotos, vivo, vendido, slug, estado, publicado)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
         ON CONFLICT (fb_id) DO UPDATE SET
           titulo = EXCLUDED.titulo, titulo_limpio = EXCLUDED.titulo_limpio,
           -- una corrida sin detalle no debe borrar la descripción de una con detalle
           descripcion = CASE WHEN EXCLUDED.descripcion <> '' THEN EXCLUDED.descripcion ELSE prospectos_venta.descripcion END,
           precio_fb = EXCLUDED.precio_fb, moneda_fb = EXCLUDED.moneda_fb,
           precio_usd = COALESCE(EXCLUDED.precio_usd, prospectos_venta.precio_usd),
           telefono = COALESCE(EXCLUDED.telefono, prospectos_venta.telefono),
           m2 = COALESCE(EXCLUDED.m2, prospectos_venta.m2),
           habitaciones = COALESCE(EXCLUDED.habitaciones, prospectos_venta.habitaciones),
           banos = COALESCE(EXCLUDED.banos, prospectos_venta.banos),
           municipio = CASE WHEN EXCLUDED.municipio <> '' THEN EXCLUDED.municipio ELSE prospectos_venta.municipio END,
           ciudad = CASE WHEN EXCLUDED.ciudad <> '' THEN EXCLUDED.ciudad ELSE prospectos_venta.ciudad END,
           latitud = COALESCE(EXCLUDED.latitud, prospectos_venta.latitud),
           longitud = COALESCE(EXCLUDED.longitud, prospectos_venta.longitud),
           zone_slug = COALESCE(EXCLUDED.zone_slug, prospectos_venta.zone_slug),
           foto_url = COALESCE(EXCLUDED.foto_url, prospectos_venta.foto_url),
           fotos = GREATEST(EXCLUDED.fotos, prospectos_venta.fotos),
           vivo = EXCLUDED.vivo, vendido = EXCLUDED.vendido,
           slug = COALESCE(prospectos_venta.slug, EXCLUDED.slug),
           visto_ultimo = now(), updated_at = now()
         RETURNING (xmax = 0) AS nuevo`,
        [p.fbId, p.url, p.titulo, p.tituloLimpio, p.descripcion, p.precioFb, p.monedaFb, p.precioUsd, p.telefono,
         p.m2, p.habitaciones, p.banos, p.municipio, p.ciudad, p.latitud, p.longitud, p.zoneSlug, p.fotoUrl, p.fotos, p.vivo, p.vendido,
         slugProspecto(p.tituloLimpio, p.fbId),
         esInmueble(p.titulo, p.descripcion) ? 'nuevo' : 'descartado', esInmueble(p.titulo, p.descripcion)],
      );
      if (res?.nuevo) nuevos++;
      await descargarFotosProspecto(p.fbId, p.urlsFotos);
    }

    // Costo real: la última corrida del actor en la cuenta.
    let corridaApify: string | null = null; let costo: number | null = null;
    try {
      const u = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/runs/last?token=${token}`, { signal: AbortSignal.timeout(10000) });
      const d = (await u.json()).data;
      corridaApify = d?.id ?? null; costo = d?.usageTotalUsd != null ? Number(d.usageTotalUsd) : null;
    } catch { /* el costo es informativo; sin él la corrida igual vale */ }

    await query(
      `UPDATE ventas_corridas SET corrida_apify = $2, traidos = $3, nuevos = $4, costo_usd = $5 WHERE id = $1`,
      [fila.id, corridaApify, (items as Crudo[]).length, nuevos, costo],
    );
  } catch (e) {
    await query(`UPDATE ventas_corridas SET error = $2 WHERE id = $1`, [fila.id, (e as Error).message.slice(0, 500)]);
    throw e;
  }
  const [c] = await rows<Record<string, unknown>>(`SELECT * FROM ventas_corridas WHERE id = $1`, [fila.id]);
  return corridaDesde(c);
}

/**
 * Copia al servidor las fotos del anuncio que aún no tengamos. Se hace en el
 * mismo momento de la búsqueda porque las URLs de Facebook caducan en menos
 * de dos horas (verificado: 403 al rato) y Venezuela bloquea ese CDN.
 * Máximo 8 por anuncio: es lo que pide Google para un alojamiento y de sobra
 * para una ficha.
 */
export async function descargarFotosProspecto(fbId: string, urls: string[]): Promise<number> {
  const [fila] = await rows<{ fotos_locales: string[] }>(`SELECT fotos_locales FROM prospectos_venta WHERE fb_id = $1`, [fbId]);
  const tengo = fila?.fotos_locales ?? [];
  const faltan = Math.max(0, 8 - tengo.length);
  if (!faltan || !urls.length) return 0;
  const nuevas: string[] = [];
  for (const [i, u] of [...new Set(urls)].slice(0, faltan).entries()) {
    const ruta = await guardarFotoRemota(u, fbId, tengo.length + i);
    if (ruta) nuevas.push(ruta);
  }
  if (nuevas.length) {
    await query(`UPDATE prospectos_venta SET fotos_locales = fotos_locales || $2::text[], updated_at = now() WHERE fb_id = $1`, [fbId, nuevas]);
  }
  return nuevas.length;
}

const corridaDesde = (c: Record<string, unknown>): Corrida => ({
  id: String(c.id), corridaApify: (c.corrida_apify as string) ?? null, urlBusqueda: String(c.url_busqueda),
  pedidos: Number(c.pedidos), conDetalle: Boolean(c.con_detalle), traidos: Number(c.traidos), nuevos: Number(c.nuevos),
  costoUsd: c.costo_usd == null ? null : Number(c.costo_usd), error: (c.error as string) ?? null, createdAt: new Date(c.created_at as string),
});

export async function listarCorridas(n = 8): Promise<Corrida[]> {
  return (await rows<Record<string, unknown>>(`SELECT * FROM ventas_corridas ORDER BY created_at DESC LIMIT $1`, [n])).map(corridaDesde);
}

// ── Prospectos ──────────────────────────────────────────────────────────────

const prospectoDesde = (r: Record<string, unknown>): Prospecto => ({
  fbId: String(r.fb_id), url: String(r.url), titulo: String(r.titulo), tituloLimpio: String(r.titulo_limpio || r.titulo),
  descripcion: String(r.descripcion ?? ''),
  precioFb: r.precio_fb == null ? null : Number(r.precio_fb), monedaFb: (r.moneda_fb as string) ?? null,
  precioUsd: r.precio_usd == null ? null : Number(r.precio_usd), telefono: (r.telefono as string) ?? null,
  m2: r.m2 == null ? null : Number(r.m2), habitaciones: r.habitaciones == null ? null : Number(r.habitaciones),
  banos: r.banos == null ? null : Number(r.banos),
  municipio: String(r.municipio ?? ''), ciudad: String(r.ciudad ?? ''),
  latitud: r.latitud == null ? null : Number(r.latitud), longitud: r.longitud == null ? null : Number(r.longitud),
  zoneSlug: (r.zone_slug as string) ?? null, zoneName: (r.zone_name as string) ?? null,
  fotoUrl: (r.foto_url as string) ?? null, fotos: Number(r.fotos ?? 0),
  vivo: Boolean(r.vivo), vendido: Boolean(r.vendido),
  estado: r.estado as EstadoProspecto, notas: String(r.notas ?? ''),
  vistoPrimero: new Date(r.visto_primero as string), vistoUltimo: new Date(r.visto_ultimo as string),
  publicado: Boolean(r.publicado), slug: (r.slug as string) ?? null,
  fotosLocales: (r.fotos_locales as string[]) ?? [],
});

export async function listarProspectos(estado?: EstadoProspecto | 'todos'): Promise<Prospecto[]> {
  const filtro = estado && estado !== 'todos' ? `WHERE p.estado = $1` : '';
  const params = estado && estado !== 'todos' ? [estado] : [];
  return (await rows<Record<string, unknown>>(
    `SELECT p.*, z.name AS zone_name FROM prospectos_venta p
     LEFT JOIN zones z ON z.slug = p.zone_slug ${filtro}
     ORDER BY CASE p.estado WHEN 'nuevo' THEN 0 WHEN 'contactado' THEN 1 WHEN 'captado' THEN 2 ELSE 3 END,
              (p.telefono IS NOT NULL) DESC, (p.precio_usd IS NOT NULL) DESC, p.visto_ultimo DESC`, params,
  )).map(prospectoDesde);
}

export async function resumenProspectos() {
  const [r] = await rows<Record<string, string>>(
    `SELECT count(*) total, count(*) FILTER (WHERE estado='nuevo') nuevos,
            count(*) FILTER (WHERE telefono IS NOT NULL) con_telefono,
            count(*) FILTER (WHERE estado='captado') captados FROM prospectos_venta`);
  return { total: +r.total, nuevos: +r.nuevos, conTelefono: +r.con_telefono, captados: +r.captados };
}

/** Condición para salir en la web. Lo descartado y lo captado no salen: lo
 *  captado ya tiene su ficha propia con fotos de la dueña. */
const PUBLICABLE = `p.publicado AND p.vivo AND NOT p.vendido AND p.estado IN ('nuevo','contactado') AND p.slug IS NOT NULL`;

export async function getProspectosPublicados(): Promise<Prospecto[]> {
  // Un vendedor suele publicar la misma casa dos o tres veces. Con igual
  // título, precio y zona se muestra una sola: la vista más recientemente.
  return (await rows<Record<string, unknown>>(
    `SELECT * FROM (
       SELECT DISTINCT ON (lower(p.titulo_limpio), coalesce(p.precio_usd, 0), coalesce(p.zone_slug, ''))
              p.*, z.name AS zone_name
       FROM prospectos_venta p LEFT JOIN zones z ON z.slug = p.zone_slug
       WHERE ${PUBLICABLE}
       ORDER BY lower(p.titulo_limpio), coalesce(p.precio_usd, 0), coalesce(p.zone_slug, ''), p.visto_ultimo DESC
     ) u
     ORDER BY (cardinality(u.fotos_locales) > 0) DESC, (u.precio_usd IS NOT NULL) DESC, u.visto_ultimo DESC`,
  )).map(prospectoDesde);
}
export async function getProspectoPublicado(slug: string): Promise<Prospecto | undefined> {
  const [r] = await rows<Record<string, unknown>>(
    `SELECT p.*, z.name AS zone_name FROM prospectos_venta p LEFT JOIN zones z ON z.slug = p.zone_slug
     WHERE p.slug = $1 AND ${PUBLICABLE}`, [slug]);
  return r ? prospectoDesde(r) : undefined;
}
export async function alternarPublicadoProspecto(fbId: string, publicado: boolean): Promise<void> {
  await query(`UPDATE prospectos_venta SET publicado = $2, updated_at = now() WHERE fb_id = $1`, [fbId, publicado]);
}

export async function cambiarEstadoProspecto(fbId: string, estado: EstadoProspecto, notas?: string): Promise<void> {
  await query(
    `UPDATE prospectos_venta SET estado = $2, notas = COALESCE($3, notas), updated_at = now() WHERE fb_id = $1`,
    [fbId, estado, notas ?? null],
  );
}

/** Marca el prospecto como captado y crea el inmueble borrador con lo que se
 *  pudo leer del anuncio. La dueña completa y sube SUS fotos en el panel. */
export async function captarProspecto(fbId: string): Promise<string> {
  return withTransaction(async (tx) => {
    const { rows: [p] } = await tx(`SELECT * FROM prospectos_venta WHERE fb_id = $1`, [fbId]);
    if (!p) throw new Error('prospecto inexistente');
    const { rows: [ya] } = await tx(`SELECT id FROM inmuebles_venta WHERE prospecto_fb_id = $1`, [fbId]);
    if (ya) return String(ya.id);
    const tipo: TipoInmueble = /casa|villa|quinta|townhouse|town house/i.test(p.titulo) ? 'casa'
      : /terreno|parcela|lote/i.test(p.titulo) ? 'terreno' : /local|oficina|galp[oó]n/i.test(p.titulo) ? 'local' : 'apartamento';
    const base = slugify(limpiarTitulo(p.titulo)).slice(0, 60) || 'inmueble';
    let slug = base;
    for (let i = 2; ; i++) {
      const { rows: [dup] } = await tx(`SELECT 1 FROM inmuebles_venta WHERE slug = $1`, [slug]);
      if (!dup) break;
      slug = `${base}-${i}`;
    }
    const { rows: [inm] } = await tx(
      `INSERT INTO inmuebles_venta (slug, titulo, tipo, zone_slug, ubicacion, descripcion, precio_usd, precio_a_consultar,
         m2_construccion, habitaciones, banos, latitud, longitud, prospecto_fb_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
      [slug, limpiarTitulo(p.titulo), tipo, p.zone_slug ?? 'porlamar', [p.municipio, p.ciudad].filter(Boolean).join(', '),
       p.descripcion ?? '', p.precio_usd ?? 0, p.precio_usd == null, p.m2, p.habitaciones, p.banos, p.latitud, p.longitud, fbId],
    );
    await tx(`UPDATE prospectos_venta SET estado = 'captado', updated_at = now() WHERE fb_id = $1`, [fbId]);
    return String(inm.id);
  });
}

// ── Inmuebles en venta ──────────────────────────────────────────────────────

const SELECT_INMUEBLE = `
  SELECT i.*, z.name AS zone_name,
    COALESCE(json_agg(json_build_object('id', im.id, 'path', im.path, 'alt', im.alt, 'isCover', im.is_cover)
      ORDER BY im.is_cover DESC, im.sort_order) FILTER (WHERE im.id IS NOT NULL), '[]') AS images
  FROM inmuebles_venta i
  JOIN zones z ON z.slug = i.zone_slug
  LEFT JOIN inmuebles_venta_images im ON im.inmueble_id = i.id`;

const inmuebleDesde = (r: Record<string, unknown>): InmuebleVenta => {
  const images = (r.images as InmuebleVenta['images']) ?? [];
  return {
    id: String(r.id), slug: String(r.slug), titulo: String(r.titulo), tipo: r.tipo as TipoInmueble,
    zoneSlug: String(r.zone_slug), zone: String(r.zone_name), ubicacion: String(r.ubicacion ?? ''), descripcion: String(r.descripcion ?? ''),
    precioUsd: Number(r.precio_usd), precioAConsultar: Boolean(r.precio_a_consultar),
    m2Construccion: r.m2_construccion == null ? null : Number(r.m2_construccion), m2Terreno: r.m2_terreno == null ? null : Number(r.m2_terreno),
    habitaciones: r.habitaciones == null ? null : Number(r.habitaciones), banos: r.banos == null ? null : Number(r.banos),
    estacionamientos: r.estacionamientos == null ? null : Number(r.estacionamientos),
    latitud: r.latitud == null ? null : Number(r.latitud), longitud: r.longitud == null ? null : Number(r.longitud),
    isPublished: Boolean(r.is_published), prospectoFbId: (r.prospecto_fb_id as string) ?? null,
    image: images.find((i) => i.isCover)?.path ?? images[0]?.path ?? '', images, updatedAt: new Date(r.updated_at as string),
  };
};

export async function getInmueblesPublicados(): Promise<InmuebleVenta[]> {
  return (await rows<Record<string, unknown>>(`${SELECT_INMUEBLE} WHERE i.is_published GROUP BY i.id, z.name ORDER BY i.sort_order, i.created_at DESC`)).map(inmuebleDesde);
}
export async function getInmueblePublicado(slug: string): Promise<InmuebleVenta | undefined> {
  const [r] = await rows<Record<string, unknown>>(`${SELECT_INMUEBLE} WHERE i.is_published AND i.slug = $1 GROUP BY i.id, z.name`, [slug]);
  return r ? inmuebleDesde(r) : undefined;
}
export async function listarInmueblesAdmin(): Promise<InmuebleVenta[]> {
  return (await rows<Record<string, unknown>>(`${SELECT_INMUEBLE} GROUP BY i.id, z.name ORDER BY i.is_published DESC, i.updated_at DESC`)).map(inmuebleDesde);
}
export async function getInmuebleAdmin(id: string): Promise<InmuebleVenta | undefined> {
  const [r] = await rows<Record<string, unknown>>(`${SELECT_INMUEBLE} WHERE i.id = $1 GROUP BY i.id, z.name`, [id]);
  return r ? inmuebleDesde(r) : undefined;
}

// ── Precio en las monedas que la gente usa ──────────────────────────────────

export interface PrecioMulti {
  usd: number;
  /** Lo que de verdad se paga en bolívares: a la tasa de mercado (Binance P2P). */
  bsMercado: number | null;
  /** Referencia oficial. Nadie vende una casa a esta tasa; se muestra por transparencia. */
  bsBcv: number | null;
  eur: number | null;
  brecha: number | null;
}
export function precioEnMonedas(usd: number, t: { bcvUsd: number | null; bcvEur: number | null; mercado: number | null; brecha: number | null }): PrecioMulti {
  return {
    usd,
    bsMercado: t.mercado ? usd * t.mercado : null,
    bsBcv: t.bcvUsd ? usd * t.bcvUsd : null,
    // Euros al cruce oficial BCV (USD→VES→EUR): el que está en España lo piensa así.
    eur: t.bcvUsd && t.bcvEur ? (usd * t.bcvUsd) / t.bcvEur : null,
    brecha: t.brecha,
  };
}
export const fmtUSD = (n: number) => 'US$ ' + Math.round(n).toLocaleString('es-VE');
export const fmtBs = (n: number) =>
  n >= 1e6 ? `Bs ${(n / 1e6).toLocaleString('es-VE', { maximumFractionDigits: 1 })} millones` : `Bs ${Math.round(n).toLocaleString('es-VE')}`;
export const fmtEUR = (n: number) => '€ ' + Math.round(n).toLocaleString('es-VE');
