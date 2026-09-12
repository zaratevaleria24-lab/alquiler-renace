import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getContacto } from '@/lib/settings';
import { SITE, absoluteUrl } from '@/lib/site';
import { breadcrumbSchema, graph, ventaSchema } from '@/lib/schema';
import {
  getInmueblePublicado, getInmueblesPublicados, getProspectoPublicado, getProspectosPublicados, textoPublico,
} from '@/lib/ventas';
import DetalleInmueble, { type DatosDetalle } from '@/components/DetalleInmueble';
import type { DatosTarjeta } from '@/components/TarjetaVenta';
import { dias, tarjetaDePropio, tarjetaDeProspecto, tipoLabel, tituloBonito } from '@/lib/ventas-vista';

// Ficha de un inmueble en venta. Resuelve dos orígenes con UNA sola vista
// (DetalleInmueble): los propios (indexables, con Offer en el JSON-LD) y los
// anuncios de la isla (noindex, sin datos del vendedor).
//
// DINÁMICA A PROPÓSITO: el bloque de precio consulta la tasa del día sin
// caché; en una ruta prerenderizada eso revienta con DYNAMIC_SERVER_USAGE, y
// además queremos la tasa del momento.
export const dynamic = 'force-dynamic';

async function relacionados(excluirHref: string, zona: string | null): Promise<DatosTarjeta[]> {
  const [propios, isla] = await Promise.all([getInmueblesPublicados(), getProspectosPublicados()]);
  const todos = [...propios.map(tarjetaDePropio), ...isla.map(tarjetaDeProspecto)].filter((t) => t.href !== excluirHref);
  const misma = todos.filter((t) => t.zona === zona);
  return [...misma, ...todos.filter((t) => t.zona !== zona)].slice(0, 3);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const path = `/en-venta/${slug}`;
  const i = await getInmueblePublicado(slug);
  if (i) {
    const title = `${i.titulo} — ${tipoLabel(i.tipo)} en venta en ${i.zone}, Isla de Margarita`;
    const description = (i.descripcion || `${i.titulo} en venta en ${i.zone}, Isla de Margarita.`).replace(/\s+/g, ' ').slice(0, 155);
    const img = i.image ? absoluteUrl(i.image) : '/opengraph-image';
    return {
      title, description, alternates: { canonical: path },
      openGraph: { type: 'website', url: absoluteUrl(path), siteName: SITE.name, title, description, images: [{ url: img, alt: title }] },
      twitter: { card: 'summary_large_image', title, description, images: [img] },
    };
  }
  const p = await getProspectoPublicado(slug);
  if (!p) return { title: 'Inmueble no disponible' };
  const t = `${tituloBonito(p)} — en venta en ${p.zoneName ?? p.municipio ?? 'Isla de Margarita'}`;
  const d = textoPublico(p.descripcion).replace(/\s+/g, ' ').slice(0, 155) || t;
  const img = p.fotosLocales[0] ? absoluteUrl(p.fotosLocales[0]) : '/opengraph-image';
  // Texto y fotos de terceros: se comparte, no se indexa.
  return {
    title: t, description: d, robots: { index: false, follow: true },
    openGraph: { type: 'website', url: absoluteUrl(path), siteName: SITE.name, title: t, description: d, images: [{ url: img, alt: t }] },
    twitter: { card: 'summary_large_image', title: t, description: d, images: [img] },
  };
}

export default async function InmueblePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const path = `/en-venta/${slug}`;
  const [i, contacto] = await Promise.all([getInmueblePublicado(slug), getContacto()]);

  if (i) {
    const jsonLd = graph(
      breadcrumbSchema([{ name: 'Inicio', path: '/' }, { name: 'En venta', path: '/en-venta' }, { name: i.titulo, path }]),
      ventaSchema(i, path),
    );
    const d: DatosDetalle = {
      titulo: i.titulo, tipo: tipoLabel(i.tipo), zona: i.zone, zoneSlug: i.zoneSlug, ubicacion: i.ubicacion,
      ref: `MR-${i.slug.slice(0, 8).toUpperCase()}`, path,
      fotos: i.images.map((im, k) => ({ src: im.path, alt: im.alt || `Foto ${k + 1} de ${i.titulo}, ${i.zone}` })),
      precioUsd: i.precioUsd, aConsultar: i.precioAConsultar,
      habitaciones: i.habitaciones, banos: i.banos, m2: i.m2Construccion, m2Terreno: i.m2Terreno, estacionamientos: i.estacionamientos,
      descripcion: i.descripcion, lat: i.latitud, lng: i.longitud, propio: true, dias: dias(i.updatedAt),
      whatsapp: contacto.whatsapp, relacionados: await relacionados(path, i.zone),
    };
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
        <DetalleInmueble d={d} />
      </>
    );
  }

  const p = await getProspectoPublicado(slug);
  if (!p) notFound();
  const zona = p.zoneName ?? p.ciudad ?? 'Isla de Margarita';
  const tipo = /casa|villa|quinta|townhouse/i.test(p.tituloLimpio) ? 'Casa' : /terreno|parcela/i.test(p.tituloLimpio) ? 'Terreno' : /local|oficina/i.test(p.tituloLimpio) ? 'Local' : /posada|hotel/i.test(p.tituloLimpio) ? 'Posada' : 'Apartamento';
  const d: DatosDetalle = {
    titulo: tituloBonito(p), tipo, zona, zoneSlug: p.zoneSlug, ubicacion: [p.municipio && `Municipio ${p.municipio}`, p.ciudad].filter(Boolean).join(', '),
    ref: `M-${p.fbId.slice(-6)}`, path,
    fotos: p.fotosLocales.map((f, k) => ({ src: f, alt: `${p.tituloLimpio} — foto ${k + 1}, en venta en ${zona}, Isla de Margarita` })),
    precioUsd: p.precioUsd ?? 0, aConsultar: !p.precioUsd,
    habitaciones: p.habitaciones, banos: p.banos, m2: p.m2, m2Terreno: null, estacionamientos: null,
    descripcion: textoPublico(p.descripcion), lat: p.latitud, lng: p.longitud, propio: false, dias: dias(p.vistoPrimero),
    whatsapp: contacto.whatsapp, relacionados: await relacionados(path, zona),
  };
  return <DetalleInmueble d={d} />;
}
