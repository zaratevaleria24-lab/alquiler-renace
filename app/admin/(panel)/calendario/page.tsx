import Link from 'next/link';
import { ChevronLeft, ChevronRight, RefreshCw, Trash2 } from 'lucide-react';
import { rows } from '@/lib/db';
import {
  getFeeds,
  getReservasRango,
  getResumenMes,
  hoyCaracas,
  sincronizarFeeds,
} from '@/lib/calendario';
import { absoluteUrl } from '@/lib/site';
import { getEventosAirbnb } from '@/lib/airbnb-correo';
import { Aviso, Cifra, Insignia, Seccion, Tarjeta } from '../_ui';
import { agregarFeedAction, eliminarFeedAction, sincronizarAction } from './actions';
import Multicalendario from './Multicalendario';

// El calendario del negocio: todas las propiedades, todas las noches, todos
// los orígenes (panel + Airbnb) en una sola pantalla.
//
// AL ABRIR SE SINCRONIZA lo que esté vencido (más de una hora sin refrescar),
// igual que las tasas: sin demonio, el dato se refresca cuando alguien lo va a
// mirar. El botón «Sincronizar ahora» existe para el caso "acabo de confirmar
// algo en Airbnb y lo quiero ver ya".
//
// SOLO PROPIEDADES REALES: las once de relleno no alquilan y once filas vacías
// enterrarían la fila que importa. Si algún día no hay ninguna marcada real,
// se muestran las publicadas para que la pantalla no amanezca vacía.

export const dynamic = 'force-dynamic';

const MENSAJES_ERROR: Record<string, string> = {
  fechas: 'Revisa las fechas: la salida tiene que ser después de la llegada.',
  monto: 'El total en dólares no es un número válido.',
  choca:
    'Esas noches chocan con una reserva o un cierre que ya existe. Mueve las fechas o revisa el calendario.',
  'no-editable': 'Esa estadía la maneja Airbnb: se cambia allá y acá se refleja sola.',
  'no-guardado': 'No se pudo guardar. Intenta de nuevo.',
  'feed-url': 'La URL del calendario tiene que empezar con https://.',
};

function mesValido(v: string | undefined, hoy: string): string {
  if (v && /^\d{4}-(0[1-9]|1[0-2])$/.test(v)) return v;
  return hoy.slice(0, 7);
}

/** 'YYYY-MM' desplazado n meses. */
function otroMes(mes: string, n: number): string {
  const [y, m] = mes.split('-').map(Number);
  const total = y * 12 + (m - 1) + n;
  const y2 = Math.floor(total / 12);
  const m2 = (total % 12) + 1;
  return `${y2}-${String(m2).padStart(2, '0')}`;
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{
    mes?: string;
    guardado?: string;
    sincronizado?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const hoy = hoyCaracas();
  const mes = mesValido(params.mes, hoy);

  // Refresco perezoso ANTES de leer: lo que se muestre ya viene sincronizado.
  // Si Airbnb no responde se sigue con lo guardado — viejo es mejor que roto.
  try {
    await sincronizarFeeds();
  } catch (err) {
    console.error('[calendario] sync al cargar falló:', err);
  }

  const [y, m] = mes.split('-').map(Number);
  const diasDelMes = new Date(y, m, 0).getDate();
  const dias = Array.from(
    { length: diasDelMes },
    (_, i) => `${mes}-${String(i + 1).padStart(2, '0')}`,
  );
  const desde = dias[0];
  const hasta = `${otroMes(mes, 1)}-01`;

  const todas = await rows<{
    id: string;
    name: string;
    price_per_night: number;
    price_on_request: boolean;
    is_real: boolean;
    is_published: boolean;
    ical_token: string;
  }>(
    `SELECT id, name, price_per_night, price_on_request, is_real, is_published,
            ical_token
     FROM properties ORDER BY sort_order, name`,
  );
  const eventosCorreo = await getEventosAirbnb(15);
  const reales = todas.filter((p) => p.is_real);
  const visibles = reales.length ? reales : todas.filter((p) => p.is_published);
  const idsVisibles = visibles.map((p) => p.id);

  const [reservasTodas, resumen, feedsTodos] = await Promise.all([
    getReservasRango(desde, hasta),
    getResumenMes(desde, hasta, idsVisibles),
    getFeeds(),
  ]);
  const reservas = reservasTodas.filter((r) => idsVisibles.includes(r.propertyId));
  const feeds = feedsTodos.filter((f) => idsVisibles.includes(f.propertyId));

  const ocupacion = resumen.nochesDisponibles
    ? Math.round((resumen.nochesOcupadas / resumen.nochesDisponibles) * 100)
    : 0;

  // A mano y no con toLocaleDateString + capitalize de CSS: eso producía
  // «Agosto De 2026», con el «De» en mayúscula.
  const soloMes = new Date(y, m - 1, 1).toLocaleDateString('es-VE', { month: 'long' });
  const nombreMes = `${soloMes.charAt(0).toUpperCase()}${soloMes.slice(1)} ${y}`;

  return (
    <div>
      <header>
        <p className="text-meta font-semibold text-ink-subtle">Panel</p>
        <h1 className="mt-2 font-serif text-headline font-normal track-headline text-ink">
          Calendario <em className="headline-italic">y reservas</em>
        </h1>
      </header>

      {params.error && MENSAJES_ERROR[params.error] && (
        <Aviso tono="error">{MENSAJES_ERROR[params.error]}</Aviso>
      )}
      {params.guardado && <Aviso tono="ok">Guardado.</Aviso>}
      {params.sincronizado && (
        <Aviso tono="ok">
          Calendarios sincronizados con {feeds.length ? 'Airbnb' : 'las fuentes conectadas'}.
        </Aviso>
      )}

      {/* ── Cómo va el mes ──────────────────────────────────────────────── */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra
          valor={`${ocupacion}%`}
          etiqueta="Ocupación del mes"
          nota={`${resumen.nochesOcupadas} de ${resumen.nochesDisponibles} noches`}
        />
        <Cifra valor={resumen.nochesOcupadas} etiqueta="Noches tomadas" />
        <Cifra
          valor={`US$${resumen.ingresoUsd.toLocaleString()}`}
          etiqueta="Ingreso estimado"
          nota="Lo pactado, o noches × tarifa"
        />
        <Cifra valor={resumen.llegadas} etiqueta="Llegadas este mes" />
      </div>

      {/* ── El multicalendario ──────────────────────────────────────────── */}
      <Seccion
        id="calendario"
        titulo="Todas las"
        cursiva="noches"
        descripcion="Pulsa un día libre para reservarlo o cerrarlo; pulsa una barra para ver su detalle. Las barras empiezan y terminan a mitad de celda: el día de una salida puede recibir una llegada."
        acciones={
          <div className="flex items-center gap-1.5">
            <Link
              href={`/admin/calendario?mes=${otroMes(mes, -1)}#calendario`}
              aria-label="Mes anterior"
              className="flex h-10 w-10 items-center justify-center rounded-control border border-line bg-white text-ink-subtle transition-colors hover:border-ink hover:text-ink"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <span className="min-w-36 text-center text-body font-semibold text-ink">
              {nombreMes}
            </span>
            <Link
              href={`/admin/calendario?mes=${otroMes(mes, 1)}#calendario`}
              aria-label="Mes siguiente"
              className="flex h-10 w-10 items-center justify-center rounded-control border border-line bg-white text-ink-subtle transition-colors hover:border-ink hover:text-ink"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        }
      >
        <Tarjeta className="p-4 md:p-5">
          {visibles.length === 0 ? (
            <p className="py-8 text-center text-body text-ink-muted">
              No hay propiedades publicadas todavía: el calendario aparece al
              publicar la primera.
            </p>
          ) : (
            <Multicalendario
              mes={mes}
              dias={dias}
              hoy={hoy}
              propiedades={visibles.map((p) => ({
                id: p.id,
                name: p.name,
                pricePerNight: p.price_per_night,
                priceOnRequest: p.price_on_request,
              }))}
              reservas={reservas}
            />
          )}
        </Tarjeta>
        {reales.length === 0 && visibles.length > 0 && (
          <p className="mt-3 text-meta text-ink-muted">
            Se muestran todas las publicadas porque ninguna está marcada como
            inventario real. Al marcar las tuyas en Propiedades, el calendario
            se queda solo con esas.
          </p>
        )}
      </Seccion>

      {/* ── Sincronización con Airbnb ───────────────────────────────────── */}
      <Seccion
        id="sincronizacion"
        titulo="Sincronización con"
        cursiva="Airbnb"
        descripcion="Dos direcciones: lo reservado en Airbnb aparece acá, y lo que registres acá le cierra las fechas a Airbnb."
        acciones={
          <form action={sincronizarAction}>
            <input type="hidden" name="mes" value={mes} />
            <button
              type="submit"
              className="inline-flex min-h-[40px] items-center gap-2 rounded-chip border border-line bg-white px-4 text-meta font-semibold text-brand-deep transition-all hover:border-ink hover:shadow-hard-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Sincronizar ahora
            </button>
          </form>
        }
      >
        <div className="space-y-4">
          {visibles.map((prop) => {
            const suyos = feeds.filter((f) => f.propertyId === prop.id);
            const urlExport = absoluteUrl(`/api/ical/${prop.ical_token}`);
            return (
              <Tarjeta key={prop.id} className="p-5">
                <h3 className="text-body font-semibold text-ink">{prop.name}</h3>

                {/* Importar: el calendario de Airbnb hacia acá */}
                {suyos.length > 0 && (
                  <ul className="mt-4 space-y-2.5">
                    {suyos.map((f) => (
                      <li key={f.id} className="flex flex-wrap items-center gap-3">
                        <Insignia tono={f.syncOk === false ? 'aviso' : f.syncOk ? 'ok' : 'neutro'}>
                          {f.nombre}
                          {f.syncOk
                            ? ` · ${f.syncEventos} ${f.syncEventos === 1 ? 'evento' : 'eventos'}`
                            : f.syncOk === false
                              ? ' · falló'
                              : ' · sin sincronizar'}
                        </Insignia>
                        <span
                          className="min-w-0 flex-1 truncate font-mono text-ui text-ink-subtle"
                          title={f.url}
                        >
                          {f.url}
                        </span>
                        <form action={eliminarFeedAction}>
                          <input type="hidden" name="mes" value={mes} />
                          <input type="hidden" name="id" value={f.id} />
                          <button
                            type="submit"
                            title="Quitar esta conexión (borra también lo que importó)"
                            className="flex h-9 w-9 items-center justify-center rounded-control text-ink-subtle transition-colors hover:bg-coral/10 hover:text-coral"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Quitar la conexión {f.nombre}</span>
                          </button>
                        </form>
                        {f.syncOk === false && f.syncError && (
                          <p className="w-full text-ui text-coral">{f.syncError}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <form action={agregarFeedAction} className="mt-4 flex flex-wrap items-center gap-2.5">
                  <input type="hidden" name="mes" value={mes} />
                  <input type="hidden" name="property_id" value={prop.id} />
                  <select
                    name="nombre"
                    defaultValue="Airbnb"
                    aria-label="De qué plataforma es el calendario"
                    className="rounded-control border border-line bg-paper/40 px-3 py-2.5 text-meta text-ink focus:border-brand focus:bg-white focus:outline-none"
                  >
                    <option>Airbnb</option>
                    <option>Booking</option>
                    <option>Otro</option>
                  </select>
                  <input
                    type="url"
                    name="url"
                    required
                    placeholder="https://www.airbnb.com/calendar/ical/…ics"
                    className="min-w-0 flex-1 basis-64 rounded-control border border-line bg-paper/40 px-3.5 py-2.5 text-meta text-ink placeholder:text-ink-faint focus:border-brand focus:bg-white focus:outline-none"
                  />
                  <button type="submit" className="btn-solid">
                    Conectar
                  </button>
                </form>
                <p className="mt-2 text-meta text-ink-muted">
                  En Airbnb: Calendario → Disponibilidad → Conectar otro sitio
                  web → <strong>Exportar calendario</strong>: esa URL va acá.
                </p>

                {/* Exportar: nuestro calendario hacia Airbnb */}
                <div className="mt-4 border-t border-line pt-4">
                  <p className="text-meta font-semibold text-ink">
                    Y esta URL se pega en Airbnb («Importar calendario») para que
                    lo que registres acá le cierre las fechas allá:
                  </p>
                  <input
                    readOnly
                    value={urlExport}
                    className="mt-2 w-full select-all rounded-control border border-line bg-paper px-3.5 py-2.5 font-mono text-ui text-ink-soft focus:outline-none"
                  />
                </div>
              </Tarjeta>
            );
          })}
        </div>
        <p className="mt-4 text-meta text-ink-muted">
          Los feeds se refrescan solos cada 10 minutos (cron del servidor) y al
          instante cuando llega un correo de Airbnb. «Sincronizar ahora» fuerza
          todos en este momento.
        </p>
      </Seccion>

      {/* ── Correos de Airbnb ───────────────────────────────────────────── */}
      <Seccion
        id="correos"
        titulo="Correos de"
        cursiva="Airbnb"
        descripcion="Cada notificación que Airbnb manda (reserva, cancelación, evaluación, pago) llega acá por airbnb@margaritarenace.com.ve y dispara la sincronización. Ver AIRBNB-CORREO.md."
      >
        <Tarjeta className="p-5">
          {eventosCorreo.length === 0 ? (
            <p className="py-6 text-center text-body text-ink-muted">
              Todavía no ha llegado ningún correo. Cuando el reenvío desde Gmail
              esté activo, la confirmación de Google aparece aquí con su código.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {eventosCorreo.map((e) => (
                <li key={e.id} className="flex flex-wrap items-start gap-x-4 gap-y-1 py-3">
                  <span className="w-36 shrink-0 font-mono text-ui text-ink-subtle">
                    {new Intl.DateTimeFormat('es-VE', { timeZone: 'America/Caracas', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(e.recibido_at)}
                  </span>
                  <Insignia tono={e.error ? 'aviso' : e.tipo === 'confirmada' || e.tipo === 'cancelada' ? 'ok' : 'neutro'}>{e.tipo}</Insignia>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-meta font-semibold text-ink" title={e.asunto}>{e.asunto || '(sin asunto)'}</p>
                    <p className="text-ui text-ink-muted">
                      {e.property ? `${e.property} · ` : ''}{e.check_in && e.check_out ? `${e.check_in} → ${e.check_out} · ` : ''}{e.resultado}{e.error ? ` · ${e.error}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </Seccion>
    </div>
  );
}
