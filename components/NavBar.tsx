'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Menu, X } from 'lucide-react';

import { puedeVolverAtras } from '@/lib/atras';

// LA barra de navegación del sitio: un solo componente para la home y para
// todas las páginas internas (antes la home tenía la suya dentro de HomeClient
// y el resto no tenía ninguna). Flotante, en píldora oscura, como siempre fue
// en la home: las páginas internas dejan espacio arriba (pt-28/32) para que
// la cabecera oscura empiece debajo y nada quede tapado.
//
// La barra usa la escala de INTERFAZ (text-ui): una barra fija compite con el
// contenido por espacio vertical, así que acá manda la densidad.

interface Enlace {
  label: string;
  href: string;
  /** Destino cuando ya estás en la home: ahí casi todo es un ancla. */
  enHome: string;
  /** Solo el primero, fuera de la home: retrocede en vez de ir al inicio. */
  atras?: boolean;
}

const ENLACES: readonly Enlace[] = [
  { label: 'Inicio', href: '/', enHome: '#hero-frame' },
  { label: 'Hospedajes', href: '/#listings-container', enHome: '#listings-container' },
  { label: 'Autos', href: '/autos', enHome: '/autos' },
  { label: 'En venta', href: '/en-venta', enHome: '/en-venta' },
  { label: 'Guía turística', href: '/guia', enHome: '/guia' },
];

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
  const activo = (e: Enlace) =>
    enHome ? activoHome === e.label : !e.href.includes('#') && e.href !== '/' && ruta.startsWith(e.href);
  const destino = (e: Enlace) => (enHome ? e.enHome : e.href);

  // FUERA DE LA HOME, «Inicio» es «Volver».
  //
  // En la home, «Inicio» sube al principio y limpia los filtros: ahí sirve.
  // En cualquier otra página llevaba al home del alquiler, que para quien está
  // leyendo la guía es salirse de la guía — y era el único botón de la barra
  // que parecía servir para retroceder. Ahora retrocede de verdad: vuelve a la
  // página anterior del sitio, y si no hay ninguna (se entró por el QR, por
  // Instagram, por Google) cae al inicio, que es su enlace de siempre. El logo
  // sigue llevando al inicio, así que no se pierde el acceso.
  const enlaces: readonly Enlace[] = enHome
    ? ENLACES
    : [{ ...ENLACES[0], label: 'Volver', atras: true }, ...ENLACES.slice(1)];
  const alTocar = (e: Enlace) => (ev: React.MouseEvent) => {
    if (e.atras && puedeVolverAtras()) {
      ev.preventDefault();
      window.history.back();
      return;
    }
    setActivoHome(e.label);
  };
  // Un solo llamado a la acción a la derecha: WhatsApp (en escritorio). La
  // hamburguesa solo existe en teléfono; en escritorio los enlaces ya están.
  const waReservar = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent('Hola, quiero reservar un apartamento en Margarita.')}`
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
          {enlaces.map((e) => (
            <a
              key={e.label}
              href={destino(e)}
              onClick={alTocar(e)}
              className={`rounded-chip px-4 py-2 text-ui font-medium tracking-wide transition-all ${
                activo(e) ? 'bg-ink text-white' : 'text-ink-soft hover:bg-white hover:text-ink'
              }`}
            >
              {e.atras && <ArrowLeft className="mr-1 inline-block h-3.5 w-3.5 align-[-2px]" aria-hidden="true" />}
              {e.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-1.5 md:gap-3">
          {waReservar && (
            <a href={waReservar} rel="noopener" className="hidden md:inline-flex min-h-[38px] items-center rounded-chip bg-brand-deep px-4 text-ui font-medium tracking-wide text-white transition-colors hover:bg-brand">
              Reservar por WhatsApp
            </a>
          )}
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-label={abierto ? 'Cerrar menú' : 'Menú de navegación'}
            aria-expanded={abierto}
            aria-controls="menu-movil"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition-all hover:bg-paper-warm md:hidden"
          >
            {abierto ? <X className="h-[17px] w-[17px]" /> : <Menu className="h-[17px] w-[17px]" />}
          </button>
        </div>
      </div>

      {abierto && (
        <div id="menu-movil" className="mt-2 rounded-control border border-line bg-white p-2 shadow-lift md:hidden">
          <ul className="flex flex-col">
            {enlaces.map((e) => (
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
            {waReservar && (
              <li><a href={waReservar} rel="noopener" className="mt-1 flex min-h-[48px] items-center justify-center rounded-chip bg-brand-deep px-4 text-body font-medium text-white">Reservar por WhatsApp</a></li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}
