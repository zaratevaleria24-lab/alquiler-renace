import Link from 'next/link';
import { Bath, BedDouble, Camera, Ruler } from 'lucide-react';
import PrecioVenta from './PrecioVenta';
import type { TasasDerivadas } from '@/lib/tasas';

// Tarjeta de un inmueble en venta, la misma para los propios y los de la isla.
// Lo que vende es la foto: ocupa todo el ancho en 4:3, con el precio encima en
// vidrio (se lee sin mover la vista) y el contador de fotos, que es la señal
// más honesta de "esto está bien documentado". Datos duros con icono, nunca
// en prosa: se escanea en un segundo.

export interface DatosTarjeta {
  href: string;
  titulo: string;
  foto: string | null;
  fotos: number;
  zona: string;
  tipo?: string;
  precioUsd: number;
  aConsultar: boolean;
  habitaciones: number | null;
  banos: number | null;
  m2: number | null;
  nuevo?: boolean;
  propio?: boolean;
  prioridad?: boolean;
}

export default function TarjetaVenta({ d, tasas }: { d: DatosTarjeta; tasas?: TasasDerivadas | null }) {
  return (
    <li className="group flex h-full flex-col overflow-hidden rounded-panel border border-line bg-white transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-brand/40 hover:shadow-lift-lg">
      <Link href={d.href} className="relative block overflow-hidden" aria-label={d.titulo}>
        {d.foto ? (
          <img
            src={d.foto}
            alt={`${d.titulo} — en venta en ${d.zona}, Isla de Margarita`}
            width={800}
            height={600}
            loading={d.prioridad ? 'eager' : 'lazy'}
            fetchPriority={d.prioridad ? 'high' : 'auto'}
            decoding="async"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center bg-brand-tint text-ui text-brand-deep">Fotos al consultar</div>
        )}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />

        {/* Arriba: una sola etiqueta a la izquierda y el contador a la derecha.
            El tipo va como antetítulo abajo: tres chips arriba se pisaban en
            tarjetas angostas. */}
        <div className="absolute left-3.5 top-3.5">
          {d.propio ? (
            <span className="label-eyebrow rounded-chip border border-white/40 bg-white/85 px-2.5 py-1.5 text-brand-deep backdrop-blur-sm">Verificado</span>
          ) : d.nuevo ? (
            <span className="label-eyebrow rounded-chip border border-white/40 bg-white/85 px-2.5 py-1.5 text-brand-deep backdrop-blur-sm">Nuevo</span>
          ) : null}
        </div>
        {d.fotos > 1 && (
          <span className="absolute right-3.5 top-3.5 inline-flex items-center gap-1 rounded-chip border border-white/30 bg-ink/40 px-2 py-1 text-ui text-white backdrop-blur-sm">
            <Camera className="h-3 w-3" aria-hidden="true" />{d.fotos}
          </span>
        )}
        <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-end justify-between gap-3 text-white">
          <span className="label-eyebrow min-w-0 truncate text-white/90">{d.zona}</span>
          <span className="mono-data shrink-0 whitespace-nowrap rounded-chip border border-white/30 bg-white/15 px-2.5 py-1 text-title-sm backdrop-blur-md">
            {d.aConsultar || d.precioUsd <= 0 ? 'Consultar' : `US$ ${d.precioUsd.toLocaleString('es-VE')}`}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-4">
        {d.tipo && <p className="label-eyebrow -mb-1 text-ink-subtle">{d.tipo}</p>}
        <h3 className="line-clamp-2 font-serif text-title-sm font-semibold leading-snug text-brand-deep">
          <Link href={d.href} className="hover:underline underline-offset-4">{d.titulo}</Link>
        </h3>
        {(d.habitaciones != null || d.banos != null || d.m2 != null) && (
          <ul className="flex flex-wrap gap-x-3.5 gap-y-1 text-ui text-ink-muted">
            {d.habitaciones != null && <li className="inline-flex items-center gap-1.5"><BedDouble className="h-3.5 w-3.5 stroke-[1.5]" aria-hidden="true" />{d.habitaciones} hab</li>}
            {d.banos != null && <li className="inline-flex items-center gap-1.5"><Bath className="h-3.5 w-3.5 stroke-[1.5]" aria-hidden="true" />{d.banos} baños</li>}
            {d.m2 != null && <li className="inline-flex items-center gap-1.5"><Ruler className="h-3.5 w-3.5 stroke-[1.5]" aria-hidden="true" />{d.m2} m²</li>}
          </ul>
        )}
        <div className="mt-auto border-t border-line pt-3">
          <PrecioVenta usd={d.precioUsd} aConsultar={d.aConsultar} compacto tasas={tasas} />
        </div>
      </div>
    </li>
  );
}
