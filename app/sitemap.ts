import type { MetadataRoute } from 'next';
import { getProperties, getZonesAll } from '@/lib/queries';
import { getInmueblesPublicados } from '@/lib/ventas';
import { getLugares } from '@/lib/guia';
import { HUBS } from '@/lib/guia-hubs';
import { PAGINAS } from '@/lib/paginas-intencion';
import { absoluteUrl } from '@/lib/site';

// Genera /sitemap.xml en build, a partir de las mismas zonas que producen las
// landings. Así no puede quedar desincronizado: si se agrega un listado en una
// zona nueva, su página y su entrada del sitemap aparecen juntas.
//
// Solo se declara lastModified cuando existe una fecha de contenido verificable.
// Un despliegue no significa que todas las páginas hayan cambiado.

// Refleja publicaciones del panel sin quedar congelado entre despliegues.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [ZONES, PROPERTIES, VENTAS, LUGARES] = await Promise.all([getZonesAll(), getProperties(), getInmueblesPublicados(), getLugares()]);


  return [
    {
      url: absoluteUrl('/'),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      // El mapa es contenido propio y enlaza las 126 fichas de la guía: entra
      // al sitemap con prioridad alta, igual que la guía.
      url: absoluteUrl('/mapa'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: absoluteUrl('/autos'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...ZONES.map((zone) => ({
      url: absoluteUrl(`/alquiler/${zone.slug}`),
      changeFrequency: 'weekly' as const,
      // Las zonas con más inventario son las que más conviene rastrear; las
      // que aún no tienen apartamentos entran igual (tienen contenido propio),
      // pero con menos prioridad.
      priority: zone.properties.length > 1 ? 0.9 : zone.properties.length === 1 ? 0.8 : 0.6,
    })),
    ...PROPERTIES.map((p) => ({
      url: absoluteUrl(`/propiedad/${p.slug}`),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    { url: absoluteUrl('/en-venta'), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: absoluteUrl('/guia'), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: absoluteUrl('/guia/que-hacer'), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: absoluteUrl('/guia/criterios'), changeFrequency: 'monthly' as const, priority: 0.5 },
    ...HUBS.map((h) => ({ url: absoluteUrl(`/guia/${h.slug}`), changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...PAGINAS.map((p) => ({ url: absoluteUrl(`/${p.slug}`), changeFrequency: 'monthly' as const, priority: 0.7 })),
    { url: absoluteUrl('/reservas'), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: absoluteUrl('/nosotros'), changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: absoluteUrl('/politicas'), changeFrequency: 'yearly' as const, priority: 0.4 },
    ...LUGARES.map((l) => ({ url: absoluteUrl(`/guia/${l.slug}`), changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...VENTAS.map((i) => ({
      url: absoluteUrl(`/en-venta/${i.slug}`),
      lastModified: new Date(i.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
