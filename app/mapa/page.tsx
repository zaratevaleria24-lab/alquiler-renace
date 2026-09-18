import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE, absoluteUrl } from '@/lib/site';
import { breadcrumbSchema, graph } from '@/lib/schema';
import { CATEGORIAS, categoriaPlural } from '@/lib/guia-comun';
import { getPuntosMapa } from '@/lib/mapa';
import MapaIsla from '@/components/MapaIsla';

// MAPA DE LA ISLA — /mapa
//
// La guía contesta «¿qué hay?»; el mapa contesta «¿qué tengo cerca?», que es la
// pregunta del huésped que ya está acá con el teléfono en la mano. Por eso el
// mapa no es una vista más de la guía: es su propia pestaña, con los cuatro
// apartamentos encima y un radio de un kilómetro a pie desde cada uno.
//
// Debajo del mapa va la MISMA lista en HTML, con enlaces a cada ficha. No es
// relleno: es lo que puede rastrear Google (un lienzo WebGL no se indexa) y lo
// que ve quien tenga el JavaScript bloqueado o una conexión que no aguante el
// motor del mapa.

export const revalidate = 3600;
const PATH = '/mapa';
const TITULO = 'Mapa turístico de Isla de Margarita';
const DESCRIPCION = 'Mapa interactivo de la Isla de Margarita con playas, restaurantes, farmacias, agua, talleres y nuestros apartamentos en Pampatar. Localiza los lugares y organiza tus recorridos.';

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRIPCION,
  alternates: { canonical: PATH },
  openGraph: { type: 'website', url: absoluteUrl(PATH), siteName: SITE.name, title: TITULO, description: DESCRIPCION, images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: TITULO }] },
  twitter: { card: 'summary_large_image', title: TITULO, description: DESCRIPCION, images: ['/opengraph-image'] },
};

export default async function MapaPage() {
  const puntos = await getPuntosMapa();
  const lugares = puntos.filter((p) => p.tipo === 'lugar');
  const casas = puntos.filter((p) => p.tipo === 'alojamiento');
  const jsonLd = graph(breadcrumbSchema([{ name: 'Inicio', path: '/' }, { name: 'Mapa de la isla', path: PATH }]), {
    '@type': 'ItemList',
    name: TITULO,
    numberOfItems: lugares.length,
    itemListElement: lugares.map((l, i) => ({ '@type': 'ListItem', position: i + 1, url: absoluteUrl(`/guia/${l.slug}`), name: l.nombre })),
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div className="min-h-screen bg-paper">
        <header className="bg-luz border-b border-line">
          <div className="mx-auto max-w-6xl px-5 pb-3 pt-[80px] md:px-8 md:pb-4 md:pt-24">
            <p className="label-eyebrow text-brand-deep">Mapa · {SITE.region.island}</p>
            <h1 className="mt-1.5 font-serif font-normal leading-[1.05] track-headline text-ink">
              <span className="text-[28px] md:text-headline">Mapa turístico de <em className="headline-italic">Isla de Margarita</em></span>
            </h1>
            <p className="mt-2 max-w-2xl text-meta text-ink-soft">
              {lugares.length} lugares de la guía y nuestros {casas.length} apartamentos. Toca «A pie desde» uno y verás
              los puntos dentro de un radio de un kilómetro. La distancia es en línea recta; confirma el acceso y la ruta antes de ir.
            </p>
            <p className="mt-3 text-meta text-brand-deep"><Link href="/guia/que-hacer" className="underline">Qué hacer en Margarita</Link> · <Link href="/guia" className="underline">Explorar la guía turística</Link></p>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-5 py-4 md:px-8 md:py-5">
          <MapaIsla puntos={puntos} />

          <section className="mt-12">
            <h2 className="font-serif text-title-sm font-semibold text-ink">Todo lo que está en el mapa</h2>
            <p className="mt-1.5 max-w-2xl text-meta text-ink-muted">
              La misma lista, en texto: cada nombre lleva a su ficha con horario, teléfono y cómo llegar.
            </p>

            <div className="mt-6 flex flex-col gap-7">
              {casas.length > 0 && (
                <div>
                  <h3 className="text-micro font-semibold uppercase tracking-[0.14em] text-brand-deep">Dormir</h3>
                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                    {casas.map((c) => (
                      <li key={c.slug} className="text-meta">
                        <Link href={`/propiedad/${c.slug}`} className="text-ink-soft underline-offset-4 hover:text-brand hover:underline">{c.nombre}</Link>
                        <span className="text-ink-faint"> · US${c.precio}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {CATEGORIAS.map((c) => {
                const suyos = lugares.filter((l) => l.categoria === c.key);
                if (suyos.length === 0) return null;
                return (
                  <div key={c.key}>
                    <h3 className="text-micro font-semibold uppercase tracking-[0.14em] text-brand-deep">
                      <span aria-hidden>{c.emoji}</span> {categoriaPlural(c.key)} <span className="font-normal text-ink-faint">{suyos.length}</span>
                    </h3>
                    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                      {suyos.map((l) => (
                        <li key={l.slug} className="text-meta">
                          <Link href={`/guia/${l.slug}`} className="text-ink-soft underline-offset-4 hover:text-brand hover:underline">{l.nombre}</Link>
                          {l.zona && <span className="text-ink-faint"> · {l.zona}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            <p className="mt-10 max-w-2xl text-micro text-ink-muted">
              El mapa lo dibujamos nosotros con datos de <a href="https://www.openstreetmap.org/copyright" rel="noopener" className="underline underline-offset-4">OpenStreetMap</a> (licencia ODbL)
              servidos desde este mismo dominio: no hay Google Maps ni ningún otro servicio ajeno cargando en tu teléfono, que en Venezuela es la diferencia entre que abra y que no.
              La ubicación de los apartamentos es la de su urbanización, no la de su puerta.
            </p>
          </section>
        </main>
      </div>
    </>
  );
}
