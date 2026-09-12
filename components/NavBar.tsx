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
  { label: 'Zonas', href: '/#zonas-de-la-isla', enHome: '#zonas-de-la-isla' },
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
      <div className="bg-earth text-white rounded-panel px-5 py-3 md:px-7 md:py-3 shadow-[0_6px_24px_-8px_rgba(15,58,71,0.45)] max-w-7xl mx-auto flex items-center justify-between border border-white/10">
        <Link
          href="/"
          onClick={(ev) => { if (enHome && onInicio) { ev.preventDefault(); onInicio(); setActivoHome('Inicio'); } }}
          className="flex items-center gap-2.5"
          aria-label="Margarita Renace, inicio"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center">
            <img src="/logo-mark-white.svg" alt="" width={40} height={40} className="h-full w-full object-contain" />
          </span>
          <span className="font-serif text-ui-lg md:text-body font-semibold tracking-wide leading-none whitespace-nowrap">
            Margarita<span className="text-accent"> Renace</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-0.5 rounded-control border border-white/10 bg-white/10 p-1">
          {ENLACES.map((e) => (
            <a
              key={e.label}
              href={destino(e)}
              onClick={() => setActivoHome(e.label)}
              className={`rounded-chip px-4 py-2 text-ui font-medium tracking-wide transition-all ${
                activo(e) ? 'bg-white text-brand' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {e.label}
            </a>
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
            aria-controls="menu-movil"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white transition-all hover:border-white/35 hover:bg-white/10"
          >
            {abierto ? <X className="h-[17px] w-[17px]" /> : <Menu className="h-[17px] w-[17px]" />}
          </button>
        </div>
      </div>

      {abierto && (
        <div id="menu-movil" className="mt-2 rounded-control border border-white/15 bg-earth/95 p-2 shadow-hard backdrop-blur-xl md:hidden">
          <ul className="flex flex-col">
            {ENLACES.map((e) => (
              <li key={e.label}>
                <a
                  href={destino(e)}
                  onClick={() => { setActivoHome(e.label); setAbierto(false); }}
                  className={`flex min-h-[48px] items-center rounded-chip px-4 text-body font-medium transition-colors ${
                    activo(e) ? 'bg-white/15 text-white' : 'text-white/85 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {e.label}
                </a>
              </li>
            ))}
            {waPublicar && (
              <li><a href={waPublicar} rel="noopener" className="flex min-h-[48px] items-center rounded-chip px-4 text-body font-medium text-accent">Publica tu propiedad</a></li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}
