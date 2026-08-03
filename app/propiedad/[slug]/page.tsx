import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProperties, getProperty, getZone } from '@/lib/queries';
import { CONTACT, SITE, absoluteUrl } from '@/lib/site';
import { iconFor } from '@/lib/icons';
import { breadcrumbSchema, graph, propertySchema } from '@/lib/schema';

// Página propia por propiedad: /propiedad/los-geranios-a, etc.
//
// POR QUÉ EXISTE: hasta 2026-08 el detalle de una propiedad solo vivía en un
// drawer del home, sin URL. Consecuencias: no se podía compartir un alojamiento
// por WhatsApp —que es COMO se recomienda alquiler en Venezuela— y Google no
// podía posicionar ninguna propiedad por su nombre. Esta página resuelve las
// dos cosas: URL compartible con su tarjeta OG (la foto del alojamiento, no la
// genérica del sitio) y una entrada indexable por propiedad.
//
// Igual que las landings de zona: Server Component estático, HTML completo en
// el build. El drawer del home sigue existiendo como UX rápida de exploración;
// esta es la versión canónica y enlazable del mismo contenido.

export const dynamicParams = false;

export async function generateStaticParams() {
  const properties = await getProperties();
  return properties.map((p) => ({ slug: p.slug }));
}

/** Meta description: la de la propiedad, recortada a tamaño de snippet. */
function metaDescription(text: string): string {
  return text.length > 158 ? `${text.slice(0, 155).trimEnd()}…` : text;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property) return {};

  const path = `/propiedad/${property.slug}`;
  const title = `${property.name} — Alquiler en ${property.zone}, Isla de Margarita`;
  const description = metaDescription(property.description);
  // La tarjeta social lleva la foto del alojamiento: al compartir el enlace por
  // WhatsApp se ve la propiedad, no el logo. Es la mitad del valor de la página.
  const ogImage = absoluteUrl(property.image);

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: SITE.ogLocale,
      url: absoluteUrl(path),
      siteName: SITE.name,
      title,
      description,
      images: [{ url: ogImage, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

/** Mensaje precargado del CTA. Sin noches/huéspedes: la página es estática y
 *  no tiene el estado del drawer; el detalle se conversa en WhatsApp. */
function urlConsultaWhatsApp(name: string, location: string): string | null {
  if (!CONTACT.whatsapp) return null;
  const texto = `Hola, vi «${name}» (${location}) en margaritarenace.com.ve y quiero saber disponibilidad para mis fechas.`;
  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(texto)}`;
}

export default async function PropiedadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property) notFound();

  const path = `/propiedad/${property.slug}`;
  const zonePath = `/alquiler/${property.zoneSlug}`;
  const zone = await getZone(property.zoneSlug);
  const vecinas = (zone?.properties ?? []).filter((p) => p.slug !== property.slug);
  const whatsapp = urlConsultaWhatsApp(property.name, property.location);
  const capacidad =
    property.guestsAllowed.adults +
    (property.guestsAllowed.children > 0
      ? ` adultos y ${property.guestsAllowed.children} niños`
      : ' adultos');

  const jsonLd = graph(
    breadcrumbSchema([
      { name: 'Inicio', path: '/' },
      { name: `Alquiler en ${property.zone}`, path: zonePath },
      { name: property.name, path },
    ]),
    propertySchema(property, path),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <div className="min-h-screen bg-paper">
        <header className="relative bg-brand-deep text-white">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-accent" />
          <div className="max-w-5xl mx-auto px-5 py-14 md:px-8 md:py-20">
            <nav aria-label="Ruta de navegación" className="mb-8 text-ui">
              <ol className="flex flex-wrap items-center gap-2 text-white/80">
                <li>
                  <Link href="/" className="underline hover:text-white">
                    Inicio
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href={zonePath} className="underline hover:text-white">
                    {property.zone}
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="text-white">{property.name}</li>
              </ol>
            </nav>

            <p className="label-eyebrow mb-4 text-accent">
              {property.zone} · {SITE.region.island}
            </p>
            <h1 className="font-serif text-display font-normal leading-[1.05] track-display max-w-3xl">
              {property.name}
            </h1>
            <p className="mt-4 max-w-2xl text-body-lg text-white/85">
              {property.location}
            </p>

            <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-5">
              <div>
                <dt className="label-eyebrow text-accent">Tarifa</dt>
                <dd className="mono-data mt-2 text-title-sm">{property.priceText}</dd>
              </div>
              <div>
                <dt className="label-eyebrow text-accent">Capacidad</dt>
                <dd className="mono-data mt-2 text-title-sm">
                  {capacidad}
                </dd>
              </div>
            </dl>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-5 py-16 md:px-8 md:py-24">
          {/* Galería. La portada es el LCP de la página: sin lazy y con
              fetchPriority alto, igual que el hero del home. */}
          <section aria-label="Fotos del alojamiento">
            <div className="overflow-hidden rounded-card border border-line">
              <img
                src={property.image}
                alt={`${property.name} — alquiler en ${property.zone}, Isla de Margarita`}
                width={1200}
                height={750}
                fetchPriority="high"
                decoding="async"
                className="aspect-[16/10] w-full object-cover"
              />
            </div>
            {property.images.length > 1 && (
              <ul className="mt-3 grid grid-cols-3 gap-3">
                {property.images
                  .filter((img) => img.path !== property.image)
                  .map((img, idx) => (
                    <li key={img.path} className="overflow-hidden rounded-card border border-line">
                      <img
                        src={img.path}
                        alt={img.alt || `Foto ${idx + 2} de ${property.name}, ${property.zone}`}
                        width={400}
                        height={250}
                        loading="lazy"
                        decoding="async"
                        className="aspect-video w-full object-cover"
                      />
                    </li>
                  ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="sobre-el-alojamiento" className="mt-14 grid gap-12 md:grid-cols-[1fr_20rem]">
            <div>
              <h2
                id="sobre-el-alojamiento"
                className="font-serif text-headline text-ink font-normal track-headline"
              >
                Cómo es <em className="headline-italic">{property.name}</em>
              </h2>
              <p className="mt-6 max-w-2xl text-body text-ink-soft leading-relaxed">
                {property.description}
              </p>

              {property.amenities.length > 0 && (
                <div className="mt-10">
                  <h3 className="label-eyebrow text-ink-subtle">Servicios incluidos</h3>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {property.amenities.map((amenity) => {
                      const Icon = iconFor(amenity.iconKey);
                      return (
                        <li key={amenity.key} className="flex items-center gap-2.5 text-body text-ink-soft">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-brand-deep">
                            <Icon className="h-4 w-4 stroke-[1.8]" />
                          </span>
                          {amenity.name}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {property.host && (
                <div className="mt-10 flex items-center gap-4 rounded-card border border-line bg-white p-5">
                  <img
                    src={property.host.avatarPath ?? '/logo-avatar.png'}
                    alt={property.host.name}
                    width={48}
                    height={48}
                    loading="lazy"
                    className="h-12 w-12 rounded-full border border-line object-cover"
                  />
                  <div>
                    <p className="text-body font-semibold text-ink">
                      Hospedado por {property.host.name}
                    </p>
                    {property.host.tagline && (
                      <p className="mt-0.5 text-meta text-ink-muted">{property.host.tagline}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Caja de reserva. Misma honestidad que el drawer del home: sin
                pagos en línea y sin tarifas inventadas; el cierre es WhatsApp. */}
            <aside className="h-fit rounded-card border border-line bg-white p-6 md:sticky md:top-6">
              <p className="mono-data text-title-sm text-brand-deep">{property.priceText}</p>
              <p className="mt-2 text-meta text-ink-muted">
                Hasta {capacidad}. {property.priceOnRequest
                  ? 'La tarifa varía según la temporada: consulta por tus fechas.'
                  : 'Confirma disponibilidad para tus fechas antes de reservar.'}
              </p>
              {whatsapp ? (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener"
                  className="btn-solid mt-5 w-full"
                >
                  Consultar por WhatsApp
                </a>
              ) : (
                <button disabled className="btn-solid mt-5 w-full cursor-not-allowed opacity-60">
                  Consultas por WhatsApp — muy pronto
                </button>
              )}
              <p className="mt-3 text-center text-micro font-medium text-gray-400">
                Sin pagos en línea: coordinas directo con quien te recibe
              </p>
            </aside>
          </section>

          {/* Enlazado interno: a la landing de la zona (contexto y autoridad) y
              a las demás propiedades de la misma zona, para que ninguna página
              de propiedad quede huérfana. */}
          <nav aria-labelledby="mas-en-la-zona" className="section-gap">
            <h2
              id="mas-en-la-zona"
              className="font-serif text-headline text-ink font-normal track-headline"
            >
              Más en <em className="headline-italic">{property.zone}</em>
            </h2>
            {vecinas.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-3">
                {vecinas.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/propiedad/${p.slug}`}
                      className="inline-flex min-h-[44px] items-center rounded-chip border border-line bg-white px-4 py-2 text-meta font-medium text-brand-deep transition-all hover:border-ink hover:shadow-hard-sm"
                    >
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-8">
              <Link href={zonePath} className="btn-solid">
                Ver la guía de {property.zone}
              </Link>
            </p>
          </nav>
        </main>
      </div>
    </>
  );
}
