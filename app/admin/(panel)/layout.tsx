import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  BarChart3,
  Car,
  ExternalLink,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  MapPin,
} from 'lucide-react';
import { usuarioActual } from '@/lib/auth';
import { cerrarSesionAction } from '../actions';

// Marco del panel — layout del grupo de rutas (panel).
//
// POR QUÉ EL GRUPO `(panel)`: este layout redirige a /admin/login cuando no hay
// sesión. La primera versión ponía el login DENTRO de app/admin/ con un layout
// hermano, creyendo que eso lo dejaba fuera del guardia. Es falso: en el App
// Router los layouts anidados SE COMPONEN, no se reemplazan, así que este
// layout seguía envolviendo al login y salía un bucle infinito de
// redirecciones. Comprobado en vivo.
//
// Los paréntesis del grupo no aparecen en la URL: /admin/(panel)/page.tsx sirve
// /admin. El login queda en app/admin/login, fuera del grupo, así que este
// guardia no lo alcanza.
//
// ── DE BARRA SUPERIOR A BARRA LATERAL (2026-08-03) ─────────────────────────
// La navegación estaba arriba, en horizontal, y con seis secciones ya se
// DESBORDABA a dos líneas: «Métricas» caía sola debajo y el correo de la dueña
// —en monoespaciada, largo— se partía en dos, ocupando el centro de la pantalla.
// Se veía roto, no diseñado.
//
// Una barra lateral resuelve las dos cosas de raíz: crece hacia abajo sin
// romperse cuando lleguen más secciones, deja ver DÓNDE estás, y el usuario baja
// al pie donde no compite con nada. Es además la forma que tiene cualquier panel
// de gestión, así que no hay que aprenderla.
//
// Hereda app/globals.css del layout raíz, así que comparte con el sitio público
// las tipografías, el sello romana/cursiva, la paleta de arena y mar profundo,
// los radios y el ritmo. Es a propósito: el panel es la otra cara del mismo
// producto. Con dos sistemas de diseño separados uno se queda atrás siempre.
//
// El panel NO se indexa nunca.
export const metadata: Metadata = {
  title: 'Panel',
  robots: { index: false, follow: false, nocache: true },
};

// Estas rutas leen sesión de una cookie, así que no pueden ser estáticas. Sin
// esto, Next intentaría prerenderizarlas en el build y fallaría.
export const dynamic = 'force-dynamic';

// Rutas REALES, con el prefijo /admin. Antes eran '/', '/propiedades'… y
// funcionaban solo porque el middleware reescribía; ver el comentario de
// middleware.ts sobre por qué se abandonó ese truco.
//
// `listo` distingue lo que ya funciona de lo que es un marcador de posición: sin
// eso, la dueña entra a cuatro secciones vacías sin saber cuáles esperar.
const NAV = [
  { href: '/admin', label: 'Resumen', icono: LayoutDashboard, listo: true },
  { href: '/admin/propiedades', label: 'Propiedades', icono: Home, listo: true },
  { href: '/admin/contenido', label: 'Contenido', icono: ImageIcon, listo: true },
  { href: '/admin/vehiculos', label: 'Vehículos', icono: Car, listo: false },
  { href: '/admin/zonas', label: 'Zonas', icono: MapPin, listo: false },
  { href: '/admin/metricas', label: 'Métricas', icono: BarChart3, listo: false },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await usuarioActual();

  // El guardia va en el LAYOUT y no en cada página: así una ruta nueva del panel
  // queda protegida por omisión. Olvidar el guardia en una página suelta es el
  // error clásico que deja un panel abierto.
  if (!user) redirect('/admin/login');

  const inicial = user.email.trim().charAt(0).toUpperCase() || '·';

  return (
    <div className="min-h-screen bg-paper lg:flex">
      {/* ── Barra lateral ──────────────────────────────────────────────────
          En pantallas chicas se convierte en una franja horizontal arriba con
          scroll lateral: en un teléfono una columna fija se comería la mitad de
          la pantalla. */}
      <aside className="border-b border-line bg-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4 px-5 py-4 lg:block lg:px-6 lg:py-7">
          <Link href="/admin" className="flex items-center gap-2.5">
            <img
              src="/icon.png"
              alt=""
              width={30}
              height={30}
              className="h-[30px] w-[30px] rounded-chip"
            />
            <span className="font-serif text-body font-semibold text-ink">
              Margarita{' '}
              <em className="headline-italic not-italic text-brand">Panel</em>
            </span>
          </Link>

          {/* En móvil el "Salir" vive acá arriba, junto al logo. */}
          <form action={cerrarSesionAction} className="lg:hidden">
            <button
              type="submit"
              aria-label="Cerrar sesión"
              className="flex h-9 w-9 items-center justify-center rounded-chip text-ink-muted transition-colors hover:bg-paper hover:text-brand"
            >
              <LogOut className="h-[17px] w-[17px]" />
            </button>
          </form>
        </div>

        <nav
          aria-label="Secciones del panel"
          className="px-3 pb-3 lg:px-4 lg:pb-4"
        >
          <ul className="flex gap-1 overflow-x-auto no-scrollbar lg:flex-col lg:gap-0.5 lg:overflow-visible">
            {NAV.map((item) => {
              const Icono = item.icono;
              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    className="group flex min-h-[42px] items-center gap-3 whitespace-nowrap rounded-control px-3 text-ui font-medium text-ink-soft transition-colors hover:bg-brand-tint hover:text-brand-deep"
                  >
                    <Icono className="h-[17px] w-[17px] shrink-0 text-ink-subtle transition-colors group-hover:text-brand" />
                    {item.label}
                    {/* Un punto en vez de la palabra "pendiente": ocupa nada y
                        se entiende igual al pasar el cursor. */}
                    {!item.listo && (
                      <span
                        title="Sección en construcción"
                        aria-label="en construcción"
                        className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-ink-faint"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Pie de la lateral: quién está dentro y las dos salidas. Antes el
            correo iba en el centro de la barra superior, en monoespaciada y
            partido en dos líneas — parecía la salida de una terminal. */}
        <div className="hidden border-t border-line px-4 py-4 lg:block lg:absolute lg:bottom-0 lg:w-64">
          <div className="flex items-center gap-3 px-1">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-ui font-semibold text-white"
            >
              {inicial}
            </span>
            <span
              title={user.email}
              className="min-w-0 flex-1 truncate text-ui text-ink-muted"
            >
              {user.email}
            </span>
          </div>

          <div className="mt-3 space-y-0.5">
            <a
              href="https://margaritarenace.com.ve"
              target="_blank"
              rel="noopener"
              className="flex min-h-[38px] items-center gap-2.5 rounded-control px-3 text-ui text-ink-muted transition-colors hover:bg-paper hover:text-brand"
            >
              <ExternalLink className="h-4 w-4" />
              Ver el sitio
            </a>
            <form action={cerrarSesionAction}>
              <button
                type="submit"
                className="flex min-h-[38px] w-full items-center gap-2.5 rounded-control px-3 text-ui text-ink-muted transition-colors hover:bg-paper hover:text-coral"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── Contenido ─────────────────────────────────────────────────────── */}
      <main className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-12">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
