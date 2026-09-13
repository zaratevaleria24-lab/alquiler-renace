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
const DESCRIPCION = 'Calcula tu estadía en Pampatar (Los Geranios, La Caranta o Playa El Ángel): precio por noche en dólares, bolívares al BCV y equivalente en USDT, fechas disponibles y reserva directa por WhatsApp sin comisión.';
export const metadata: Metadata = { title: TITULO, description: DESCRIPCION, alternates: { canonical: '/reservas' }, openGraph: { type: 'website', url: absoluteUrl('/reservas'), siteName: SITE.name, title: TITULO, description: DESCRIPCION, images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: TITULO }] } };
export const revalidate = 3600;

export default async function ReservasPage() {
  const [props, contacto] = await Promise.all([getProperties(), getContacto()]);
  const aptos = props.filter((p) => !p.priceOnRequest && p.pricePerNight > 0).map((p) => ({ slug: p.slug, nombre: p.name, zona: p.zone, precio: p.pricePerNight, personas: p.guestsAllowed.adults + p.guestsAllowed.children, portada: p.image }));
  const jsonLd = graph(breadcrumbSchema([{ name: 'Inicio', path: '/' }, { name: 'Reservar', path: '/reservas' }]), {
    '@type': 'FAQPage', mainEntity: [
      { '@type': 'Question', name: '¿Cuánto cuesta un apartamento en Isla de Margarita por noche?', acceptedAnswer: { '@type': 'Answer', text: `Nuestros apartamentos en Pampatar (Los Geranios, La Caranta y Playa El Ángel) cuestan desde US$ ${Math.min(...aptos.map((a) => a.precio))} por noche, para hasta 6 personas. En bolívares se calcula al BCV del día del pago; también aceptamos USDT al equivalente del día.` } },
      { '@type': 'Question', name: '¿Cómo reservo sin comisión?', acceptedAnswer: { '@type': 'Answer', text: 'Eliges fechas y apartamento, te mostramos el total y nos escribes por WhatsApp. Confirmas con un anticipo del 50 % y firmas un contrato de hospedaje desde tu teléfono. Sin comisión de plataforma.' } },
      { '@type': 'Question', name: '¿Puedo pagar en bolívares?', acceptedAnswer: { '@type': 'Answer', text: 'Sí: pago móvil o efectivo en bolívares al BCV del día. También Zelle en dólares y USDT por Binance al equivalente del día (te lo mostramos en la calculadora).' } },
    ],
  });
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div className="min-h-screen bg-paper">
        <header className="bg-luz border-b border-line"><div className="max-w-5xl mx-auto px-5 pb-8 pt-24 md:px-8 md:pt-28">
          <p className="label-eyebrow text-brand-deep">Reserva directa · sin comisión</p>
          <h1 className="mt-2 font-serif text-headline font-normal leading-[1.05] track-headline text-ink">¿Cuánto cuesta <em className="headline-italic">tu estadía?</em></h1>
          <p className="mt-4 max-w-2xl text-body text-ink-soft">Elige apartamento y fechas: te decimos el total en dólares, en bolívares al BCV de hoy y su equivalente en USDT, si las fechas están libres, y te llevamos al WhatsApp con todo escrito. Te responde una persona.</p>
        </div></header>
        <main className="max-w-5xl mx-auto px-5 py-8 md:px-8 md:py-12">
          <Calculadora aptos={aptos} whatsapp={contacto.whatsapp} />
        </main>
      </div>
    </>
  );
}
