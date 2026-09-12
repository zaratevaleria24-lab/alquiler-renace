'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

// Barra de navegación del sitio para TODAS las páginas que no son la home.
// Hasta el 2026-09-12 solo la home tenía barra (vivía dentro de HomeClient):
// en /en-venta, /autos, las zonas y las fichas no había forma de ir a ninguna
// otra sección salvo el pie. Misma estética que la de la home (píldora oscura,
// enlaces en cápsula, menú de teléfono), pero pegajosa arriba en vez de
// flotante: las páginas internas abren con una cabecera oscura y una barra
// flotante encima se perdería.
//
// La home conserva la suya porque tiene lógica propia (reiniciar la búsqueda,
// saltos a secciones de la misma página).

const ENLACES = [
  { label: 'Inicio', href: '/' },
  { label: 'Apartamentos', href: '/#listings-container' },
  { label: 'Autos', href: '/autos' },
  { label: 'En venta', href: '/en-venta' },
  { label: 'Zonas', href: '/#zonas-de-la-isla' },
] as const;

export default function NavBar({ whatsapp }: { whatsapp: string | null }) {
  const [abierto, setAbierto] = useState(false);
  const ruta = usePathname();
  const activo = (href: string) =>
    href === '/' ? ruta === '/' : !href.includes('#') && ruta.startsWith(href);
  const waPublicar = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent('Hola, quiero publicar mi propiedad en margaritarenace.com.ve.')}`
    : null;

  return (
    <nav className="sticky top-0 z-40 bg-earth text-white shadow-[0_6px_24px_-8px_rgba(15,58,71,0.45)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 py-2.5 md:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Margarita Renace, inicio">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center">
            <img src="/logo-mark-white.svg" alt="" width={40} height={40} className="h-full w-full object-contain" />
          </span>
          <span className="font-serif text-ui-lg md:text-body font-semibold tracking-wide leading-none whitespace-nowrap">
            Margarita<span className="text-accent"> Renace</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-0.5 rounded-control border border-white/10 bg-white/10 p-1">
          {ENLACES.map((e) => (
            <Link
              key={e.label}
              href={e.href}
              className={`rounded-chip px-4 py-2 text-ui font-medium tracking-wide transition-all ${
                activo(e.href) ? 'bg-white text-brand' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {e.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1.5 md:gap-3">
          {waPublicar && (
            <a href={waPublicar} rel="noopener" className="hidden lg:inline text-ui font-medium tracking-wide text-white/75 transition-colors hover:text-white">
              Publica tu propiedad
            </a>
          )}
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-label={abierto ? 'Cerrar menú' : 'Menú de navegación'}
            aria-expanded={abierto}
            aria-controls="menu-movil-global"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white transition-all hover:border-white/35 hover:bg-white/10 md:hidden"
          >
            {abierto ? <X className="h-[17px] w-[17px]" /> : <Menu className="h-[17px] w-[17px]" />}
          </button>
        </div>
      </div>

      {abierto && (
        <div id="menu-movil-global" className="border-t border-white/10 bg-earth/95 px-4 pb-3 pt-2 backdrop-blur-xl md:hidden">
          <ul className="flex flex-col">
            {ENLACES.map((e) => (
              <li key={e.label}>
                <Link
                  href={e.href}
                  onClick={() => setAbierto(false)}
                  className={`flex min-h-[48px] items-center rounded-chip px-4 text-body font-medium transition-colors ${
                    activo(e.href) ? 'bg-white/15 text-white' : 'text-white/85 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {e.label}
                </Link>
              </li>
            ))}
            {waPublicar && (
              <li>
                <a href={waPublicar} rel="noopener" className="flex min-h-[48px] items-center rounded-chip px-4 text-body font-medium text-accent">
                  Publica tu propiedad
                </a>
              </li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}
