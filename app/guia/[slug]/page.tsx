import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, MapPin, Navigation, Phone, Star, Sun, Ticket, Timer, Instagram, Globe } from 'lucide-react';
import { SITE, absoluteUrl } from '@/lib/site';
import { getContacto } from '@/lib/settings';
import { getZones } from '@/lib/queries';
import { breadcrumbSchema, graph } from '@/lib/schema';
import { CATEGORIAS, categoriaLabel, categoriasDe, esEnlaceWa, galeriaDe, getLugar, getLugares, horarioHoy, portadaDe, waDeTelefono } from '@/lib/guia';
import GaleriaInmueble from '@/components/GaleriaInmueble';
import TarjetaGuia from '@/components/TarjetaGuia';
import ListaGuia from '@/components/ListaGuia';
import { HUBS, hubDe, hubsDeCategoria } from '@/lib/guia-hubs';
import { getAjustes } from '@/lib/settings';
import IconoCategoria from '@/components/IconosGuia';
import IconoWhatsApp from '@/components/IconoWhatsApp';

// Ficha de un lugar de la guía. Orden pensado para el teléfono: fotos, los
// cuatro datos que decides con (cuándo ir, cuánto dura, cuánto cuesta, cómo
// llegar), el consejo de quien vive acá, y después el detalle.

export const revalidate = 3600;
export const dynamicParams = true;
export async function generateStaticParams() { return [...HUBS.map((h) => ({ slug: h.slug })), ...(await getLugares()).map((l) => ({ slug: l.slug }))]; }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const hub = hubDe(slug);
  if (hub) return { title: hub.titulo, description: hub.descripcion, alternates: { canonical: `/guia/${hub.slug}` }, openGraph: { type: 'website', url: absoluteUrl(`/guia/${hub.slug}`), siteName: SITE.name, title: hub.titulo, description: hub.descripcion, images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: hub.titulo }] } };
  const l = await getLugar(slug);
  if (!l) return { title: 'Lugar no disponible' };
  const path = `/guia/${l.slug}`;
  // Corto: la plantilla del sitio antepone «Margarita Renace · ».
  const title = `${l.nombre} · ${categoriaLabel(l.categoria)} en Isla de Margarita`;
  const description = l.descripcion.replace(/\s+/g, ' ').slice(0, 155);
  const img = portadaDe(l)?.src;
  const imgAbs = img ? (img.startsWith('/api/') ? absoluteUrl(img) : absoluteUrl(img)) : '/opengraph-image';
  return {
    title, description, alternates: { canonical: path },
    openGraph: { type: 'article', url: absoluteUrl(path), siteName: SITE.name, title, description, images: [{ url: imgAbs, alt: l.nombre }] },
    twitter: { card: 'summary_large_image', title, description, images: [imgAbs] },
  };
}

export default async function LugarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (hubDe(slug)) return <PaginaHub slug={slug} />;
  const [l, todos, contacto, zonas, ajustes] = await Promise.all([getLugar(slug), getLugares(), getContacto(), getZones(), getAjustes()]);
  if (!l) notFound();
  const autora = (ajustes as unknown as Record<string, string>).representante || 'el equipo de Margarita Renace';

  const path = `/guia/${l.slug}`;
  const fotos = galeriaDe(l);
  const hoy = horarioHoy(l);
  const irA = l.latitud != null && l.longitud != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${l.latitud},${l.longitud}&travelmode=driving`
    : l.mapsUrl ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.nombre + ' Isla de Margarita')}`;
  // Instagram SOLO si el lugar tiene el suyo. Antes, cuando no lo tenía, el
  // enlace llevaba a una BÚSQUEDA de Instagram por el nombre: un botón que dice
  // «Instagram» y no lleva a su Instagram. 74 de los 103 lugares publicados
  // caían en ese caso (auditado el 2026-09-15).
  const ig = l.instagram ? `https://www.instagram.com/${l.instagram.replace(/^@/, '')}/` : null;

  // DOS WhatsApp distintos, y por eso se nombran distinto.
  //   waLugar    → al negocio, solo si su teléfono es un móvil venezolano.
  //   wa         → a Margarita Renace, para lo que el negocio no resuelve.
  // Antes la tarjeta escribía al NEGOCIO y esta ficha escribía a MARGARITA
  // RENACE, las dos con un botón que decía «WhatsApp»: el mismo gesto llevaba a
  // dos sitios distintos según la pantalla. Y esta ficha no ofrecía escribirle
  // al negocio aunque tuviera móvil.
  const numeroWaLugar = waDeTelefono(l.telefono);
  const waLugar = numeroWaLugar
    ? `https://wa.me/${numeroWaLugar}?text=${encodeURIComponent(`Hola, vengo de la guía de Margarita Renace y quisiera información sobre ${l.nombre}.`)}`
    : esEnlaceWa(l.web) ? l.web : null;
  const wa = contacto.whatsapp ? `https://wa.me/${contacto.whatsapp}?text=${encodeURIComponent(`Hola, vi «${l.nombre}» en la guía de margaritarenace.com.ve y quisiera preguntarles algo.`)}` : null;
  const zonaCercana = zonas.find((z) => z.slug === l.zoneSlug);
  const relacionados = todos.filter((x) => x.categoria === l.categoria && x.slug !== l.slug).slice(0, 3);
  // Preguntas frecuentes reales, armadas con los datos de la ficha.
  const faq: { q: string; a: string }[] = [
    l.horario?.length ? { q: `¿Cuál es el horario de ${l.nombre}?`, a: `${hoy ? `Hoy: ${hoy}. ` : ''}Horario según Google: ${l.horario.join('; ')}.` } : null,
    { q: `¿Cómo llegar a ${l.nombre}?`, a: `${l.direccion ? `Queda en ${l.direccion.replace(/^[A-Z0-9]{4,}\+[A-Z0-9]{2,3},?\s*/, '')}${l.municipio ? `, municipio ${l.municipio}` : ''}. ` : ''}${zonaCercana ? `Desde nuestros apartamentos en ${zonaCercana.name} ` : 'Desde Pampatar o Porlamar '}se llega en carro o taxi; el botón «Cómo llegar» abre la ruta en Google Maps.` },
    l.costo ? { q: `¿Cuánto cuesta ${l.nombre}?`, a: l.costo } : null,
    l.mejorMomento ? { q: `¿Cuál es el mejor momento para ir a ${l.nombre}?`, a: `${l.mejorMomento}.${l.duracion ? ` Calcula ${l.duracion.toLowerCase()}.` : ''}` } : null,
    l.telefono || l.instagram ? { q: `¿Cómo contacto a ${l.nombre}?`, a: `${l.telefono ? `Teléfono ${l.telefono}. ` : ''}${l.instagram ? `Instagram @${l.instagram.replace(/^@/, '')}. ` : ''}${l.web ? `Web: ${l.web}.` : ''}`.trim() } : null,
  ].filter(Boolean) as { q: string; a: string }[];
  const datos = [
    l.mejorMomento && { I: Sun, k: 'Mejor momento', v: l.mejorMomento },
    l.duracion && { I: Timer, k: 'Cuánto dura', v: l.duracion },
    l.costo && { I: Ticket, k: 'Cuánto cuesta', v: l.costo },
    hoy && { I: Clock, k: 'Horario de hoy', v: hoy },
  ].filter(Boolean) as { I: typeof Sun; k: string; v: string }[];

  const tipoSchema = { playa: 'Beach', historia: 'LandmarksOrHistoricalBuildings', naturaleza: 'Park', mirador: 'TouristAttraction', museo: 'Museum', comer: 'Restaurant', actividad: 'TouristAttraction', nocturna: 'BarOrPub', compras: 'ShoppingCenter', familia: 'AmusementPark', delivery: 'FoodEstablishment', supermercado: 'GroceryStore', licores: 'LiquorStore', agua: 'LocalBusiness', salud: 'MedicalBusiness', transporte: 'LocalBusiness', aventura: 'SportsActivityLocation', practico: 'LocalBusiness' }[l.categoria] ?? 'TouristAttraction';
  const jsonLd = graph(
    breadcrumbSchema([{ name: 'Inicio', path: '/' }, { name: 'Guía turística', path: '/guia' }, { name: l.nombre, path }]),
    {
      '@type': tipoSchema, name: l.nombre, description: l.descripcion, url: absoluteUrl(path),
      image: fotos.map((f) => absoluteUrl(f.src)),
      ...(l.latitud != null ? { geo: { '@type': 'GeoCoordinates', latitude: l.latitud, longitude: l.longitud } } : {}),
      address: { '@type': 'PostalAddress', addressLocality: l.municipio || l.zone || 'Isla de Margarita', addressRegion: SITE.region.state, addressCountry: SITE.region.country },
      ...(l.telefono ? { telephone: l.telefono } : {}), ...(l.web ? { sameAs: [l.web] } : {}),
      isAccessibleForFree: /gratis/i.test(l.costo),
      touristType: ['Familias', 'Parejas', 'Viajeros de Venezuela y la diáspora'],
      ...(l.horario?.length ? { openingHours: l.horario } : {}),
      ...(l.rating != null && l.resenas ? {} : {}),
    },
    ...(faq.length ? [{ '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }] : []),
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div className="min-h-screen bg-paper pb-24 md:pb-0">
        <header className="max-w-5xl mx-auto px-5 pt-24 md:px-8 md:pt-28">
          <nav aria-label="Ruta de navegación" className="text-ui">
            <ol className="flex flex-wrap items-center gap-2 text-ink-muted">
              <li><Link href="/guia" className="hover:text-brand hover:underline underline-offset-4">Guía</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href={`/guia?c=${l.categoria}`} className="hover:text-brand hover:underline underline-offset-4">{CATEGORIAS.find((c) => c.key === l.categoria)?.plural}</Link></li>
            </ol>
          </nav>
          <p className="label-eyebrow mt-5 flex items-center gap-1.5 text-brand-deep"><IconoCategoria cat={l.categoria} className="h-4 w-4" />{categoriaLabel(l.categoria)}{l.municipio ? ` · ${l.municipio}` : ''}{l.destacado ? ' · Imperdible' : ''}</p>
          <h1 className="mt-2 font-serif text-display font-normal leading-[1.03] track-display text-ink text-balance">{l.nombre}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-meta text-ink-soft">
            {l.rating != null && <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-brand text-brand" aria-hidden="true" />{l.rating.toFixed(1)} <span className="text-ink-muted">({l.resenas?.toLocaleString('es-VE')} reseñas en Google)</span></span>}
            {l.direccion && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 stroke-[1.6] text-brand" aria-hidden="true" />{l.direccion}</span>}
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-5 py-7 md:px-8 md:py-10">
          <GaleriaInmueble fotos={fotos} titulo={l.nombre} />
          {fotos[0]?.credito && <p className="mt-2 text-ui text-ink-faint">{fotos[0].credito}</p>}

          <div className="mt-10 grid gap-10 md:grid-cols-[1fr_20rem] lg:gap-14">
            <div className="min-w-0">
              {datos.length > 0 && (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {datos.map(({ I, k, v }) => (
                    <li key={k} className="rounded-card border border-line bg-white p-4">
                      <I className="h-4 w-4 stroke-[1.5] text-brand" aria-hidden="true" />
                      <p className="mt-2.5 text-body font-semibold leading-snug text-ink">{v}</p>
                      <p className="text-ui text-ink-muted">{k}</p>
                    </li>
                  ))}
                </ul>
              )}

              <section className="mt-10">
                <p className="max-w-prose text-body-lg text-ink/85 leading-relaxed">{l.descripcion}</p>
                {l.resumenGoogle && !l.descripcion.includes(l.resumenGoogle) && (
                  <p className="mt-4 max-w-prose text-meta text-ink-muted"><span className="font-semibold">Google dice:</span> {l.resumenGoogle}</p>
                )}
              </section>

              {l.consejo && (
                <aside className={`mt-8 rounded-panel border bg-luz p-6 md:p-7 ${l.aliado ? 'borde-brillo borde-brillo-grueso border-transparent' : 'border-line'}`}>
                  <p className={`label-eyebrow flex items-center gap-1.5 ${l.aliado ? 'text-oro-deep' : 'text-brand-deep'}`}>{l.aliado && <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />}{l.aliado ? `Recomendado por ${SITE.name}` : `El consejo de ${SITE.name}`}</p>
                  <p className="mt-2 text-body text-ink leading-relaxed">{l.consejo}</p>
                </aside>
              )}

              <p className="mt-6 text-ui text-ink-muted">Escrito por {autora}, anfitriona en Pampatar · datos de horario y valoración de Google · actualizado {new Date(l.datosActualizados ?? Date.now()).toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })}.</p>

              {faq.length > 0 && (
                <section aria-labelledby="faq" className="mt-8">
                  <h2 id="faq" className="font-serif text-title-sm font-semibold text-ink">Preguntas frecuentes</h2>
                  <dl className="mt-3 divide-y divide-line rounded-card border border-line bg-white">
                    {faq.map((f) => <div key={f.q} className="px-5 py-3.5"><dt className="text-body font-semibold text-brand-deep">{f.q}</dt><dd className="mt-1 text-meta leading-relaxed text-ink-soft">{f.a}</dd></div>)}
                  </dl>
                </section>
              )}

              {hubsDeCategoria(l.categoria).length > 0 && (
                <p className="mt-6 text-meta text-ink-soft">Más en la guía: {hubsDeCategoria(l.categoria).map((h, i) => <span key={h.slug}>{i > 0 ? ' · ' : ''}<Link href={`/guia/${h.slug}`} className="text-brand-deep underline underline-offset-4">{h.h1.join(' ')}</Link></span>)}.</p>
              )}

              {l.horario && l.horario.length > 0 && (
                <details className="mt-8 rounded-card border border-line bg-white">
                  <summary className="cursor-pointer px-5 py-4 text-body font-semibold text-brand-deep [&::-webkit-details-marker]:hidden">Horario de la semana</summary>
                  <ul className="grid gap-1 px-5 pb-5 text-meta text-ink-soft sm:grid-cols-2">
                    {l.horario.map((h) => <li key={h}>{h}</li>)}
                  </ul>
                </details>
              )}
            </div>

            <aside className="h-fit space-y-3 md:sticky md:top-28">
              <a href={irA} target="_blank" rel="noopener noreferrer" className="btn-solid w-full justify-center"><Navigation className="h-4 w-4" aria-hidden="true" />Cómo llegar</a>
              {waLugar && (
                <a href={waLugar} target="_blank" rel="noopener noreferrer" className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-control border border-line bg-white px-4 text-center text-meta font-medium text-brand-deep transition-colors hover:border-brand/40">
                  <IconoWhatsApp className="h-4 w-4 shrink-0" /><span className="truncate">Escribir a {l.nombre.split(/[—·]/)[0].trim()}</span>
                </a>
              )}
              {(l.telefono || ig || l.web) && (
                <div className="rounded-card border border-line bg-white p-4 text-meta">
                  <ul className="space-y-2.5">
                    {l.telefono && <li><a href={`tel:${l.telefono.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-2 text-brand-deep hover:underline underline-offset-4"><Phone className="h-4 w-4" aria-hidden="true" />{l.telefono}</a></li>}
                    {ig && <li><a href={ig} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-brand-deep hover:underline underline-offset-4"><Instagram className="h-4 w-4" aria-hidden="true" />@{l.instagram?.replace(/^@/, '')}</a></li>}
                    {l.web && <li><a href={l.web} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-brand-deep hover:underline underline-offset-4"><Globe className="h-4 w-4" aria-hidden="true" />Sitio web</a></li>}
                  </ul>
                </div>
              )}
              {/* El nuestro, nombrado para que no se confunda con el de arriba. */}
              {wa && <a href={wa} rel="noopener" className="block rounded-control border border-dashed border-line-strong bg-paper px-4 py-2.5 text-center text-meta text-ink-soft transition-colors hover:border-brand/40 hover:text-brand-deep">¿Dudas? Pregúntale a Margarita Renace</a>}
              {zonaCercana && zonaCercana.properties.length > 0 && (
                <div className="rounded-card border border-line bg-white p-4">
                  <p className="label-eyebrow text-ink-subtle">Duerme cerca</p>
                  <p className="mt-1.5 text-meta text-ink-soft">{zonaCercana.properties.length === 1 ? 'Un apartamento nuestro' : `${zonaCercana.properties.length} apartamentos nuestros`} en {zonaCercana.name}{zonaCercana.minPrice ? `, desde US$ ${zonaCercana.minPrice}/noche` : ''}.</p>
                  <Link href={`/alquiler/${zonaCercana.slug}`} className="mt-2 inline-block text-meta font-medium text-brand-deep underline-offset-4 hover:underline">Ver hospedajes en {zonaCercana.name} →</Link>
                </div>
              )}
              <p className="px-1 text-ui text-ink-faint">Valoración, horario y teléfono: Google. El texto y el consejo son nuestros. Si algo cambió, avísanos.</p>
            </aside>
          </div>

          {relacionados.length > 0 && (
            <section aria-labelledby="mas" className="section-gap">
              <h2 id="mas" className="font-serif text-headline font-normal track-headline text-ink">Más <em className="headline-italic">{CATEGORIAS.find((c) => c.key === l.categoria)?.plural.toLowerCase()}</em></h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{relacionados.map((r) => <TarjetaGuia key={r.id} l={r} />)}</ul>
            </section>
          )}
        </main>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 py-3 backdrop-blur-md md:hidden [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0"><p className="truncate text-body font-semibold text-ink">{l.nombre}</p>{hoy && <p className="text-ui text-ink-muted">Hoy: {hoy}</p>}</div>
            <a href={irA} target="_blank" rel="noopener noreferrer" className="btn-solid shrink-0"><Navigation className="h-4 w-4" aria-hidden="true" />Ir</a>
          </div>
        </div>
      </div>
    </>
  );
}


// ── Página por tema (hub) ────────────────────────────────────────────────────
async function PaginaHub({ slug }: { slug: string }) {
  const hub = hubDe(slug)!;
  const [lugares, contacto] = await Promise.all([getLugares(), getContacto()]);
  const propios = lugares.filter((l) => (hub.categorias as string[]).some((c) => categoriasDe(l).includes(c)));
  const path = `/guia/${hub.slug}`;
  const wa = contacto.whatsapp ? `https://wa.me/${contacto.whatsapp}?text=${encodeURIComponent(`Hola, estoy viendo la guía de ${hub.h1.join(' ').toLowerCase()} y quiero reservar un apartamento.`)}` : null;
  const jsonLd = graph(
    breadcrumbSchema([{ name: 'Inicio', path: '/' }, { name: 'Guía turística', path: '/guia' }, { name: hub.h1.join(' '), path }]),
    { '@type': 'ItemList', name: hub.titulo, numberOfItems: propios.length, itemListElement: propios.slice(0, 40).map((l, i) => ({ '@type': 'ListItem', position: i + 1, url: absoluteUrl(`/guia/${l.slug}`), name: l.nombre })) },
  );
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div className="min-h-screen bg-paper">
        <header className="bg-luz border-b border-line">
          <div className="max-w-6xl mx-auto px-5 pb-8 pt-24 md:px-8 md:pb-10 md:pt-28">
            <nav aria-label="Ruta de navegación" className="text-ui"><ol className="flex flex-wrap items-center gap-2 text-ink-muted"><li><Link href="/guia" className="hover:text-brand">Guía</Link></li><li aria-hidden="true">/</li><li className="text-ink">{hub.h1.join(' ')}</li></ol></nav>
            <h1 className="mt-4 font-serif text-headline font-normal leading-[1.05] track-headline text-ink">{hub.h1[0]} <em className="headline-italic">{hub.h1[1]}</em></h1>
            <div className="mt-5 max-w-2xl space-y-3 text-body leading-relaxed text-ink-soft">{hub.intro.map((p) => <p key={p.slice(0, 20)}>{p}</p>)}</div>
            <p className="mt-4 text-meta text-ink-muted">{propios.length} lugares · {HUBS.filter((h) => h.slug !== hub.slug).map((h, i) => <span key={h.slug}>{i > 0 ? ' · ' : 'También: '}<Link href={`/guia/${h.slug}`} className="text-brand-deep underline underline-offset-4">{h.h1.join(' ')}</Link></span>)}</p>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-5 py-8 md:px-8 md:py-10">
          <ListaGuia cat="" escucha={false} lugares={propios.map((l) => ({ ...l, descripcion: l.descripcion.slice(0, 180), consejo: l.consejo.slice(0, 180), resumenGoogle: null, fotos: l.fotos.slice(0, 1), fotosGoogle: l.fotosGoogle.slice(0, 1).map((f) => ({ name: '', autor: f.autor })) }))} />
          <section className="section-gap rounded-panel bg-luz border border-line p-7 md:p-10">
            <h2 className="font-serif text-headline font-normal track-headline text-ink">¿Te quedas en la isla?</h2>
            <p className="mt-3 max-w-2xl text-body text-ink-soft">Apartamentos en Pampatar (Los Geranios, La Caranta y Playa El Ángel) desde US$65 la noche, con precio claro y trato directo. Todo lo de esta guía queda cerca.</p>
            <div className="mt-6 flex flex-wrap gap-3"><Link href="/" className="btn-solid">Ver hospedajes</Link>{wa && <a href={wa} rel="noopener" className="inline-flex min-h-[46px] items-center rounded-control border border-line bg-white px-5 text-meta font-medium text-brand-deep hover:border-brand/40">Reservar por WhatsApp</a>}</div>
          </section>
        </main>
      </div>
    </>
  );
}
