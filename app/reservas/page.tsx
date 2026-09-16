import type { Metadata } from 'next';
import { SITE, absoluteUrl } from '@/lib/site';
import { getProperties } from '@/lib/queries';
import { getContacto } from '@/lib/settings';
import { breadcrumbSchema, graph } from '@/lib/schema';
import Calculadora from './Calculadora';

// /reservas: «cuánto cuesta mi estadía» con fechas reales, en US$ y bolívares a
// BCV (y equivalente USDT), disponibilidad del calendario y WhatsApp con el mensaje armado.
// Es la página que enlazan los reels de precio en Instagram.
const TITULO = 'Reservar apartamento en Isla de Margarita: precio por noche y disponibilidad';
const DESCRIPCION = 'Calcula tu estadía en Pampatar (Los Geranios, La Caranta o Playa El Ángel): precio por noche en dólares, bolívares al BCV y equivalente en USDT, consulta de fechas y reserva directa por WhatsApp sin comisión.';
export const metadata: Metadata = { title: TITULO, description: DESCRIPCION, alternates: { canonical: '/reservas' }, openGraph: { type: 'website', url: absoluteUrl('/reservas'), siteName: SITE.name, title: TITULO, description: DESCRIPCION, images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: TITULO }] } };
export const revalidate = 3600;

export default async function ReservasPage() {
  const [props, contacto] = await Promise.all([getProperties(), getContacto()]);
  const aptos = props.filter((p) => !p.priceOnRequest && p.pricePerNight > 0).map((p) => ({ slug: p.slug, nombre: p.name, zona: p.zone, precio: p.pricePerNight, personas: p.guestsAllowed.adults + p.guestsAllowed.children, portada: p.image, minNoches: p.nightsCount }));
  const preguntas = [
      { '@type': 'Question', name: '¿Cuánto cuesta un apartamento en Isla de Margarita por noche?', acceptedAnswer: { '@type': 'Answer', text: aptos.length ? `La tarifa base de los apartamentos publicados en Pampatar parte de US$${Math.min(...aptos.map((a) => a.precio))} por noche. Consulta la capacidad y el mínimo de noches de cada ficha. El precio final y la disponibilidad se confirman antes de reservar.` : 'Estamos actualizando las tarifas del catálogo. Consulta el precio y la disponibilidad por WhatsApp.' } },
      { '@type': 'Question', name: '¿Cómo reservo sin comisión?', acceptedAnswer: { '@type': 'Answer', text: 'Eliges fechas y apartamento, te mostramos el total y nos escribes por WhatsApp. Confirmas con un anticipo del 50 % y firmas un contrato de hospedaje desde tu teléfono. Sin comisión de plataforma.' } },
      { '@type': 'Question', name: '¿Puedo pagar en bolívares?', acceptedAnswer: { '@type': 'Answer', text: 'Sí: pago móvil o efectivo en bolívares al BCV del día. También Zelle en dólares y USDT por Binance al equivalente del día (te lo mostramos en la calculadora).' } },
    ];
  const jsonLd = graph(breadcrumbSchema([{ name: 'Inicio', path: '/' }, { name: 'Reservar', path: '/reservas' }]), {
    '@type': 'FAQPage', mainEntity: preguntas,
  });
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div className="min-h-screen bg-paper">
        <header className="bg-luz border-b border-line"><div className="max-w-5xl mx-auto px-5 pb-8 pt-24 md:px-8 md:pt-28">
          <p className="label-eyebrow text-brand-deep">Reserva directa · sin comisión</p>
          <h1 className="mt-2 font-serif text-headline font-normal leading-[1.05] track-headline text-ink">¿Cuánto cuesta <em className="headline-italic">tu estadía?</em></h1>
          <p className="mt-4 max-w-2xl text-body text-ink-soft">Elige apartamento y fechas: te decimos el total en dólares, en bolívares al BCV de hoy y su equivalente en USDT, y preparamos tu mensaje de WhatsApp. La disponibilidad y el precio final se confirman antes de reservar. Te responde una persona.</p>
        </div></header>
        <main className="max-w-5xl mx-auto px-5 py-8 md:px-8 md:py-12">
          <Calculadora aptos={aptos} whatsapp={contacto.whatsapp} />
          <section className="mt-12 border-t border-line pt-8" aria-labelledby="preguntas-reserva">
            <h2 id="preguntas-reserva" className="font-serif text-title text-ink">Antes de reservar</h2>
            <dl className="mt-4 space-y-5">{preguntas.map((p) => <div key={p.name}><dt className="font-medium text-brand-deep">{p.name}</dt><dd className="mt-2 text-body text-ink-soft">{p.acceptedAnswer.text}</dd></div>)}</dl>
          </section>
        </main>
      </div>
    </>
  );
}
