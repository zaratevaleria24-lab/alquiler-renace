'use client';

import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import type { Moneda } from '@/lib/tasas';

// Conversor del panel.
//
// PORTADO DE SIBERIA, en versión reducida a propósito. El de Siberia
// (`frontend/src/lib/components/Conversor.svelte`, 483 líneas) tiene tarjetas
// configurables, siete monedas, un panel de suma y persistencia en
// localStorage. Eso tiene sentido en una herramienta financiera cuyo producto ES
// convertir. Acá el trabajo concreto es otro y mucho más estrecho: **saber
// cuántos bolívares cobrar por una tarifa en dólares**, o al revés. Un conversor
// con siete monedas y sumas obligaría a leer una interfaz entera para hacer una
// división.
//
// Lo que SÍ se conserva es el modelo de cálculo: pivote en bolívares, o sea
// monto × tasa(entrada) / tasa(salida). Con eso la brecha entre el dólar BCV y
// el de mercado aparece sola en cualquier ruta, sin tratarla como caso especial.
//
// Las tasas llegan por props ya calculadas en el servidor: este archivo no abre
// Postgres ni llama a ninguna API.

export interface ConversorProps {
  /** Bolívares por unidad de cada moneda; null si no se pudo obtener. */
  tasas: Record<Moneda, number | null>;
  monedas: { key: Moneda; corto: string; desc: string }[];
}

const fmt = (n: number, decimales: number) =>
  n.toLocaleString('es-VE', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });

export default function Conversor({ tasas, monedas }: ConversorProps) {
  const [monto, setMonto] = useState('100');
  const [de, setDe] = useState<Moneda>('USD');

  // Se acepta coma o punto: en Venezuela se escribe con coma decimal y obligar
  // al punto es una fuente tonta de errores al cobrar.
  const valor = Number(monto.replace(/\./g, '').replace(',', '.'));
  const valido = Number.isFinite(valor) && valor > 0;
  const tasaDe = tasas[de];

  const salidas = monedas.filter((m) => m.key !== de);

  const control =
    'rounded-control border border-line bg-paper/40 px-3.5 py-2.5 text-body text-ink transition-colors hover:border-line-strong focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10';

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[9rem] flex-1">
          <label
            htmlFor="conv-monto"
            className="mb-1.5 block text-meta font-semibold text-ink"
          >
            Monto
          </label>
          <input
            id="conv-monto"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            inputMode="decimal"
            className={`w-full font-mono tabular-nums ${control}`}
          />
        </div>
        <div>
          <label
            htmlFor="conv-de"
            className="mb-1.5 block text-meta font-semibold text-ink"
          >
            En
          </label>
          <select
            id="conv-de"
            value={de}
            onChange={(e) => setDe(e.target.value as Moneda)}
            className={control}
          >
            {monedas.map((m) => (
              <option key={m.key} value={m.key}>
                {m.corto}
              </option>
            ))}
          </select>
        </div>
        <span
          aria-hidden="true"
          className="hidden h-11 items-center text-ink-faint sm:flex"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </span>
      </div>

      <ul className="mt-5 divide-y divide-line/70 border-t border-line">
        {salidas.map((m) => {
          const tasaA = tasas[m.key];
          const resultado =
            valido && tasaDe && tasaA ? (valor * tasaDe) / tasaA : null;
          // Los bolívares se muestran con dos decimales; las divisas también,
          // porque son montos de cobro y redondear a entero descuadra la cuenta.
          return (
            <li
              key={m.key}
              className="flex items-baseline justify-between gap-4 py-3"
            >
              <span>
                <span className="text-body text-ink">{m.corto}</span>
                <span className="ml-2 text-meta text-ink-muted">{m.desc}</span>
              </span>
              <span className="font-mono text-body tabular-nums text-brand-deep">
                {resultado === null ? '—' : fmt(resultado, 2)}
              </span>
            </li>
          );
        })}
      </ul>

      {!tasaDe && (
        <p className="mt-4 text-meta text-coral">
          No hay tasa disponible para {monedas.find((m) => m.key === de)?.corto}.
        </p>
      )}
    </div>
  );
}
