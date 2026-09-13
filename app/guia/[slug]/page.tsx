import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, MapPin, Navigation, Phone, Star, Sun, Ticket, Timer, Instagram, Globe } from 'lucide-react';
import { SITE, absoluteUrl } from '@/lib/site';
import { getContacto } from '@/lib/settings';
import { getZones } from '@/lib/queries';
import { breadcrumbSchema, graph } from '@/lib/schema';
import { CATEGORIAS, categoriaLabel, galeriaDe, getLugar, getLugares, horarioHoy, portadaDe } from '@/lib/guia';
import GaleriaInmueble from '@/components/GaleriaInmueble';
import TarjetaLugar from '@/components/TarjetaLugar';

// Ficha de un lugar de la guía. Orden pensado para el teléfono: fotos, los
// cuatro datos que decides con (cuándo ir, cuánto dura, cuánto cuesta, cómo
// llegar), el consejo de quien vive acá, y después el detalle.

export const revalidate = 3600;
export const dynamicParams = true;
export async function generateStaticParams() { return (await getLugares()).map((l) => ({ slug: l.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const l = await getLugar(slug);
  if (!l) return { title: 'Lugar no disponible' };
  const path = `/guia/${l.slug}`;
  const title = `${l.nombre} — ${categoriaLabel(l.categoria)} en Isla de Margarita: cómo llegar, horario y consejos`;
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
  const [l, todos, contacto, zonas] = await Promise.all([getLugar(slug), getLugares(), getContacto(), getZones()]);
  if (!l) notFound();
  const path = `/guia/${l.slug}`;
  const emoji = CATEGORIAS.find((c) => c.key === l.categoria)?.emoji ?? '';
  const fotos = galeriaDe(l);
  const hoy = horarioHoy(l);
  const irA = l.latitud != null && l.longitud != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${l.latitud},${l.longitud}&travelmode=driving`
    : l.mapsUrl ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.nombre + ' Isla de Margarita')}`;
  const ig = l.instagram ? `https://www.instagram.com/${l.instagram.replace(/^@/, '')}/` : `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(l.nombre + ' margarita')}`;
  const wa = contacto.whatsapp ? `https://wa.me/${contacto.whatsapp}?text=${encodeURIComponent(`Hola, vi «${l.nombre}» en la guía de margaritarenace.com.ve. ¿Me ayudan con `)}` : null;
  const zonaCercana = zonas.find((z) => z.slug === l.zoneSlug);
  const relacionados = todos.filter((x) => x.categoria === l.categoria && x.slug !== l.slug).slice(0, 3);
  const datos = [
    l.mejorMomento && { I: Sun, k: 'Mejor momento', v: l.mejorMomento },
    l.duracion && { I: Timer, k: 'Cuánto dura', v: l.duracion },
    l.costo && { I: Ticket, k: 'Cuánto cuesta', v: l.costo },
    hoy && { I: Clock, k: 'Horario de hoy', v: hoy },
  ].filter(Boolean) as { I: typeof Sun; k: string; v: string }[];

  const tipoSchema = { playa: 'Beach', historia: 'LandmarksOrHistoricalBuildings', naturaleza: 'Park', mirador: 'TouristAttraction', museo: 'Museum', comer: 'Restaurant', actividad: 'TouristAttraction', nocturna: 'BarOrPub', compras: 'ShoppingCenter', familia: 'AmusementPark', delivery: 'FoodEstablishment', supermercado: 'GroceryStore', licores: 'LiquorStore', agua: 'LocalBusiness', salud: 'MedicalBusiness', transporte: 'LocalBusiness' }[l.categoria] ?? 'TouristAttraction';
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
    },
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
          <p className="label-eyebrow mt-5 text-brand-deep">{emoji} {categoriaLabel(l.categoria)}{l.municipio ? ` · ${l.municipio}` : ''}{l.destacado ? ' · Imperdible' : ''}</p>
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
                <aside className="mt-8 rounded-panel border border-line bg-luz p-6 md:p-7">
                  <p className="label-eyebrow text-brand-deep">El consejo de {SITE.name}</p>
                  <p className="mt-2 text-body text-ink leading-relaxed">{l.consejo}</p>
                </aside>
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
              <div className="rounded-card border border-line bg-white p-4 text-meta">
                <ul className="space-y-2.5">
                  {l.telefono && <li><a href={`tel:${l.telefono.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-2 text-brand-deep hover:underline underline-offset-4"><Phone className="h-4 w-4" aria-hidden="true" />{l.telefono}</a></li>}
                  <li><a href={ig} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-brand-deep hover:underline underline-offset-4"><Instagram className="h-4 w-4" aria-hidden="true" />{l.instagram ? `@${l.instagram.replace(/^@/, '')}` : 'Ver en Instagram'}</a></li>
                  {l.web && <li><a href={l.web} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-brand-deep hover:underline underline-offset-4"><Globe className="h-4 w-4" aria-hidden="true" />Sitio web</a></li>}
                </ul>
                {wa && <a href={wa} rel="noopener" className="mt-4 block rounded-control border border-line bg-paper px-4 py-2.5 text-center text-meta font-medium text-brand-deep hover:border-brand/40">Preguntanos por WhatsApp</a>}
              </div>
              {zonaCercana && zonaCercana.properties.length > 0 && (
                <div className="rounded-card border border-line bg-white p-4">
                  <p className="label-eyebrow text-ink-subtle">Dormí cerca</p>
                  <p className="mt-1.5 text-meta text-ink-soft">{zonaCercana.properties.length === 1 ? 'Un apartamento nuestro' : `${zonaCercana.properties.length} apartamentos nuestros`} en {zonaCercana.name}{zonaCercana.minPrice ? `, desde US$ ${zonaCercana.minPrice}/noche` : ''}.</p>
                  <Link href={`/alquiler/${zonaCercana.slug}`} className="mt-2 inline-block text-meta font-medium text-brand-deep underline-offset-4 hover:underline">Ver alojamientos en {zonaCercana.name} →</Link>
                </div>
              )}
              <p className="px-1 text-ui text-ink-faint">Valoración, horario y teléfono: Google. El texto y el consejo son nuestros. Si algo cambió, avisanos.</p>
            </aside>
          </div>

          {relacionados.length > 0 && (
            <section aria-labelledby="mas" className="section-gap">
              <h2 id="mas" className="font-serif text-headline font-normal track-headline text-ink">Más <em className="headline-italic">{CATEGORIAS.find((c) => c.key === l.categoria)?.plural.toLowerCase()}</em></h2>
              <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{relacionados.map((r) => <TarjetaLugar key={r.id} l={r} />)}</ul>
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
