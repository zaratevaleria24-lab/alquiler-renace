import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE, absoluteUrl } from '@/lib/site';
import { getContacto } from '@/lib/settings';
import { breadcrumbSchema, graph } from '@/lib/schema';
import { CATEGORIAS, POR_PAGINA, claveMaps, enCategoria, getConsejos, getLugares, miniatura, portadaDe, type Categoria } from '@/lib/guia';
import ListaGuia from '@/components/ListaGuia';
import MapaGuia from '@/components/MapaGuia';
import FiltroGuia from '@/components/FiltroGuia';
import HubGuia from '@/components/HubGuia';
import { HUBS } from '@/lib/guia-hubs';
import Bienvenida from '@/components/Bienvenida';

// GUÍA TURÍSTICA — /guia
//
// Se abre desde un QR pegado en cada apartamento, así que está hecha para el
// teléfono (8 de cada 10 visitas): bienvenida animada mientras carga, un hub
// de baldosas «Resolver / Descubrir» (HubGuia) en vez de una lista larga,
// tarjetas grandes con foto para lugares y tarjetas de acción (llamar,
// WhatsApp, ir) para servicios, y el mapa solo si lo piden. En escritorio
// queda la tira de chips de siempre. Los textos son
// nuestros (IDENTIDAD.md); los datos, de Google; las fotos, libres o nuestras.

export const revalidate = 3600;
const PATH = '/guia';
const TITULO = 'Guía de Isla de Margarita: playas, comida y servicios';
const DESCRIPCION = 'Playas, castillos, dónde comer, aventura y servicios a domicilio en la Isla de Margarita, con horarios, cómo llegar y consejos de gente de la isla.';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ c?: string }> }): Promise<Metadata> {
  const { c } = await searchParams;
  // Los filtros ?c= son la misma página: canonical a /guia y sin indexar (las
  // páginas por tema son /guia/playas, /guia/donde-comer, /guia/servicios, /guia/aventura).
  return { ...metadata, robots: c ? { index: false, follow: true } : undefined };
}
const metadata: Metadata = {
  title: TITULO, description: DESCRIPCION, alternates: { canonical: PATH },
  openGraph: { type: 'website', url: absoluteUrl(PATH), siteName: SITE.name, title: TITULO, description: DESCRIPCION, images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: TITULO }] },
  twitter: { card: 'summary_large_image', title: TITULO, description: DESCRIPCION, images: ['/opengraph-image'] },
};

export default async function GuiaPage({ searchParams }: { searchParams: Promise<{ c?: string; desde?: string }> }) {
  const [sp, lugares, consejos, contacto] = await Promise.all([searchParams, getLugares(), getConsejos(), getContacto()]);
  const cat = CATEGORIAS.find((c) => c.key === sp.c)?.key as Categoria | undefined;
  const visibles = cat ? lugares.filter((l) => enCategoria(l, cat)) : lugares;
  const cuenta = (k: Categoria) => lugares.filter((l) => enCategoria(l, k)).length;
  const puntos = lugares.filter((l) => l.latitud != null && l.longitud != null).map((l) => ({
    slug: l.slug, nombre: l.nombre, categoria: l.categoria, emoji: CATEGORIAS.find((c) => c.key === l.categoria)?.emoji ?? '📍',
    lat: l.latitud!, lng: l.longitud!, foto: portadaDe(l) ? miniatura(portadaDe(l)!.src) : null,
  }));
  const wa = contacto.whatsapp ? `https://wa.me/${contacto.whatsapp}?text=${encodeURIComponent('Hola, estoy viendo la guía turística de Margarita Renace y tengo una pregunta: ')}` : null;
  const jsonLd = graph(breadcrumbSchema([{ name: 'Inicio', path: '/' }, { name: 'Guía turística', path: PATH }]), {
    '@type': 'ItemList', name: TITULO, numberOfItems: lugares.length,
    itemListElement: lugares.slice(0, 30).map((l, i) => ({ '@type': 'ListItem', position: i + 1, url: absoluteUrl(`/guia/${l.slug}`), name: l.nombre })),
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Bienvenida forzar={sp.desde === 'qr'} />
      <div className="min-h-screen bg-paper">
        <header className="bg-luz border-b border-line">
          <div className="max-w-6xl mx-auto px-5 pb-4 pt-[84px] md:px-8 md:pb-8 md:pt-28">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="label-eyebrow text-brand-deep">Guía turística · {SITE.region.island}</p>
                {/* En teléfono la cabecera es de app: una pregunta y a los botones.
                    En escritorio queda el titular editorial de siempre. */}
                <h1 className="mt-1.5 font-serif font-normal leading-[1.05] track-headline text-ink">
                  <span className="text-[28px] md:hidden">¿Qué necesitas <em className="headline-italic">hoy</em>?</span>
                  <span className="hidden text-headline md:inline">Lo mejor de la isla, <em className="headline-italic">contado por gente de acá</em></span>
                </h1>
                <p className="mt-2 text-[13px] text-ink-muted md:hidden">{lugares.length} lugares y servicios · contado por gente de acá</p>
                <p className="mt-3 hidden max-w-xl text-meta text-ink-soft md:block md:text-body">
                  {lugares.length} lugares, planes y servicios con datos reales: horario, valoración, cómo llegar y el consejo que te daría un amigo margariteño.
                </p>
              </div>
              <img src="/logo-mark-teal.svg" alt="" width={72} height={72} className="hidden h-[72px] w-[72px] shrink-0 opacity-80 sm:block" />
            </div>
          </div>
          {/* Categorías: tira deslizable, pegada bajo la barra al hacer scroll */}
          <nav aria-label="Categorías" className="sticky top-[88px] z-30 border-t border-line/70 bg-paper/90 backdrop-blur-md md:top-[104px]">
            <FiltroGuia
              inicial={cat ?? ''}
              chips={[{ key: '', label: 'Todo', n: lugares.length }, ...CATEGORIAS.filter((c) => cuenta(c.key) > 0).map((c) => ({ key: c.key, label: c.plural, emoji: c.emoji, n: cuenta(c.key) }))]}
            />
          </nav>
        </header>

        <main className="max-w-6xl mx-auto px-5 py-5 md:px-8 md:py-10">
          <HubGuia
            inicial={cat ?? ''}
            whatsapp={contacto.whatsapp}
            baldosas={CATEGORIAS.filter((c) => cuenta(c.key) > 0).map((c) => ({ key: c.key, label: c.label, sub: c.sub, grupo: c.grupo, n: cuenta(c.key) }))}
          />
          <div id="resultados-guia" className="mt-8 flex flex-wrap items-baseline justify-between gap-3 md:mt-0">
            <h2 className="font-serif text-title-sm font-semibold text-ink">
              <span id="titulo-guia">{cat ? CATEGORIAS.find((c) => c.key === cat)!.plural : 'Imperdibles primero'}</span>{' '}
              <span id="cuenta-guia" className="mono-data text-ink-muted">{visibles.length}</span>
            </h2>
            <MapaGuia puntos={puntos} clave={claveMaps()} />
          </div>
          {/* Todas las tarjetas van en el HTML; el filtro solo las muestra u
              oculta (FiltroGuia). Las que no coinciden con ?c= salen ocultas
              desde el servidor, así el enlace compartido abre bien sin JS. */}
          {/* Solo lo que la tarjeta necesita: descripción y consejo recortados,
              una foto, sin horario completo ni resumen de Google. */}
          <ListaGuia cat={cat ?? ''} lugares={lugares.map((l) => ({
            ...l, descripcion: l.descripcion.slice(0, 180), consejo: l.consejo.slice(0, 180), resumenGoogle: null, direccion: (l.direccion ?? '').slice(0, 90),
            fotos: l.fotos.slice(0, 1), fotosGoogle: l.fotosGoogle.slice(0, 1).map((f) => ({ name: '', autor: f.autor })), horario: l.horario,
          }))} />
          <noscript><p className="mt-4 text-meta text-ink-muted">Sin JavaScript se muestran los primeros {POR_PAGINA} lugares; explora por tema en <Link href="/guia/playas">playas</Link>, <Link href="/guia/donde-comer">dónde comer</Link>, <Link href="/guia/servicios">servicios</Link> y <Link href="/guia/aventura">aventura</Link>.</p></noscript>

          <nav aria-label="Guías por tema" className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {HUBS.map((h) => (
              <Link key={h.slug} href={`/guia/${h.slug}`} className="rounded-card border border-line bg-white p-4 transition-colors hover:border-brand/40">
                <p className="label-eyebrow text-brand-deep">Guía por tema</p>
                <p className="mt-1 font-serif text-title-sm font-semibold text-ink">{h.h1[0]} <em className="headline-italic">{h.h1[1]}</em></p>
                <p className="mt-1 text-ui text-ink-muted">{lugares.filter((l) => (h.categorias as string[]).some((c) => enCategoria(l, c))).length} lugares →</p>
              </Link>
            ))}
          </nav>

          <section aria-labelledby="consejos" className="section-gap">
            <p className="label-eyebrow text-brand-deep">Antes de salir</p>
            <h2 id="consejos" className="mt-1.5 font-serif text-headline font-normal track-headline text-ink">Consejos de la isla, <em className="headline-italic">sin adornos</em></h2>
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {consejos.map((c) => (
                <details key={c.id} className="group rounded-card border border-line bg-white open:shadow-lift">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-body font-semibold text-brand-deep [&::-webkit-details-marker]:hidden">
                    {c.titulo}<span className="text-ink-faint transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="px-5 pb-5 text-body text-ink-soft leading-relaxed">{c.texto}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="section-gap rounded-panel bg-luz border border-line p-7 md:p-10">
            <h2 className="font-serif text-headline font-normal track-headline text-ink">¿Te quedas en la isla?</h2>
            <p className="mt-3 max-w-2xl text-body text-ink-soft">Tenemos apartamentos en Pampatar, Porlamar, Costa Azul y El Yaque, con precio claro y trato directo. Y si algo de esta guía no te cuadra, escríbenos: la corregimos.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/" className="btn-solid">Ver alojamientos</Link>
              {wa && <a href={wa} rel="noopener" className="inline-flex min-h-[46px] items-center rounded-control border border-line bg-white px-5 text-meta font-medium text-brand-deep hover:border-brand/40">Preguntar por WhatsApp</a>}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
