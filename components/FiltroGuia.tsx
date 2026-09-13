'use client';

import { useEffect, useState } from 'react';
import type { Categoria } from '@/lib/guia';

import IconoCategoria from '@/components/IconosGuia';

// Filtro de categorías de la guía SIN ir al servidor: las 60 tarjetas ya están
// en la página (con data-cat) y acá solo se muestran u ocultan. Cambiar de
// categoría es instantáneo, el scroll no se mueve y la URL se actualiza para
// poder compartirla. Sin JavaScript los chips siguen siendo enlaces normales
// (?c=playa) que el servidor resuelve.

export interface ChipCategoria { key: Categoria | ''; label: string; emoji?: string; n: number }

// Paginación automática, como en /en-venta: de las tarjetas que coinciden se
// muestran las primeras POR_PAGINA y, cuando el final de la lista entra en
// pantalla, se sueltan otras tantas. Las tarjetas ya están en el HTML (el
// filtro no va al servidor); lo que se ahorra es pintar 100 fotos de golpe en
// un teléfono con datos. Sin JavaScript se ven todas (ver <noscript> en la página).
export default function FiltroGuia({ chips, inicial }: { chips: ChipCategoria[]; inicial: Categoria | '' }) {
  const [cat, setCat] = useState<Categoria | ''>(inicial);
  // La lista (ListaGuia) es la dueña del estado: acá solo se refleja y se avisa.
  useEffect(() => {
    const on = (e: Event) => setCat(((e as CustomEvent<string>).detail ?? '') as Categoria | '');
    window.addEventListener('guia:categoria', on);
    return () => window.removeEventListener('guia:categoria', on);
  }, []);
  const elegir = (k: Categoria | '') => window.dispatchEvent(new CustomEvent('guia:elegir', { detail: k }));

  return (
    <ul className={`max-w-6xl mx-auto gap-2 overflow-x-auto px-5 py-3 md:flex md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${cat ? 'flex' : 'hidden'}`}>
      {cat && (
        <li className="md:hidden">
          <button type="button" onClick={() => { elegir(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="inline-flex min-h-[38px] items-center gap-1 whitespace-nowrap rounded-chip border border-brand-deep/30 bg-white px-3 text-ui font-semibold text-brand-deep" aria-label="Volver al inicio de la guía">
            ← Inicio
          </button>
        </li>
      )}
      {chips.map((c) => {
        const activo = cat === c.key;
        return (
          <li key={c.key || 'todo'} className={c.key ? '' : 'hidden md:block'}>
            <a
              href={c.key ? `/guia?c=${c.key}` : '/guia'}
              onClick={(e) => { e.preventDefault(); elegir(c.key); }}
              aria-pressed={activo}
              className={`inline-flex min-h-[38px] items-center gap-1.5 whitespace-nowrap rounded-chip border px-3.5 text-ui font-medium transition-colors duration-200 ${
                activo ? 'border-brand-deep bg-brand-deep text-white' : 'border-line bg-white text-ink-soft hover:border-brand/40'
              }`}
            >
              {c.key && <IconoCategoria cat={c.key} className="h-4 w-4" />}{c.label} · {c.n}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
