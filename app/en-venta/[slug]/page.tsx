import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getContacto } from '@/lib/settings';
import { SITE, absoluteUrl } from '@/lib/site';
import { breadcrumbSchema, graph, ventaSchema } from '@/lib/schema';
import { getInmueblePublicado, getProspectoPublicado, textoPublico, TIPOS } from '@/lib/ventas';
import FichaProspecto from './FichaProspecto';
import PrecioVenta from '@/components/PrecioVenta';

// Ficha de un inmueble en venta propio. Misma estructura que /propiedad/<slug>.
//
// DINÁMICA A PROPÓSITO (no SSG como /propiedad): el bloque de precio consulta
// la tasa del día sin caché (lib/tasas.ts) y, en una ruta prerenderizada, eso
// revienta con DYNAMIC_SERVER_USAGE. Además es lo que queremos: que el precio
// en bolívares, USDT y euros salga siempre con la tasa del momento.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const i = await getInmueblePublicado(slug);
  if (!i) {
    // Anuncio de Marketplace: se muestra y se comparte, pero NO se indexa
    // (texto y fotos de terceros). Solo lo propio compite en Google.
    const p = await getProspectoPublicado(slug);
    if (!p) return { title: 'Inmueble no disponible' };
    const t = `${p.tituloLimpio} — en venta en ${p.zoneName ?? p.municipio ?? 'Isla de Margarita'}`;
    const d = textoPublico(p.descripcion).replace(/\s+/g, ' ').slice(0, 155) || t;
    const img = p.fotosLocales[0] ? absoluteUrl(p.fotosLocales[0]) : '/opengraph-image';
    return {
      title: t, description: d, robots: { index: false, follow: true },
      openGraph: { type: 'website', url: absoluteUrl(`/en-venta/${slug}`), siteName: SITE.name, title: t, description: d, images: [{ url: img, alt: t }] },
      twitter: { card: 'summary_large_image', title: t, description: d, images: [img] },
    };
  }
  const path = `/en-venta/${i.slug}`;
  const title = `${i.titulo} — ${TIPOS.find((t) => t.key === i.tipo)?.label} en venta en ${i.zone}, Isla de Margarita`;
  const description = (i.descripcion || `${i.titulo} en venta en ${i.zone}, Isla de Margarita.`).replace(/\s+/g, ' ').slice(0, 155);
  const img = i.image ? absoluteUrl(i.image) : '/opengraph-image';
  return {
    title, description, alternates: { canonical: path },
    openGraph: { type: 'website', url: absoluteUrl(path), siteName: SITE.name, title, description, images: [{ url: img, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [img] },
  };
}

export default async function InmueblePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [i, contacto] = await Promise.all([getInmueblePublicado(slug), getContacto()]);
  if (!i) {
    const p = await getProspectoPublicado(slug);
    if (!p) notFound();
    return <FichaProspecto p={p} whatsapp={contacto.whatsapp} />;
  }
  const path = `/en-venta/${i.slug}`;
  const tipo = TIPOS.find((t) => t.key === i.tipo)?.label ?? 'Inmueble';
  const wa = contacto.whatsapp
    ? `https://wa.me/${contacto.whatsapp}?text=${encodeURIComponent(`Hola, me interesa «${i.titulo}» (${i.zone}) que vi en margaritarenace.com.ve/en-venta. ¿Podemos coordinar una visita o una videollamada?`)}`
    : null;
  const mapa = i.latitud != null && i.longitud != null
    ? `https://www.google.com/maps/search/?api=1&query=${i.latitud},${i.longitud}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${i.ubicacion || i.zone}, Isla de Margarita`)}`;
  const ficha = [
    i.habitaciones != null && ['Habitaciones', String(i.habitaciones)],
    i.banos != null && ['Baños', String(i.banos)],
    i.m2Construccion != null && ['Construcción', `${i.m2Construccion} m²`],
    i.m2Terreno != null && ['Terreno', `${i.m2Terreno} m²`],
    i.estacionamientos != null && ['Estacionamientos', String(i.estacionamientos)],
  ].filter(Boolean) as [string, string][];

  const jsonLd = graph(
    breadcrumbSchema([{ name: 'Inicio', path: '/' }, { name: 'En venta', path: '/en-venta' }, { name: i.titulo, path }]),
    ventaSchema(i, path),
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div className="min-h-screen bg-paper">
        <header className="relative bg-brand-deep text-white">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-accent" />
          <div className="max-w-5xl mx-auto px-5 py-14 md:px-8 md:py-20">
            <nav aria-label="Ruta de navegación" className="mb-8 text-ui">
              <ol className="flex flex-wrap items-center gap-2 text-white/80">
                <li><Link href="/" className="underline hover:text-white">Inicio</Link></li>
                <li aria-hidden="true">/</li>
                <li><Link href="/en-venta" className="underline hover:text-white">En venta</Link></li>
                <li aria-hidden="true">/</li>
                <li className="text-white">{i.titulo}</li>
              </ol>
            </nav>
            <p className="label-eyebrow mb-4 text-accent">{tipo} en venta · {i.zone} · {SITE.region.island}</p>
            <h1 className="font-serif text-display font-normal leading-[1.05] track-display max-w-3xl">{i.titulo}</h1>
            {i.ubicacion && <p className="mt-4 max-w-2xl text-body-lg text-white/85">{i.ubicacion}</p>}
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-5 py-16 md:px-8 md:py-24">
          {i.image && (
            <section aria-label="Fotos del inmueble">
              <div className="overflow-hidden rounded-card border border-line">
                <img src={i.image} alt={`${i.titulo} — en venta en ${i.zone}, Isla de Margarita`} width={1200} height={750} fetchPriority="high" decoding="async" className="aspect-[16/10] w-full object-cover" />
              </div>
              {i.images.length > 1 && (
                <ul className="mt-3 grid grid-cols-3 gap-3">
                  {i.images.filter((im) => im.path !== i.image).map((im, idx) => (
                    <li key={im.id} className="overflow-hidden rounded-card border border-line">
                      <img src={im.path} alt={im.alt || `Foto ${idx + 2} de ${i.titulo}`} width={400} height={250} loading="lazy" decoding="async" className="aspect-video w-full object-cover" />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section className="mt-14 grid gap-12 md:grid-cols-[1fr_22rem]">
            <div>
              {ficha.length > 0 && (
                <dl className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                  {ficha.map(([k, v]) => (
                    <div key={k} className="rounded-card border border-line bg-white p-4">
                      <dt className="label-eyebrow text-ink-subtle">{k}</dt>
                      <dd className="mono-data mt-1.5 text-title-sm text-brand-deep">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <h2 className="mt-10 font-serif text-headline text-ink font-normal track-headline">Sobre este inmueble</h2>
              <p className="mt-5 whitespace-pre-line text-body text-ink/80 leading-relaxed">{i.descripcion}</p>
              <p className="mt-8 text-body">
                <a href={mapa} target="_blank" rel="noopener noreferrer" className="text-brand-deep underline underline-offset-4">Ver la zona en Google Maps</a>
                {' · '}
                <Link href={`/alquiler/${i.zoneSlug}`} className="text-brand-deep underline underline-offset-4">Cómo es {i.zone}</Link>
              </p>
            </div>
            <aside className="h-fit space-y-4 md:sticky md:top-6">
              <PrecioVenta usd={i.precioUsd} aConsultar={i.precioAConsultar} />
              {wa && (
                <a href={wa} className="btn-solid w-full justify-center" rel="noopener">Consultar por WhatsApp</a>
              )}
              <p className="text-meta text-ink-muted">
                Inmueble representado por {SITE.name}. Antes de mostrarlo verificamos documento de
                propiedad, catastro y solvencias con el propietario.
              </p>
            </aside>
          </section>
        </main>
      </div>
    </>
  );
}
