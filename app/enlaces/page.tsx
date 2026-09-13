import type { Metadata } from 'next';
import Link from 'next/link';
import { getAnunciosAirbnb, getEnlacesPublicos } from '@/lib/enlaces';
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
// LA FORMA (desde 2026-09-13, dirección «Amanecer»)
//
// Fondo `.bg-luz` (durazno → agua) como la cabecera de la guía, el emblema
// nuevo en azulejo grande y sin marco, el nombre con «Renace» en terracota como
// en la barra del sitio, y botones-pastilla con línea fina y sombra suave. El
// destacado (WhatsApp, el que no paga comisión) va lleno de azul profundo. Se
// quitaron la sombra dura y los anillos: era el brutalismo que el dueño pidió
// dejar atrás. Es la única página del sitio con pastillas, y puede porque no
// comparte pantalla con ninguna otra.

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
  const [{ botones, circulos }, ajustes, anuncios] = await Promise.all([
    getEnlacesPublicos(),
    getAjustes(),
    getAnunciosAirbnb(),
  ]);

  return (
    <main className="bg-luz relative isolate flex min-h-dvh flex-col justify-center overflow-hidden px-5 py-12">

      <div className="mx-auto w-full max-w-[27rem]">
        <header className="text-center">
          {/* Retrato con dos anillos concéntricos. El logo ya es cuadrado y
              tiene su versión de avatar; los anillos son lo que lo convierte en
              el centro de la composición sin agrandarlo. */}
          {/* El emblema nuevo, en azulejo y sin marco: es el mismo que va en la
              barra del sitio y en el cartel del QR. */}
          <img
            src="/logo-mark-teal.svg"
            alt={`Emblema de ${SITE.name}`}
            width={132}
            height={132}
            fetchPriority="high"
            className="mx-auto h-[132px] w-[132px]"
          />

          <h1 className="mt-5 font-serif text-headline font-semibold track-headline text-ink">
            Margarita <span className="text-accent">Renace</span>
          </h1>

          <p className="mx-auto mt-3 max-w-[22rem] text-meta text-ink-soft">
            {ajustes.enlaces_frase}
          </p>
        </header>

        <BotonesEnlaces botones={botones} circulos={circulos} anuncios={anuncios} />

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
