import type { Metadata } from 'next';
import Link from 'next/link';
import { getZonesAll } from '@/lib/queries';
import { getContacto } from '@/lib/settings';
import { SITE, absoluteUrl } from '@/lib/site';
import { breadcrumbSchema, faqSchema, graph } from '@/lib/schema';
import { getInmueblesPublicados, getProspectosPublicados, TIPOS } from '@/lib/ventas';
import { FAQ_VENTA } from '@/lib/faq';
import PrecioVenta from '@/components/PrecioVenta';

// EN VENTA — /en-venta
//
// Solo inmuebles que Margarita Renace representa de verdad, con fotos propias
// y permiso del dueño. Los anuncios ajenos de Marketplace viven en el panel
// (prospectos) y jamás llegan acá: ver lib/ventas.ts.
//
// La página también CAPTA VENDEDORES: el bloque «¿Vendés en Margarita?» es la
// otra mitad del negocio, y funciona aunque el catálogo esté vacío.

export const revalidate = 3600;

const PATH = '/en-venta';
const TITULO = 'Apartamentos y Casas en Venta en Isla de Margarita';
const DESCRIPCION =
  'Inmuebles en venta en la Isla de Margarita: apartamentos y casas en Pampatar, Porlamar, Costa Azul y más zonas, con precio en dólares, bolívares (tasa de mercado y BCV), USDT y euros. Trato directo, sin comisiones ocultas.';

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRIPCION,
  alternates: { canonical: PATH },
  openGraph: { type: 'website', url: absoluteUrl(PATH), siteName: SITE.name, title: TITULO, description: DESCRIPCION,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: TITULO }] },
  twitter: { card: 'summary_large_image', title: TITULO, description: DESCRIPCION, images: ['/opengraph-image'] },
};



export default async function EnVentaPage() {
  const [inmuebles, prospectos, zonas, contacto] = await Promise.all([getInmueblesPublicados(), getProspectosPublicados(), getZonesAll(), getContacto()]);
  const total = inmuebles.length + prospectos.length;
  const wa = (texto: string) => contacto.whatsapp ? `https://wa.me/${contacto.whatsapp}?text=${encodeURIComponent(texto)}` : null;
  const waVendo = wa('Hola, tengo un inmueble en venta en Margarita y quiero que Margarita Renace lo represente. Es un [apartamento/casa] en [zona].');
  const waBusco = wa('Hola, busco comprar en Margarita: [apartamento/casa], en [zona], presupuesto aprox. US$ [monto]. ¿Qué tienen o qué me pueden conseguir?');

  const jsonLd = graph(
    breadcrumbSchema([{ name: 'Inicio', path: '/' }, { name: 'En venta', path: PATH }]),
    faqSchema(FAQ_VENTA),
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div className="min-h-screen bg-paper">
        <header className="relative bg-brand-deep text-white">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-accent" />
          <div className="max-w-5xl mx-auto px-5 py-16 md:px-8 md:py-24">
            <nav aria-label="Ruta de navegación" className="mb-8 text-ui">
              <ol className="flex flex-wrap items-center gap-2 text-white/80">
                <li><Link href="/" className="underline hover:text-white">Inicio</Link></li>
                <li aria-hidden="true">/</li>
                <li className="text-white">En venta</li>
              </ol>
            </nav>
            <p className="label-eyebrow mb-4 text-accent">Comprar en {SITE.region.island}</p>
            <h1 className="font-serif text-display font-normal leading-[1.05] track-display max-w-3xl">
              Apartamentos y casas <em className="headline-italic">en venta</em>
            </h1>
            <p className="mt-6 max-w-2xl text-body-lg text-white/85">
              Lo que está en venta hoy en la isla, en un solo lugar, con el precio en dólares,
              bolívares, USDT y euros a la tasa del día. Vos elegís, nosotros gestionamos el
              contacto y revisamos los papeles.
            </p>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-5 py-16 md:px-8 md:py-24">
          <section aria-labelledby="catalogo">
            <h2 id="catalogo" className="font-serif text-headline text-ink font-normal track-headline">
              {total ? `${total} ${total === 1 ? 'inmueble' : 'inmuebles'} en venta` : 'Catálogo'}
            </h2>
            {total === 0 ? (
              <div className="mt-7 rounded-card border border-line bg-white p-7">
                <p className="text-body text-ink/80 leading-relaxed">
                  Estamos incorporando los primeros inmuebles. Si buscás comprar en la isla,
                  decinos qué y dónde: trabajamos con propietarios de Pampatar, Porlamar y
                  Costa Azul y te conseguimos opciones con los papeles en orden.
                </p>
                {waBusco && <p className="mt-5"><a href={waBusco} className="btn-solid" rel="noopener">Decirnos qué buscás</a></p>}
              </div>
            ) : (
              <ul className="mt-8 grid gap-8 sm:grid-cols-2">
                {inmuebles.map((i) => (
                  <li key={i.id} className="group overflow-hidden rounded-card border border-line bg-white transition-all hover:border-ink hover:shadow-hard-sm">
                    <Link href={`${PATH}/${i.slug}`}>
                      {i.image ? (
                        <img src={i.image} alt={`${i.titulo} — en venta en ${i.zone}, Isla de Margarita`} width={800} height={533} loading="lazy" decoding="async" className="aspect-[3/2] w-full object-cover" />
                      ) : (
                        <div className="aspect-[3/2] w-full bg-paper-warm" />
                      )}
                    </Link>
                    <div className="p-5">
                      <p className="label-eyebrow text-ink-subtle">{TIPOS.find((t) => t.key === i.tipo)?.label} · {i.zone}</p>
                      <h3 className="mt-2 font-serif text-title-sm text-brand-deep font-semibold">
                        <Link href={`${PATH}/${i.slug}`} className="hover:underline underline-offset-4">{i.titulo}</Link>
                      </h3>
                      <p className="mt-1 text-meta text-ink-muted">
                        {[i.habitaciones && `${i.habitaciones} hab`, i.banos && `${i.banos} baños`, i.m2Construccion && `${i.m2Construccion} m²`].filter(Boolean).join(' · ')}
                      </p>
                      <div className="mt-4 border-t border-line pt-4">
                        <PrecioVenta usd={i.precioUsd} aConsultar={i.precioAConsultar} compacto />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {prospectos.length > 0 && (
            <section aria-labelledby="en-la-isla" className={inmuebles.length ? 'section-gap' : 'mt-8'}>
              {inmuebles.length > 0 && (
                <h2 id="en-la-isla" className="font-serif text-headline text-ink font-normal track-headline">
                  Más inmuebles <em className="headline-italic">en la isla</em>
                </h2>
              )}
              <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {prospectos.map((p) => {
                  const foto = p.fotosLocales[0];
                  const ficha = [p.habitaciones && `${p.habitaciones} hab`, p.banos && `${p.banos} baños`, p.m2 && `${p.m2} m²`].filter(Boolean).join(' · ');
                  return (
                    <li key={p.fbId} className="group overflow-hidden rounded-card border border-line bg-white transition-all hover:border-ink hover:shadow-hard-sm">
                      <Link href={`${PATH}/${p.slug}`} className="block overflow-hidden">
                        {foto ? (
                          <img src={foto} alt={`${p.tituloLimpio} — en venta en ${p.zoneName ?? p.municipio}, Isla de Margarita`} width={800} height={600} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                        ) : (
                          <div className="flex aspect-[4/3] w-full items-center justify-center bg-brand-tint text-ui text-brand-deep">Foto al consultar</div>
                        )}
                      </Link>
                      <div className="p-5">
                        <p className="label-eyebrow text-ink-subtle">{p.zoneName ?? p.ciudad ?? 'Isla de Margarita'}{p.municipio ? ` · mun. ${p.municipio}` : ''}</p>
                        <h3 className="mt-2 font-serif text-title-sm text-brand-deep font-semibold">
                          <Link href={`${PATH}/${p.slug}`} className="hover:underline underline-offset-4">{p.tituloLimpio}</Link>
                        </h3>
                        {ficha && <p className="mt-1 text-meta text-ink-muted">{ficha}</p>}
                        <div className="mt-4 border-t border-line pt-4">
                          <PrecioVenta usd={p.precioUsd ?? 0} aConsultar={!p.precioUsd} compacto />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section aria-labelledby="vendes" className="section-gap">
            <div className="rounded-card border border-line bg-brand-deep p-8 text-white md:p-10">
              <h2 id="vendes" className="font-serif text-headline font-normal track-headline">¿Vendés en Margarita?</h2>
              <p className="mt-4 max-w-2xl text-body-lg text-white/85">
                Lo publicamos con fotos profesionales, precio en las monedas que usa el comprador
                y el respaldo de un sitio que Google ya conoce. Vos ponés el inmueble y los papeles;
                nosotros, los compradores. Sin exclusividad forzada ni costos por adelantado.
              </p>
              {waVendo && <p className="mt-6"><a href={waVendo} className="btn-solid bg-white text-brand-deep" rel="noopener">Quiero vender mi inmueble</a></p>}
            </div>
          </section>

          <section aria-labelledby="faq-venta" className="section-gap">
            <h2 id="faq-venta" className="font-serif text-headline text-ink font-normal track-headline">Comprar en la isla, <em className="headline-italic">sin sorpresas</em></h2>
            <div className="mt-7 max-w-2xl space-y-7">
              {FAQ_VENTA.map((f) => (
                <div key={f.q}>
                  <h3 className="text-body font-semibold text-brand-deep">{f.q}</h3>
                  <p className="mt-2 text-body text-ink-soft leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </section>

          <nav aria-labelledby="zonas-venta" className="section-gap">
            <h2 id="zonas-venta" className="font-serif text-headline text-ink font-normal track-headline">Zonas de la isla</h2>
            <ul className="mt-6 flex flex-wrap gap-3">
              {zonas.map((z) => (
                <li key={z.slug}>
                  <Link href={`/alquiler/${z.slug}`} className="inline-flex min-h-[44px] items-center rounded-chip border border-line bg-white px-4 py-2 text-meta font-medium text-brand-deep transition-all hover:border-ink hover:shadow-hard-sm">{z.name}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </main>
      </div>
    </>
  );
}
