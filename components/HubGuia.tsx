'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Categoria } from '@/lib/guia';

// El "conserje" de la guía, solo en teléfono (md:hidden): al escanear el QR
// la persona no quiere leer una lista de 80 tarjetas, quiere RESOLVER algo o
// DESCUBRIR algo. Dos grupos de baldosas grandes, del tamaño de un pulgar,
// cada una una categoría. Tocar una filtra la lista (FiltroGuia hace el
// trabajo) y baja hasta los resultados; arriba queda una tira de chips para
// cambiar de categoría y un botón para volver acá.

export interface Baldosa { key: Categoria; label: string; sub: string; emoji: string; n: number; grupo: 'descubrir' | 'resolver' }

export default function HubGuia({ baldosas, whatsapp, inicial }: { baldosas: Baldosa[]; whatsapp: string | null; inicial: string }) {
  const [activa, setActiva] = useState<string>(inicial);
  const reducido = useReducedMotion();

  useEffect(() => {
    const on = (e: Event) => setActiva((e as CustomEvent<string>).detail);
    window.addEventListener('guia:categoria', on);
    return () => window.removeEventListener('guia:categoria', on);
  }, []);

  const elegir = (key: Categoria) => {
    window.dispatchEvent(new CustomEvent('guia:elegir', { detail: key }));
    // Dejar la lista justo debajo de la tira de chips pegada arriba.
    requestAnimationFrame(() => {
      const y = (document.getElementById('resultados-guia')?.getBoundingClientRect().top ?? 0) + window.scrollY - 150;
      window.scrollTo({ top: y, behavior: reducido ? 'auto' : 'smooth' });
    });
  };

  if (activa) return null;

  const grupo = (g: Baldosa['grupo'], titulo: string, sub: string, i0: number) => (
    <section aria-label={titulo} className="mt-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-title-sm font-semibold text-ink">{titulo}</h2>
        <p className="text-ui text-ink-muted">{sub}</p>
      </div>
      <ul className="mt-3 grid grid-cols-3 gap-2.5">
        {baldosas.filter((b) => b.grupo === g).map((b, i) => (
          <motion.li
            key={b.key}
            initial={reducido ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * (i0 + i), duration: 0.35, ease: [0.2, 0, 0.2, 1] }}
          >
            <button
              type="button"
              onClick={() => elegir(b.key)}
              className="flex min-h-[104px] w-full flex-col items-start justify-between rounded-card border border-line bg-white p-3 text-left shadow-lift transition-transform duration-150 active:scale-[0.97]"
            >
              <span className="text-[26px] leading-none" aria-hidden="true">{b.emoji}</span>
              <span>
                <span className="block text-ui font-semibold leading-tight text-brand-deep">{b.label}</span>
                <span className="mt-0.5 block text-[11px] leading-tight text-ink-muted">{b.n} opciones</span>
              </span>
            </button>
          </motion.li>
        ))}
      </ul>
    </section>
  );

  return (
    <div className="md:hidden">
      {grupo('resolver', 'Resolver', 'Desde el apartamento', 0)}
      {grupo('descubrir', 'Descubrir', 'Salir a la isla', 6)}
      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hola, estoy en el apartamento y necesito una mano con: ')}`}
          rel="noopener"
          className="mt-6 flex min-h-[56px] items-center justify-between gap-3 rounded-card bg-brand-deep px-4 text-white shadow-lift"
        >
          <span>
            <span className="block text-ui font-semibold">¿No está lo que buscás?</span>
            <span className="block text-[12px] text-white/80">Escribile al anfitrión por WhatsApp</span>
          </span>
          <span aria-hidden="true" className="text-xl">→</span>
        </a>
      )}
    </div>
  );
}
