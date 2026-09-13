import type { MetadataRoute } from 'next';
import { getProperties, getZonesAll } from '@/lib/queries';
import { getInmueblesPublicados } from '@/lib/ventas';
import { getLugares } from '@/lib/guia';
import { absoluteUrl } from '@/lib/site';

// Genera /sitemap.xml en build, a partir de las mismas zonas que producen las
// landings. Así no puede quedar desincronizado: si se agrega un listado en una
// zona nueva, su página y su entrada del sitemap aparecen juntas.
//
// lastModified sale de la fecha de build, no de Date.now() en request: el sitio
// es estático y todas las páginas se regeneran en el mismo build.

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [ZONES, PROPERTIES, VENTAS, LUGARES] = await Promise.all([getZonesAll(), getProperties(), getInmueblesPublicados(), getLugares()]);
  const buildDate = new Date();

  return [
    {
      url: absoluteUrl('/'),
      lastModified: buildDate,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: absoluteUrl('/autos'),
      lastModified: buildDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...ZONES.map((zone) => ({
      url: absoluteUrl(`/alquiler/${zone.slug}`),
      lastModified: buildDate,
      changeFrequency: 'weekly' as const,
      // Las zonas con más inventario son las que más conviene rastrear; las
      // que aún no tienen apartamentos entran igual (tienen contenido propio),
      // pero con menos prioridad.
      priority: zone.properties.length > 1 ? 0.9 : zone.properties.length === 1 ? 0.8 : 0.6,
    })),
    ...PROPERTIES.map((p) => ({
      url: absoluteUrl(`/propiedad/${p.slug}`),
      lastModified: buildDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    { url: absoluteUrl('/en-venta'), lastModified: buildDate, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: absoluteUrl('/guia'), lastModified: buildDate, changeFrequency: 'weekly' as const, priority: 0.9 },
    ...LUGARES.map((l) => ({ url: absoluteUrl(`/guia/${l.slug}`), lastModified: buildDate, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...VENTAS.map((i) => ({
      url: absoluteUrl(`/en-venta/${i.slug}`),
      lastModified: new Date(i.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
