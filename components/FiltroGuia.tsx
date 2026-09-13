'use client';

import { useEffect, useState } from 'react';
import type { Categoria } from '@/lib/guia';

// Filtro de categorías de la guía SIN ir al servidor: las 60 tarjetas ya están
// en la página (con data-cat) y acá solo se muestran u ocultan. Cambiar de
// categoría es instantáneo, el scroll no se mueve y la URL se actualiza para
// poder compartirla. Sin JavaScript los chips siguen siendo enlaces normales
// (?c=playa) que el servidor resuelve.

export interface ChipCategoria { key: Categoria | ''; label: string; emoji?: string; n: number }

export default function FiltroGuia({ chips, inicial }: { chips: ChipCategoria[]; inicial: Categoria | '' }) {
  const [cat, setCat] = useState<Categoria | ''>(inicial);

  useEffect(() => {
    const grid = document.getElementById('grid-guia');
    if (!grid) return;
    let visibles = 0;
    for (const li of Array.from(grid.children) as HTMLElement[]) {
      const ok = !cat || li.dataset.cat === cat;
      li.hidden = !ok;
      if (ok) visibles++;
    }
    const titulo = document.getElementById('titulo-guia');
    const cuenta = document.getElementById('cuenta-guia');
    if (titulo) titulo.textContent = cat ? (chips.find((c) => c.key === cat)?.label ?? '') : 'Imperdibles primero';
    if (cuenta) cuenta.textContent = String(visibles);
    const url = cat ? `/guia?c=${cat}` : '/guia';
    if (location.pathname + location.search !== url) history.replaceState(null, '', url);
    // Los puntos del mapa siguen al filtro (MapaGuia escucha este evento).
    window.dispatchEvent(new CustomEvent('guia:categoria', { detail: cat }));
  }, [cat, chips]);

  return (
    <ul className="max-w-6xl mx-auto flex gap-2 overflow-x-auto px-5 py-3 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chips.map((c) => {
        const activo = cat === c.key;
        return (
          <li key={c.key || 'todo'}>
            <a
              href={c.key ? `/guia?c=${c.key}` : '/guia'}
              onClick={(e) => { e.preventDefault(); setCat(c.key); }}
              aria-pressed={activo}
              className={`inline-flex min-h-[38px] items-center gap-1.5 whitespace-nowrap rounded-chip border px-3.5 text-ui font-medium transition-colors duration-200 ${
                activo ? 'border-brand-deep bg-brand-deep text-white' : 'border-line bg-white text-ink-soft hover:border-brand/40'
              }`}
            >
              {c.emoji && <span aria-hidden="true">{c.emoji}</span>}{c.label} · {c.n}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
