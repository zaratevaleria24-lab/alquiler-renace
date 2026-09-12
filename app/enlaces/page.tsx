import type { Metadata } from 'next';
import Link from 'next/link';
import { getEnlacesPublicos } from '@/lib/enlaces';
import { getAjustes } from '@/lib/settings';
import { SITE } from '@/lib/site';
import { BotonesEnlaces } from '@/components/BotonesEnlaces';

// La página del «link en la bio»: la que se pega en Instagram y TikTok, donde
// solo cabe una URL.
//
// ═══════════════════════════════════════════════════════════════════════════
// POR QUÉ PROPIA Y NO LINKTREE
//
//   1. El dominio es tuyo. La bio dice margaritarenace.com.ve/enlaces, no el
//      nombre de otra empresa, y la visita cae en tu casa en vez de regalarle
//      el tráfico a un intermediario.
//   2. Carga en Venezuela. Linktree sirve fuentes, iconos y scripts desde CDNs
//      de terceros; en este país eso se bloquea o se arrastra, y es el mismo
//      motivo por el que las 26 fotos del sitio se bajaron a public/images el
//      2026-07-25. Acá no hay una sola petición a un servidor ajeno.
//   3. Los clics son tuyos. Se cuentan con el recolector propio (sin cookies,
//      sin IPs) y se ven en el panel, junto a cada botón.
//   4. No hay cuota ni límite de enlaces, y el aspecto es el del sitio.
//
// ═══════════════════════════════════════════════════════════════════════════
// LA FORMA: TODO CÍRCULOS
//
// Pedido explícito. El sistema del sitio evita la pastilla por defecto —37
// `rounded-full` fueron parte de lo que hacía que la página anterior se viera
// de plantilla, ver globals.css— así que acá el círculo NO se deja solo: va
// con el borde de tinta y la sombra dura de la casa. Pastilla + sombra dura no
// es el aspecto genérico de un generador de enlaces; pastilla sola, sí.
//
// El resto del vocabulario redondo lo dan el retrato con sus anillos
// concéntricos, los medallones de cada botón, la tira de redes y los dos halos
// del fondo. Es la única página del sitio con esta libertad, y se la puede
// permitir porque no comparte pantalla con ninguna otra.

export const metadata: Metadata = {
  title: 'Enlaces',
  description: `Todos los enlaces de ${SITE.name}: WhatsApp, reservas directas, Airbnb y redes sociales.`,
  alternates: { canonical: '/enlaces' },
  // NOINDEX A PROPÓSITO. Es una página de botones sin contenido propio: si
  // Google la indexa, compite con el inicio por las búsquedas de la marca y
  // gana la peor de las dos —quien busca «Margarita Renace» debe caer en los
  // alojamientos, no en un menú—. `follow` sí: los enlaces internos que salen
  // de acá se siguen valorando. Por lo mismo no está en app/sitemap.ts.
  robots: { index: false, follow: true },
  openGraph: {
    title: `${SITE.name} — enlaces`,
    description: SITE.shortDescription,
    url: '/enlaces',
  },
};

export default async function EnlacesPage() {
  const [{ botones, circulos }, ajustes] = await Promise.all([
    getEnlacesPublicos(),
    getAjustes(),
  ]);

  return (
    <main className="relative isolate flex min-h-dvh flex-col justify-center overflow-hidden px-5 py-14">
      {/* Los dos halos. Círculos difusos de color, no un degradado de esquina a
          esquina: repiten la geometría de la página y dejan el centro limpio
          para que el texto no pierda contraste. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-16rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,var(--color-brand-soft)_0%,transparent_65%)] opacity-80" />
        <div className="absolute bottom-[-18rem] left-[-8rem] h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,var(--color-paper-warm)_0%,transparent_70%)]" />
      </div>

      <div className="mx-auto w-full max-w-[27rem]">
        <header className="text-center">
          {/* Retrato con dos anillos concéntricos. El logo ya es cuadrado y
              tiene su versión de avatar; los anillos son lo que lo convierte en
              el centro de la composición sin agrandarlo. */}
          <div className="relative mx-auto h-28 w-28">
            <span
              aria-hidden="true"
              className="absolute inset-[-11px] rounded-full border border-line"
            />
            <span
              aria-hidden="true"
              className="absolute inset-[-22px] rounded-full border border-line/55"
            />
            <img
              src="/logo-avatar.png"
              alt={`Logotipo de ${SITE.name}`}
              width={112}
              height={112}
              // Es el elemento más grande de la primera pantalla: se carga con
              // prioridad en vez de perezoso, como el hero del inicio.
              fetchPriority="high"
              className="relative h-28 w-28 rounded-full bg-white object-cover shadow-lift ring-1 ring-line"
            />
          </div>

          <h1 className="mt-7 font-serif text-headline font-normal track-headline text-ink">
            Margarita <em className="headline-italic">Renace</em>
          </h1>

          <p className="mx-auto mt-3 max-w-[22rem] text-meta text-ink-soft">
            {ajustes.enlaces_frase}
          </p>
        </header>

        <BotonesEnlaces botones={botones} circulos={circulos} />

        {botones.length === 0 && circulos.length === 0 && (
          // Solo se llega acá si alguien desactivó todos los enlaces o borró la
          // tabla. Antes que una página en blanco, la puerta del sitio.
          <p className="mt-10 text-center text-meta text-ink-muted">
            <Link href="/" className="underline underline-offset-4">
              Ver los alojamientos
            </Link>
          </p>
        )}

        <footer className="mt-12 text-center">
          <Link
            href="/"
            className="mono-data text-ink-subtle transition-colors hover:text-brand"
          >
            {SITE.url.replace('https://', '')}
          </Link>
          <p className="mt-2 text-ui text-ink-faint">
            {SITE.region.island} · {SITE.region.countryName}
          </p>
        </footer>
      </div>
    </main>
  );
}
