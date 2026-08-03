// Recolector de métricas propio. SOLO SERVIDOR.
//
// POR QUÉ NO GOOGLE ANALYTICS: en Venezuela sus recursos se bloquean, así que no
// cargaría para buena parte del público y las cifras vendrían sesgadas justo
// hacia quien menos interesa. Un recolector propio además no pone cookies, así
// que no hace falta banner de consentimiento.
//
// ═══════════════════════════════════════════════════════════════════════════
// LO QUE NO SE GUARDA, A PROPÓSITO
//
//   · La IP. Ni en crudo ni cifrada de forma reversible. Una base con las IPs de
//     quién visitó el sitio es exposición para los VISITANTES, y si alguien la
//     pide el problema es del negocio. Ver la migración 007.
//   · El user-agent completo. Solo se deriva "móvil" o "escritorio".
//   · La URL de procedencia completa. Solo el HOST: la URL puede llevar
//     parámetros con datos de la otra página.
//
// Lo que sí: hash(IP + navegador + sal del día). Distingue visitantes DENTRO del
// día sin saber quién es ninguno, y como la sal cambia y las viejas se borran,
// los hashes de días pasados no se pueden recalcular ni teniendo la IP.
// ═══════════════════════════════════════════════════════════════════════════

import { createHash, randomBytes } from 'node:crypto';
import { query, rows } from './db';

/** Tipos de evento aceptados. Lista cerrada: el endpoint está abierto a
 *  internet y sin esto cualquiera podría llenar la tabla de basura. */
export const EVENTOS = ['whatsapp', 'busqueda', 'ver_propiedad'] as const;
export type Evento = (typeof EVENTOS)[number];

// ── Huella del visitante ────────────────────────────────────────────────────

/**
 * Sal del día. Se crea la primera vez que se usa y se borran las de más de dos
 * días, que es lo que hace irreversibles los hashes viejos.
 *
 * ON CONFLICT DO NOTHING + RETURNING no devuelve fila cuando ya existía, así que
 * se lee después: dos visitas simultáneas del primer día no deben crear dos
 * sales distintas y partir el conteo en dos.
 */
async function salDelDia(): Promise<string> {
  await query(
    `INSERT INTO metricas_sal (dia, sal) VALUES (current_date, $1)
     ON CONFLICT (dia) DO NOTHING`,
    [randomBytes(24).toString('base64url')],
  );
  await query(`DELETE FROM metricas_sal WHERE dia < current_date - 2`);

  const [r] = await rows<{ sal: string }>(
    `SELECT sal FROM metricas_sal WHERE dia = current_date`,
  );
  return r.sal;
}

async function huella(ip: string, ua: string): Promise<string> {
  return createHash('sha256')
    .update(`${ip}|${ua}|${await salDelDia()}`)
    .digest('hex')
    .slice(0, 24);
}

// ── Clasificación ───────────────────────────────────────────────────────────

/** Móvil o escritorio, sin guardar el user-agent. */
function dispositivo(ua: string): 'movil' | 'escritorio' {
  return /Mobile|Android|iPhone|iPad|iPod/i.test(ua) ? 'movil' : 'escritorio';
}

/**
 * Rastreadores conocidos. El aviso se dispara desde el navegador con
 * JavaScript, lo que ya descarta a la mayoría; esto atrapa a los que sí lo
 * ejecutan y a las herramientas de monitoreo.
 */
const BOTS =
  /bot|crawl|spider|slurp|bingpreview|headless|lighthouse|pagespeed|curl|wget|python-requests|axios|postman|monitor|uptime|gptbot|claudebot|perplexity/i;

export function esBot(ua: string): boolean {
  return ua.trim() === '' || BOTS.test(ua);
}

/** Solo el host de la procedencia, y nunca el propio dominio. */
function hostDeProcedencia(referrer: string | null): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    return host.endsWith('margaritarenace.com.ve') ? null : host;
  } catch {
    return null;
  }
}

/**
 * Países de la diáspora con más venezolanos, para el corte que de verdad decide
 * dónde pautar. Cualquier otro país que no sea VE cuenta igual como "afuera";
 * esta lista solo sirve para nombrarlos en el dashboard.
 */
export const PAISES_DIASPORA: Record<string, string> = {
  US: 'Estados Unidos',
  ES: 'España',
  CO: 'Colombia',
  CL: 'Chile',
  PE: 'Perú',
  AR: 'Argentina',
  EC: 'Ecuador',
  MX: 'México',
  PA: 'Panamá',
  BR: 'Brasil',
  IT: 'Italia',
  PT: 'Portugal',
};

export function nombrePais(codigo: string | null): string {
  if (!codigo) return 'sin identificar';
  if (codigo === 'VE') return 'Venezuela';
  return PAISES_DIASPORA[codigo] ?? codigo;
}

// ── Registro ────────────────────────────────────────────────────────────────

export interface DatosVisita {
  path: string;
  referrer: string | null;
  ip: string;
  ua: string;
  /** Cabecera CF-IPCountry: Cloudflare la manda en cada petición, gratis. */
  pais: string | null;
}

export async function registrarVisita(d: DatosVisita): Promise<void> {
  if (esBot(d.ua)) return;
  // Rutas absurdas: alguien probando el endpoint a mano.
  if (!d.path.startsWith('/') || d.path.length > 300) return;

  await query(
    `INSERT INTO page_views (path, referrer_host, device, country, visitor_day)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      d.path,
      hostDeProcedencia(d.referrer),
      dispositivo(d.ua),
      d.pais,
      await huella(d.ip, d.ua),
    ],
  );
}

export async function registrarEvento(
  kind: Evento,
  d: DatosVisita & { propertyId?: string | null; meta?: Record<string, unknown> },
): Promise<void> {
  if (esBot(d.ua)) return;

  await query(
    `INSERT INTO events (kind, path, property_id, meta, visitor_day)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      kind,
      d.path.slice(0, 300),
      d.propertyId ?? null,
      JSON.stringify(d.meta ?? {}),
      await huella(d.ip, d.ua),
    ],
  );
}

// ── Consultas del dashboard ─────────────────────────────────────────────────

export interface Resumen {
  visitasHoy: number;
  visitantesHoy: number;
  visitas7d: number;
  visitantes7d: number;
  clicsWhatsApp7d: number;
  /** Visitantes únicos de 7 días, partidos en Venezuela / afuera / desconocido. */
  diaspora: { dentro: number; afuera: number; sinDato: number };
  porPais: { pais: string; nombre: string; visitantes: number }[];
  porPagina: { path: string; visitas: number; visitantes: number }[];
  porProcedencia: { host: string; visitas: number }[];
  dispositivos: { device: string; visitas: number }[];
  /** Propiedades con visitas y cuántas terminaron en clic de WhatsApp. */
  propiedades: { path: string; visitas: number; clics: number }[];
  busquedas: { texto: string; veces: number }[];
  porDia: { dia: string; visitas: number; visitantes: number }[];
  hayDatos: boolean;
}

const N = (v: unknown) => Number(v ?? 0);

export async function getResumenMetricas(): Promise<Resumen> {
  const [
    hoy,
    semana,
    clics,
    diaspora,
    porPais,
    porPagina,
    porProcedencia,
    dispositivos,
    propiedades,
    busquedas,
    porDia,
  ] = await Promise.all([
    rows(`SELECT count(*) v, count(DISTINCT visitor_day) u FROM page_views
          WHERE created_at >= current_date`),
    rows(`SELECT count(*) v, count(DISTINCT visitor_day) u FROM page_views
          WHERE created_at > now() - interval '7 days'`),
    rows(`SELECT count(*) n FROM events
          WHERE kind = 'whatsapp' AND created_at > now() - interval '7 days'`),
    rows(`SELECT
            count(DISTINCT visitor_day) FILTER (WHERE country = 'VE')                     dentro,
            count(DISTINCT visitor_day) FILTER (WHERE country IS NOT NULL AND country <> 'VE') afuera,
            count(DISTINCT visitor_day) FILTER (WHERE country IS NULL)                    sin_dato
          FROM page_views WHERE created_at > now() - interval '7 days'`),
    rows(`SELECT country, count(DISTINCT visitor_day) u FROM page_views
          WHERE created_at > now() - interval '30 days' AND country IS NOT NULL
          GROUP BY country ORDER BY u DESC LIMIT 12`),
    rows(`SELECT path, count(*) v, count(DISTINCT visitor_day) u FROM page_views
          WHERE created_at > now() - interval '30 days'
          GROUP BY path ORDER BY v DESC LIMIT 15`),
    rows(`SELECT referrer_host, count(*) v FROM page_views
          WHERE created_at > now() - interval '30 days' AND referrer_host IS NOT NULL
          GROUP BY referrer_host ORDER BY v DESC LIMIT 10`),
    rows(`SELECT device, count(*) v FROM page_views
          WHERE created_at > now() - interval '30 days' AND device IS NOT NULL
          GROUP BY device ORDER BY v DESC`),
    // Visitas a fichas de propiedad y cuántos clics de WhatsApp salieron de
    // ellas. Es el proxy de conversión más cercano que existe sin reservas.
    rows(`SELECT p.path,
                 count(*) v,
                 (SELECT count(*) FROM events e
                  WHERE e.kind = 'whatsapp' AND e.path = p.path
                    AND e.created_at > now() - interval '30 days') clics
          FROM page_views p
          WHERE p.created_at > now() - interval '30 days'
            AND p.path LIKE '/propiedad/%'
          GROUP BY p.path ORDER BY v DESC LIMIT 15`),
    rows(`SELECT meta->>'q' q, count(*) n FROM events
          WHERE kind = 'busqueda' AND meta->>'q' <> ''
            AND created_at > now() - interval '30 days'
          GROUP BY 1 ORDER BY n DESC LIMIT 15`),
    rows(`SELECT to_char(created_at AT TIME ZONE 'America/Caracas', 'YYYY-MM-DD') dia,
                 count(*) v, count(DISTINCT visitor_day) u
          FROM page_views WHERE created_at > now() - interval '14 days'
          GROUP BY 1 ORDER BY 1`),
  ]);

  const d = diaspora[0] ?? {};
  return {
    visitasHoy: N(hoy[0]?.v),
    visitantesHoy: N(hoy[0]?.u),
    visitas7d: N(semana[0]?.v),
    visitantes7d: N(semana[0]?.u),
    clicsWhatsApp7d: N(clics[0]?.n),
    diaspora: {
      dentro: N(d.dentro),
      afuera: N(d.afuera),
      sinDato: N(d.sin_dato),
    },
    porPais: porPais.map((r) => ({
      pais: String(r.country),
      nombre: nombrePais(String(r.country)),
      visitantes: N(r.u),
    })),
    porPagina: porPagina.map((r) => ({
      path: String(r.path),
      visitas: N(r.v),
      visitantes: N(r.u),
    })),
    porProcedencia: porProcedencia.map((r) => ({
      host: String(r.referrer_host),
      visitas: N(r.v),
    })),
    dispositivos: dispositivos.map((r) => ({
      device: String(r.device),
      visitas: N(r.v),
    })),
    propiedades: propiedades.map((r) => ({
      path: String(r.path),
      visitas: N(r.v),
      clics: N(r.clics),
    })),
    busquedas: busquedas.map((r) => ({ texto: String(r.q), veces: N(r.n) })),
    porDia: porDia.map((r) => ({
      dia: String(r.dia),
      visitas: N(r.v),
      visitantes: N(r.u),
    })),
    hayDatos: N(semana[0]?.v) > 0,
  };
}
