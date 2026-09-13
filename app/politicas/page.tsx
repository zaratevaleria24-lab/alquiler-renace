import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE, absoluteUrl } from '@/lib/site';
import { getAjustes } from '@/lib/settings';
import { breadcrumbSchema, graph } from '@/lib/schema';

// Políticas en lenguaje claro. Son las mismas reglas del contrato de hospedaje
// (lib/contratos-clausulas.ts): si cambia una, cambia allá primero.
const TITULO = 'Políticas de reserva, cancelación y datos';
const DESCRIPCION = 'Cómo reservamos, qué pasa si cancelas, el depósito de garantía, las normas de la casa y qué hacemos con tus datos. Las mismas reglas del contrato de hospedaje.';
export const metadata: Metadata = { title: TITULO, description: DESCRIPCION, alternates: { canonical: '/politicas' }, openGraph: { type: 'website', url: absoluteUrl('/politicas'), siteName: SITE.name, title: TITULO, description: DESCRIPCION } };
export const revalidate = 3600;

export default async function PoliticasPage() {
  const a = await getAjustes() as unknown as Record<string, string>;
  const entrada = a.contrato_checkin || '14:00', salida = a.contrato_checkout || '12:00', deposito = a.contrato_deposito || '50';
  const secciones: [string, string[]][] = [
    ['Reserva y pago', [`Reservas directo por WhatsApp o en /reservas, o por Airbnb si prefieres su protección. El precio se expresa en dólares; si pagas en bolívares se calcula a la tasa USDT (Binance P2P) del día del pago, que te informamos por escrito.`, 'Para confirmar, un anticipo (normalmente el 50 %) por Zelle, Binance/USDT, pago móvil o efectivo; el saldo, al ingresar. Recibes un contrato de hospedaje para firmar desde tu teléfono antes de llegar.']],
    ['Cancelación', ['Con 7 días o más de anticipación: devolvemos el 100 % de lo pagado.', 'Con menos de 7 días y más de 48 horas: el 50 %.', 'Con menos de 48 horas o si no te presentas: no hay reembolso.', 'Si cancelamos nosotros por causa propia, devolvemos el 100 %. Por fuerza mayor (cierre del aeropuerto, emergencia sanitaria, desastre natural) reprogramamos sin penalidad.']],
    ['Entrada, salida y depósito', [`Entrada a partir de las ${entrada}; salida hasta las ${salida}. Horarios distintos se acuerdan por escrito y pueden tener costo.`, `Depósito de garantía de US$ ${deposito} al ingresar, que devolvemos íntegro al salir tras revisar el apartamento (o en 24 horas si fue electrónico). Solo se descuenta lo que falte o se dañe por uso indebido.`]],
    ['Normas de la casa', ['Solo las personas declaradas en la reserva; todas presentan cédula o pasaporte al ingresar.', 'Sin fiestas ni eventos; no se fuma dentro; descanso de los vecinos entre las 10 de la noche y las 8 de la mañana; se cumplen las normas del conjunto (piscina, áreas comunes, estacionamiento).', 'Mascotas solo con autorización escrita.']],
    ['Servicios', ['Incluimos agua, electricidad, internet y los enseres del inventario. Los cortes de luz, agua o internet de los prestadores del servicio —frecuentes en la isla— no son responsabilidad nuestra ni dan derecho a reembolso, pero si el tanque baja o falta gas, avísanos y lo gestionamos a la brevedad.']],
    ['Tus datos', ['Los datos tuyos y de tus acompañantes se usan solo para el contrato, el registro de hospedaje que exigen las autoridades y la comunicación durante la estadía. No se comparten con terceros ni se usan para publicidad.', 'Al firmar el contrato electrónico se registran, como prueba de la firma, fecha y hora, dirección IP, dispositivo, idioma y zona horaria, y el código de verificación enviado a tu correo. Puedes pedir una copia o la eliminación de tus datos al terminar la estadía escribiéndonos.']],
    ['Cookies', ['El sitio no usa cookies propias: las métricas de visitas son nuestras, sin cookies ni direcciones IP. Las únicas cookies posibles son las de medición y publicidad (Google Analytics, Meta) y solo se activan si las aceptas en el aviso; sirven para saber si nuestros anuncios traen huéspedes. Puedes cambiar tu decisión en «Cookies», al pie de la página. Si no aceptas, la web funciona igual.']],
    ['Marco legal', ['El contrato se rige por las leyes de Venezuela. La firma electrónica tiene la validez del Decreto con Fuerza de Ley sobre Mensajes de Datos y Firmas Electrónicas; cada contrato firmado tiene una página de verificación con su huella criptográfica, sello de tiempo de una autoridad externa y anclaje en la cadena de Bitcoin.']],
  ];
  const jsonLd = graph(breadcrumbSchema([{ name: 'Inicio', path: '/' }, { name: 'Políticas', path: '/politicas' }]));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div className="min-h-screen bg-paper">
        <header className="bg-luz border-b border-line"><div className="max-w-3xl mx-auto px-5 pb-10 pt-24 md:px-8 md:pt-28">
          <p className="label-eyebrow text-brand-deep">Políticas</p>
          <h1 className="mt-2 font-serif text-headline font-normal leading-[1.05] track-headline text-ink">Reglas claras, <em className="headline-italic">antes de reservar</em></h1>
          <p className="mt-4 max-w-2xl text-body text-ink-soft">Son las mismas cláusulas del contrato de hospedaje que firmas antes de llegar, en lenguaje llano. Si algo no te cuadra, pregúntanos antes.</p>
        </div></header>
        <main className="max-w-3xl mx-auto px-5 py-10 md:px-8 md:py-14">
          {secciones.map(([t, ps]) => <section key={t} className="mb-8"><h2 className="font-serif text-title-sm font-semibold text-brand-deep">{t}</h2><ul className="mt-2 space-y-2">{ps.map((p) => <li key={p.slice(0, 30)} className="text-body leading-relaxed text-ink-soft">{p}</li>)}</ul></section>)}
          <p className="text-meta text-ink-muted">Última revisión: septiembre de 2026. <Link href="/nosotros" className="text-brand-deep underline underline-offset-4">Quiénes somos</Link> · <Link href="/reservas" className="text-brand-deep underline underline-offset-4">Calcular una estadía</Link></p>
        </main>
      </div>
    </>
  );
}
