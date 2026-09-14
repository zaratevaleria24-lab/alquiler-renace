import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PAGINAS, paginaDe } from '@/lib/paginas-intencion';
import { HUBS } from '@/lib/guia-hubs';
import { getProperties } from '@/lib/queries';
import { getContacto } from '@/lib/settings';
import { SITE, absoluteUrl } from '@/lib/site';
import { breadcrumbSchema, graph } from '@/lib/schema';
import SinFoto from '@/components/SinFoto';

// Páginas por intención de búsqueda (lib/paginas-intencion.ts). Solo existen
// los slugs declarados: cualquier otra ruta de un segmento sigue dando 404.
export const dynamicParams = false;
export const revalidate = 3600;
export function generateStaticParams() { return PAGINAS.map((p) => ({ tema: p.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ tema: string }> }): Promise<Metadata> {
  const p = paginaDe((await params).tema); if (!p) return {};
  return { title: p.titulo, description: p.descripcion, alternates: { canonical: `/${p.slug}` }, openGraph: { type: 'article', url: absoluteUrl(`/${p.slug}`), siteName: SITE.name, title: p.titulo, description: p.descripcion, images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: p.titulo }] } };
}

export default async function PaginaTema({ params }: { params: Promise<{ tema: string }> }) {
  const p = paginaDe((await params).tema); if (!p) notFound();
  const [props, contacto] = await Promise.all([getProperties(), getContacto()]);
  const aptos = props.filter((x) => !x.priceOnRequest && x.pricePerNight > 0);
  const wa = contacto.whatsapp ? `https://wa.me/${contacto.whatsapp}?text=${encodeURIComponent(`Hola, leí «${p.h1.join(' ')}» en la web y quiero cotizar.`)}` : null;
  const jsonLd = graph(
    breadcrumbSchema([{ name: 'Inicio', path: '/' }, { name: p.h1.join(' '), path: `/${p.slug}` }]),
    { '@type': 'Article', headline: p.titulo, description: p.descripcion, url: absoluteUrl(`/${p.slug}`), inLanguage: 'es-VE', author: { '@type': 'Organization', name: SITE.name }, publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url } },
    { '@type': 'FAQPage', mainEntity: p.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  );
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div className="min-h-screen bg-paper">
        <header className="bg-luz border-b border-line"><div className="max-w-4xl mx-auto px-5 pb-10 pt-24 md:px-8 md:pt-28">
          <nav aria-label="Ruta de navegación" className="text-ui"><ol className="flex flex-wrap items-center gap-2 text-ink-muted"><li><Link href="/" className="hover:text-brand">Inicio</Link></li><li aria-hidden="true">/</li><li className="text-ink">{p.h1.join(' ')}</li></ol></nav>
          <h1 className="mt-4 font-serif text-headline font-normal leading-[1.05] track-headline text-ink">{p.h1[0]} <em className="headline-italic">{p.h1[1]}</em></h1>
          <p className="mt-5 max-w-2xl text-body leading-relaxed text-ink-soft">{p.intro}</p>
        </div></header>
        <main className="max-w-4xl mx-auto px-5 py-10 md:px-8 md:py-14">
          {p.secciones.map((s) => (
            <section key={s.titulo} className="mb-10"><h2 className="font-serif text-title font-semibold text-ink">{s.titulo}</h2>
              <div className="mt-3 space-y-4">{s.parrafos.map((t) => <p key={t.slice(0, 30)} className="text-body leading-relaxed text-ink-soft">{t}</p>)}</div></section>
          ))}
          {p.mostrarApartamentos && aptos.length > 0 && (
            <section aria-labelledby="aptos" className="mb-10"><h2 id="aptos" className="font-serif text-title font-semibold text-ink">Nuestros apartamentos</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">{aptos.map((a) => (
                <li key={a.slug}><Link href={`/propiedad/${a.slug}`} className="flex gap-3 rounded-card border border-line bg-white p-3 transition-colors hover:border-brand/40">
                  {a.image ? (
                    <img src={a.image} alt={`${a.name}, ${a.zone}, Isla de Margarita`} width={96} height={96} loading="lazy" className="h-24 w-24 shrink-0 rounded-card object-cover" />
                  ) : (
                    <SinFoto compacta className="h-24 w-24 shrink-0 rounded-card" />
                  )}
                  <span className="min-w-0"><span className="block font-serif text-[17px] font-semibold leading-tight text-ink">{a.name}</span><span className="mt-0.5 block text-ui text-ink-muted">{a.zone} · hasta {a.guestsAllowed.adults + a.guestsAllowed.children} personas</span><span className="mono-data mt-2 block text-ink">US$ {a.pricePerNight} <span className="text-ink-muted">/ noche</span></span></span>
                </Link></li>))}</ul></section>
          )}
          <section aria-labelledby="faq" className="mb-10"><h2 id="faq" className="font-serif text-title font-semibold text-ink">Preguntas frecuentes</h2>
            <dl className="mt-4 divide-y divide-line rounded-card border border-line bg-white">{p.faq.map((f) => <div key={f.q} className="px-5 py-4"><dt className="text-body font-semibold text-brand-deep">{f.q}</dt><dd className="mt-1.5 text-meta leading-relaxed text-ink-soft">{f.a}</dd></div>)}</dl></section>
          <p className="mb-10 text-meta text-ink-soft">Más en la guía: {p.hubs.map((h, i) => { const hub = HUBS.find((x) => x.slug === h); return hub ? <span key={h}>{i > 0 ? ' · ' : ''}<Link href={`/guia/${h}`} className="text-brand-deep underline underline-offset-4">{hub.h1.join(' ')}</Link></span> : null; })}.</p>
          <section className="rounded-panel bg-luz border border-line p-7 md:p-10">
            <h2 className="font-serif text-headline font-normal track-headline text-ink">Calcula tu estadía</h2>
            <p className="mt-3 max-w-2xl text-body text-ink-soft">Fechas, apartamento y personas: total en dólares y bolívares al instante, y el WhatsApp con todo escrito.</p>
            <div className="mt-6 flex flex-wrap gap-3"><Link href="/reservas" className="btn-solid">Ir a reservas</Link>{wa && <a href={wa} rel="noopener" className="inline-flex min-h-[46px] items-center rounded-control border border-line bg-white px-5 text-meta font-medium text-brand-deep hover:border-brand/40">Preguntar por WhatsApp</a>}</div>
          </section>
        </main>
      </div>
    </>
  );
}
