// Calendario de reservas y sincronización con Airbnb. SOLO SERVIDOR.
//
// LA SINCRONIZACIÓN ES A DEMANDA, igual que las tasas (lib/tasas.ts): se
// dispara al abrir el calendario del panel o al pedir disponibilidad pública,
// y solo si el feed lleva más de SYNC_MINUTOS sin refrescarse. Sin demonio ni
// cron: este servidor de 3.7GB ya carga tres productos, y a un calendario de
// alquileres no le cambia nada un desfase de una hora — el propio Airbnb
// refresca los calendarios conectados cada varias horas.
//
// FECHAS COMO TEXTO 'YYYY-MM-DD' DE PUNTA A PUNTA. node-postgres convierte las
// columnas `date` a Date de JavaScript en la zona horaria DEL SERVIDOR, que no
// es la de Venezuela: por ese camino un check-in del 15 amanece 14 a las
// primeras de cambio. Se selecciona con to_char() y no se sale nunca del
// formato texto, que además compara bien con < y > por ser ISO.

import { query, rows, withTransaction } from './db';
import { parseIcs } from './ical';

/** Minutos antes de considerar vencido lo importado de un feed. */
const SYNC_MINUTOS = 60;

/** 'YYYY-MM-DD' de hoy en Venezuela, que no es la zona horaria del servidor. */
export function hoyCaracas(): string {
  // en-CA formatea como ISO YYYY-MM-DD; es el idioma-truco estándar para esto.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Caracas',
  }).format(new Date());
}

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface Reserva {
  id: string;
  propertyId: string;
  origen: 'manual' | 'ical';
  tipo: 'reserva' | 'bloqueo';
  estado: 'confirmada' | 'tentativa';
  huesped: string;
  telefono: string;
  notas: string;
  /** Monto pactado. Null = se estima con noches × tarifa. */
  totalUsd: number | null;
  checkIn: string;
  /** Exclusivo: la noche del check-out ya está libre. */
  checkOut: string;
  noches: number;
  feedNombre: string | null;
  icalSummary: string;
}

export interface Feed {
  id: string;
  propertyId: string;
  nombre: string;
  url: string;
  activo: boolean;
  syncAt: Date | null;
  syncOk: boolean | null;
  syncError: string;
  syncEventos: number;
}

const RESERVA_SELECT = `
  SELECT r.id, r.property_id, r.origen, r.tipo, r.estado,
         r.huesped, r.telefono, r.notas, r.total_usd,
         to_char(r.check_in,  'YYYY-MM-DD') AS check_in,
         to_char(r.check_out, 'YYYY-MM-DD') AS check_out,
         (r.check_out - r.check_in) AS noches,
         f.nombre AS feed_nombre, r.ical_summary
  FROM reservas r
  LEFT JOIN ical_feeds f ON f.id = r.feed_id
`;

type ReservaRow = {
  id: string; property_id: string; origen: 'manual' | 'ical';
  tipo: 'reserva' | 'bloqueo'; estado: 'confirmada' | 'tentativa';
  huesped: string; telefono: string; notas: string; total_usd: string | null;
  check_in: string; check_out: string; noches: number;
  feed_nombre: string | null; ical_summary: string;
};

function toReserva(r: ReservaRow): Reserva {
  return {
    id: r.id,
    propertyId: r.property_id,
    origen: r.origen,
    tipo: r.tipo,
    estado: r.estado,
    huesped: r.huesped,
    telefono: r.telefono,
    notas: r.notas,
    // numeric llega como string desde pg, como en lib/queries.ts.
    totalUsd: r.total_usd === null ? null : Number(r.total_usd),
    checkIn: r.check_in,
    checkOut: r.check_out,
    noches: r.noches,
    feedNombre: r.feed_nombre,
    icalSummary: r.ical_summary,
  };
}

// ── Sincronización ───────────────────────────────────────────────────────────

async function importarFeed(feed: { id: string; property_id: string; url: string }) {
  const resp = await fetch(feed.url, {
    // El caché es la propia tabla reservas; una capa de caché de Next encima
    // solo confundiría de qué hora es el dato (mismo criterio que lib/tasas.ts).
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
    headers: { 'User-Agent': 'MargaritaRenace-Calendario/1.0' },
  });
  if (!resp.ok) throw new Error(`el feed devolvió ${resp.status}`);
  const eventos = parseIcs(await resp.text());

  await withTransaction(async (q) => {
    for (const e of eventos) {
      // Airbnb marca sus cierres como 'Airbnb (Not available)': eso es un
      // bloqueo, no un huésped. Todo lo demás ('Reserved') es reserva.
      const tipo = /not available/i.test(e.summary) ? 'bloqueo' : 'reserva';
      await q(
        `INSERT INTO reservas
           (property_id, origen, tipo, estado, check_in, check_out,
            feed_id, ical_uid, ical_summary)
         VALUES ($1, 'ical', $2, 'confirmada', $3, $4, $5, $6, $7)
         ON CONFLICT (feed_id, ical_uid) WHERE ical_uid IS NOT NULL
         DO UPDATE SET check_in = $3, check_out = $4, tipo = $2,
                       ical_summary = $7, updated_at = now()`,
        [feed.property_id, tipo, e.inicio, e.fin, feed.id, e.uid, e.summary],
      );
    }

    // Lo que ya no viene en el feed se canceló en Airbnb… si es futuro. Las
    // estadías pasadas desaparecen del feed por viejas, no por canceladas, y
    // son la historia con la que se calcula "cómo nos fue": no se tocan.
    await q(
      `DELETE FROM reservas
       WHERE feed_id = $1
         AND check_out >= $2
         AND NOT (ical_uid = ANY($3::text[]))`,
      [feed.id, hoyCaracas(), eventos.map((e) => e.uid)],
    );

    await q(
      `UPDATE ical_feeds
       SET sync_at = now(), sync_ok = true, sync_error = '', sync_eventos = $2
       WHERE id = $1`,
      [feed.id, eventos.length],
    );
  });
}

/**
 * Refresca los feeds activos. Con `soloVencidos` (el modo normal) solo toca
 * los que llevan más de SYNC_MINUTOS sin refrescar; el botón del panel pasa
 * false y fuerza todos.
 *
 * El UPDATE con RETURNING reclama el feed ANTES de salir a internet: dos
 * peticiones simultáneas no sincronizan el mismo feed dos veces, y un feed
 * roto no se martilla en cada carga de página — hasta dentro de una hora no
 * se vuelve a intentar. Si falla, el error queda escrito para que el panel
 * lo muestre.
 */
export async function sincronizarFeeds(soloVencidos = true): Promise<void> {
  const reclamados = await rows<{ id: string; property_id: string; url: string }>(
    `UPDATE ical_feeds
     SET sync_at = now()
     WHERE activo
       AND ($1 = false OR sync_at IS NULL OR sync_at < now() - make_interval(mins => $2))
     RETURNING id, property_id, url`,
    [soloVencidos, SYNC_MINUTOS],
  );

  await Promise.allSettled(
    reclamados.map(async (feed) => {
      try {
        await importarFeed(feed);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[calendario] feed ${feed.url} falló:`, msg);
        await query(
          `UPDATE ical_feeds SET sync_ok = false, sync_error = $2 WHERE id = $1`,
          [feed.id, msg.slice(0, 300)],
        );
      }
    }),
  );
}

// ── Lecturas del panel ───────────────────────────────────────────────────────

/** Reservas que tocan el rango [desde, hasta). Ambos 'YYYY-MM-DD'. */
export async function getReservasRango(
  desde: string,
  hasta: string,
): Promise<Reserva[]> {
  const rs = await rows<ReservaRow>(
    `${RESERVA_SELECT}
     WHERE r.check_in < $2 AND r.check_out > $1
     ORDER BY r.check_in`,
    [desde, hasta],
  );
  return rs.map(toReserva);
}

export async function getReserva(id: string): Promise<Reserva | undefined> {
  const rs = await rows<ReservaRow>(`${RESERVA_SELECT} WHERE r.id = $1`, [id]);
  return rs[0] ? toReserva(rs[0]) : undefined;
}

export async function getFeeds(): Promise<Feed[]> {
  const rs = await rows<{
    id: string; property_id: string; nombre: string; url: string;
    activo: boolean; sync_at: Date | null; sync_ok: boolean | null;
    sync_error: string; sync_eventos: number;
  }>(`SELECT id, property_id, nombre, url, activo, sync_at, sync_ok,
             sync_error, sync_eventos
      FROM ical_feeds ORDER BY created_at`);
  return rs.map((r) => ({
    id: r.id,
    propertyId: r.property_id,
    nombre: r.nombre,
    url: r.url,
    activo: r.activo,
    syncAt: r.sync_at,
    syncOk: r.sync_ok,
    syncError: r.sync_error,
    syncEventos: r.sync_eventos,
  }));
}

/**
 * Resumen del mes para las cifras de arriba del calendario.
 *
 * La ocupación se cuenta por NOCHES DENTRO DEL MES (la intersección de cada
 * estadía con el mes), no por reservas: una estadía de quincena vale quince
 * noches, no una. El ingreso estimado usa el monto pactado prorrateado a las
 * noches del mes, o noches × tarifa si no se pactó monto.
 */
export async function getResumenMes(
  desde: string,
  hasta: string,
  propertyIds: string[],
): Promise<{
  nochesOcupadas: number;
  nochesDisponibles: number;
  ingresoUsd: number;
  llegadas: number;
}> {
  if (propertyIds.length === 0) {
    return { nochesOcupadas: 0, nochesDisponibles: 0, ingresoUsd: 0, llegadas: 0 };
  }
  const [r] = await rows<{
    noches: string | null;
    ingreso: string | null;
    llegadas: string;
    dias_mes: string;
  }>(
    `WITH tramos AS (
       SELECT r.id, r.check_in, r.check_out, r.total_usd, p.price_per_night,
              (LEAST(r.check_out, $2::date) - GREATEST(r.check_in, $1::date)) AS noches_mes,
              (r.check_out - r.check_in) AS noches_total,
              r.tipo
       FROM reservas r
       JOIN properties p ON p.id = r.property_id
       WHERE r.property_id = ANY($3::uuid[])
         AND r.check_in < $2 AND r.check_out > $1
     )
     SELECT
       sum(noches_mes) AS noches,
       sum(CASE WHEN tipo = 'reserva' THEN
         CASE WHEN total_usd IS NOT NULL
              THEN total_usd * noches_mes / noches_total
              ELSE price_per_night * noches_mes END
       END) AS ingreso,
       count(*) FILTER (WHERE tipo = 'reserva' AND check_in >= $1 AND check_in < $2) AS llegadas,
       ($2::date - $1::date) AS dias_mes
     FROM tramos`,
    [desde, hasta, propertyIds],
  );

  const diasMes = Number(r?.dias_mes ?? 30);
  return {
    nochesOcupadas: Number(r?.noches ?? 0),
    nochesDisponibles: diasMes * propertyIds.length,
    ingresoUsd: Math.round(Number(r?.ingreso ?? 0)),
    llegadas: Number(r?.llegadas ?? 0),
  };
}

// ── Disponibilidad pública ───────────────────────────────────────────────────

/**
 * Rangos ocupados de una propiedad, de hoy en adelante, FUSIONADOS.
 *
 * Fusionados por dos razones: el widget no necesita saber que son tres
 * reservas y no una, y no se le cuenta a internet cuántas reservas hay ni de
 * qué origen — solo qué noches no están libres. Tentativas y bloqueos también
 * cuentan: mostrar libre lo apalabrado invita al doble alquiler.
 */
export async function getOcupadoPublico(
  slug: string,
): Promise<{ desde: string; hasta: string }[] | null> {
  const [prop] = await rows<{ id: string }>(
    `SELECT id FROM properties WHERE slug = $1 AND is_published`,
    [slug],
  );
  if (!prop) return null;

  const rs = await rows<{ check_in: string; check_out: string }>(
    `SELECT to_char(check_in, 'YYYY-MM-DD') AS check_in,
            to_char(check_out, 'YYYY-MM-DD') AS check_out
     FROM reservas
     WHERE property_id = $1 AND check_out > $2
     ORDER BY check_in`,
    [prop.id, hoyCaracas()],
  );

  const fusionados: { desde: string; hasta: string }[] = [];
  for (const r of rs) {
    const ultimo = fusionados.at(-1);
    if (ultimo && r.check_in <= ultimo.hasta) {
      if (r.check_out > ultimo.hasta) ultimo.hasta = r.check_out;
    } else {
      fusionados.push({ desde: r.check_in, hasta: r.check_out });
    }
  }
  return fusionados;
}

/** Reservas manuales a exportar hacia Airbnb, por token de propiedad. */
export async function getExportacionIcal(token: string): Promise<
  | { nombre: string; eventos: { uid: string; summary: string; inicio: string; fin: string }[] }
  | null
> {
  const [prop] = await rows<{ id: string; name: string }>(
    `SELECT id, name FROM properties WHERE ical_token = $1`,
    [token],
  );
  if (!prop) return null;

  // Solo lo MANUAL: devolverle a Airbnb sus propias reservas crearía un eco
  // (nos las volvería a importar como ajenas). Se exporta también el pasado
  // reciente por si su importador revisa continuidad, pero no todo el
  // histórico: el .ics crecería para siempre.
  const rs = await rows<{ id: string; tipo: string; check_in: string; check_out: string }>(
    `SELECT id, tipo,
            to_char(check_in, 'YYYY-MM-DD') AS check_in,
            to_char(check_out, 'YYYY-MM-DD') AS check_out
     FROM reservas
     WHERE property_id = $1 AND origen = 'manual'
       AND check_out >= ($2::date - 30)
     ORDER BY check_in`,
    [prop.id, hoyCaracas()],
  );

  return {
    nombre: `Margarita Renace — ${prop.name}`,
    eventos: rs.map((r) => ({
      uid: `reserva-${r.id}@margaritarenace.com.ve`,
      // Sin nombre ni teléfono del huésped: a un tercero solo se le dice que
      // esas noches están tomadas.
      summary: r.tipo === 'bloqueo' ? 'No disponible (Margarita Renace)' : 'Reservado (Margarita Renace)',
      inicio: r.check_in,
      fin: r.check_out,
    })),
  };
}
