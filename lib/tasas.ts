// Tasas de cambio del bolívar. SOLO SERVIDOR.
//
// ═══════════════════════════════════════════════════════════════════════════
// PORTADO DE SIBERIA (2026-08-03)
//
// El modelo de tasas y la matemática vienen del backend Rust de Siberia
// (`/root/proyectos/siberia/backend/ws-server/src/main.rs`), que lleva semanas
// en producción sirviendo siberiaonline.xyz. Se copian las FUENTES y el CÁLCULO,
// no el código: allá es un demonio en Rust que sondea sin parar porque su
// producto es el gráfico en vivo; acá es una consulta a demanda con caché,
// porque un alquiler no necesita la tasa al segundo.
//
// Los dos productos NO se acoplan: cada uno consulta las APIs públicas por su
// cuenta. Es la regla del servidor —los tres productos no comparten nada— y
// además evita que Margarita se quede sin tasas si Siberia está caído.
//
// DECISIONES QUE SE HEREDAN DE SIBERIA, con su motivo:
//
// 1. El "dólar paralelo" NO es la referencia de mercado. Siberia lo eliminó de
//    su producto el 2026-07-19 por ser un índice opaco: nadie publica cómo se
//    calcula. Se guarda solo como dato secundario informativo.
//
// 2. La tasa de mercado es BINANCE P2P DIRECTO, con la mediana de 10 ofertas
//    por lado (compra y venta) y el punto medio entre ambas medianas. La
//    mediana y no el promedio: en P2P siempre hay anuncios con precios absurdos
//    —para llamar la atención o para lavar— y un promedio se los come.
//
// 3. Se piden DOS variantes: todos los métodos de pago, y solo Pago Móvil.
//    Pago Móvil cotiza sistemáticamente más bajo, y es el método que usa la
//    mayoría de la gente en Venezuela. La tasa que se muestra es el promedio de
//    las dos, que es lo que hace el frontend de Siberia.
// ═══════════════════════════════════════════════════════════════════════════

import { rows, query } from './db';

const DOLARAPI = 'https://ve.dolarapi.com/v1/dolares';
const EUROAPI = 'https://ve.dolarapi.com/v1/euros';
const BINANCE_P2P =
  'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';

/** Minutos antes de considerar el caché vencido. El BCV publica una vez al día
 *  y el P2P se mueve despacio; 15 minutos es de sobra y evita machacar las
 *  APIs cuando la dueña recarga el panel. */
const CACHE_MINUTOS = 15;

/** Ofertas por lado que se piden a Binance para calcular la mediana. */
const OFERTAS = 10;

export interface Tasas {
  /** Bolívares por dólar oficial del BCV. */
  bcvUsd: number | null;
  /** Bolívares por euro oficial del BCV. */
  bcvEur: number | null;
  /** Binance P2P, todos los métodos de pago. */
  binance: number | null;
  /** Binance P2P, solo Pago Móvil (cotiza más bajo). */
  binancePm: number | null;
  /** Índice "paralelo" de DolarAPI. Opaco: informativo, no se usa para calcular. */
  paralelo: number | null;
  /** Cuándo se trajeron estos datos. Null si nunca se ha podido. */
  obtenidoAt: Date | null;
  /** Cuándo publicó el BCV su tasa. */
  bcvAt: Date | null;
}

export interface TasasDerivadas extends Tasas {
  /** La tasa de mercado que se usa para todo: promedio de las dos de Binance. */
  mercado: number | null;
  /** Cuánto está el mercado por encima del BCV, en %. */
  brecha: number | null;
  /** True si el caché tiene más de CACHE_MINUTOS. */
  vencido: boolean;
}

// ── Lectura ─────────────────────────────────────────────────────────────────

async function leerCache(): Promise<Tasas> {
  const rs = await rows<{
    fuente: string;
    valor: string;
    fuente_at: Date | null;
    obtenido_at: Date;
  }>(`SELECT fuente, valor, fuente_at, obtenido_at FROM tasas`);

  const por = new Map(rs.map((r) => [r.fuente, r]));
  // numeric llega como string desde pg: si no se convierte, las comparaciones
  // numéricas fallan en silencio (el mismo tropiezo que en lib/queries.ts).
  const num = (k: string) => {
    const v = por.get(k)?.valor;
    return v === undefined ? null : Number(v);
  };

  return {
    bcvUsd: num('bcv_usd'),
    bcvEur: num('bcv_eur'),
    binance: num('binance'),
    binancePm: num('binance_pm'),
    paralelo: num('paralelo'),
    obtenidoAt: rs.length
      ? new Date(Math.max(...rs.map((r) => r.obtenido_at.getTime())))
      : null,
    bcvAt: por.get('bcv_usd')?.fuente_at ?? null,
  };
}

function derivar(t: Tasas): TasasDerivadas {
  // Promedio de las dos variantes de Binance, igual que el frontend de Siberia.
  // Si solo hay una, se usa esa: media tasa es mejor que ninguna.
  const lados = [t.binance, t.binancePm].filter(
    (v): v is number => v !== null && v > 0,
  );
  const mercado = lados.length
    ? lados.reduce((s, v) => s + v, 0) / lados.length
    : null;

  const brecha =
    mercado && t.bcvUsd ? (mercado / t.bcvUsd - 1) * 100 : null;

  const vencido =
    !t.obtenidoAt ||
    Date.now() - t.obtenidoAt.getTime() > CACHE_MINUTOS * 60_000;

  return { ...t, mercado, brecha, vencido };
}

// ── Consulta a las fuentes ──────────────────────────────────────────────────

async function guardar(
  fuente: string,
  valor: number,
  fuenteAt: Date | null,
): Promise<void> {
  if (!Number.isFinite(valor) || valor <= 0) return;
  await query(
    `INSERT INTO tasas (fuente, valor, fuente_at, obtenido_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (fuente) DO UPDATE
       SET valor = $2, fuente_at = $3, obtenido_at = now()`,
    [fuente, valor, fuenteAt],
  );
}

type FilaDolarApi = {
  fuente: string;
  promedio: number | null;
  fechaActualizacion: string | null;
};

async function traerDolarApi(url: string, prefijo: string): Promise<void> {
  const resp = await fetch(url, {
    // Sin caché de Next: acá el caché lo maneja la tabla `tasas`, y dos capas
    // de caché encima de la otra solo confunden de qué hora es el dato.
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  if (!resp.ok) throw new Error(`${url} devolvió ${resp.status}`);
  const datos = (await resp.json()) as FilaDolarApi[];

  for (const fila of datos) {
    if (fila.promedio === null) continue;
    const fecha = fila.fechaActualizacion
      ? new Date(fila.fechaActualizacion)
      : null;
    if (fila.fuente === 'oficial') {
      await guardar(prefijo, fila.promedio, fecha);
    } else if (fila.fuente === 'paralelo' && prefijo === 'bcv_usd') {
      await guardar('paralelo', fila.promedio, fecha);
    }
  }
}

/**
 * Mediana de las ofertas de un lado del libro P2P.
 *
 * Copiado de fetch_binance_mid() de Siberia. La mediana descarta los anuncios
 * de precio absurdo que siempre hay en P2P; el punto medio entre compra y venta
 * da la tasa a la que realmente se cruza el mercado.
 */
async function medianaBinance(
  tradeType: 'BUY' | 'SELL',
  payTypes: string[],
): Promise<number | null> {
  const resp = await fetch(BINANCE_P2P, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      asset: 'USDT',
      fiat: 'VES',
      tradeType,
      page: 1,
      rows: OFERTAS,
      payTypes,
      publisherType: null,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  if (!resp.ok) throw new Error(`binance devolvió ${resp.status}`);

  const raw = (await resp.json()) as {
    data?: { adv?: { price?: string } }[];
  };
  const precios = (raw.data ?? [])
    .map((ad) => Number(ad.adv?.price))
    .filter((p) => Number.isFinite(p) && p > 0)
    .sort((a, b) => a - b);

  return precios.length ? precios[Math.floor(precios.length / 2)] : null;
}

async function traerBinance(clave: string, payTypes: string[]): Promise<void> {
  const [compra, venta] = await Promise.all([
    medianaBinance('BUY', payTypes),
    medianaBinance('SELL', payTypes),
  ]);
  const lados = [compra, venta].filter(
    (v): v is number => v !== null && v > 0,
  );
  if (!lados.length) throw new Error(`binance ${clave} sin ofertas`);
  await guardar(clave, lados.reduce((s, v) => s + v, 0) / lados.length, new Date());
}

/**
 * Refresca todas las fuentes. Cada una por separado y sin cortar a las demás:
 * si Binance falla, el BCV igual se actualiza. Una tasa vieja es aceptable;
 * quedarse sin ninguna porque una API se cayó, no.
 */
export async function refrescarTasas(): Promise<string[]> {
  const fallos: string[] = [];
  const tareas: [string, Promise<void>][] = [
    ['BCV USD', traerDolarApi(DOLARAPI, 'bcv_usd')],
    ['BCV EUR', traerDolarApi(EUROAPI, 'bcv_eur')],
    ['Binance', traerBinance('binance', [])],
    ['Binance Pago Móvil', traerBinance('binance_pm', ['PagoMovil'])],
  ];

  for (const [nombre, tarea] of await Promise.allSettled(
    tareas.map(([, t]) => t),
  ).then((rs) => rs.map((r, i) => [tareas[i][0], r] as const))) {
    if (tarea.status === 'rejected') {
      fallos.push(nombre);
      console.error(`[tasas] ${nombre} falló:`, tarea.reason?.message ?? tarea.reason);
    }
  }
  return fallos;
}

/**
 * Tasas listas para usar. Refresca si el caché venció.
 *
 * Si el refresco falla del todo se devuelve lo guardado marcado como vencido:
 * mostrar una tasa vieja CON su hora es honesto y útil; mostrar un guion no
 * ayuda a nadie a cobrarle a un cliente.
 */
export async function getTasas(): Promise<TasasDerivadas> {
  let cache = derivar(await leerCache());
  if (!cache.vencido) return cache;

  try {
    await refrescarTasas();
    cache = derivar(await leerCache());
  } catch (err) {
    console.error('[tasas] refresco falló por completo:', err);
  }
  return cache;
}

// ── Conversión ──────────────────────────────────────────────────────────────

export type Moneda = 'VES' | 'USD' | 'USDT' | 'EUR';

export const MONEDAS: { key: Moneda; corto: string; desc: string }[] = [
  { key: 'VES', corto: 'Bs', desc: 'bolívares' },
  { key: 'USD', corto: 'USD BCV', desc: 'dólar oficial del BCV' },
  { key: 'USDT', corto: 'USDT', desc: 'dólar USDT (Binance P2P)' },
  { key: 'EUR', corto: 'EUR BCV', desc: 'euro oficial del BCV' },
];

/**
 * Bolívares por una unidad de cada moneda. Es el modelo "pivote en VES" de
 * Siberia: toda conversión es monto × tasa(entrada) / tasa(salida), así la
 * brecha aparece sola en cualquier ruta sin tratarla como caso especial.
 */
export function tasaDe(m: Moneda, t: TasasDerivadas): number | null {
  switch (m) {
    case 'VES':
      return 1;
    case 'USD':
      return t.bcvUsd;
    case 'USDT':
      return t.mercado;
    case 'EUR':
      return t.bcvEur;
  }
}

export function convertir(
  monto: number,
  de: Moneda,
  a: Moneda,
  t: TasasDerivadas,
): number | null {
  const rDe = tasaDe(de, t);
  const rA = tasaDe(a, t);
  if (!rDe || !rA) return null;
  return (monto * rDe) / rA;
}
