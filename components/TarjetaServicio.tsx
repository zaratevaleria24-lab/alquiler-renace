import Link from 'next/link';
import { MessageCircle, Navigation, Phone, Star } from 'lucide-react';
import { horarioHoy, miniatura, portadaDe, type Lugar } from '@/lib/guia';
import { CATEGORIAS } from '@/lib/guia';

// Tarjeta de SERVICIO: acá no se va a visitar, se va a resolver. Por eso la
// acción está a la vista —llamar, WhatsApp, cómo llegar— y la foto es chica.
function waDe(tel: string | null): string | null {
  if (!tel) return null;
  let d = tel.replace(/\D/g, '');
  if (d.startsWith('58')) return d;
  if (d.startsWith('0')) d = d.slice(1);
  return d.length >= 9 ? '58' + d : null;
}

export default function TarjetaServicio({ l, oculta = false }: { l: Lugar; oculta?: boolean }) {
  const foto = portadaDe(l);
  const cat = CATEGORIAS.find((c) => c.key === l.categoria);
  const hoy = horarioHoy(l);
  const wa = waDe(l.telefono);
  const ir = l.latitud != null ? `https://www.google.com/maps/dir/?api=1&destination=${l.latitud},${l.longitud}` : l.mapsUrl;
  const ig = l.instagram ? `https://www.instagram.com/${l.instagram}/` : null;
  return (
    <li data-cat={l.categoria} hidden={oculta} className="overflow-hidden rounded-panel border border-line bg-white shadow-lift [content-visibility:auto] [contain-intrinsic-size:auto_180px]">
      <div className="flex gap-4 p-4">
        <Link href={`/guia/${l.slug}`} className="block shrink-0">
          {foto ? (
            <img src={miniatura(foto.src)} alt="" width={96} height={96} loading="lazy" decoding="async" className="h-20 w-20 rounded-card object-cover sm:h-24 sm:w-24" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-card bg-luz text-3xl sm:h-24 sm:w-24">{cat?.emoji}</div>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <p className="label-eyebrow text-ink-subtle">{cat?.emoji} {cat?.label}{l.municipio ? ` · ${l.municipio}` : ''}</p>
          <h3 className="mt-1 font-serif text-title-sm font-semibold leading-tight text-brand-deep"><Link href={`/guia/${l.slug}`} className="hover:underline underline-offset-4">{l.nombre}</Link></h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-ui text-ink-muted">
            {l.rating != null && <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-current" aria-hidden="true" />{l.rating.toFixed(1)}</span>}
            {hoy && <span>Hoy: {hoy}</span>}
          </p>
          <p className="mt-1.5 line-clamp-2 text-meta text-ink-soft">{l.consejo || l.descripcion}</p>
        </div>
      </div>
      <div className="flex divide-x divide-line border-t border-line text-ui font-medium text-brand-deep">
        {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener" className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 hover:bg-paper"><MessageCircle className="h-4 w-4" aria-hidden="true" />WhatsApp</a>}
        {l.telefono && <a href={`tel:${l.telefono.replace(/[^\d+]/g, '')}`} className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 hover:bg-paper"><Phone className="h-4 w-4" aria-hidden="true" />Llamar</a>}
        {ig && !wa && <a href={ig} target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 hover:bg-paper">Instagram</a>}
        {l.web && !l.telefono && <a href={l.web} target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 hover:bg-paper">Abrir</a>}
        {ir && <a href={ir} target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 hover:bg-paper"><Navigation className="h-4 w-4" aria-hidden="true" />Ir</a>}
      </div>
    </li>
  );
}
