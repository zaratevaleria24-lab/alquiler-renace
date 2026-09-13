'use client';

import Link from 'next/link';
import { Instagram, MapPin, MessageCircle, Navigation, Phone, Star } from 'lucide-react';
import { CATEGORIAS, categoriaLabel, categoriasDe, esServicio, horarioHoy, miniatura, portadaDe, type Lugar } from '@/lib/guia-comun';
import IconoCategoria from '@/components/IconosGuia';

// LA tarjeta de la guía: la misma para una playa, un restaurante o el camión
// de agua, así la lista se lee como un solo conjunto. En teléfono es compacta
// (foto cuadrada a la izquierda); en escritorio la foto va grande arriba y
// debajo el resto, como las tarjetas de siempre. Siempre: nombre, valoración y
// horario de hoy, DÓNDE está, el consejo, y una fila de acciones: WhatsApp,
// llamar, Instagram, web, cómo llegar. Los ALIADOS (trato directo con nosotros)
// llevan el sello «Recomendado» y un borde en el color de la marca.
function waDe(tel: string | null): string | null {
  if (!tel) return null;
  let d = tel.replace(/\D/g, '');
  if (d.startsWith('58')) return d;
  if (d.startsWith('0')) d = d.slice(1);
  return d.length >= 9 ? '58' + d : null;
}
const esWa = (u: string | null) => !!u && /wa\.(me|link)|whatsapp\.com/.test(u);
// Google antepone plus codes («2624+5CG, Pampatar»): no le dicen nada a nadie.
const sinPlusCode = (d: string | null) => (d ?? '').replace(/^[A-Z0-9]{4,}\+[A-Z0-9]{2,3},?\s*/, '');

export default function TarjetaGuia({ l, prioridad = false, oculta = false, paginada = false }: { l: Lugar; prioridad?: boolean; oculta?: boolean; paginada?: boolean }) {
  const foto = portadaDe(l);
  const cat = CATEGORIAS.find((c) => c.key === l.categoria);
  const hoy = horarioHoy(l);
  const servicio = esServicio(l.categoria);
  const wa = waDe(l.telefono) ? `https://wa.me/${waDe(l.telefono)}` : esWa(l.web) ? l.web : null;
  const web = l.web && !esWa(l.web) ? l.web : null;
  const ig = l.instagram ? `https://www.instagram.com/${l.instagram}/` : null;
  const ir = l.latitud != null ? `https://www.google.com/maps/dir/?api=1&destination=${l.latitud},${l.longitud}` : l.mapsUrl;
  const donde = [sinPlusCode(l.direccion), l.municipio && !l.direccion?.includes(l.municipio) ? l.municipio : ''].filter(Boolean).join(' · ');
  const acciones = [
    wa && { href: wa, I: MessageCircle, t: 'WhatsApp', ext: true },
    l.telefono && !wa?.startsWith('https://wa.me') && { href: `tel:${l.telefono.replace(/[^\d+]/g, '')}`, I: Phone, t: 'Llamar', ext: false },
    l.telefono && wa?.startsWith('https://wa.me') && { href: `tel:${l.telefono.replace(/[^\d+]/g, '')}`, I: Phone, t: 'Llamar', ext: false },
    ig && { href: ig, I: Instagram, t: 'Instagram', ext: true },
    web && !ig && { href: web, I: null, t: 'Web', ext: true },
    ir && { href: ir, I: Navigation, t: 'Ir', ext: true },
  ].filter(Boolean).slice(0, 4) as { href: string; I: typeof Star | null; t: string; ext: boolean }[];
  const href = `/guia/${l.slug}`;

  return (
    <li data-cat={categoriasDe(l).join(' ')} hidden={oculta || paginada} className={`${paginada ? 'paginada ' : ''}flex flex-col overflow-hidden rounded-panel border bg-white shadow-lift [content-visibility:auto] [contain-intrinsic-size:auto_200px] md:[contain-intrinsic-size:auto_420px] ${l.aliado ? 'borde-brillo border-transparent' : 'border-line'}`}>
      {l.aliado && (
        <p className="flex items-center gap-1.5 bg-brand-deep px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
          <Star className="h-3 w-3 fill-current" aria-hidden="true" />Recomendado por Margarita Renace
        </p>
      )}
      <div className="flex gap-3.5 p-3.5 md:flex-col md:gap-0 md:p-0">
        <Link href={href} className="relative block h-[88px] w-[88px] shrink-0 overflow-hidden rounded-card bg-luz sm:h-24 sm:w-24 md:aspect-[16/10] md:h-auto md:w-full md:rounded-none">
          {foto ? (
            <picture>
              <source media="(min-width: 768px)" srcSet={foto.src} />
              <img src={miniatura(foto.src)} alt={`${l.nombre}, Isla de Margarita`} width={96} height={96} loading={prioridad ? 'eager' : 'lazy'} fetchPriority={prioridad ? 'high' : undefined} decoding="async" className="h-full w-full object-cover" />
            </picture>
          ) : (
            <span className="flex h-full w-full items-center justify-center text-brand"><IconoCategoria cat={l.categoria} className="h-9 w-9 md:h-14 md:w-14" /></span>
          )}
          {l.destacado && !l.aliado && (
            <span className="absolute left-1 top-1 rounded-chip bg-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white md:left-3 md:top-3 md:px-2.5 md:py-1 md:text-[11px]"><span className="md:hidden">Top</span><span className="hidden md:inline">Imperdible</span></span>
          )}
        </Link>
        <div className="min-w-0 flex-1 md:p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-brand-deep">
            <IconoCategoria cat={l.categoria} className="h-3.5 w-3.5" />{cat?.label ?? categoriaLabel(l.categoria)}
          </p>
          <h3 className="mt-0.5 font-serif text-[17px] font-semibold leading-tight text-ink"><Link href={href}>{l.nombre}</Link></h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-2.5 text-[12px] text-ink-muted">
            {l.rating != null && <span className="inline-flex items-center gap-1 text-ink"><Star className="h-3 w-3 fill-current text-accent" aria-hidden="true" />{l.rating.toFixed(1)}{l.resenas ? <span className="text-ink-faint"> ({l.resenas})</span> : null}</span>}
            {hoy && <span>Hoy {hoy}</span>}
            {!hoy && l.costo && <span>{l.costo}</span>}
          </p>
          {donde && <p className="mt-1 flex items-start gap-1 text-[12px] leading-snug text-ink-soft"><MapPin className="mt-[2px] h-3 w-3 shrink-0 text-ink-faint" aria-hidden="true" /><span className="line-clamp-1">{donde}</span></p>}
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-ink-soft">{servicio ? (l.consejo || l.descripcion) : (l.descripcion)}</p>
        </div>
      </div>
      {acciones.length > 0 && (
        <div className="mt-auto flex divide-x divide-line border-t border-line text-[13px] font-medium text-brand-deep">
          {acciones.map((a) => (
            <a key={a.t} href={a.href} target={a.ext ? '_blank' : undefined} rel={a.ext ? 'noopener noreferrer' : undefined} className="flex min-h-[42px] flex-1 items-center justify-center gap-1.5 hover:bg-paper">
              {a.I ? <a.I className="h-3.5 w-3.5" aria-hidden="true" /> : null}{a.t}
            </a>
          ))}
        </div>
      )}
    </li>
  );
}
