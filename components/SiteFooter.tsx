import Link from 'next/link';
import type { SVGProps } from 'react';
import { siInstagram, siTiktok, siWhatsapp } from 'simple-icons';
import BotonCookies from './BotonCookies';
import { getZones } from '@/lib/queries';
import { SITE } from '@/lib/site';
import { getContacto } from '@/lib/settings';
import { HUBS } from '@/lib/guia-hubs';

// Footer del sitio (rediseño 2026-09-13, dirección «Amanecer»).
//
// Cuatro columnas ordenadas por lo que la persona busca —marca y contacto,
// alojamiento, la guía, la casa— sobre el degradado suave del sitio, y una
// línea legal fina. Todos los enlaces son páginas REALES (nada de «Blog» o
// «Términos» de relleno): el footer viaja en el layout, así que es enlazado
// interno desde todas las páginas hacia zonas, hubs de la guía, páginas por
// intención y políticas. Se quitó «Tarifas en US$»: la moneda ya se explica
// donde se muestra el precio.

const Marca = (path: string) => (p: SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}><path d={path} /></svg>;
const IgIcon = Marca(siInstagram.path), TkIcon = Marca(siTiktok.path), WaIcon = Marca(siWhatsapp.path);

export async function SiteFooter() {
  const [CONTACT, zones] = await Promise.all([getContacto(), getZones()]);
  const enlace = 'text-meta text-ink-soft transition-colors hover:text-brand-deep';
  const titulo = 'label-eyebrow text-ink-subtle';
  const redes = [
    { href: 'https://www.instagram.com/margaritarenace.ve/', I: IgIcon, t: 'Instagram' },
    { href: 'https://www.tiktok.com/@margaritarenace.ve', I: TkIcon, t: 'TikTok' },
    ...(CONTACT.whatsapp ? [{ href: `https://wa.me/${CONTACT.whatsapp}`, I: WaIcon, t: 'WhatsApp' }] : []),
  ];

  return (
    <footer className="bg-luz border-t border-line">
      <div className="mx-auto max-w-7xl px-5 pb-8 pt-12 md:px-8 md:pt-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-8">
          {/* Marca: en teléfono ocupa las dos columnas; las tres listas van en dos columnas */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-3">
              <img src="/logo-mark-teal.svg" alt="" width={44} height={44} className="h-11 w-11" />
              <span className="font-serif text-[22px] font-semibold text-ink">Margarita <span className="text-accent">Renace</span></span>
            </Link>
            <p className="mt-4 max-w-xs text-meta leading-relaxed text-ink-soft">Apartamentos, autos y una guía de la isla, con tratos justos: el precio es el precio y te responde una persona.</p>
            <ul className="mt-5 flex gap-2">
              {redes.map((r) => (
                <li key={r.t}><a href={r.href} target="_blank" rel="noopener noreferrer" title={r.t} className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-brand-deep transition-colors hover:border-brand/40 hover:text-brand"><r.I className="h-4 w-4" /><span className="sr-only">{r.t}</span></a></li>
              ))}
            </ul>
            {CONTACT.email && <p className="mt-4 text-meta"><a href={`mailto:${CONTACT.email}`} className={enlace}>{CONTACT.email}</a></p>}
          </div>

          {/* Alojamiento */}
          <nav aria-label="Alojamiento">
            <p className={titulo}>Alojamiento</p>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/" className={enlace}>Apartamentos</Link></li>
              <li><Link href="/reservas" className={enlace}>Calcular y reservar</Link></li>
              <li><Link href="/apartamentos-con-piscina-en-margarita" className={enlace}>Con piscina, para familias</Link></li>
              <li><Link href="/alquiler-por-mes-en-margarita" className={enlace}>Alquiler por mes</Link></li>
              <li><Link href="/autos" className={enlace}>Traslados y alquiler de carros</Link></li>
              <li><Link href="/en-venta" className={enlace}>Casas y apartamentos en venta</Link></li>
            </ul>
          </nav>

          {/* Guía */}
          <nav aria-label="Guía de la isla">
            <p className={titulo}>Guía de la isla</p>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/guia" className={enlace}>Toda la guía</Link></li>
              {HUBS.map((h) => <li key={h.slug}><Link href={`/guia/${h.slug}`} className={enlace}>{h.h1.join(' ')}</Link></li>)}
              <li><Link href="/cuanto-cuesta-viajar-a-margarita" className={enlace}>Cuánto cuesta viajar a Margarita</Link></li>
            </ul>
          </nav>

          {/* La casa */}
          <nav aria-label="Margarita Renace">
            <p className={titulo}>Margarita Renace</p>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/nosotros" className={enlace}>Quiénes somos</Link></li>
              <li><Link href="/politicas" className={enlace}>Políticas de reserva y cancelación</Link></li>
              <li><Link href="/politicas#cookies" className={enlace}>Privacidad y datos</Link></li>
              <li><BotonCookies className={enlace} /></li>
              {CONTACT.whatsapp && <li><a href={`https://wa.me/${CONTACT.whatsapp}`} rel="noopener" className={enlace}>Escríbenos por WhatsApp</a></li>}
            </ul>
          </nav>
        </div>

        {/* Zonas: una línea, enlazado interno hacia las landings */}
        <nav aria-label="Zonas de la isla" className="mt-10 border-t border-line/70 pt-5">
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-ui text-ink-muted">
            <li className="label-eyebrow text-ink-subtle">Zonas</li>
            {zones.map((z) => <li key={z.slug}><Link href={`/alquiler/${z.slug}`} className="transition-colors hover:text-brand-deep">{z.name}</Link></li>)}
          </ul>
        </nav>

        <div className="mt-5 flex flex-col gap-1 border-t border-line/70 pt-4 text-micro text-ink-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Margarita Renace · {SITE.region.island}, {SITE.region.state}, Venezuela</p>
          <p>Hecho en la isla, sin rastreadores.</p>
        </div>
      </div>
    </footer>
  );
}
