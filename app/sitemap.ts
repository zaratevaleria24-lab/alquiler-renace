import type { MetadataRoute } from 'next';
import { getZones } from '@/lib/queries';
import { absoluteUrl } from '@/lib/site';

// Genera /sitemap.xml en build, a partir de las mismas zonas que producen las
// landings. Así no puede quedar desincronizado: si se agrega un listado en una
// zona nueva, su página y su entrada del sitemap aparecen juntas.
//
// lastModified sale de la fecha de build, no de Date.now() en request: el sitio
// es estático y todas las páginas se regeneran en el mismo build.

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ZONES = await getZones();
  const buildDate = new Date();

  return [
    {
      url: absoluteUrl('/'),
      lastModified: buildDate,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...ZONES.map((zone) => ({
      url: absoluteUrl(`/alquiler/${zone.slug}`),
      lastModified: buildDate,
      changeFrequency: 'weekly' as const,
      // Las zonas con más inventario son las que más conviene rastrear.
      priority: zone.properties.length > 1 ? 0.9 : 0.8,
    })),
  ];
}
