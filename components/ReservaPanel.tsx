'use client';

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { avisar } from './Medidor';
import CalendarioDisponibilidad, {
  type FechasElegidas,
} from './CalendarioDisponibilidad';

// Calculadora de reserva de la página de propiedad.
//
// Vivía dentro del panel lateral del home (el drawer que se abría a la
// derecha). El drawer se retiró el 2026-08-03: al pulsar un alojamiento ahora
// se abre su PÁGINA, que es enlazable, se comparte por WhatsApp con su foto y
// la indexa Google. Esta pieza es lo único del drawer que valía la pena
// conservar, así que se movió acá — es el único trozo cliente de una página
// que por lo demás es estática.
//
// No cobra ni envía nada: calcula el estimado y arma el mensaje de WhatsApp.
// Desde 2026-08-03 incluye el calendario de disponibilidad: si el visitante
// elige fechas, las noches salen de ahí y el mensaje de WhatsApp las lleva —
// que es la mitad de la conversación de reserva resuelta antes de empezar.

export interface ReservaPanelProps {
  /** Slug de la propiedad, para pedir su disponibilidad. */
  slug: string;
  nombre: string;
  ubicacion: string;
  precioTexto: string;
  precioPorNoche: number;
  precioAConsultar: boolean;
  maxHuespedes: number;
  /** Estadía mínima en noches (`nights_count` de la propiedad). */
  minNoches: number;
  capacidadTexto: string;
  /** Solo dígitos, o null mientras no se haya configurado en el panel. */
  whatsapp: string | null;
}

const NOCHES = [1, 2, 3, 4, 5, 6, 7, 10, 14, 21, 30];

/** Tasa BCV tal como la sirve /api/tasa. */
interface Tasa {
  bcv: number | null;
  /** Tasa USDT (mercado), la que se cobra. */
  usdt?: number | null;
  /** Cuándo la publicó el BCV. Hoy la fuente no siempre lo trae. */
  bcvAt: string | null;
  /** Cuándo la consultamos nosotros. Siempre existe. */
  obtenidoAt: string | null;
}

/** «Bs. 72.315,59» — separadores de Venezuela: punto para miles, coma decimal. */
function bolivares(n: number): string {
  return `Bs. ${n.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fechaCorta(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** «del 12 al 15 de agosto de 2026», o con ambos meses si cruza de uno a otro. */
function textoFechas(f: FechasElegidas): string {
  const [y1, m1, d1] = f.checkIn.split('-').map(Number);
  const [y2, m2, d2] = f.checkOut.split('-').map(Number);
  if (y1 === y2 && m1 === m2) {
    return `del ${d1} al ${d2} de ${MESES[m2 - 1]} de ${y2}`;
  }
  const izq = y1 === y2 ? `${d1} de ${MESES[m1 - 1]}` : `${d1} de ${MESES[m1 - 1]} de ${y1}`;
  return `del ${izq} al ${d2} de ${MESES[m2 - 1]} de ${y2}`;
}

export default function ReservaPanel({
  slug,
  nombre,
  ubicacion,
  precioTexto,
  precioPorNoche,
  precioAConsultar,
  maxHuespedes,
  minNoches,
  capacidadTexto,
  whatsapp: numero,
}: ReservaPanelProps) {
  // El mínimo manda sobre el valor inicial: antes arrancaba fijo en 2 y el
  // selector ofrecía 1 noche aunque la propiedad exigiera más.
  const minimo = Math.max(1, minNoches);
  const [noches, setNoches] = useState(minimo);
  const [huespedes, setHuespedes] = useState(1);
  // Fechas del calendario. Si hay, mandan sobre el selector de noches; si el
  // visitante no toca el calendario, todo funciona como antes.
  const [fechas, setFechas] = useState<FechasElegidas | null>(null);

  // La tasa se pide al navegador, no viaja en el HTML: esta página es estática
  // y una tasa horneada quedaría vieja hasta el siguiente despliegue. Si falla,
  // `tasa` se queda en null y el panel muestra solo dólares.
  const [tasa, setTasa] = useState<Tasa | null>(null);
  useEffect(() => {
    let vivo = true;
    fetch('/api/tasa')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Tasa | null) => {
        if (vivo && (d?.usdt ?? d?.bcv)) setTasa({ ...d, bcv: d.usdt ?? d.bcv });
      })
      .catch(() => {
        /* sin tasa: se muestra solo el dólar */
      });
    return () => {
      vivo = false;
    };
  }, []);

  const nochesElegidas = fechas?.noches ?? noches;
  const total = precioPorNoche * nochesElegidas;
  const totalBs = tasa?.bcv ? total * tasa.bcv : null;
  // El calendario puede devolver menos noches que el mínimo: ahí se avisa en
  // vez de bloquear, porque la estadía se cierra por WhatsApp de todos modos.
  const bajoMinimo = nochesElegidas < minimo;
  const textoHuespedes = `${huespedes} ${huespedes === 1 ? 'huésped' : 'huéspedes'}`;
  const textoNoches = `${nochesElegidas} ${nochesElegidas === 1 ? 'noche' : 'noches'}`;
  const conFechas = fechas ? `, ${textoFechas(fechas)}` : '';
  const mensaje = precioAConsultar
    ? `Hola, vi «${nombre}» (${ubicacion}) en margaritarenace.com.ve. ¿Disponibilidad y tarifa para ${textoHuespedes}${fechas ? `, ${textoFechas(fechas)} (${textoNoches})` : ''}?`
    : `Hola, quiero reservar «${nombre}» (${ubicacion}) que vi en margaritarenace.com.ve: ${textoNoches}${conFechas}, ${textoHuespedes}. ¿Está disponible?`;
  const whatsapp = numero
    ? `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
    : null;

  return (
    <aside className="h-fit rounded-card border border-line bg-white p-6 md:sticky md:top-6">
      <p className="mono-data text-title-sm text-brand-deep">{precioTexto}</p>
      {!precioAConsultar && tasa?.bcv && (
        <p className="mt-1 text-meta text-ink-muted">
          {bolivares(precioPorNoche * tasa.bcv)} / noche · a la tasa USDT
        </p>
      )}
      <p className="mt-2 text-meta text-ink-muted">
        {/* Todo en una expresión: partirlo en varias líneas de JSX metía un
            espacio antes de la coma y del punto («6 adultos , mínimo…»). */}
        {`Hasta ${capacidadTexto}${!precioAConsultar ? `, mínimo ${minimo} noches` : ''}. `}
        {precioAConsultar
          ? 'La tarifa varía según la temporada: consulta por tus fechas.'
          : 'Confirma disponibilidad para tus fechas antes de reservar.'}
      </p>

      {/* El calendario decide sus propias condiciones: si la API de
          disponibilidad no responde, no aparece y no estorba. */}
      <CalendarioDisponibilidad slug={slug} onCambio={setFechas} />

      {!precioAConsultar && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="noches"
                className="block text-micro uppercase font-semibold text-ink-subtle mb-1.5"
              >
                Noches
              </label>
              {fechas ? (
                <p className="w-full rounded-xl border border-brand/40 bg-brand-tint px-3 py-2 text-meta font-semibold text-brand-deep">
                  {fechas.noches} {fechas.noches === 1 ? 'noche' : 'noches'}
                </p>
              ) : (
                <select
                  id="noches"
                  value={noches}
                  onChange={(e) => setNoches(Number(e.target.value))}
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-meta font-semibold text-ink focus:outline-none focus:border-ink"
                >
                  {/* Solo se ofrecen estadías que la propiedad acepta: antes
                      el selector listaba 1 noche aunque el mínimo fuera 2. */}
                  {NOCHES.filter((n) => n >= minimo).map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'noche' : 'noches'}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label
                htmlFor="huespedes"
                className="block text-micro uppercase font-semibold text-ink-subtle mb-1.5"
              >
                Huéspedes
              </label>
              <select
                id="huespedes"
                value={huespedes}
                onChange={(e) => setHuespedes(Number(e.target.value))}
                className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-meta font-semibold text-ink focus:outline-none focus:border-ink"
              >
                {Array.from({ length: Math.max(1, maxHuespedes) }, (_, i) => i + 1).map(
                  (g) => (
                    <option key={g} value={g}>
                      {g} {g === 1 ? 'huésped' : 'huéspedes'}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          {bajoMinimo && (
            <p className="mt-3 rounded-xl border border-brand/40 bg-brand-tint px-3 py-2 text-micro font-medium text-brand-deep">
              La estadía mínima es de {minimo} noches. Podemos revisar tus fechas
              por WhatsApp.
            </p>
          )}

          {/* Sin "tarifa de limpieza" ni "de servicio": eran montos inventados
              que nadie decidió cobrar. Total = noches × precio. */}
          {/* El BOLÍVAR es el total final, no una nota al pie: es la moneda de
              curso legal en Venezuela y es lo que el huésped va a pagar. El
              dólar queda arriba como subtotal, que es el rol que de verdad
              cumple — el catálogo está en US$ pero nadie paga en US$ sin
              conversión.

              Si la tasa no se pudo obtener, el dólar vuelve a ser el total: es
              preferible a publicar un bolívar equivocado. */}
          <div className="mt-5 border-t border-line pt-4">
            <div className="flex justify-between text-body text-ink-muted">
              <span>
                {nochesElegidas} {nochesElegidas === 1 ? 'noche' : 'noches'} × US$
                {precioPorNoche.toLocaleString()}
              </span>
              <span className="mono-data">Ref. US${total.toLocaleString()}</span>
            </div>

            {totalBs !== null && tasa?.bcv ? (
              <>
                <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-line pt-4">
                  <span className="text-body-lg font-semibold text-brand-deep">
                    Total a pagar en bolívares
                  </span>
                  <span className="mono-data text-title font-semibold text-brand-deep">
                    {bolivares(totalBs)}
                  </span>
                </div>

                {/* La fecha va SIEMPRE junto al número. Si la fuente no trae la
                    fecha de publicación del BCV se dice cuándo se consultó, que
                    es un dato que sí tenemos — nunca "de hoy" a secas, que sería
                    afirmar algo que no podemos verificar. */}
                <p className="mt-2 text-meta text-ink-muted">
                  Calculado a la tasa USDT: {bolivares(tasa.bcv)} por US$
                  {tasa.bcvAt
                    ? `, publicada el ${fechaCorta(tasa.bcvAt)}`
                    : tasa.obtenidoAt
                      ? `, consultada el ${fechaCorta(tasa.obtenidoAt)}`
                      : ''}
                  . El monto final se ajusta a la tasa USDT del día de pago.
                </p>
              </>
            ) : (
              <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-line pt-4 font-semibold text-brand-deep">
                <span className="text-body-lg">Total estimado</span>
                <span className="mono-data text-title">US${total.toLocaleString()}</span>
              </div>
            )}
          </div>
        </>
      )}

      {whatsapp ? (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener"
          // Se registra el clic sin esperar la respuesta: el enlace abre igual.
          // Es el proxy de conversión más cercano que hay sin sistema de reservas.
          onClick={() => avisar({ kind: 'whatsapp' })}
          className="btn-solid mt-5 w-full"
        >
          <span>{precioAConsultar ? 'Consultar por WhatsApp' : 'Reservar por WhatsApp'}</span>
          <MessageCircle className="h-4 w-4" />
        </a>
      ) : (
        <button
          disabled
          className="btn-solid mt-5 w-full cursor-not-allowed opacity-60"
        >
          <span>Reservas por WhatsApp — muy pronto</span>
          <MessageCircle className="h-4 w-4" />
        </button>
      )}
      <p className="mt-3 text-center text-micro font-medium text-gray-400">
        Sin pagos en línea: coordinas directo con quien te recibe
      </p>
    </aside>
  );
}
