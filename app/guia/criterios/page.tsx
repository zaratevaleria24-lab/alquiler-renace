import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE, absoluteUrl } from '@/lib/site';
import { getContacto } from '@/lib/settings';
import { breadcrumbSchema, graph } from '@/lib/schema';

const PATH = '/guia/criterios';
const TITULO = 'Cómo elaboramos la guía de Margarita';
const DESCRIPCION = 'Quién está detrás de la guía de Margarita Renace, de dónde salen los datos, qué significa la fecha de actualización y cómo comunicar una corrección.';
export const metadata: Metadata = {
  title: TITULO, description: DESCRIPCION, alternates: { canonical: PATH },
  openGraph: { type: 'website', url: absoluteUrl(PATH), siteName: SITE.name, title: TITULO, description: DESCRIPCION, images: ['/opengraph-image'] },
  twitter: { card: 'summary_large_image', title: TITULO, description: DESCRIPCION, images: ['/opengraph-image'] },
};
export default async function CriteriosPage() {
  const contacto = await getContacto();
  const wa = contacto.whatsapp ? `https://wa.me/${contacto.whatsapp}?text=${encodeURIComponent('Hola, quisiera comunicar una corrección en la guía de Margarita. La ficha es: ')}` : null;
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: graph(breadcrumbSchema([{ name: 'Inicio', path: '/' }, { name: 'Guía turística', path: '/guia' }, { name: 'Criterios editoriales', path: PATH }])) }} />
    <main className="mx-auto max-w-3xl px-5 pb-16 pt-28 md:px-8">
      <Link href="/guia" className="text-meta text-brand-deep underline">Volver a la guía turística</Link>
      <h1 className="mt-6 font-serif text-headline leading-tight text-ink">Cómo elaboramos <em className="headline-italic">la guía de Margarita</em></h1>
      <p className="mt-5 text-body-lg text-ink-soft">Una guía local de Margarita Renace, hecha desde Pampatar para quienes visitan la isla y para quienes viven aquí.</p>
      <div className="mt-8 space-y-8 text-body leading-relaxed text-ink-soft">
        <section><h2 className="font-serif text-title-sm text-ink">Quién está detrás</h2><p className="mt-2">Margarita Renace es un proyecto privado de alojamiento y guía local. Esta guía es independiente; no representa a una oficina pública de turismo ni acredita oficialmente a los establecimientos. Puedes conocer el proyecto en <Link href="/nosotros" className="text-brand-deep underline">Quiénes somos</Link>.</p></section>
        <section><h2 className="font-serif text-title-sm text-ink">Textos, datos y fotografías</h2><p className="mt-2">Los textos y consejos de las fichas se publican por Margarita Renace. Los horarios, teléfonos y valoraciones identificados como datos de Google proceden de Google Places. Las fotos pueden ser propias, de autores con licencia indicada o mostradas mediante Google; sus créditos se conservan donde corresponden. Una valoración de Google no es una reseña escrita por nuestro equipo.</p></section>
        <section><h2 className="font-serif text-title-sm text-ink">Qué significa “actualizado”</h2><p className="mt-2">La fecha de sincronización indica cuándo se incorporaron los datos de Google. No acredita una visita personal ni una revisión de todos los textos, precios o servicios. Si falta la fecha, lo indicamos. Un horario publicado puede cambiar: confirma directamente antes de un desplazamiento o una reserva.</p></section>
        <section><h2 className="font-serif text-title-sm text-ink">Lugares, recomendaciones y aliados</h2><p className="mt-2">Aparecer en el directorio no significa que el lugar sea un aliado ni que hayamos probado cada servicio. Las recomendaciones de Margarita Renace se identifican en su ficha; los criterios de nuestra red están en <Link href="/nosotros#red" className="text-brand-deep underline">La red Margarita Renace</Link>. Los alojamientos que ofrecemos y los contactos con nuestro equipo se distinguen de los datos de los negocios incluidos en la guía.</p></section>
        <section><h2 className="font-serif text-title-sm text-ink">Cómo leer el mapa y las excursiones</h2><p className="mt-2">El mapa ayuda a localizar lugares; una coordenada no certifica un acceso público, una ruta peatonal ni una salida disponible. Coche, Cubagua y Los Frailes requieren transporte marítimo. Los horarios de un destino no equivalen a los horarios de las embarcaciones.</p></section>
        <section><h2 className="font-serif text-title-sm text-ink">Comunica una corrección</h2><p className="mt-2">Si encuentras un dato que cambió, envíanos el enlace de la ficha, qué debe corregirse y una referencia o fecha que permita revisarlo. No necesitamos datos personales de terceros.</p>{wa && <a href={wa} className="btn-solid mt-4" rel="noopener noreferrer">Comunicar una corrección</a>}</section>
      </div>
    </main>
  </>;
}
