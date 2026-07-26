import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ZONES, getZone } from '@/lib/listings';
import { SITE, absoluteUrl } from '@/lib/site';
import { getZoneCopy } from '@/lib/zones-content';
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

export const dynamicParams = false;

export function generateStaticParams() {
  return ZONES.map((zone) => ({ zona: zone.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ zona: string }>;
}): Promise<Metadata> {
  const { zona } = await params;
  const zone = getZone(zona);
  if (!zone) return {};

  const copy = getZoneCopy(zone.slug, zone.name);
  const path = `/alquiler/${zone.slug}`;
  const title = `Alquiler de Apartamentos en ${zone.name}, Isla de Margarita`;

  return {
    title,
    description: copy.summary,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: SITE.ogLocale,
      url: absoluteUrl(path),
      siteName: SITE.name,
      title,
      description: copy.summary,
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: copy.summary,
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
  const zone = getZone(zona);
  if (!zone) notFound();

  const copy = getZoneCopy(zone.slug, zone.name);
  const path = `/alquiler/${zone.slug}`;
  const otherZones = ZONES.filter((z) => z.slug !== zone.slug);

  const jsonLd = graph(
    breadcrumbSchema([
      { name: 'Inicio', path: '/' },
      { name: `Alquiler en ${zone.name}`, path },
    ]),
    zonePlaceSchema(zone, copy),
    zoneItemListSchema(zone, path),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <div className="min-h-screen bg-[#F6F4EE]">
        <header className="bg-gradient-to-br from-[#0C4A5A] via-[#0E7490] to-[#21BBBB] text-white">
          <div className="max-w-5xl mx-auto px-5 py-14 md:px-8 md:py-20">
            <nav aria-label="Ruta de navegación" className="mb-8 text-sm">
              <ol className="flex flex-wrap items-center gap-2 text-white/80">
                <li>
                  <Link href="/" className="underline hover:text-white">
                    Inicio
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="text-white">Alquiler en {zone.name}</li>
              </ol>
            </nav>

            <p className="mb-3 text-xs md:text-sm uppercase tracking-[0.25em] text-[#5EEAD4]">
              {SITE.region.island} · {SITE.region.state}
            </p>
            <h1 className="font-serif text-3xl md:text-5xl font-semibold leading-tight max-w-3xl">
              Alquiler de apartamentos en {zone.name}, Isla de Margarita
            </h1>
            <p className="mt-5 max-w-2xl text-base md:text-lg text-white/90">
              {copy.summary}
            </p>

            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-sm">
              <div>
                <dt className="text-[#5EEAD4] uppercase tracking-wider text-xs">
                  Alojamientos
                </dt>
                <dd className="mt-1 text-lg">
                  {zone.properties.length}{' '}
                  {zone.properties.length === 1 ? 'disponible' : 'disponibles'}
                </dd>
              </div>
              {zone.minPrice !== null && (
                <div>
                  <dt className="text-[#5EEAD4] uppercase tracking-wider text-xs">
                    Desde
                  </dt>
                  <dd className="mt-1 text-lg">US${zone.minPrice} / noche</dd>
                </div>
              )}
              <div>
                <dt className="text-[#5EEAD4] uppercase tracking-wider text-xs">
                  Ubicación
                </dt>
                <dd className="mt-1 text-lg">{copy.coast}</dd>
              </div>
            </dl>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-5 py-14 md:px-8 md:py-20">
          <section aria-labelledby="sobre-la-zona">
            <h2
              id="sobre-la-zona"
              className="font-serif text-2xl md:text-3xl text-[#0C4A5A] font-semibold"
            >
              Cómo es {zone.name}
            </h2>
            <div className="mt-5 space-y-4 text-[#1A1A1A]/85 leading-relaxed">
              {copy.body.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>

            {copy.nearby.length > 0 && (
              <div className="mt-8 rounded-2xl border border-[#E6D7C2] bg-white/70 p-6 backdrop-blur-sm">
                <h3 className="font-serif text-lg text-[#0C4A5A] font-semibold">
                  Qué hay cerca
                </h3>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-sm text-[#1A1A1A]/80">
                  {copy.nearby.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span aria-hidden="true" className="text-[#0E7490]">
                        ·
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm text-[#1A1A1A]/70">
                  Ideal para {copy.bestFor}.
                </p>
              </div>
            )}
          </section>

          <section aria-labelledby="alojamientos" className="mt-16">
            <h2
              id="alojamientos"
              className="font-serif text-2xl md:text-3xl text-[#0C4A5A] font-semibold"
            >
              Alojamientos en {zone.name}
            </h2>

            <ul className="mt-8 grid gap-8 sm:grid-cols-2">
              {zone.properties.map((property) => (
                <li
                  key={property.id}
                  className="overflow-hidden rounded-2xl border border-[#E6D7C2] bg-white"
                >
                  <img
                    src={property.image}
                    alt={`${property.name} — alojamiento en ${property.zone}, Isla de Margarita`}
                    width={800}
                    height={600}
                    loading="lazy"
                    decoding="async"
                    className="h-56 w-full object-cover"
                  />
                  <div className="p-5">
                    <h3 className="font-serif text-xl text-[#0C4A5A] font-semibold">
                      {property.name}
                    </h3>
                    <p className="mt-1 text-sm text-[#1A1A1A]/60">
                      {property.location}
                    </p>
                    <p className="mt-3 text-sm text-[#1A1A1A]/80 leading-relaxed">
                      {property.description}
                    </p>
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {property.amenities.slice(0, 5).map((amenity) => (
                        <li
                          key={amenity.name}
                          className="rounded-full bg-[#F6F4EE] px-3 py-1 text-xs text-[#0C4A5A]"
                        >
                          {amenity.name}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 font-medium text-[#0E7490]">
                      {property.priceText}
                    </p>
                    <p className="mt-1 text-xs text-[#1A1A1A]/60">
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
                className="inline-block rounded-full bg-gradient-to-r from-[#0E7490] to-[#0C4A5A] px-7 py-3 text-white"
              >
                Ver todos los alojamientos de la isla
              </Link>
            </p>
          </section>

          {/* Enlazado interno entre zonas: reparte autoridad y le da a los
              crawlers un camino a todas las landings desde cualquiera de ellas. */}
          <nav aria-labelledby="otras-zonas" className="mt-16">
            <h2
              id="otras-zonas"
              className="font-serif text-2xl md:text-3xl text-[#0C4A5A] font-semibold"
            >
              Otras zonas de la Isla de Margarita
            </h2>
            <ul className="mt-6 flex flex-wrap gap-3">
              {otherZones.map((other) => (
                <li key={other.slug}>
                  <Link
                    href={`/alquiler/${other.slug}`}
                    className="inline-block rounded-full border border-[#0E7490]/30 bg-white px-4 py-2 text-sm text-[#0C4A5A] hover:border-[#0E7490]"
                  >
                    {other.name}
                    <span className="ml-2 text-[#1A1A1A]/50">
                      {other.properties.length}
                    </span>
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
