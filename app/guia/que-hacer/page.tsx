import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE, absoluteUrl } from '@/lib/site';
import { getLugares } from '@/lib/guia';
import { breadcrumbSchema, graph } from '@/lib/schema';

const PATH = '/guia/que-hacer';
const TITULO = 'Qué hacer en Isla de Margarita: planes y recorridos';
const DESCRIPCION = 'Elige qué hacer en Margarita: Pampatar, playas, castillos, La Restinga y excursiones a islas vecinas. Ideas para organizar tres días, con mapa y fichas útiles.';
export const revalidate = 3600;
export const metadata: Metadata = {
  title: TITULO, description: DESCRIPCION, alternates: { canonical: PATH },
  openGraph: { type: 'article', url: absoluteUrl(PATH), siteName: SITE.name, title: TITULO, description: DESCRIPCION, images: ['/opengraph-image'] },
  twitter: { card: 'summary_large_image', title: TITULO, description: DESCRIPCION, images: ['/opengraph-image'] },
};

const PLANES = [
  { id: 'pampatar', titulo: 'Pampatar: patrimonio y vistas de la costa', para: 'Si buscas combinar historia, un paseo y una comida.', texto: 'Empieza por el castillo de San Carlos de Borromeo y el entorno de la bahía. El faro de Punta Ballena es otra parada para mirar la costa: consulta su acceso y organiza el traslado antes de añadirlo al paseo. No hace falta recorrer toda la isla en un día.', slugs: ['castillo-de-san-carlos-de-borromeo', 'faro-de-punta-ballena'] },
  { id: 'playas', titulo: 'Elige una playa según el plan del día', para: 'Si prefieres dedicar el día al mar.', texto: 'Compara El Agua, Parguito, Guacuco y El Yaque en las fichas de playas. Elegir por ubicación, acceso y servicios resulta más útil que buscar una única “mejor playa”. El oleaje y el viento cambian: las condiciones de baño se comprueban al llegar, especialmente con niños.', slugs: ['playa-el-agua', 'playa-parguito', 'playa-guacuco', 'playa-el-yaque'] },
  { id: 'patrimonio', titulo: 'El Valle y La Asunción: otra mirada a Margarita', para: 'Si te interesan los pueblos y el patrimonio.', texto: 'La basílica de Nuestra Señora del Valle y el castillo de Santa Rosa permiten armar un recorrido distinto al de playa. Son paradas en localidades diferentes: mira el mapa, confirma los horarios y deja espacio para los traslados.', slugs: ['basilica-de-nuestra-senora-del-valle', 'castillo-de-santa-rosa'] },
  { id: 'juan-griego', titulo: 'Juan Griego y el Fortín de La Galera', para: 'Si quieres conocer otra zona y contemplar la bahía.', texto: 'Puedes dedicar una salida a Juan Griego y su fortín. Si buscas el atardecer, organiza antes el regreso y consulta las condiciones del acceso; el tiempo puede cambiar la vista que esperabas.', slugs: ['fortin-de-la-galera'] },
  { id: 'restinga', titulo: 'La Restinga: un paseo por la laguna', para: 'Si buscas naturaleza y un recorrido en embarcación.', texto: 'El Parque Nacional Laguna de La Restinga propone una experiencia distinta a la costa urbana. Separa el traslado por carretera del paseo por los manglares. Antes de salir, confirma embarque, duración, precio e inclusiones con quien presta el servicio.', slugs: ['parque-nacional-laguna-de-la-restinga'] },
  { id: 'aventura', titulo: 'Kite, senderismo o buceo según tu experiencia', para: 'Si prefieres una actividad organizada.', texto: 'Elige una actividad por tu nivel y las condiciones del día. Pregunta por el equipo incluido, el acompañamiento, los requisitos y las condiciones de cancelación. La presencia de un operador en la guía no certifica por sí sola sus habilitaciones.', slugs: ['kitesurf-y-windsurf-en-el-yaque', 'buceo-y-snorkel-en-los-frailes', 'senderismo-por-los-cerros-de-la-isla'] },
  { id: 'islas', titulo: 'Coche y Cubagua: excursiones a islas vecinas', para: 'Si quieres reservar una salida por mar.', texto: 'Coche y Cubagua son islas distintas de Margarita. Necesitas coordinar el cruce marítimo; no se llega conduciendo desde Pampatar. Confirma el punto de salida, los traslados terrestres, el regreso y las condiciones del mar. Evita encajar una excursión incierta justo antes de tu vuelo o ferry.', slugs: ['isla-de-coche', 'isla-de-cubagua', 'excursion-a-coche-y-cubagua-en-lancha'] },
];

export default async function QueHacerPage() {
  const lugares = await getLugares();
  const publicados = new Map(lugares.map((l) => [l.slug, l]));
  const schema = graph(breadcrumbSchema([{ name: 'Inicio', path: '/' }, { name: 'Guía turística', path: '/guia' }, { name: 'Qué hacer', path: PATH }]), {
    '@type': 'Article', headline: TITULO, description: DESCRIPCION,
    mainEntityOfPage: absoluteUrl(PATH), inLanguage: SITE.locale,
    author: { '@id': absoluteUrl('/#organizacion') }, publisher: { '@id': absoluteUrl('/#organizacion') },
  });
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />
    <main className="mx-auto max-w-5xl px-5 pb-16 pt-28 md:px-8">
      <Link href="/guia" className="text-meta text-brand-deep underline underline-offset-4">Guía turística de Margarita</Link>
      <p className="label-eyebrow mt-6 text-brand-deep">Organiza tu visita · Nueva Esparta</p>
      <h1 className="mt-3 font-serif text-headline leading-tight text-ink">Qué hacer en <em className="headline-italic">Isla de Margarita</em></h1>
      <p className="mt-5 max-w-3xl text-body-lg text-ink-soft">Combina playas, pueblos y naturaleza según dónde estés y cuánto quieras desplazarte. Estas ideas te ayudan a elegir; cada lugar enlaza a su ficha y puedes situarlo en el <Link href="/mapa" className="text-brand-deep underline">mapa turístico</Link>.</p>
      <p className="mt-3 text-meta text-ink-muted">Por Margarita Renace, desde Pampatar · <Link href="/guia/criterios" className="underline">Fuentes y criterios de la guía</Link></p>
      <nav aria-label="Planes en esta página" className="mt-6 flex flex-wrap gap-2">{PLANES.map((p) => <a key={p.id} href={`#${p.id}`} className="rounded-chip border border-line bg-white px-3 py-2 text-ui text-brand-deep">{p.titulo.split(':')[0]}</a>)}</nav>
      <div className="mt-10 grid gap-5 md:grid-cols-2">{PLANES.map((plan) => <section key={plan.id} id={plan.id} className="scroll-mt-28 rounded-panel border border-line bg-white p-6">
        <h2 className="font-serif text-title-sm text-ink">{plan.titulo}</h2>
        <p className="mt-2 text-meta font-medium text-brand-deep">{plan.para}</p>
        <p className="mt-3 text-body leading-relaxed text-ink-soft">{plan.texto}</p>
        <ul className="mt-4 space-y-2">{plan.slugs.filter((slug) => publicados.has(slug)).map((slug) => <li key={slug}><Link href={`/guia/${slug}`} className="text-meta text-brand-deep underline underline-offset-4">{publicados.get(slug)!.nombre}</Link></li>)}</ul>
      </section>)}</div>
      <section className="section-gap rounded-panel border border-line bg-luz p-6 md:p-8">
        <h2 className="font-serif text-title text-ink">Una idea para organizar tres días</h2>
        <p className="mt-3 text-body text-ink-soft">Es una propuesta flexible, no un circuito con tiempos garantizados. Cuenta aparte tus días de llegada y salida y ajusta el orden al clima y al transporte.</p>
        <ol className="mt-4 space-y-4 text-body text-ink-soft">
          <li><strong>Día 1: conocer tu entorno.</strong> Si estás en Pampatar, explora su bahía y patrimonio. Elige dónde comer y familiarízate con las distancias.</li>
          <li><strong>Día 2: una zona de playas.</strong> Escoge una playa principal y deja tiempo para disfrutarla. Añade otra parada solo si el mapa y el transporte lo permiten.</li>
          <li><strong>Día 3: naturaleza o una isla vecina.</strong> Elige entre La Restinga y una excursión marítima confirmada. Son alternativas: no hace falta meterlas todas en el mismo día.</li>
        </ol>
      </section>
      <section className="section-gap grid gap-6 md:grid-cols-2">
        <div><h2 className="font-serif text-title-sm text-ink">Si viajas con niños</h2><p className="mt-3 text-body text-ink-soft">Prioriza sombra, descansos, baños y traslados que puedas manejar. No deduzcas que una playa es apta para bañarse solo por una foto. Para una excursión, consulta edades admitidas y equipo disponible.</p></div>
        <div><h2 className="font-serif text-title-sm text-ink">Si no tienes carro</h2><p className="mt-3 text-body text-ink-soft">Agrupa las visitas por zona y acuerda ida y regreso antes de salir. Un punto en el mapa no garantiza acceso caminando. Consulta los <Link href="/guia/servicios" className="text-brand-deep underline">servicios de transporte</Link> y confirma tarifas directamente.</p></div>
      </section>
      <nav aria-label="Continúa preparando tu viaje" className="section-gap flex flex-wrap gap-4 text-meta text-brand-deep">
        <Link href="/guia/playas" className="underline">Comparar playas</Link><Link href="/guia/donde-comer" className="underline">Dónde comer</Link><Link href="/guia/aventura" className="underline">Excursiones y aventura</Link><Link href="/cuanto-cuesta-viajar-a-margarita" className="underline">Preparar el presupuesto</Link><Link href="/mapa" className="underline">Abrir el mapa</Link>
      </nav>
      <p className="mt-8 text-ui text-ink-muted">Referencia geográfica complementaria: <a href="https://www.venezuelatuya.com/margarita/guia_turistica_margarita.htm" className="underline" rel="noopener noreferrer">guía de Margarita de Venezuela Tuya</a>. Para horarios, precios y salidas, consulta la ficha y confirma con el lugar u operador.</p>
    </main>
  </>;
}
