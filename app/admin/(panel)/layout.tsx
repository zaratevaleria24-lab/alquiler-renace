import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ExternalLink, LogOut } from 'lucide-react';
import { usuarioActual } from '@/lib/auth';
import { contarPendientes } from '@/lib/pendientes';
import { cerrarSesionAction } from '../actions';
import NavLateral from './NavLateral';

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
// ── LA LATERAL: DE COLUMNA A TIRA DE ICONOS (2026-08-03) ───────────────────
// Primero fue barra superior horizontal, y con seis secciones se desbordaba a
// dos líneas. Se pasó a columna de 16rem con iconos y texto. Ahora es una TIRA
// de 60px, solo iconos: el panel tiene seis secciones que se aprenden en un día,
// y el texto repetido en cada visita no aportaba nada mientras se comía 200px de
// ancho útil en cada pantalla. El nombre sigue estando al pasar el cursor y para
// los lectores de pantalla — ver NavLateral.tsx.
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

  // Los avisos ya NO ocupan media pantalla de cada sección: todo lo que falta
  // vive en /admin/pendientes y acá queda una cifra sobre su icono. Un cartel
  // grande que no se puede atender desde donde está solo estorba el trabajo.
  const pendientes = await contarPendientes();

  const inicial = user.email.trim().charAt(0).toUpperCase() || '·';

  return (
    <div className="min-h-screen bg-paper lg:flex">
      {/* ── Tira lateral ───────────────────────────────────────────────────
          60px en escritorio. En móvil se vuelve una franja horizontal con
          scroll: una columna fija se comería la pantalla de un teléfono. */}
      <aside className="flex items-center justify-between border-b border-line bg-white lg:sticky lg:top-0 lg:h-screen lg:w-[60px] lg:shrink-0 lg:flex-col lg:justify-start lg:border-b-0 lg:border-r">
        <Link
          href="/admin"
          title="Margarita Renace · Panel"
          className="flex h-14 w-14 shrink-0 items-center justify-center lg:h-[60px] lg:w-[60px]"
        >
          <img
            src="/icon.png"
            alt="Panel de Margarita Renace"
            width={28}
            height={28}
            className="h-7 w-7 rounded-chip"
          />
        </Link>

        <NavLateral pendientes={pendientes} />

        {/* Pie: quién está dentro y las dos salidas. En móvil va a la derecha
            de la franja, en escritorio abajo. */}
        <div className="flex items-center gap-1 px-2 lg:mt-auto lg:flex-col lg:gap-1 lg:border-t lg:border-line lg:px-0 lg:py-3">
          <span
            title={user.email}
            aria-label={`Sesión de ${user.email}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-ui font-semibold text-white"
          >
            {inicial}
          </span>

          <a
            href="https://margaritarenace.com.ve"
            target="_blank"
            rel="noopener"
            title="Ver el sitio"
            className="flex h-10 w-10 items-center justify-center rounded-control text-ink-subtle transition-colors hover:bg-paper hover:text-brand"
          >
            <ExternalLink className="h-[17px] w-[17px]" />
            <span className="sr-only">Ver el sitio público</span>
          </a>

          <form action={cerrarSesionAction}>
            <button
              type="submit"
              title="Salir"
              className="flex h-10 w-10 items-center justify-center rounded-control text-ink-subtle transition-colors hover:bg-paper hover:text-coral"
            >
              <LogOut className="h-[17px] w-[17px]" />
              <span className="sr-only">Cerrar sesión</span>
            </button>
          </form>
        </div>
      </aside>

      {/* ── Contenido ─────────────────────────────────────────────────────── */}
      <main className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-12">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
