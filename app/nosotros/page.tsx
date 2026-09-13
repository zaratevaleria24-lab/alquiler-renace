import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE, absoluteUrl } from '@/lib/site';
import { getAjustes, getContacto } from '@/lib/settings';
import { breadcrumbSchema, graph } from '@/lib/schema';

// Quiénes somos: la misión de IDENTIDAD.md dicha a la cara del visitante, con
// los datos que dan confianza (quién atiende, dónde estamos, RIF).
const TITULO = 'Quiénes somos: alquiler con tratos justos en Isla de Margarita';
const DESCRIPCION = 'Margarita Renace: apartamentos en Pampatar, autos y una guía de la isla, atendidos por Valeria. Precio claro en dólares y bolívares, sin comisiones ocultas.';
export const metadata: Metadata = { title: TITULO, description: DESCRIPCION, alternates: { canonical: '/nosotros' }, openGraph: { type: 'website', url: absoluteUrl('/nosotros'), siteName: SITE.name, title: TITULO, description: DESCRIPCION } };
export const revalidate = 3600;

export default async function NosotrosPage() {
  const [a, contacto] = await Promise.all([getAjustes() as Promise<unknown> as Promise<Record<string, string>>, getContacto()]);
  const jsonLd = graph(breadcrumbSchema([{ name: 'Inicio', path: '/' }, { name: 'Quiénes somos', path: '/nosotros' }]), { '@type': 'AboutPage', name: TITULO, url: absoluteUrl('/nosotros'), description: DESCRIPCION });
  const valores: [string, string][] = [
    ['Tratos justos', 'El precio es el precio: en dólares y en bolívares a la tasa real del día, sin comisiones ocultas ni «depende de quién pregunte». Si algo cuesta más, te explicamos por qué.'],
    ['Conciencia', 'Sabemos dónde vivimos: el agua llega por cisterna, la luz a veces se va, la brecha cambiaria existe. Diseñamos precios y servicios para la isla real, no para un folleto.'],
    ['Empatía', 'Del otro lado hay una familia que ahorró un año, un venezolano de afuera que quiere volver, un dueño que necesita vender. Te respondemos nosotros, no un robot.'],
    ['Humildad', 'Si no tenemos lo que buscas, te lo decimos y te ayudamos a encontrarlo. Un apartamento sin precio publicado dice «a consultar», no inventamos uno.'],
    ['Equidad', 'Revisamos los papeles antes de la visita, el dueño no paga por adelantado y el comprador no paga de más. Las mismas reglas para todos.'],
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div className="min-h-screen bg-paper">
        <header className="bg-luz border-b border-line"><div className="max-w-4xl mx-auto px-5 pb-10 pt-24 md:px-8 md:pt-28">
          <p className="label-eyebrow text-brand-deep">Quiénes somos</p>
          <h1 className="mt-2 font-serif text-headline font-normal leading-[1.05] track-headline text-ink">Cambiar la forma de hacer negocios en Margarita, <em className="headline-italic">con conciencia, empatía y tratos justos</em></h1>
          <p className="mt-5 max-w-2xl text-body leading-relaxed text-ink-soft">El nombre lo dice: <b>Renace</b>. La isla renace cuando la gente puede volver a alojarse, comprar y moverse sin sentir que la están estafando. Empezamos con cuatro apartamentos nuestros en Pampatar —Los Geranios, La Caranta y Playa El Ángel—, traslados desde el aeropuerto, alquiler de carros y una guía de la isla escrita por gente de aquí.</p>
        </div></header>
        <main className="max-w-4xl mx-auto px-5 py-10 md:px-8 md:py-14">
          <section aria-labelledby="valores"><h2 id="valores" className="font-serif text-title font-semibold text-ink">Lo que creemos</h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">{valores.map(([k, v]) => <div key={k} className="rounded-card border border-line bg-white p-5"><dt className="font-serif text-title-sm font-semibold text-brand-deep">{k}</dt><dd className="mt-2 text-body leading-relaxed text-ink-soft">{v}</dd></div>)}</dl></section>
          <section aria-labelledby="quien" className="section-gap grid gap-8 md:grid-cols-[1fr_20rem]">
            <div><h2 id="quien" className="font-serif text-title font-semibold text-ink">Quién te atiende</h2>
              <p className="mt-4 text-body leading-relaxed text-ink-soft"><b>{a.representante || 'Valeria Zarate'}</b>, anfitriona en Pampatar, recibe cada reserva, coordina las llegadas desde el aeropuerto y escribe los consejos de la guía. Detrás está un equipo pequeño que mantiene los apartamentos, resuelve el agua y el gas cuando faltan y responde el WhatsApp de verdad.</p>
              <p className="mt-4 text-body leading-relaxed text-ink-soft">Cada estadía se formaliza con un <Link href="/politicas" className="text-brand-deep underline underline-offset-4">contrato de hospedaje con firma electrónica</Link>: sabes qué incluye, qué pasa si cancelas y cómo te protegemos. Nuestros anuncios en Airbnb tienen valoración media de 5.0.</p></div>
            <aside className="rounded-card border border-line bg-white p-5 text-meta text-ink-soft">
              <p className="label-eyebrow text-ink-subtle">Datos</p>
              <p className="mt-2"><b className="text-ink">{a.razon_social || SITE.name}</b>{a.rif ? <><br />RIF {a.rif}</> : null}<br />{a.domicilio_fiscal || 'Pampatar, estado Nueva Esparta, Venezuela'}</p>
              {contacto.whatsapp && <p className="mt-3"><a href={`https://wa.me/${contacto.whatsapp}`} rel="noopener" className="text-brand-deep underline underline-offset-4">WhatsApp +{contacto.whatsapp}</a></p>}
              {a.correo_corporativo && <p className="mt-1"><a href={`mailto:${a.correo_corporativo}`} className="text-brand-deep underline underline-offset-4">{a.correo_corporativo}</a></p>}
              <p className="mt-3"><a href="https://www.instagram.com/margaritarenace.ve/" target="_blank" rel="noopener noreferrer" className="text-brand-deep underline underline-offset-4">@margaritarenace.ve</a></p>
            </aside>
          </section>
          <section className="section-gap rounded-panel bg-luz border border-line p-7 md:p-10">
            <h2 className="font-serif text-headline font-normal track-headline text-ink">¿Hablamos?</h2>
            <p className="mt-3 max-w-2xl text-body text-ink-soft">Dinos fechas y cuántos vienen; te respondemos con disponibilidad y precio cerrado en el día.</p>
            <div className="mt-6 flex flex-wrap gap-3"><Link href="/reservas" className="btn-solid">Calcular mi estadía</Link><Link href="/guia" className="inline-flex min-h-[46px] items-center rounded-control border border-line bg-white px-5 text-meta font-medium text-brand-deep hover:border-brand/40">Ver la guía de la isla</Link></div>
          </section>
        </main>
      </div>
    </>
  );
}
