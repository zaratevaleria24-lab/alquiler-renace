import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getZone, getZonesAll } from '@/lib/queries';
import { getContacto } from '@/lib/settings';
import { getLugares } from '@/lib/guia';
import TarjetaGuia from '@/components/TarjetaGuia';
import { HUBS } from '@/lib/guia-hubs';
import { SITE, absoluteUrl } from '@/lib/site';

import {
  breadcrumbSchema,
  graph,
  zoneItemListSchema,
  zonePlaceSchema,
} from '@/lib/schema';

// Landing estática por zona de la isla: /alquiler/pampatar, /alquiler/porlamar…
//
// POR QUÉ: el home solo puede rankear para "alquiler Isla de Margarita", que es
// la búsqueda más competida. La intención real de la gente es más específica
// —"apartamentos en Pampatar", "alojamiento Playa El Yaque"— y esas búsquedas
// necesitan una URL propia con contenido propio. Es el mayor golpe de SEO local
// que se puede dar con el inventario actual.
//
// Cada página es Server Component estático (sin 'use client'): el HTML sale
// completo del build, con el texto en el markup, que es exactamente lo que
// necesitan los crawlers clásicos y los de IA. El home, al ser un componente
// cliente enorme, depende de hidratación para parte de su contenido.

// dynamicParams=true: si una zona estrena inventario publicado desde el panel,
// su landing se renderiza a demanda en la primera visita, sin rebuild.
export const dynamicParams = true;
// ISR: la página se sirve como estática y se regenera como mucho cada hora.
// El panel además llama revalidatePath('/', 'layout') al guardar, así que un
// cambio en el CMS se ve al instante; esto solo cubre lo que nadie tocó.
export const revalidate = 3600;

export async function generateStaticParams() {
  // Las 9 zonas, con o sin inventario: todas tienen texto propio y URL propia.
  const zones = await getZonesAll();
  return zones.map((zone) => ({ zona: zone.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ zona: string }>;
}): Promise<Metadata> {
  const { zona } = await params;
  const zone = await getZone(zona);
  if (!zone) return {};

  
  const path = `/alquiler/${zone.slug}`;
  const title = `Alquiler de Apartamentos en ${zone.name}, Isla de Margarita`;

  return {
    title,
    description: zone.summary,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: SITE.ogLocale,
      url: absoluteUrl(path),
      siteName: SITE.name,
      title,
      description: zone.summary,
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: zone.summary,
      images: ['/opengraph-image'],
    },
  };
}

export default async function ZonaPage({
  params,
}: {
  params: Promise<{ zona: string }>;
}) {
  const { zona } = await params;
  const zone = await getZone(zona);

  // Solo una zona que NO existe merece 404. Una zona sin inventario publicado
  // (Juan Griego, Manzanillo, Playa Caribe, Parguito, Guacuco) se renderiza
  // igual: tiene 300-400 palabras de geografía real y es exactamente lo que
  // busca alguien que escribe "alquiler en Juan Griego". Hasta 2026-09-12 esas
  // cinco redirigían a la home y Search Console las reportaba como "página
  // con redirección"; se perdían cinco URLs con contenido ya escrito. Cuando
  // no hay apartamentos se muestra un aviso honesto con el WhatsApp y las
  // zonas que sí tienen, en lugar de una lista vacía.
  if (!zone) notFound();

  const path = `/alquiler/${zone.slug}`;
  const [allZones, contacto] = await Promise.all([getZonesAll(), getContacto()]);
  const otherZones = allZones.filter((z) => z.slug !== zone.slug);
  const conInventario = otherZones.filter((z) => z.properties.length > 0);
  const cercanos = (await getLugares()).filter((l) => l.zoneSlug === zone.slug).slice(0, 9).map((l) => ({ ...l, descripcion: l.descripcion.slice(0, 160), consejo: l.consejo.slice(0, 160), resumenGoogle: null, fotos: l.fotos.slice(0, 1), fotosGoogle: l.fotosGoogle.slice(0, 1).map((f) => ({ name: '', autor: f.autor })) }));
  const sinInventario = zone.properties.length === 0;
  const waConsulta = contacto.whatsapp
    ? `https://wa.me/${contacto.whatsapp}?text=${encodeURIComponent(
        `Hola, busco apartamento en ${zone.name}, Isla de Margarita. Vi margaritarenace.com.ve — ¿tienen algo disponible o próximo?`,
      )}`
    : null;

  const jsonLd = graph(
    breadcrumbSchema([
      { name: 'Inicio', path: '/' },
      { name: `Alquiler en ${zone.name}`, path },
    ]),
    zonePlaceSchema(zone, { coast: zone.coast }),
    // Un ItemList vacío es markup sin sentido: solo se emite con inventario.
    ...(sinInventario ? [] : [zoneItemListSchema(zone, path)]),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <div className="min-h-screen bg-paper">
        {/* Color plano en vez del degradado de tres paradas que había antes
            (brand-deep → brand → accent). Un degradado ancho y saturado es una
            de las firmas más reconocibles de plantilla generada; un plano
            profundo con un filete de acento arriba se lee más editorial. */}
        <header className="relative bg-luz text-ink border-b border-line">
          
          <div className="max-w-5xl mx-auto px-5 pb-16 pt-28 md:px-8 md:pb-28 md:pt-40">
            <nav aria-label="Ruta de navegación" className="mb-8 text-ui">
              <ol className="flex flex-wrap items-center gap-2 text-ink-muted">
                <li>
                  <Link href="/" className="underline hover:text-brand">
                    Inicio
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="text-ink">Alquiler en {zone.name}</li>
              </ol>
            </nav>

            <p className="label-eyebrow mb-4 text-brand-deep">
              {SITE.region.island} · {SITE.region.state}
            </p>
            <h1 className="font-serif text-display font-normal leading-[1.05] track-display max-w-3xl">
              Alquiler de apartamentos en {zone.name},{' '}
              <em className="headline-italic">Isla de Margarita</em>
            </h1>
            <p className="mt-6 max-w-2xl text-body-lg text-ink-soft">
              {zone.summary}
            </p>

            <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-5">
              <div>
                <dt className="label-eyebrow text-brand-deep">
                  Hospedajes
                </dt>
                <dd className="mono-data mt-2 text-title-sm">
                  {zone.properties.length}{' '}
                  {zone.properties.length === 1 ? 'disponible' : 'disponibles'}
                </dd>
              </div>
              {zone.minPrice !== null && (
                <div>
                  <dt className="label-eyebrow text-brand-deep">
                    Desde
                  </dt>
                  <dd className="mono-data mt-2 text-title-sm">US${zone.minPrice} / noche</dd>
                </div>
              )}
              <div>
                <dt className="label-eyebrow text-brand-deep">
                  Ubicación
                </dt>
                <dd className="mono-data mt-2 text-title-sm">{zone.coast}</dd>
              </div>
            </dl>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-5 py-16 md:px-8 md:py-28">
          <section aria-labelledby="sobre-la-zona">
            <h2
              id="sobre-la-zona"
              className="font-serif text-headline text-ink font-normal track-headline"
            >
              Cómo es <em className="headline-italic">{zone.name}</em>
            </h2>
            <div className="mt-7 max-w-2xl space-y-5 text-body text-ink-soft leading-relaxed">
              {zone.body.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>

            {zone.nearby.length > 0 && (
              <div className="mt-10 rounded-card border border-line bg-white p-7">
                <h3 className="font-serif text-title-sm text-brand-deep font-semibold">
                  Qué hay cerca
                </h3>
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-2 text-body text-ink-soft">
                  {zone.nearby.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span aria-hidden="true" className="text-brand">
                        ·
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-body text-ink-muted">
                  Ideal para {zone.bestFor}.
                </p>
              </div>
            )}
          </section>

          {cercanos.length > 0 && (
            <section aria-labelledby="guia-zona" className="section-gap">
              <h2 id="guia-zona" className="font-serif text-headline text-ink font-normal track-headline">Qué hay en {zone.name}, <em className="headline-italic">según nuestra guía</em></h2>
              <p className="mt-3 max-w-2xl text-body text-ink-soft">{cercanos.length} lugares y servicios de {zone.name} que recomendamos a nuestros huéspedes, con horario de hoy, valoración en Google, teléfono y cómo llegar.</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{cercanos.map((l) => <TarjetaGuia key={l.id} l={l} />)}</ul>
              <p className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-meta">{HUBS.map((h) => <Link key={h.slug} href={`/guia/${h.slug}`} className="font-medium text-brand-deep underline-offset-4 hover:underline">{h.h1.join(' ')} →</Link>)}</p>
            </section>
          )}

          <section aria-labelledby="alojamientos" className="section-gap reveal">
            <h2
              id="alojamientos"
              className="font-serif text-headline text-ink font-normal track-headline"
            >
              Hospedajes en {zone.name}
            </h2>

            {sinInventario && (
              <div className="block-gap rounded-card border border-line bg-white p-7">
                <p className="text-body text-ink/80 leading-relaxed">
                  Todavía no tenemos apartamentos publicados en {zone.name}. Estamos
                  incorporando hospedajes zona por zona; si buscas en esta parte de
                  la isla, escríbenos y te avisamos apenas haya uno, o te orientamos
                  a la zona vecina más parecida.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {waConsulta && (
                    <a href={waConsulta} className="btn-solid" rel="noopener">
                      Consultar por WhatsApp
                    </a>
                  )}
                  {conInventario.slice(0, 3).map((z) => (
                    <Link
                      key={z.slug}
                      href={`/alquiler/${z.slug}`}
                      className="inline-flex min-h-[44px] items-center rounded-chip border border-line bg-white px-4 py-2 text-meta font-medium text-brand-deep transition-all hover:border-ink hover:shadow-hard-sm"
                    >
                      Ver hospedajes en {z.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <ul className="block-gap grid gap-8 md:gap-10 sm:grid-cols-2">
              {zone.properties.map((property) => (
                <li
                  key={property.id}
                  className="group overflow-hidden rounded-card border border-line bg-white transition-all duration-200 hover:border-ink hover:shadow-hard-sm"
                >
                  {/* Foto y nombre enlazan a la página propia de la propiedad:
                      sin estos enlaces, /propiedad/<slug> sería huérfana. */}
                  <Link href={`/propiedad/${property.slug}`}>
                    <img
                      src={property.image}
                      alt={`${property.name} — alojamiento en ${property.zone}, Isla de Margarita`}
                      width={800}
                      height={600}
                      loading="lazy"
                      decoding="async"
                      className="h-56 w-full object-cover"
                    />
                  </Link>
                  <div className="p-5">
                    <h3 className="font-serif text-title-sm text-brand-deep font-semibold">
                      <Link
                        href={`/propiedad/${property.slug}`}
                        className="hover:underline underline-offset-4"
                      >
                        {property.name}
                      </Link>
                    </h3>
                    <p className="mt-1 text-body text-ink/60">
                      {property.location}
                    </p>
                    <p className="mt-3 text-body text-ink/80 leading-relaxed">
                      {property.description}
                    </p>
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {property.amenities.slice(0, 5).map((amenity) => (
                        <li
                          key={amenity.name}
                          className="rounded-chip bg-paper px-2.5 py-1 text-ui text-brand-deep"
                        >
                          {amenity.name}
                        </li>
                      ))}
                    </ul>
                    <p className="mono-data mt-5 text-brand-deep">
                      {property.priceText}
                    </p>
                    <p className="mt-1 text-meta text-ink/60">
                      Hasta {property.guestsAllowed.adults} adultos
                      {property.guestsAllowed.children > 0 &&
                        ` y ${property.guestsAllowed.children} niños`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-10">
              <Link
                href="/"
                className="btn-solid"
              >
                Ver todos los hospedajes de la isla
              </Link>
            </p>
          </section>

          {/* Enlazado interno entre zonas: reparte autoridad y le da a los
              crawlers un camino a todas las landings desde cualquiera de ellas. */}
          <nav aria-labelledby="otras-zonas" className="section-gap reveal">
            <h2
              id="otras-zonas"
              className="font-serif text-headline text-ink font-normal track-headline"
            >
              Otras zonas de la Isla de Margarita
            </h2>
            <ul className="mt-6 flex flex-wrap gap-3">
              {otherZones.map((other) => (
                <li key={other.slug}>
                  <Link
                    href={`/alquiler/${other.slug}`}
                    className="inline-flex min-h-[44px] items-center rounded-chip border border-line bg-white px-4 py-2 text-meta font-medium text-brand-deep transition-all hover:border-ink hover:shadow-hard-sm"
                  >
                    {other.name}
                    {other.properties.length > 0 && (
                      <span className="ml-2 text-ink/50">
                        {other.properties.length}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </main>
      </div>
    </>
  );
}
