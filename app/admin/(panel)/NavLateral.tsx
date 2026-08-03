'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Car,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  MapPin,
  Settings,
} from 'lucide-react';

// Navegación del panel: una tira de iconos, sin texto.
//
// POR QUÉ CLIENTE Y NO SERVIDOR: hace falta saber en qué ruta estás para
// marcarla, y un layout de servidor no puede leer el pathname. Es lo único que
// justifica JavaScript acá; sin él los enlaces siguen funcionando, solo se
// pierde el resaltado.
//
// SOBRE LOS ICONOS SOLOS: una tira de iconos sin nombre es un examen de memoria
// si no se resuelve bien. Se resuelve con tres cosas: la etiqueta aparece al
// pasar el cursor, cada enlace lleva su nombre accesible para lectores de
// pantalla, y la sección activa se ve de un golpe. Sin eso sería más bonito y
// menos usable.

const NAV = [
  { href: '/admin', label: 'Herramientas', icono: LayoutDashboard, listo: true },
  { href: '/admin/propiedades', label: 'Propiedades', icono: Home, listo: true },
  { href: '/admin/contenido', label: 'Contenido', icono: ImageIcon, listo: true },
  { href: '/admin/vehiculos', label: 'Vehículos', icono: Car, listo: false },
  { href: '/admin/zonas', label: 'Zonas', icono: MapPin, listo: false },
  { href: '/admin/metricas', label: 'Métricas', icono: BarChart3, listo: false },
  // Última a propósito: es utilidad, no trabajo diario.
  { href: '/admin/configuracion', label: 'Configuración', icono: Settings, listo: true },
];

export default function NavLateral({
  /** Cuántas cosas quedan por llenar. Se muestra como cifra sobre su icono, que
   *  es la única señal de aviso que queda en el panel: antes cada pantalla de
   *  trabajo tenía su propio cartel. */
  pendientes = 0,
}: {
  pendientes?: number;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Secciones del panel" className="px-2 py-2 lg:px-2.5 lg:py-3">
      <ul className="flex gap-1 overflow-x-auto no-scrollbar lg:flex-col lg:overflow-visible">
        {NAV.map((item) => {
          const Icono = item.icono;
          // Coincidencia exacta para /admin; por prefijo para las demás, así
          // /admin/propiedades/<id> sigue marcando Propiedades.
          const activo =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);

          return (
            <li key={item.href} className="group relative shrink-0">
              <Link
                href={item.href}
                aria-current={activo ? 'page' : undefined}
                className={`relative flex h-11 w-11 items-center justify-center rounded-control transition-colors ${
                  activo
                    ? 'bg-brand text-white'
                    : 'text-ink-subtle hover:bg-brand-tint hover:text-brand-deep'
                }`}
              >
                <Icono className="h-[18px] w-[18px]" />
                <span className="sr-only">{item.label}</span>

                {/* Contador de pendientes. Cifra y no punto: saber que quedan
                    tres cosas es distinto de saber que queda "algo". */}
                {pendientes > 0 && item.href === '/admin/configuracion' && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-coral px-1 font-mono text-[10px] font-semibold leading-none text-white ring-2 ring-white"
                  >
                    {pendientes}
                  </span>
                )}
                {!item.listo && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-1.5 h-1 w-1 rounded-full bg-ink-faint"
                  />
                )}
              </Link>

              {/* Etiqueta al pasar el cursor. Solo en escritorio: en táctil no
                  hay hover y estorbaría al pulsar. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-full top-1/2 z-20 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-chip bg-ink px-2.5 py-1.5 text-ui text-white opacity-0 transition-opacity group-hover:opacity-100 lg:block"
              >
                {item.label}
                {!item.listo && ' · en construcción'}
                {pendientes > 0 && item.href === '/admin/configuracion' && ` · ${pendientes}`}
              </span>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
