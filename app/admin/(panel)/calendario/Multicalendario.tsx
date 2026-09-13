'use client';

import { useMemo, useRef, useState } from 'react';
import { CalendarPlus, X } from 'lucide-react';
import {
  actualizarReservaAction,
  crearReservaAction,
  eliminarReservaAction,
} from './actions';

// El calendario del mes, a página completa: la vista con la que se trabaja.
//
// FORMATO: cuadrícula mensual de celdas grandes (el estándar de los
// calendarios de anfitrión), no la tira de días con scroll que hubo primero.
// Las estadías son BARRAS CONTINUAS que atraviesan las semanas y empiezan y
// terminan A MITAD DE CELDA: así el día en que un huésped sale y otro llega
// se ve como dos medias barras que comparten la celda — que es exactamente lo
// que pasa en la realidad, la salida es en la mañana y la llegada en la tarde.
//
// VARIAS PROPIEDADES: cada una es un carril dentro de la semana, y los chips
// de arriba filtran a una sola cuando hay que concentrarse. Con el inventario
// real de hoy (una propiedad) los chips ni aparecen.
//
// POR QUÉ CLIENTE: pulsar un día libre abre el diálogo de reserva prellenado
// y pulsar una barra abre su detalle. Los formularios del diálogo son <form>
// reales contra Server Actions — el JavaScript solo abre, cierra y prellena.

export interface PropiedadCal {
  id: string;
  name: string;
  pricePerNight: number;
  priceOnRequest: boolean;
}

export interface ReservaCal {
  id: string;
  propertyId: string;
  origen: 'manual' | 'ical' | 'airbnb-correo';
  tipo: 'reserva' | 'bloqueo';
  estado: 'confirmada' | 'tentativa';
  huesped: string;
  telefono: string;
  notas: string;
  totalUsd: number | null;
  checkIn: string;
  checkOut: string;
  noches: number;
  feedNombre: string | null;
  icalSummary: string;
}

type Dialogo =
  | { modo: 'crear'; propertyId: string; checkIn: string; checkOut: string }
  | { modo: 'reserva'; reserva: ReservaCal };

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** 'YYYY-MM-DD' + n días, sin pasar por zonas horarias. */
function sumarDias(fecha: string, n: number): string {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function diaSemana(fecha: string): number {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** '2026-08-12' → '12 ago'. Para los textos del diálogo. */
function corta(fecha: string): string {
  const [, m, d] = fecha.split('-').map(Number);
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${d} ${meses[m - 1]}`;
}

/** Aspecto de la barra según qué es. Los colores son la leyenda del pie. */
function claseBarra(r: ReservaCal): string {
  if (r.tipo === 'bloqueo')
    return 'bg-paper-warm text-ink-muted border border-line-strong';
  if (r.origen === 'ical') return 'bg-coral text-white';
  if (r.origen === 'airbnb-correo') return 'bg-coral/70 text-white border border-dashed border-white/70';
  if (r.estado === 'tentativa')
    return 'bg-brand-soft text-brand-deep border border-dashed border-brand';
  return 'bg-brand text-white';
}

function etiquetaBarra(r: ReservaCal): string {
  if (r.tipo === 'bloqueo') return 'Cerrado';
  if (r.origen === 'ical') return r.feedNombre ?? 'Airbnb';
  if (r.origen === 'airbnb-correo') return `Airbnb · correo${r.huesped ? ` · ${r.huesped}` : ''}`;
  return r.huesped || 'Reserva';
}

/** Un tramo de barra dentro de una fila de semana, en columnas fraccionarias
 *  de 0 a 7 (las mitades son los medios días de llegada y salida). */
interface Tramo {
  reserva: ReservaCal;
  carril: number;
  desde: number;
  hasta: number;
  redondaIzq: boolean;
  redondaDer: boolean;
  conEtiqueta: boolean;
}

export default function Multicalendario({
  mes,
  dias,
  hoy,
  propiedades,
  reservas,
}: {
  /** 'YYYY-MM' que se está mirando. Viaja oculto en los formularios. */
  mes: string;
  /** Todas las fechas del mes, 'YYYY-MM-DD', en orden. */
  dias: string[];
  hoy: string;
  propiedades: PropiedadCal[];
  reservas: ReservaCal[];
}) {
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const [filtro, setFiltro] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const visibles = filtro
    ? propiedades.filter((p) => p.id === filtro)
    : propiedades;
  const carrilDe = new Map(visibles.map((p, i) => [p.id, i]));
  const carriles = Math.max(1, visibles.length);

  const abrir = (d: Dialogo) => {
    setDialogo(d);
    // El estado tiene que estar puesto antes del showModal; requestAnimationFrame
    // deja que React pinte el contenido del diálogo primero.
    requestAnimationFrame(() => dialogRef.current?.showModal());
  };
  const cerrar = () => {
    dialogRef.current?.close();
    setDialogo(null);
  };

  const finDeMes = sumarDias(dias[dias.length - 1], 1);
  const lead = diaSemana(dias[0]);

  // Las semanas del mes: null en los huecos de los meses vecinos.
  const semanas = useMemo(() => {
    const celdas: (string | null)[] = [
      ...Array.from({ length: lead }, () => null),
      ...dias,
    ];
    while (celdas.length % 7 !== 0) celdas.push(null);
    const out: (string | null)[][] = [];
    for (let i = 0; i < celdas.length; i += 7) out.push(celdas.slice(i, i + 7));
    return out;
  }, [dias, lead]);

  // Tramos de barra por semana. La estadía se modela como un rango
  // FRACCIONARIO sobre los días del mes —la llegada arranca a mitad de su
  // celda y la salida entrega a mitad de la suya, que es como pasa de verdad—
  // y cada semana recorta su pedazo. Una estadía larga aporta un tramo por
  // semana; solo el primero lleva la etiqueta.
  const tramosPorSemana = useMemo(() => {
    const out: Tramo[][] = semanas.map(() => []);
    for (const r of reservas) {
      const carril = carrilDe.get(r.propertyId);
      if (carril === undefined) continue;
      if (r.checkIn >= finDeMes || r.checkOut <= dias[0]) continue;

      const cortadaIzq = r.checkIn < dias[0];
      const cortadaDer = r.checkOut > finDeMes;
      // Índice 0-based del día de llegada y del de salida dentro del mes.
      const idxLlegada = cortadaIzq ? 0 : Number(r.checkIn.slice(8)) - 1;
      const idxSalida = cortadaDer ? dias.length : Number(r.checkOut.slice(8)) - 1;

      const S = idxLlegada + (cortadaIzq ? 0 : 0.5);
      // La media celda de la salida solo si ese día existe en la cuadrícula
      // (una salida el 1° del mes siguiente termina al filo del mes).
      const E = Math.min(idxSalida + (cortadaDer ? 0 : 0.5), dias.length);

      const segmentos: { w: number; tramo: Tramo }[] = [];
      for (let w = 0; w < semanas.length; w++) {
        const primerIdx = w * 7 - lead;
        const desde = Math.max(S, primerIdx);
        const hasta = Math.min(E, primerIdx + 7);
        if (desde >= hasta) continue;

        segmentos.push({
          w,
          tramo: {
            reserva: r,
            carril,
            desde: desde - primerIdx,
            hasta: hasta - primerIdx,
            // Redondo solo en los extremos VERDADEROS; los cortes de semana o
            // de mes van al filo, para que se lea que la barra continúa.
            redondaIzq: desde === S && !cortadaIzq,
            redondaDer: hasta === E && !cortadaDer,
            conEtiqueta: false,
          },
        });
      }
      // La etiqueta va en el tramo más ANCHO, no en el primero: quien llega un
      // sábado estrena su barra con media celda, y ahí no cabe ni el nombre.
      if (segmentos.length) {
        segmentos.reduce((max, s) =>
          s.tramo.hasta - s.tramo.desde > max.tramo.hasta - max.tramo.desde ? s : max,
        ).tramo.conEtiqueta = true;
        for (const s of segmentos) out[s.w].push(s.tramo);
      }
    }
    return out;
  }, [reservas, semanas, dias, finDeMes, lead, carrilDe]);

  // Geometría vertical de la celda: franja del número + un carril por
  // propiedad visible. Es lo que mantiene las celdas grandes y cuadradas.
  const altoNumero = 2.1;
  const altoCarril = visibles.length > 1 ? 2.2 : 2.6;
  const altoCelda = Math.max(6.5, altoNumero + carriles * altoCarril + 0.9);

  return (
    <>
      {/* Filtro por propiedad: solo aparece cuando hay entre qué elegir. */}
      {propiedades.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2">
          <ChipFiltro activo={filtro === null} onClick={() => setFiltro(null)}>
            Todas
          </ChipFiltro>
          {propiedades.map((p) => (
            <ChipFiltro
              key={p.id}
              activo={filtro === p.id}
              onClick={() => setFiltro(filtro === p.id ? null : p.id)}
            >
              {p.name}
            </ChipFiltro>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[40rem]">
          {/* Cabecera de la semana */}
          <div className="grid grid-cols-7 border-b border-line-strong">
            {DIAS_SEMANA.map((d, i) => (
              <div
                key={d}
                className={`px-3 pb-2.5 text-micro font-semibold uppercase tracking-label ${
                  i === 0 || i === 6 ? 'text-ink-faint' : 'text-ink-subtle'
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Las semanas */}
          {semanas.map((semana, w) => (
            <div key={w} className="relative">
              <div className="grid grid-cols-7">
                {semana.map((d, i) =>
                  d === null ? (
                    <div
                      key={`v${i}`}
                      className="border-b border-r border-line/50 bg-paper/40 first:border-l"
                      style={{ height: `${altoCelda}rem` }}
                    />
                  ) : (
                    <button
                      key={d}
                      type="button"
                      onClick={() =>
                        abrir({
                          modo: 'crear',
                          propertyId: (filtro ?? propiedades[0]?.id) || '',
                          checkIn: d,
                          checkOut: sumarDias(d, 2),
                        })
                      }
                      title={`Reservar desde el ${corta(d)}`}
                      className={`group relative border-b border-r border-line/50 text-left align-top transition-colors first:border-l hover:bg-brand-tint/60 ${
                        d < hoy ? 'bg-paper/70' : 'bg-white'
                      }`}
                      style={{ height: `${altoCelda}rem` }}
                    >
                      <span
                        className={`absolute right-2.5 top-2 flex h-7 w-7 items-center justify-center rounded-full font-mono text-meta tabular-nums ${
                          d === hoy
                            ? 'bg-brand font-semibold text-white'
                            : d < hoy
                              ? 'text-ink-faint'
                              : 'text-ink-soft'
                        }`}
                      >
                        {Number(d.slice(8))}
                      </span>
                      {/* La invitación a reservar, solo al pasar el cursor:
                          una cruz en cada celda vacía sería ruido. */}
                      <span
                        aria-hidden="true"
                        className="absolute left-2.5 top-2 hidden h-7 w-7 items-center justify-center rounded-full bg-white/90 text-brand shadow-sm group-hover:flex"
                      >
                        <CalendarPlus className="h-3.5 w-3.5" />
                      </span>
                      <span className="sr-only">Reservar desde el {corta(d)}</span>
                    </button>
                  ),
                )}
              </div>

              {/* Las barras de la semana, encima de las celdas */}
              {tramosPorSemana[w].map((t) => (
                <button
                  key={`${t.reserva.id}-${w}`}
                  type="button"
                  onClick={() => abrir({ modo: 'reserva', reserva: t.reserva })}
                  style={{
                    left: `${(t.desde / 7) * 100}%`,
                    width: `${((t.hasta - t.desde) / 7) * 100}%`,
                    top: `${altoNumero + 0.3 + t.carril * altoCarril}rem`,
                    height: `${altoCarril - 0.45}rem`,
                  }}
                  className={`absolute z-10 flex min-w-0 items-center overflow-hidden px-3 text-left text-ui font-medium shadow-sm transition-[filter,transform] hover:-translate-y-px hover:brightness-105 ${
                    t.redondaIzq ? 'rounded-l-full' : ''
                  } ${t.redondaDer ? 'rounded-r-full' : ''} ${claseBarra(t.reserva)}`}
                >
                  {t.conEtiqueta && (
                    <span className="truncate">
                      {visibles.length > 1 &&
                        `${propiedades.find((p) => p.id === t.reserva.propertyId)?.name.split(' ')[0]} · `}
                      {etiquetaBarra(t.reserva)}
                      {t.reserva.tipo === 'reserva' &&
                        t.reserva.estado === 'tentativa' &&
                        ' · por confirmar'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Leyenda + botón de reserva sin pasar por la cuadrícula */}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2.5">
        <Leyenda className="bg-brand" texto="Reserva directa" />
        <Leyenda className="bg-brand-soft border border-dashed border-brand" texto="Por confirmar" />
        <Leyenda className="bg-coral" texto="Airbnb" />
        <Leyenda className="bg-paper-warm border border-line-strong" texto="Cerrado" />
        <button
          type="button"
          onClick={() =>
            propiedades[0] &&
            abrir({
              modo: 'crear',
              propertyId: filtro ?? propiedades[0].id,
              checkIn: hoy,
              checkOut: sumarDias(hoy, 2),
            })
          }
          className="ml-auto inline-flex min-h-[40px] items-center gap-2 rounded-chip border border-line bg-white px-4 text-meta font-semibold text-brand-deep transition-all hover:border-ink hover:shadow-hard-sm"
        >
          <CalendarPlus className="h-4 w-4" />
          Nueva reserva
        </button>
      </div>

      {/* ── Diálogo ──────────────────────────────────────────────────────────
          <dialog> nativo: el foco, la tecla Escape y el fondo los pone el
          navegador. El clic en el respaldo cierra (el rect del propio dialog
          no incluye el ::backdrop, así que un clic fuera cae en el dialog
          mismo como target). */}
      <dialog
        ref={dialogRef}
        onClose={() => setDialogo(null)}
        onClick={(e) => {
          if (e.target === dialogRef.current) cerrar();
        }}
        className="m-auto w-[min(92vw,26rem)] rounded-panel border border-line bg-white p-0 shadow-lift-lg backdrop:bg-ink/30 backdrop:backdrop-blur-[2px]"
      >
        {dialogo && (
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-serif text-title-sm font-normal track-title text-ink">
                {dialogo.modo === 'crear' ? (
                  <>Nueva <em className="headline-italic">reserva</em></>
                ) : dialogo.reserva.origen === 'ical' ? (
                  <>Reserva de <em className="headline-italic">{dialogo.reserva.feedNombre ?? 'Airbnb'}</em></>
                ) : (
                  <>Editar <em className="headline-italic">reserva</em></>
                )}
              </h3>
              <button
                type="button"
                onClick={cerrar}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-ink-subtle transition-colors hover:bg-paper hover:text-ink"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Cerrar</span>
              </button>
            </div>

            {dialogo.modo === 'reserva' && dialogo.reserva.origen === 'ical' ? (
              <VistaIcal reserva={dialogo.reserva} propiedades={propiedades} />
            ) : (
              <FormularioReserva
                mes={mes}
                propiedades={propiedades}
                dialogo={dialogo}
              />
            )}
          </div>
        )}
      </dialog>
    </>
  );
}

function ChipFiltro({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`inline-flex min-h-[38px] items-center rounded-chip border px-3.5 text-meta font-medium transition-all ${
        activo
          ? 'border-brand bg-brand text-white'
          : 'border-line bg-white text-ink-soft hover:border-line-strong'
      }`}
    >
      {children}
    </button>
  );
}

function Leyenda({ className, texto }: { className: string; texto: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-ui text-ink-muted">
      <span aria-hidden="true" className={`h-3 w-6 rounded-full ${className}`} />
      {texto}
    </span>
  );
}

/** Detalle de una reserva importada: se mira, no se edita — la maneja Airbnb. */
function VistaIcal({
  reserva,
  propiedades,
}: {
  reserva: ReservaCal;
  propiedades: PropiedadCal[];
}) {
  const prop = propiedades.find((p) => p.id === reserva.propertyId);
  return (
    <div className="mt-4">
      <dl className="space-y-3">
        <Dato etiqueta="Propiedad" valor={prop?.name ?? '—'} />
        <Dato
          etiqueta="Noches"
          valor={`${corta(reserva.checkIn)} → ${corta(reserva.checkOut)} (${reserva.noches})`}
        />
        <Dato
          etiqueta="Qué es"
          valor={reserva.tipo === 'bloqueo' ? 'Fechas cerradas en Airbnb' : 'Reserva de huésped'}
        />
        {reserva.icalSummary && <Dato etiqueta="Detalle del feed" valor={reserva.icalSummary} />}
      </dl>
      <p className="mt-5 rounded-control bg-paper px-3.5 py-2.5 text-meta text-ink-muted">
        Esta estadía la trae la sincronización: cualquier cambio se hace en{' '}
        {reserva.feedNombre ?? 'Airbnb'} y aparece acá en el próximo refresco.
      </p>
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-meta text-ink-muted">{etiqueta}</dt>
      <dd className="text-right text-meta font-semibold text-ink">{valor}</dd>
    </div>
  );
}

const INPUT =
  'w-full rounded-control border border-line bg-paper/40 px-3 py-2 text-meta text-ink transition-colors placeholder:text-ink-faint hover:border-line-strong focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10';

function FormularioReserva({
  mes,
  propiedades,
  dialogo,
}: {
  mes: string;
  propiedades: PropiedadCal[];
  dialogo: Dialogo;
}) {
  const editando = dialogo.modo === 'reserva' ? dialogo.reserva : null;
  const propertyId = editando?.propertyId ?? (dialogo as { propertyId: string }).propertyId;
  const [propElegida, setPropElegida] = useState(propertyId);
  const prop = propiedades.find((p) => p.id === propElegida);

  const tarifa = prop && !prop.priceOnRequest ? prop.pricePerNight : 0;

  return (
    <form action={editando ? actualizarReservaAction : crearReservaAction} className="mt-4 space-y-4">
      <input type="hidden" name="mes" value={mes} />
      {editando && <input type="hidden" name="id" value={editando.id} />}

      {editando ? (
        <input type="hidden" name="property_id" value={propertyId} />
      ) : (
        <label className="block">
          <span className="mb-1.5 block text-meta font-semibold text-ink">Propiedad</span>
          <select
            name="property_id"
            value={propElegida}
            onChange={(e) => setPropElegida(e.target.value)}
            className={INPUT}
          >
            {propiedades.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-meta font-semibold text-ink">Llegada</span>
          <input
            type="date"
            name="check_in"
            required
            defaultValue={editando?.checkIn ?? (dialogo as { checkIn: string }).checkIn}
            className={INPUT}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-meta font-semibold text-ink">Salida</span>
          <input
            type="date"
            name="check_out"
            required
            defaultValue={editando?.checkOut ?? (dialogo as { checkOut: string }).checkOut}
            className={INPUT}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-meta font-semibold text-ink">Qué es</span>
          <select name="tipo" defaultValue={editando?.tipo ?? 'reserva'} className={INPUT}>
            <option value="reserva">Reserva</option>
            <option value="bloqueo">Cerrar fechas</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-meta font-semibold text-ink">Estado</span>
          <select name="estado" defaultValue={editando?.estado ?? 'confirmada'} className={INPUT}>
            <option value="confirmada">Confirmada</option>
            <option value="tentativa">Por confirmar</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-meta font-semibold text-ink">Huésped</span>
        <input
          name="huesped"
          defaultValue={editando?.huesped ?? ''}
          placeholder="Nombre (vacío si es un cierre)"
          className={INPUT}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-meta font-semibold text-ink">Teléfono</span>
          <input
            name="telefono"
            defaultValue={editando?.telefono ?? ''}
            placeholder="0412…"
            className={INPUT}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-meta font-semibold text-ink">Total US$</span>
          <input
            name="total_usd"
            type="number"
            min={0}
            step="0.01"
            defaultValue={editando?.totalUsd ?? ''}
            placeholder={tarifa ? `vacío = noches × ${tarifa}` : 'opcional'}
            className={INPUT}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-meta font-semibold text-ink">Notas</span>
        <textarea
          name="notas"
          rows={2}
          defaultValue={editando?.notas ?? ''}
          placeholder="Abono, hora de llegada, mascotas…"
          className={`${INPUT} resize-y`}
        />
      </label>

      <div className="flex items-center justify-between gap-3 pt-1">
        {/* El borrado es un formulario aparte vía formaction: un solo diálogo,
            dos acciones, cero JavaScript extra. */}
        {editando ? (
          <button
            type="submit"
            formAction={eliminarReservaAction}
            className="rounded-chip px-3 py-2 text-meta font-semibold text-coral transition-colors hover:bg-coral/10"
          >
            Eliminar
          </button>
        ) : (
          <span />
        )}
        <button type="submit" className="btn-solid">
          {editando ? 'Guardar cambios' : 'Crear reserva'}
        </button>
      </div>
    </form>
  );
}
