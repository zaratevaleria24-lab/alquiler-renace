'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

// LA barra de navegación del sitio: un solo componente para la home y para
// todas las páginas internas (antes la home tenía la suya dentro de HomeClient
// y el resto no tenía ninguna). Flotante, en píldora oscura, como siempre fue
// en la home: las páginas internas dejan espacio arriba (pt-28/32) para que
// la cabecera oscura empiece debajo y nada quede tapado.
//
// La barra usa la escala de INTERFAZ (text-ui): una barra fija compite con el
// contenido por espacio vertical, así que acá manda la densidad.

const ENLACES = [
  { label: 'Inicio', href: '/', enHome: '#hero-frame' },
  { label: 'Apartamentos', href: '/#listings-container', enHome: '#listings-container' },
  { label: 'Autos', href: '/autos', enHome: '/autos' },
  { label: 'En venta', href: '/en-venta', enHome: '/en-venta' },
  { label: 'Guía', href: '/guia', enHome: '/guia' },
] as const;

export default function NavBar({
  whatsapp, onInicio,
}: {
  whatsapp: string | null;
  /** Solo la home lo pasa: al tocar el logo reinicia la búsqueda. */
  onInicio?: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [activoHome, setActivoHome] = useState('Inicio');
  const ruta = usePathname();
  const enHome = ruta === '/';
  const activo = (e: (typeof ENLACES)[number]) =>
    enHome ? activoHome === e.label : !e.href.includes('#') && e.href !== '/' && ruta.startsWith(e.href);
  const destino = (e: (typeof ENLACES)[number]) => (enHome ? e.enHome : e.href);
  const waPublicar = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent('Hola, quiero publicar mi propiedad en margaritarenace.com.ve.')}`
    : null;

  return (
    <nav id="navbar-floating" className="fixed top-0 left-0 right-0 z-40 px-4 pt-4 md:px-8 md:pt-6">
      <div className="bg-white/85 text-ink rounded-panel px-5 py-3 md:px-7 md:py-3 shadow-lift max-w-7xl mx-auto flex items-center justify-between border border-line backdrop-blur-md">
        <Link
          href="/"
          onClick={(ev) => { if (enHome && onInicio) { ev.preventDefault(); onInicio(); setActivoHome('Inicio'); } }}
          className="flex items-center gap-2.5"
          aria-label="Margarita Renace, inicio"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center">
            <img src="/logo-mark-teal.svg" alt="" width={40} height={40} className="h-full w-full object-contain" />
          </span>
          <span className="font-serif text-ui-lg md:text-body font-semibold tracking-wide leading-none whitespace-nowrap">
            Margarita<span className="text-accent"> Renace</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-0.5 rounded-control border border-line bg-paper p-1">
          {ENLACES.map((e) => (
            <a
              key={e.label}
              href={destino(e)}
              onClick={() => setActivoHome(e.label)}
              className={`rounded-chip px-4 py-2 text-ui font-medium tracking-wide transition-all ${
                activo(e) ? 'bg-ink text-white' : 'text-ink-soft hover:bg-white hover:text-ink'
              }`}
            >
              {e.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-1.5 md:gap-3">
          {waPublicar && (
            <a href={waPublicar} rel="noopener" className="hidden lg:inline text-ui font-medium tracking-wide text-ink-soft transition-colors hover:text-ink">
              Publica tu propiedad
            </a>
          )}
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-label={abierto ? 'Cerrar menú' : 'Menú de navegación'}
            aria-expanded={abierto}
            aria-controls="menu-movil"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition-all hover:bg-paper-warm"
          >
            {abierto ? <X className="h-[17px] w-[17px]" /> : <Menu className="h-[17px] w-[17px]" />}
          </button>
        </div>
      </div>

      {abierto && (
        <div id="menu-movil" className="mt-2 rounded-control border border-line bg-white p-2 shadow-lift md:hidden">
          <ul className="flex flex-col">
            {ENLACES.map((e) => (
              <li key={e.label}>
                <a
                  href={destino(e)}
                  onClick={() => { setActivoHome(e.label); setAbierto(false); }}
                  className={`flex min-h-[48px] items-center rounded-chip px-4 text-body font-medium transition-colors ${
                    activo(e) ? 'bg-ink text-white' : 'text-ink hover:bg-paper-warm'
                  }`}
                >
                  {e.label}
                </a>
              </li>
            ))}
            {waPublicar && (
              <li><a href={waPublicar} rel="noopener" className="flex min-h-[48px] items-center rounded-chip px-4 text-body font-medium text-brand-deep">Publica tu propiedad</a></li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}
