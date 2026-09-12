import type { Metadata } from 'next';
import Link from 'next/link';
import { SlidersHorizontal } from 'lucide-react';
import { getZonesAll } from '@/lib/queries';
import { getContacto } from '@/lib/settings';
import { SITE, absoluteUrl } from '@/lib/site';
import { breadcrumbSchema, faqSchema, graph } from '@/lib/schema';
import { getInmueblesPublicados, getProspectosPublicados } from '@/lib/ventas';
import { getTasas } from '@/lib/tasas';
import { FAQ_VENTA } from '@/lib/faq';
import TarjetaVenta, { type DatosTarjeta } from '@/components/TarjetaVenta';
import { tarjetaDePropio, tarjetaDeProspecto } from '@/lib/ventas-vista';

// EN VENTA — /en-venta
//
// Todo lo que está en venta en la isla en un solo lugar: lo que Margarita
// Renace representa (verificado, indexable) y los anuncios publicados en la
// isla (fotos copiadas al servidor, sin datos del vendedor, noindex). El
// contacto siempre pasa por Margarita Renace: ese es el negocio.
//
// Los filtros son un formulario GET: funcionan sin JavaScript, la URL con
// filtros se puede compartir por WhatsApp, y no hay estado que se pierda.

export const dynamic = 'force-dynamic';

const PATH = '/en-venta';
const TITULO = 'Apartamentos y Casas en Venta en Isla de Margarita';
const DESCRIPCION =
  'Inmuebles en venta en la Isla de Margarita: apartamentos y casas en Pampatar, Porlamar, Costa Azul y más zonas, con precio en dólares, bolívares (tasa de mercado y BCV), USDT y euros. Fotos completas y trato directo.';

export const metadata: Metadata = {
  title: TITULO, description: DESCRIPCION, alternates: { canonical: PATH },
  openGraph: { type: 'website', url: absoluteUrl(PATH), siteName: SITE.name, title: TITULO, description: DESCRIPCION, images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: TITULO }] },
  twitter: { card: 'summary_large_image', title: TITULO, description: DESCRIPCION, images: ['/opengraph-image'] },
};

const PRECIOS = [
  { v: '', l: 'Cualquier precio' }, { v: '50000', l: 'Hasta US$ 50.000' }, { v: '100000', l: 'Hasta US$ 100.000' },
  { v: '200000', l: 'Hasta US$ 200.000' }, { v: '200001', l: 'Más de US$ 200.000' },
];
const ORDENES = [{ v: 'recientes', l: 'Más recientes' }, { v: 'precio-asc', l: 'Precio: menor a mayor' }, { v: 'precio-desc', l: 'Precio: mayor a menor' }];

const TIPOS_FILTRO = ['Apartamento', 'Casa', 'Terreno', 'Local comercial', 'Posada'];
const HABS = [{ v: '', l: 'Cualquiera' }, { v: '1', l: '1+' }, { v: '2', l: '2+' }, { v: '3', l: '3+' }, { v: '4', l: '4+' }];

export default async function EnVentaPage({ searchParams }: { searchParams: Promise<{ zona?: string; precio?: string; orden?: string; tipo?: string | string[]; hab?: string }> }) {
  const [sp, inmuebles, prospectos, zonas, contacto, tasas] = await Promise.all([
    searchParams, getInmueblesPublicados(), getProspectosPublicados(), getZonesAll(), getContacto(),
    getTasas().catch(() => null),
  ]);
  const zonaSel = zonas.find((z) => z.slug === sp.zona)?.name ?? '';
  const tope = Number(sp.precio) || 0;
  const orden = ORDENES.some((o) => o.v === sp.orden) ? sp.orden! : 'recientes';
  const tiposSel = (Array.isArray(sp.tipo) ? sp.tipo : sp.tipo ? [sp.tipo] : []).filter((t) => TIPOS_FILTRO.includes(t));
  const habMin = Number(sp.hab) || 0;

  let tarjetas: DatosTarjeta[] = [...inmuebles.map(tarjetaDePropio), ...prospectos.map(tarjetaDeProspecto)];
  const totalSinFiltro = tarjetas.length;
  if (zonaSel) tarjetas = tarjetas.filter((t) => t.zona === zonaSel);
  if (tiposSel.length) tarjetas = tarjetas.filter((t) => t.tipo && tiposSel.includes(t.tipo));
  if (habMin) tarjetas = tarjetas.filter((t) => (t.habitaciones ?? 0) >= habMin);
  if (tope === 200001) tarjetas = tarjetas.filter((t) => !t.aConsultar && t.precioUsd > 200000);
  else if (tope > 0) tarjetas = tarjetas.filter((t) => !t.aConsultar && t.precioUsd > 0 && t.precioUsd <= tope);
  if (orden === 'precio-asc') tarjetas.sort((a, b) => (a.aConsultar ? 1 : 0) - (b.aConsultar ? 1 : 0) || a.precioUsd - b.precioUsd);
  if (orden === 'precio-desc') tarjetas.sort((a, b) => (a.aConsultar ? 1 : 0) - (b.aConsultar ? 1 : 0) || b.precioUsd - a.precioUsd);
  const hayFiltro = Boolean(zonaSel || tope || orden !== 'recientes' || tiposSel.length || habMin);

  const wa = (texto: string) => contacto.whatsapp ? `https://wa.me/${contacto.whatsapp}?text=${encodeURIComponent(texto)}` : null;
  const waVendo = wa('Hola, tengo un inmueble en venta en Margarita y quiero que Margarita Renace lo represente. Es un [apartamento/casa] en [zona].');
  const waBusco = wa('Hola, busco comprar en Margarita: [apartamento/casa], en [zona], presupuesto aprox. US$ [monto]. ¿Qué tienen o qué me pueden conseguir?');
  const zonasConInventario = zonas.filter((z) => [...inmuebles.map(tarjetaDePropio), ...prospectos.map(tarjetaDeProspecto)].some((t) => t.zona === z.name));

  const jsonLd = graph(breadcrumbSchema([{ name: 'Inicio', path: '/' }, { name: 'En venta', path: PATH }]), faqSchema(FAQ_VENTA));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div className="min-h-screen bg-paper">
        <header className="relative bg-brand-deep text-white">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-accent" />
          <div className="max-w-6xl mx-auto px-5 py-14 md:px-8 md:py-20">
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
              {totalSinFiltro} inmuebles en venta en la isla, con todas sus fotos y el precio en dólares,
              bolívares, USDT y euros a la tasa del día. Vos elegís; nosotros gestionamos el contacto y
              revisamos los papeles.
            </p>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-5 py-12 md:px-8 md:py-16">
          {/* Filtros en barra lateral izquierda (escritorio) o plegable arriba
              (móvil). Formulario GET: sin JavaScript, y la URL con filtros se
              comparte por WhatsApp tal cual. */}
          <div className="grid gap-8 lg:grid-cols-[17rem_1fr] lg:gap-10">
            <aside className="lg:sticky lg:top-24 lg:h-fit">
              {/* Siempre visible (la dueña no quiso plegable): a la izquierda en
                  escritorio, arriba del listado en teléfono. */}
              <div className="rounded-panel border border-line bg-white">
                <p className="flex items-center gap-2 px-5 py-4 text-body font-semibold text-ink"><SlidersHorizontal className="h-4 w-4 text-brand" aria-hidden="true" />Filtros</p>
                <form method="get" action={PATH} className="space-y-6 border-t border-line px-5 pb-5 pt-5">
                  <div>
                    <p className="label-eyebrow text-ink-subtle">Zona</p>
                    <select name="zona" defaultValue={sp.zona ?? ''} className="mt-2 block w-full rounded-control border border-line bg-paper px-3 py-2.5 text-body text-ink">
                      <option value="">Toda la isla</option>
                      {zonasConInventario.map((z) => <option key={z.slug} value={z.slug}>{z.name}</option>)}
                    </select>
                  </div>
                  <fieldset>
                    <legend className="label-eyebrow text-ink-subtle">Tipo</legend>
                    <ul className="mt-2 space-y-1.5">
                      {TIPOS_FILTRO.map((t) => (
                        <li key={t}>
                          <label className="flex cursor-pointer items-center gap-2.5 text-body text-ink">
                            <input type="checkbox" name="tipo" value={t} defaultChecked={tiposSel.includes(t)} className="h-4 w-4 rounded-sm border-line accent-brand" />
                            {t}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </fieldset>
                  <div>
                    <p className="label-eyebrow text-ink-subtle">Precio</p>
                    <select name="precio" defaultValue={sp.precio ?? ''} className="mt-2 block w-full rounded-control border border-line bg-paper px-3 py-2.5 text-body text-ink">
                      {PRECIOS.map((p) => <option key={p.v} value={p.v}>{p.l}</option>)}
                    </select>
                  </div>
                  <fieldset>
                    <legend className="label-eyebrow text-ink-subtle">Habitaciones</legend>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {HABS.map((h) => (
                        <label key={h.v} className="cursor-pointer">
                          <input type="radio" name="hab" value={h.v} defaultChecked={String(habMin || '') === h.v} className="peer sr-only" />
                          <span className="inline-flex min-h-[36px] items-center rounded-chip border border-line bg-paper px-3 text-ui font-medium text-ink transition-colors peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white">{h.l}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div>
                    <p className="label-eyebrow text-ink-subtle">Ordenar</p>
                    <select name="orden" defaultValue={orden} className="mt-2 block w-full rounded-control border border-line bg-paper px-3 py-2.5 text-body text-ink">
                      {ORDENES.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <button type="submit" className="btn-solid">Aplicar</button>
                    {hayFiltro && <Link href={PATH} className="text-meta text-ink-muted underline-offset-4 hover:underline">Limpiar</Link>}
                  </div>
                </form>
              </div>
              {waBusco && (
                <div className="mt-4 hidden rounded-panel border border-line bg-brand-tint p-5 lg:block">
                  <p className="text-body font-semibold text-brand-deep">¿No ves lo que buscás?</p>
                  <p className="mt-1.5 text-meta text-ink-soft">Decinos zona y presupuesto y lo buscamos con los propietarios.</p>
                  <a href={waBusco} className="btn-solid mt-4" rel="noopener">Escribirnos</a>
                </div>
              )}
            </aside>

            <section aria-labelledby="catalogo" className="min-w-0">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 id="catalogo" className="font-serif text-headline text-ink font-normal track-headline">
                  {tarjetas.length === 0 ? 'Nada con ese filtro' : `${tarjetas.length} ${tarjetas.length === 1 ? 'inmueble' : 'inmuebles'}`}
                  {zonaSel && <> en <em className="headline-italic">{zonaSel}</em></>}
                </h2>
                {inmuebles.length > 0 && <p className="text-meta text-ink-muted">Con «Verificado»: papeles revisados por {SITE.name}</p>}
              </div>

              {tarjetas.length === 0 ? (
                <div className="mt-7 rounded-panel border border-line bg-white p-7">
                  <p className="text-body text-ink/80 leading-relaxed">
                    {hayFiltro ? 'No hay inmuebles con esos filtros ahora mismo. ' : 'Estamos incorporando los primeros inmuebles. '}
                    Decinos qué buscás y dónde: trabajamos con propietarios de toda la isla y te conseguimos opciones con los papeles en orden.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {waBusco && <a href={waBusco} className="btn-solid" rel="noopener">Decirnos qué buscás</a>}
                    {hayFiltro && <Link href={PATH} className="inline-flex items-center rounded-chip border border-line bg-white px-4 py-2 text-meta font-medium text-brand-deep hover:border-ink">Ver todos</Link>}
                  </div>
                </div>
              ) : (
                <ul className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {tarjetas.map((t, k) => <TarjetaVenta key={t.href} d={{ ...t, prioridad: k < 3 }} tasas={tasas} />)}
                </ul>
              )}
            </section>
          </div>

          <section aria-labelledby="vendes" className="section-gap">
            <div className="rounded-panel border border-line bg-brand-deep p-8 text-white md:p-10">
              <h2 id="vendes" className="font-serif text-headline font-normal track-headline">¿Vendés en Margarita?</h2>
              <p className="mt-4 max-w-2xl text-body-lg text-white/85">
                Lo publicamos con fotos profesionales, precio en las monedas que usa el comprador y el respaldo
                de un sitio que Google ya conoce. Vos ponés el inmueble y los papeles; nosotros, los compradores.
                Sin exclusividad forzada ni costos por adelantado.
              </p>
              {waVendo && <p className="mt-6"><a href={waVendo} className="btn-solid bg-white text-brand-deep" rel="noopener">Quiero vender mi inmueble</a></p>}
            </div>
          </section>

          <section aria-labelledby="faq-venta" className="section-gap">
            <h2 id="faq-venta" className="font-serif text-headline text-ink font-normal track-headline">Comprar en la isla, <em className="headline-italic">sin sorpresas</em></h2>
            <div className="mt-7 grid gap-7 md:grid-cols-2">
              {FAQ_VENTA.map((f) => (
                <div key={f.q} className="rounded-card border border-line bg-white p-6">
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
