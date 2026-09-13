'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Categoria } from '@/lib/guia';
import IconoCategoria from '@/components/IconosGuia';

// El "control remoto" de la guía, solo en teléfono (md:hidden). Quien escanea
// el QR no quiere leer 90 tarjetas: quiere RESOLVER algo (agua, comida, un
// taxi) o DESCUBRIR algo (una playa, un plan). Dos paneles de botones en filas
// de tres, con la iconografía artesanal de la isla. Tocar uno filtra la lista
// (FiltroGuia hace el trabajo) y baja hasta los resultados.

export interface Baldosa { key: Categoria | ''; label: string; sub: string; n: number; grupo: 'descubrir' | 'resolver' }

export default function HubGuia({ baldosas, whatsapp, inicial }: { baldosas: Baldosa[]; whatsapp: string | null; inicial: string }) {
  const [activa, setActiva] = useState<string>(inicial);
  const reducido = useReducedMotion();

  useEffect(() => {
    const on = (e: Event) => setActiva((e as CustomEvent<string>).detail);
    window.addEventListener('guia:categoria', on);
    return () => window.removeEventListener('guia:categoria', on);
  }, []);

  const elegir = (key: Categoria | '') => {
    window.dispatchEvent(new CustomEvent('guia:elegir', { detail: key }));
    requestAnimationFrame(() => {
      const y = (document.getElementById('resultados-guia')?.getBoundingClientRect().top ?? 0) + window.scrollY - 150;
      window.scrollTo({ top: y, behavior: reducido ? 'auto' : 'smooth' });
    });
  };

  if (activa) return null;

  const panel = (g: Baldosa['grupo'], titulo: string, sub: string, i0: number) => {
    const items: Baldosa[] = baldosas.filter((b) => b.grupo === g);
    // La cuadrícula cierra en 3×4 con «Ver todo», que baja a la lista completa.
    if (g === 'descubrir') items.push({ key: '', label: 'Ver todo', sub: '', n: 0, grupo: g });
    return (
      <section aria-label={titulo} className="mt-5">
        <div className="flex items-baseline justify-between px-1">
          <h2 className="font-serif text-[19px] font-semibold text-ink">{titulo}</h2>
          <p className="text-[12px] text-ink-muted">{sub}</p>
        </div>
        <ul className="mt-2.5 grid grid-cols-3 overflow-hidden rounded-panel border border-line bg-white shadow-lift">
          {items.map((b, i) => (
            <motion.li
              key={b.key || 'todo'}
              className={`${i % 3 !== 2 ? 'border-r' : ''} ${i < items.length - (items.length % 3 || 3) ? 'border-b' : ''} border-line`}
              initial={reducido ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.035 * (i0 + i), duration: 0.3, ease: [0.2, 0, 0.2, 1] }}
            >
              <button
                type="button"
                onClick={() => elegir(b.key)}
                className="flex min-h-[92px] w-full flex-col items-center justify-center gap-2 px-2 py-3 text-center transition-colors duration-150 active:bg-luz"
              >
                <span className="text-brand">{b.key ? <IconoCategoria cat={b.key} className="h-8 w-8" /> : <span className="flex h-8 w-8 items-center justify-center font-serif text-[26px] leading-none">∞</span>}</span>
                <span className="block text-[12.5px] font-semibold leading-tight text-brand-deep">{b.label}</span>
              </button>
            </motion.li>
          ))}
        </ul>
      </section>
    );
  };

  return (
    <div className="md:hidden">
      {panel('resolver', 'Resolver', 'Desde el apartamento', 0)}
      {panel('descubrir', 'Descubrir', 'Salir a la isla', 6)}
      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hola, estoy en el apartamento y necesito una mano con: ')}`}
          rel="noopener"
          className="mt-5 flex min-h-[56px] items-center justify-between gap-3 rounded-panel bg-brand-deep px-4 text-white shadow-lift"
        >
          <span>
            <span className="block text-[14px] font-semibold">¿No está lo que buscas?</span>
            <span className="block text-[12px] text-white/80">Escríbele al anfitrión por WhatsApp</span>
          </span>
          <span aria-hidden="true" className="text-xl">→</span>
        </a>
      )}
    </div>
  );
}
