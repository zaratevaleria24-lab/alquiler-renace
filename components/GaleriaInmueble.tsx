'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Images, X } from 'lucide-react';

// Galería de una ficha: mosaico (1 grande + 4 chicas, el patrón que Airbnb
// volvió estándar) y visor a pantalla completa con <dialog> nativo. Sin
// librerías: el visor pesa ~3 KB, funciona con teclado (← → Esc), con el
// dedo (deslizar) y con el ratón, y precarga la foto siguiente para que el
// cambio sea instantáneo. En móvil el mosaico se vuelve una foto grande con
// tira de miniaturas: es lo que se usa con una mano.

export interface FotoGaleria { src: string; alt: string }

export default function GaleriaInmueble({ fotos, titulo }: { fotos: FotoGaleria[]; titulo: string }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [i, setI] = useState(0);
  const toque = useRef<number | null>(null);
  const n = fotos.length;

  const abrir = useCallback((idx: number) => {
    setI(idx);
    dialogo.current?.showModal();
  }, []);
  const cerrar = useCallback(() => dialogo.current?.close(), []);
  const ir = useCallback((d: number) => setI((v) => (v + d + n) % n), [n]);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    const teclas = (e: KeyboardEvent) => {
      if (!d.open) return;
      if (e.key === 'ArrowRight') ir(1);
      if (e.key === 'ArrowLeft') ir(-1);
    };
    window.addEventListener('keydown', teclas);
    return () => window.removeEventListener('keydown', teclas);
  }, [ir]);

  // Precarga la siguiente y la anterior mientras se mira la actual.
  useEffect(() => {
    if (n < 2) return;
    for (const k of [(i + 1) % n, (i - 1 + n) % n]) { const img = new Image(); img.src = fotos[k].src; }
  }, [i, n, fotos]);

  if (n === 0) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-panel border border-line bg-brand-tint text-body text-brand-deep">
        Fotos al consultar
      </div>
    );
  }

  const chicas = fotos.slice(1, 5);

  return (
    <>
      {/* Mosaico escritorio / foto + tira en móvil */}
      <section aria-label={`Fotos de ${titulo}`}>
        <div className="grid gap-2 md:grid-cols-4 md:grid-rows-2 md:gap-2.5 md:[&>*]:h-full">
          <button
            type="button"
            onClick={() => abrir(0)}
            className="group relative block overflow-hidden rounded-panel border border-line md:col-span-2 md:row-span-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="Ver foto 1 en grande"
          >
            <img
              src={fotos[0].src}
              alt={fotos[0].alt}
              width={1200}
              height={900}
              fetchPriority="high"
              decoding="async"
              sizes="(min-width: 768px) 50vw, 100vw"
              className="aspect-[4/3] h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            />
            <span className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors group-hover:bg-ink/10" />
          </button>
          {chicas.map((f, k) => (
            <button
              key={f.src}
              type="button"
              onClick={() => abrir(k + 1)}
              className="group relative hidden overflow-hidden rounded-panel border border-line md:block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              aria-label={`Ver foto ${k + 2} en grande`}
            >
              <img src={f.src} alt={f.alt} width={600} height={450} loading="lazy" decoding="async" sizes="25vw" className="aspect-[4/3] h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
              <span className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors group-hover:bg-ink/10" />
              {k === 3 && n > 5 && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/45 text-white">
                  <span className="text-title-sm font-semibold">+{n - 5}</span>
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tira móvil: todas las miniaturas, deslizable */}
        {n > 1 && (
          <ul className="mt-2.5 flex gap-2 overflow-x-auto pb-1 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {fotos.map((f, k) => (
              <li key={f.src} className="shrink-0">
                <button type="button" onClick={() => abrir(k)} className="block overflow-hidden rounded-control border border-line" aria-label={`Ver foto ${k + 1}`}>
                  <img src={f.src} alt="" width={112} height={84} loading="lazy" decoding="async" className="h-[68px] w-[92px] object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex items-center justify-between gap-3">
          <button type="button" onClick={() => abrir(0)} className="inline-flex items-center gap-2 rounded-chip border border-line bg-white px-3.5 py-2 text-ui font-medium text-brand-deep transition-all hover:border-ink hover:shadow-hard-sm">
            <Images className="h-4 w-4" aria-hidden="true" />
            Ver las {n} fotos
          </button>
          <p className="text-ui text-ink-faint">Tocá una foto para verla en grande</p>
        </div>
      </section>

      {/* Visor */}
      <dialog
        ref={dialogo}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-ink/95 p-0 text-white backdrop:bg-ink/90 open:flex open:flex-col"
        onClick={(e) => { if (e.target === dialogo.current) cerrar(); }}
        onTouchStart={(e) => { toque.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (toque.current == null) return;
          const dx = e.changedTouches[0].clientX - toque.current;
          if (Math.abs(dx) > 40) ir(dx < 0 ? 1 : -1);
          toque.current = null;
        }}
        aria-label={`Fotos de ${titulo}`}
      >
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          <p className="mono-data text-ui text-white/80">{i + 1} / {n}</p>
          <p className="hidden truncate px-4 text-meta text-white/70 md:block">{titulo}</p>
          <button type="button" onClick={cerrar} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 md:px-16">
          <img key={fotos[i].src} src={fotos[i].src} alt={fotos[i].alt} className="max-h-full max-w-full rounded-control object-contain" decoding="async" />
          {n > 1 && (
            <>
              <button type="button" onClick={() => ir(-1)} className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/25 md:left-4 md:h-12 md:w-12" aria-label="Foto anterior">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button type="button" onClick={() => ir(1)} className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/25 md:right-4 md:h-12 md:w-12" aria-label="Foto siguiente">
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>

        {n > 1 && (
          <ul className="flex justify-center gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {fotos.map((f, k) => (
              <li key={f.src} className="shrink-0">
                <button type="button" onClick={() => setI(k)} className={`block overflow-hidden rounded-control border-2 transition-all ${k === i ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-90'}`} aria-label={`Ir a la foto ${k + 1}`} aria-current={k === i}>
                  <img src={f.src} alt="" width={96} height={72} loading="lazy" decoding="async" className="h-14 w-[76px] object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </dialog>
    </>
  );
}
