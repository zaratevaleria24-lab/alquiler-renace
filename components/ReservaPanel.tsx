'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { avisar } from './Medidor';

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

export interface ReservaPanelProps {
  nombre: string;
  ubicacion: string;
  precioTexto: string;
  precioPorNoche: number;
  precioAConsultar: boolean;
  maxHuespedes: number;
  capacidadTexto: string;
  /** Solo dígitos, o null mientras no se haya configurado en el panel. */
  whatsapp: string | null;
}

const NOCHES = [1, 2, 3, 4, 5, 6, 7, 10, 14, 21, 30];

export default function ReservaPanel({
  nombre,
  ubicacion,
  precioTexto,
  precioPorNoche,
  precioAConsultar,
  maxHuespedes,
  capacidadTexto,
  whatsapp: numero,
}: ReservaPanelProps) {
  const [noches, setNoches] = useState(2);
  const [huespedes, setHuespedes] = useState(1);

  const total = precioPorNoche * noches;
  const textoHuespedes = `${huespedes} ${huespedes === 1 ? 'huésped' : 'huéspedes'}`;
  const mensaje = precioAConsultar
    ? `Hola, vi «${nombre}» (${ubicacion}) en margaritarenace.com.ve. ¿Disponibilidad y tarifa para ${textoHuespedes}?`
    : `Hola, quiero reservar «${nombre}» (${ubicacion}) que vi en margaritarenace.com.ve: ${noches} ${noches === 1 ? 'noche' : 'noches'}, ${textoHuespedes}. ¿Está disponible?`;
  const whatsapp = numero
    ? `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
    : null;

  return (
    <aside className="h-fit rounded-card border border-line bg-white p-6 md:sticky md:top-6">
      <p className="mono-data text-title-sm text-brand-deep">{precioTexto}</p>
      <p className="mt-2 text-meta text-ink-muted">
        Hasta {capacidadTexto}.{' '}
        {precioAConsultar
          ? 'La tarifa varía según la temporada: consulta por tus fechas.'
          : 'Confirma disponibilidad para tus fechas antes de reservar.'}
      </p>

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
              <select
                id="noches"
                value={noches}
                onChange={(e) => setNoches(Number(e.target.value))}
                className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-meta font-semibold text-ink focus:outline-none focus:border-ink"
              >
                {NOCHES.map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'noche' : 'noches'}
                  </option>
                ))}
              </select>
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

          {/* Sin "tarifa de limpieza" ni "de servicio": eran montos inventados
              que nadie decidió cobrar. Total = noches × precio. */}
          <div className="mt-5 flex justify-between border-t border-line pt-4 text-body font-semibold text-brand-deep">
            <span>Total estimado</span>
            <span className="mono-data">US${total.toLocaleString()}</span>
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
