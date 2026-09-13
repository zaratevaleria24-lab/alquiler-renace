'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Calendario de disponibilidad de la página de propiedad.
//
// DE DÓNDE SALEN LOS DATOS: de /api/disponibilidad/<slug>, que junta lo
// registrado en el panel con lo sincronizado de Airbnb. La página es estática;
// esto se pide en el navegador para que la disponibilidad esté siempre al día
// sin regenerar nada (ver el comentario de la ruta).
//
// SI LA API NO RESPONDE, EL CALENDARIO NO APARECE y el panel de reserva sigue
// funcionando como siempre (selector de noches). La disponibilidad es una
// mejora, no una dependencia: nada de este archivo puede romper la reserva.
//
// La selección es la de todos los calendarios de viaje: primer toque marca la
// llegada, segundo la salida. La noche de la salida no se ocupa (convención
// hotelera), así que un día que ya está tomado SÍ puede ser día de salida.

export interface FechasElegidas {
  checkIn: string;
  checkOut: string;
  noches: number;
}

interface Rango {
  desde: string;
  hasta: string;
}

const DIAS_SEMANA = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function sumarDias(fecha: string, n: number): string {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function otroMes(mes: string, n: number): string {
  const [y, m] = mes.split('-').map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

export default function CalendarioDisponibilidad({
  slug,
  onCambio,
  meses = 1,
  inicial,
  siempre = false,
  minNoches = 1,
  variante = 'panel',
}: {
  slug: string;
  /** Se llama con las fechas elegidas, o null al limpiar la selección. */
  onCambio: (fechas: FechasElegidas | null) => void;
  /** 2 = dos meses lado a lado en pantallas medianas (estilo Airbnb); en teléfono siempre uno. */
  meses?: 1 | 2;
  /** Fechas ya elegidas al abrir (p. ej. las del modal de reserva). */
  inicial?: { checkIn: string; checkOut: string } | null;
  /** Mostrar el calendario aunque la API no responda (sin días ocupados). */
  siempre?: boolean;
  /** Mínimo de noches entre llegada y salida. */
  minNoches?: number;
  /** 'amplio' quita el borde superior y agranda las celdas para el modal. */
  variante?: 'panel' | 'amplio';
}) {
  const [datos, setDatos] = useState<{ hoy: string; ocupado: Rango[] } | null>(null);
  const [mesVista, setMesVista] = useState('');
  const [llegada, setLlegada] = useState<string | null>(inicial?.checkIn ?? null);
  const [salida, setSalida] = useState<string | null>(inicial?.checkOut ?? null);

  useEffect(() => {
    let vivo = true;
    fetch(`/api/disponibilidad/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { hoy: string; ocupado: Rango[] } | null) => {
        if (vivo && d?.hoy) {
          setDatos(d);
          setMesVista((inicial?.checkIn ?? d.hoy).slice(0, 7));
        } else if (vivo && siempre) {
          const hoy = new Date().toISOString().slice(0, 10);
          setDatos({ hoy, ocupado: [] });
          setMesVista((inicial?.checkIn ?? hoy).slice(0, 7));
        }
      })
      .catch(() => {
        // Sin datos no hay calendario; la reserva por selector sigue intacta.
        // Salvo que el padre pida verlo «siempre»: entonces se dibuja sin
        // días ocupados, con la fecha local como hoy.
        if (vivo && siempre) {
          const hoy = new Date().toISOString().slice(0, 10);
          setDatos({ hoy, ocupado: [] });
          setMesVista((inicial?.checkIn ?? hoy).slice(0, 7));
        }
      });
    return () => {
      vivo = false;
    };
  }, [slug]);

  const ocupadoEl = useMemo(() => {
    const rangos = datos?.ocupado ?? [];
    return (d: string) => rangos.some((r) => r.desde <= d && d < r.hasta);
  }, [datos]);

  if (!datos || !mesVista) return null;
  const { hoy } = datos;

  const elegir = (d: string) => {
    // Primer toque, o toque estando ya completa la selección: nueva llegada.
    if (!llegada || (llegada && salida)) {
      setLlegada(d);
      setSalida(null);
      onCambio(null);
      return;
    }
    // Toque antes de la llegada (o sin cumplir el mínimo de noches): se
    // corrige la llegada, no es una salida.
    if (d < sumarDias(llegada, minNoches)) {
      setLlegada(d);
      return;
    }
    // Salida: válida solo si TODAS las noches del medio están libres.
    for (let n = llegada; n < d; n = sumarDias(n, 1)) {
      if (ocupadoEl(n)) {
        setLlegada(d);
        setSalida(null);
        onCambio(null);
        return;
      }
    }
    setSalida(d);
    const noches = Math.round(
      (Date.parse(d) - Date.parse(llegada)) / 86_400_000,
    );
    onCambio({ checkIn: llegada, checkOut: d, noches });
  };

  const mesDeHoy = hoy.slice(0, 7);
  const amplio = variante === 'amplio';
  const celda = amplio ? 'h-10 w-10 md:h-11 md:w-11' : 'h-9 w-9';
  const mesesVista = meses === 2 ? [mesVista, otroMes(mesVista, 1)] : [mesVista];

  const cuadricula = (mes: string, segundo: boolean) => {
    const [y, m] = mes.split('-').map(Number);
    const totalDias = new Date(y, m, 0).getDate();
    const primerDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    return (
      <div key={mes} className={segundo ? 'hidden md:block' : ''}>
        {meses === 2 && (
          <p className="mb-2 text-center text-meta font-semibold capitalize text-ink">
            {MESES[m - 1]} {y}
          </p>
        )}
        <div className="grid grid-cols-7 text-center">
          {DIAS_SEMANA.map((d, i) => (
            <span key={i} className="pb-1.5 text-[11px] font-medium uppercase text-ink-faint">
              {d}
            </span>
          ))}
          {Array.from({ length: primerDow }, (_, i) => (
            <span key={`v${i}`} />
          ))}
          {Array.from({ length: totalDias }, (_, i) => {
            const d = `${mes}-${String(i + 1).padStart(2, '0')}`;
            const pasado = d < hoy;
            const ocupado = ocupadoEl(d);
            // Un día ocupado sigue sirviendo como día de SALIDA (la noche de la
            // salida no se duerme), por eso solo se apagan los días pasados y
            // los ocupados cuando todavía no se eligió llegada.
            const puedeSerSalida = llegada !== null && !salida && d > llegada;
            const deshabilitado = pasado || (ocupado && !puedeSerSalida);
            const esLlegada = d === llegada;
            const esSalida = d === salida;
            const dentro =
              llegada !== null && salida !== null && d > llegada && d < salida;

            return (
              <button
                key={d}
                type="button"
                onClick={() => elegir(d)}
                disabled={deshabilitado}
                aria-label={`${i + 1} de ${MESES[m - 1]}${ocupado ? ', ocupado' : ''}`}
                aria-pressed={esLlegada || esSalida}
                className={`mx-auto flex ${celda} items-center justify-center rounded-full text-meta tabular-nums transition-colors ${
                  esLlegada || esSalida
                    ? 'bg-brand font-semibold text-white'
                    : dentro
                      ? 'bg-brand-tint text-brand-deep'
                      : pasado
                        ? 'text-ink-faint/60'
                        : ocupado
                          ? 'text-ink-faint line-through decoration-ink-faint/70'
                          : 'font-medium text-ink hover:bg-brand-tint'
                } ${d === hoy && !esLlegada && !esSalida ? 'ring-1 ring-inset ring-brand/40' : ''} disabled:cursor-not-allowed`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const [y, m] = mesVista.split('-').map(Number);

  return (
    <div className={amplio ? '' : 'mt-5 border-t border-line pt-5'}>
      <div className="flex items-center justify-between">
        {amplio ? (
          <div>
            <p className="font-serif text-title-sm font-semibold text-brand">
              {llegada && salida
                ? `${Math.round((Date.parse(salida) - Date.parse(llegada)) / 86_400_000)} noches`
                : 'Elige tus fechas'}
            </p>
            <p className="text-ui text-ink-muted">
              {llegada && salida
                ? `Del ${Number(llegada.slice(8))} de ${MESES[Number(llegada.slice(5, 7)) - 1]} al ${Number(salida.slice(8))} de ${MESES[Number(salida.slice(5, 7)) - 1]}`
                : `Mínimo ${minNoches} ${minNoches === 1 ? 'noche' : 'noches'} · los días tachados ya están tomados`}
            </p>
          </div>
        ) : (
          <p className="text-micro uppercase font-semibold text-ink-subtle">
            Disponibilidad
          </p>
        )}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMesVista(otroMes(mesVista, -1))}
            disabled={mesVista <= mesDeHoy}
            aria-label="Mes anterior"
            className="flex h-8 w-8 items-center justify-center rounded-control text-ink-subtle transition-colors hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {meses === 1 && (
            <span className="min-w-28 text-center text-meta font-semibold capitalize text-ink">
              {MESES[m - 1]} {y}
            </span>
          )}
          <button
            type="button"
            onClick={() => setMesVista(otroMes(mesVista, 1))}
            disabled={mesVista >= otroMes(mesDeHoy, 12)}
            aria-label="Mes siguiente"
            className="flex h-8 w-8 items-center justify-center rounded-control text-ink-subtle transition-colors hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className={`mt-3 ${meses === 2 ? 'grid gap-6 md:grid-cols-2 md:gap-10' : ''}`}>
        {mesesVista.map((mes, i) => cuadricula(mes, i === 1))}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3">
        <p className="text-[12px] leading-relaxed text-ink-subtle">
          {amplio ? '' : 'Los días tachados ya están tomados.'}
          {llegada && !salida && ' Ahora toca el día de salida.'}
        </p>
        {amplio && llegada && (
          <button
            type="button"
            onClick={() => {
              setLlegada(null);
              setSalida(null);
              onCambio(null);
            }}
            className="text-[12px] font-semibold text-brand-deep underline underline-offset-2 hover:text-brand"
          >
            Borrar fechas
          </button>
        )}
      </div>
    </div>
  );
}
