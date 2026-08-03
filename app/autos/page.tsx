import type { Metadata } from 'next';
import Link from 'next/link';
import { getVehicles, getZones } from '@/lib/queries';
import { getContacto } from '@/lib/settings';
import { SITE, absoluteUrl } from '@/lib/site';
import { iconFor } from '@/lib/icons';
import { breadcrumbSchema, graph } from '@/lib/schema';
import { HOME_FAQ } from '@/lib/faq';

// Alquiler de carros: /autos
//
// POR QUÉ EXISTE: el titular del home dice "Apartamentos y carros", las
// preguntas frecuentes responden que sí se alquilan autos, y el menú tenía un
// botón «Autos»… que no llevaba a ninguna parte. Prometer un servicio y no
// tener dónde verlo es peor que no ofrecerlo.
//
// HONESTIDAD CON EL CATÁLOGO VACÍO: la tabla `vehicles` existe (migración 001)
// pero hoy tiene 0 filas. Esta página NO inventa vehículos, precios ni
// requisitos: cuando no hay flota publicada lo dice y ofrece el canal de
// contacto. En cuanto se carguen vehículos desde la base, aparecen solos acá.
//
// El contenido que SÍ se afirma es sobre la isla —qué zonas necesitan carro—, y
// sale de lib/faq.ts, que es información geográfica verificable y ya estaba
// escrita y publicada. No se duplica a mano: se lee de la misma fuente.

export const dynamic = 'force-static';
export const revalidate = false;

const PATH = '/autos';
const TITULO = 'Alquiler de Carros en Isla de Margarita';
const DESCRIPCION =
  'Alquiler de carros en la Isla de Margarita con entrega en la zona de tu alojamiento. Precios en dólares, depósito y mínimo de días claros antes de escribir.';

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRIPCION,
  alternates: { canonical: PATH },
  openGraph: {
    type: 'website',
    locale: SITE.ogLocale,
    url: absoluteUrl(PATH),
    siteName: SITE.name,
    title: TITULO,
    description: DESCRIPCION,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: TITULO }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITULO,
    description: DESCRIPCION,
    images: ['/opengraph-image'],
  },
};

/** Las dos preguntas de la FAQ que tratan de carros, leídas de la fuente. */
const FAQ_CARROS = HOME_FAQ.filter(
  (f) => f.q.toLowerCase().includes('carro') || f.q.toLowerCase().includes('auto'),
);

export default async function AutosPage() {
  const [vehiculos, zones, contacto] = await Promise.all([
    getVehicles(),
    getZones(),
    getContacto(),
  ]);

  const wa = contacto.whatsapp
    ? `https://wa.me/${contacto.whatsapp}?text=${encodeURIComponent(
        'Hola, quiero alquilar un carro en Margarita. ¿Qué tienen disponible y cuál es el depósito?',
      )}`
    : null;

  const jsonLd = graph(
    breadcrumbSchema([
      { name: 'Inicio', path: '/' },
      { name: 'Alquiler de carros', path: PATH },
    ]),
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
          <div className="max-w-5xl mx-auto px-5 py-16 md:px-8 md:py-24">
            <nav aria-label="Ruta de navegación" className="mb-8 text-ui">
              <ol className="flex flex-wrap items-center gap-2 text-white/80">
                <li>
                  <Link href="/" className="underline hover:text-white">
                    Inicio
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="text-white">Alquiler de carros</li>
              </ol>
            </nav>

            <p className="label-eyebrow mb-4 text-accent">
              {SITE.region.island} · {SITE.region.state}
            </p>
            <h1 className="font-serif text-display font-normal leading-[1.05] track-display max-w-3xl">
              Alquiler de carros{' '}
              <em className="headline-italic-light">en Isla de Margarita</em>
            </h1>
            <p className="mt-6 max-w-2xl text-body-lg text-white/85">
              Resolver alojamiento y carro con la misma persona es la diferencia
              frente a las plataformas de solo alojamiento.
            </p>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-5 py-16 md:px-8 md:py-24">
          {vehiculos.length > 0 ? (
            <section aria-labelledby="flota">
              <h2
                id="flota"
                className="font-serif text-headline text-ink font-normal track-headline"
              >
                Vehículos <em className="headline-italic">disponibles</em>
              </h2>
              <ul className="block-gap grid gap-8 sm:grid-cols-2">
                {vehiculos.map((v) => (
                  <li
                    key={v.id}
                    className="overflow-hidden rounded-card border border-line bg-white"
                  >
                    {v.image && (
                      <img
                        src={v.image}
                        alt={`${v.displayName} — alquiler de carros en Isla de Margarita`}
                        width={800}
                        height={600}
                        loading="lazy"
                        decoding="async"
                        className="h-56 w-full object-cover"
                      />
                    )}
                    <div className="p-5">
                      <h3 className="font-serif text-title-sm text-brand-deep font-semibold">
                        {v.displayName}
                      </h3>
                      <p className="mono-data mt-2 text-brand-deep">{v.priceText}</p>
                      <p className="mt-3 text-body text-ink-soft leading-relaxed">
                        {v.description}
                      </p>

                      <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2 text-meta text-ink-muted">
                        <div>
                          <dt className="inline font-semibold">Transmisión: </dt>
                          <dd className="inline">
                            {v.transmission === 'automatica' ? 'automática' : 'sincrónica'}
                          </dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold">Puestos: </dt>
                          <dd className="inline">{v.seats}</dd>
                        </div>
                        {/* Las dos dudas que frenan a la gente antes de escribir,
                            y que casi ningún competidor publica. */}
                        {v.depositText && (
                          <div className="col-span-2">
                            <dt className="inline font-semibold">Depósito: </dt>
                            <dd className="inline">{v.depositText}</dd>
                          </div>
                        )}
                        {v.minDays > 0 && (
                          <div className="col-span-2">
                            <dt className="inline font-semibold">Mínimo: </dt>
                            <dd className="inline">
                              {v.minDays} {v.minDays === 1 ? 'día' : 'días'}
                            </dd>
                          </div>
                        )}
                        {v.pickupNote && (
                          <div className="col-span-2">
                            <dt className="inline font-semibold">Entrega: </dt>
                            <dd className="inline">{v.pickupNote}</dd>
                          </div>
                        )}
                      </dl>

                      {v.features.length > 0 && (
                        <ul className="mt-4 flex flex-wrap gap-2">
                          {v.features.map((f) => {
                            const Icon = iconFor(f.iconKey);
                            return (
                              <li
                                key={f.key}
                                className="flex items-center gap-1.5 rounded-chip bg-paper px-2.5 py-1 text-ui text-brand-deep"
                              >
                                <Icon className="h-3.5 w-3.5" />
                                {f.name}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            /* Catálogo vacío. Se dice tal cual en vez de mostrar vehículos de
               relleno: es la misma regla que con los alojamientos inventados
               (ver SEO.md) y acá además sería prometer un carro que nadie puede
               entregar. */
            <section
              aria-labelledby="flota"
              className="rounded-card border border-line bg-white p-7 md:p-9"
            >
              <h2
                id="flota"
                className="font-serif text-headline text-ink font-normal track-headline"
              >
                El catálogo <em className="headline-italic">se está armando</em>
              </h2>
              <p className="mt-6 max-w-2xl text-body text-ink-soft leading-relaxed">
                Todavía no hay vehículos publicados en el sitio. No ponemos
                fotos ni precios de carros que no podamos entregarte: cuando la
                flota esté cargada, aparecerá acá con su tarifa por día, el
                depósito y el mínimo de días a la vista.
              </p>
              <p className="mt-5 max-w-2xl text-body text-ink-soft leading-relaxed">
                Mientras tanto, si necesitas carro para tus fechas, escríbenos y
                te decimos qué hay disponible.
              </p>
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener"
                  className="btn-solid mt-8"
                >
                  Preguntar por WhatsApp
                </a>
              ) : (
                <button disabled className="btn-solid mt-8 cursor-not-allowed opacity-60">
                  Consultas por WhatsApp — muy pronto
                </button>
              )}
            </section>
          )}

          {/* Contenido real sobre la isla, leído de lib/faq.ts para no tener dos
              versiones del mismo texto. Responde la búsqueda que de verdad hace
              la gente: "¿hace falta carro en Margarita?". */}
          {FAQ_CARROS.length > 0 && (
            <section aria-labelledby="hace-falta" className="section-gap">
              <h2
                id="hace-falta"
                className="font-serif text-headline text-ink font-normal track-headline"
              >
                ¿Hace falta carro <em className="headline-italic">en Margarita?</em>
              </h2>
              <div className="mt-7 max-w-2xl space-y-7">
                {FAQ_CARROS.map((f) => (
                  <div key={f.q}>
                    <h3 className="text-body font-semibold text-brand-deep">{f.q}</h3>
                    <p className="mt-2 text-body text-ink-soft leading-relaxed">{f.a}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <nav aria-labelledby="zonas-carro" className="section-gap">
            <h2
              id="zonas-carro"
              className="font-serif text-headline text-ink font-normal track-headline"
            >
              Zonas de la isla
            </h2>
            <p className="mt-4 max-w-2xl text-body text-ink-soft">
              Mira dónde te vas a alojar: de ahí depende cuánto vas a usar el
              carro.
            </p>
            <ul className="mt-6 flex flex-wrap gap-3">
              {zones.map((z) => (
                <li key={z.slug}>
                  <Link
                    href={`/alquiler/${z.slug}`}
                    className="inline-flex min-h-[44px] items-center rounded-chip border border-line bg-white px-4 py-2 text-meta font-medium text-brand-deep transition-all hover:border-ink hover:shadow-hard-sm"
                  >
                    {z.name}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-10">
              <Link href="/" className="btn-solid">
                Ver los alojamientos
              </Link>
            </p>
          </nav>
        </main>
      </div>
    </>
  );
}
