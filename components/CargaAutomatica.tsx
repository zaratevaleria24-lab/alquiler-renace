'use client';

import { useEffect, useRef, useState } from 'react';

// Scroll infinito para el listado de /en-venta.
//
// Cómo funciona: la página servidor ya sabe paginar por URL (?pagina=n). Este
// componente vigila un centinela al final de la lista y, cuando entra en
// pantalla, pide la página siguiente COMO HTML (la misma URL, con la misma
// ruta), extrae las tarjetas del <ul data-grid> y las agrega. Así las tarjetas
// nuevas son idénticas a las del servidor —precio en cuatro monedas incluido—
// sin duplicar lógica en el cliente ni inventar una API.
//
// Sin JavaScript el visitante ve un enlace «Ver más inmuebles» que lleva a la
// página siguiente: los buscadores también lo siguen.

export default function CargaAutomatica({
  siguiente, total, cargados, idGrid,
}: { siguiente: string | null; total: number; cargados: number; idGrid: string }) {
  const [url, setUrl] = useState<string | null>(siguiente);
  const [vistos, setVistos] = useState(cargados);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);
  const centinela = useRef<HTMLDivElement>(null);
  const enCurso = useRef(false);

  useEffect(() => {
    if (!url || !centinela.current) return;
    const obs = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting || enCurso.current) return;
      enCurso.current = true;
      setCargando(true);
      setError(false);
      try {
        const r = await fetch(url, { headers: { Accept: 'text/html' } });
        if (!r.ok) throw new Error(String(r.status));
        const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
        const nuevas = doc.querySelector(`#${idGrid}`);
        const grid = document.getElementById(idGrid);
        if (nuevas && grid) {
          for (const li of Array.from(nuevas.children)) {
            // Las tarjetas nuevas entran con un fundido corto, sin librerías.
            (li as HTMLElement).style.animation = 'aparecer .45s ease-out both';
            grid.appendChild(li);
          }
          setVistos((v) => v + nuevas.children.length);
        }
        const prox = doc.querySelector<HTMLElement>('[data-siguiente]')?.dataset.siguiente || null;
        setUrl(prox);
      } catch {
        setError(true);
      } finally {
        setCargando(false);
        enCurso.current = false;
      }
    }, { rootMargin: '600px 0px' }); // empieza a cargar antes de llegar al final
    obs.observe(centinela.current);
    return () => obs.disconnect();
  }, [url, idGrid]);

  return (
    <div ref={centinela} data-siguiente={url ?? undefined} className="mt-8 flex flex-col items-center gap-3 text-center">
      <style>{`@keyframes aparecer{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>
      {cargando && (
        <p className="inline-flex items-center gap-2 text-meta text-ink-muted" role="status" aria-live="polite">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand" aria-hidden="true" />Cargando más inmuebles…
        </p>
      )}
      {error && url && (
        <button type="button" onClick={() => { setError(false); setUrl((u) => u); enCurso.current = false; }} className="btn-solid">
          Reintentar
        </button>
      )}
      {url && !cargando && !error && (
        // Sin JavaScript se ve este enlace; con JavaScript el observador lo
        // adelanta y casi nunca llega a mostrarse.
        <a href={url} className="text-meta text-ink-muted underline-offset-4 hover:underline">Ver más inmuebles</a>
      )}
      {!url && (
        <p className="text-meta text-ink-muted">
          {total > 0 ? `Viste los ${vistos} inmuebles disponibles.` : ''}
        </p>
      )}
    </div>
  );
}
