import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { usuarioActual } from '@/lib/auth';
import { cerrarSesionAction } from '../actions';

// Marco del panel — layout del grupo de rutas (panel).
//
// POR QUÉ EL GRUPO `(panel)`: este layout redirige a /login cuando no hay
// sesión. La primera versión ponía el login DENTRO de app/admin/ con un layout
// hermano, creyendo que eso lo dejaba fuera del guardia. Es falso: en el App
// Router los layouts anidados SE COMPONEN, no se reemplazan, así que este
// layout seguía envolviendo al login y salía un bucle infinito de
// redirecciones — /login redirigía a /login. Comprobado en vivo.
//
// Los paréntesis del grupo no aparecen en la URL: /admin/(panel)/page.tsx sirve
// /admin. El login queda en app/admin/login, fuera del grupo, así que este
// guardia no lo alcanza.
//
// Hereda app/globals.css del layout raíz, así que comparte con el sitio público
// las tres tipografías, el sello romana/cursiva, la paleta de hueso y mar
// profundo, los radios y el ritmo. Es a propósito: el panel no es una
// herramienta aparte, es la otra cara del mismo producto. Con dos sistemas de
// diseño separados uno de los dos se queda atrás siempre.
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
const NAV = [
  { href: '/admin', label: 'Resumen' },
  { href: '/admin/propiedades', label: 'Propiedades' },
  { href: '/admin/contenido', label: 'Contenido' },
  { href: '/admin/vehiculos', label: 'Vehículos' },
  { href: '/admin/zonas', label: 'Zonas' },
  { href: '/admin/metricas', label: 'Métricas' },
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

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5">
              <img
                src="/icon.png"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 rounded-chip"
              />
              <span className="font-serif text-body font-semibold text-ink">
                Margarita{' '}
                <em className="headline-italic not-italic text-brand">Panel</em>
              </span>
            </Link>
          </div>

          <nav aria-label="Secciones del panel">
            <ul className="flex flex-wrap items-center gap-1">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-[38px] items-center rounded-chip px-3.5 text-ui font-medium text-ink-muted transition-colors hover:bg-brand-tint hover:text-brand-deep"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-4">
            <span className="mono-data text-ink-subtle">{user.email}</span>
            <form action={cerrarSesionAction}>
              <button
                type="submit"
                className="text-ui text-ink-muted underline-offset-4 hover:text-brand hover:underline"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
        {children}
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-6 md:px-8">
          <p className="mono-data text-ink-subtle">
            Panel de Margarita Renace ·{' '}
            <a
              href="https://margaritarenace.com.ve"
              className="underline-offset-4 hover:underline"
              target="_blank"
              rel="noopener"
            >
              ver el sitio público
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
