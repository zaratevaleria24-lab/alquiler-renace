import Link from 'next/link';
import { Star } from 'lucide-react';
import { categoriaLabel, miniatura, portadaDe, type Lugar } from '@/lib/guia';
import { CATEGORIAS } from '@/lib/guia';

// Tarjeta de un lugar de la guía. Pensada para el pulgar: foto grande, nombre,
// una línea de contexto y la valoración. Nada que leer con lupa.
export default function TarjetaLugar({ l, prioridad = false, oculta = false }: { l: Lugar; prioridad?: boolean; oculta?: boolean }) {
  const foto = portadaDe(l);
  const emoji = CATEGORIAS.find((c) => c.key === l.categoria)?.emoji ?? '';
  return (
    <li data-cat={l.categoria} hidden={oculta} className="group overflow-hidden rounded-panel border border-line bg-white shadow-lift transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lift-lg [content-visibility:auto] [contain-intrinsic-size:auto_340px]">
      <Link href={`/guia/${l.slug}`} className="block">
        <div className="relative overflow-hidden">
          {foto ? (
            <img src={miniatura(foto.src)} alt={foto.alt} width={480} height={300} loading={prioridad ? 'eager' : 'lazy'} fetchPriority={prioridad ? 'high' : 'auto'} decoding="async"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="aspect-[16/10] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
          ) : (
            <div className="flex aspect-[16/10] w-full items-center justify-center bg-luz text-3xl">{emoji}</div>
          )}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/60 to-transparent" />
          <span className="absolute left-3 top-3 rounded-chip border border-white/50 bg-white/85 px-2.5 py-1 text-ui font-medium text-brand-deep backdrop-blur-sm">{emoji} {categoriaLabel(l.categoria)}</span>
          {l.destacado && <span className="absolute right-3 top-3 rounded-chip bg-accent px-2.5 py-1 text-ui font-medium text-white">Imperdible</span>}
          <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3 text-white">
            <h3 className="font-serif text-title-sm font-semibold leading-tight [text-shadow:0_1px_8px_rgba(0,0,0,.35)]">{l.nombre}</h3>
            {l.rating != null && (
              <span className="mono-data inline-flex shrink-0 items-center gap-1 rounded-chip bg-white/15 px-2 py-1 text-ui backdrop-blur-md">
                <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />{l.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
        <div className="px-4 pb-4 pt-3">
          <p className="label-eyebrow text-ink-subtle">{[l.municipio || l.zone, l.mejorMomento].filter(Boolean).join(' · ')}</p>
          <p className="mt-1.5 line-clamp-2 text-meta text-ink-soft leading-relaxed">{l.descripcion}</p>
        </div>
      </Link>
    </li>
  );
}
