'use client';

import { useEffect, useRef, useState } from 'react';
import TarjetaGuia from '@/components/TarjetaGuia';
import { CATEGORIAS, POR_PAGINA, enCategoria, type Lugar } from '@/lib/guia-comun';

// La lista de la guía, dueña del filtro y de la paginación.
//
// POR QUÉ ASÍ: el servidor pinta SOLO la primera tanda (18 tarjetas) en el
// HTML —la guía pasó de 1,25 MB a menos de 300 KB— y manda los 100 lugares
// como datos compactos; el navegador pinta el resto al filtrar o al bajar.
// IndiceGuia enlaza todas las fichas en HTML sin duplicar sus fotos. Los chips (FiltroGuia) y el hub
// de teléfono (HubGuia) solo avisan «guia:elegir»; esta lista responde con
// «guia:categoria» para el mapa, el hub y los chips.
export default function ListaGuia({ lugares, cat: inicial, escucha = true }: { lugares: Lugar[]; cat: string; escucha?: boolean }) {
  const [cat, setCat] = useState(inicial);
  const [limite, setLimite] = useState(POR_PAGINA);
  const centinela = useRef<HTMLDivElement>(null);
  const visibles = cat ? lugares.filter((l) => enCategoria(l, cat)) : lugares;

  useEffect(() => {
    if (!escucha) return;
    const on = (e: Event) => { setCat(String((e as CustomEvent<string>).detail ?? '')); setLimite(POR_PAGINA); };
    window.addEventListener('guia:elegir', on);
    return () => window.removeEventListener('guia:elegir', on);
  }, [escucha]);

  // El centinela aparece y desaparece (al filtrar, al agotar la lista): el
  // observador se engancha cada vez que el nodo existe, no solo al montar.
  const hayMas = visibles.length > limite;
  useEffect(() => {
    const s = centinela.current;
    if (!hayMas || !s || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) setLimite((n) => n + POR_PAGINA); }, { rootMargin: '700px 0px' });
    io.observe(s);
    return () => io.disconnect();
  }, [hayMas, cat, limite]);

  useEffect(() => {
    if (!escucha) return;
    const titulo = document.getElementById('titulo-guia'), cuenta = document.getElementById('cuenta-guia');
    if (titulo) titulo.textContent = cat ? (CATEGORIAS.find((c) => c.key === cat)?.plural ?? '') : 'Imperdibles primero';
    if (cuenta) cuenta.textContent = String(visibles.length);
    const url = cat ? `/guia?c=${cat}` : '/guia';
    if (location.pathname === '/guia' && location.pathname + location.search !== url) history.replaceState(null, '', url);
    window.dispatchEvent(new CustomEvent('guia:categoria', { detail: cat }));
  }, [cat, visibles.length, escucha]);

  return (
    <>
      <ul id="grid-guia" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        {visibles.slice(0, limite).map((l, k) => <TarjetaGuia key={l.id} l={l} prioridad={k < 2} />)}
      </ul>
      {visibles.length > limite && (
        <div ref={centinela} className="mt-6 flex justify-center">
          <button type="button" onClick={() => setLimite((n) => n + POR_PAGINA)} className="inline-flex min-h-[44px] items-center rounded-control border border-line bg-white px-5 text-meta font-medium text-brand-deep hover:border-brand/40">
            Ver más ({visibles.length - limite} restantes)
          </button>
        </div>
      )}
    </>
  );
}
