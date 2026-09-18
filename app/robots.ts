import type { MetadataRoute } from 'next';
import { SITE, absoluteUrl } from '@/lib/site';

// Permisos de rastreo, no una garantía de indexación ni recomendación por IA.
// Googlebot controla Search y sus funciones de IA; Google-Extended controla
// otros usos de Google. No se necesita un archivo ni marcado especial de GEO.
// https://developers.google.com/search/docs/appearance/ai-features
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot',
  'Applebot-Extended',
  'CCBot',
  'meta-externalagent',
  'Bingbot',
  'DuckDuckBot',
  'YandexBot',
];

// El panel ya existe (subdominio admin., con su propio noindex por cabecera y
// por metadata). Disallow limita rastreo; no sustituye autenticación ni noindex.
const RUTAS_VEDADAS = ['/api/', '/admin/'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/guia/foto/'],
        disallow: RUTAS_VEDADAS,
      },
      // Los bloques por nombre repiten el `disallow`: en robots.txt un
      // user-agent con bloque propio NO hereda nada del bloque `*`, usa solo el
      // suyo. Sin esta línea, los 16 crawlers de acá abajo tenían permiso
      // EXPLÍCITO para /admin/ mientras el resto lo tenía vedado.
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: ['/', '/api/guia/foto/'],
        disallow: RUTAS_VEDADAS,
      })),
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    // `host` sin protocolo: es una directiva de Yandex y espera un nombre de
    // dominio. Con 'https://…' delante la línea es basura que el crawler ignora.
    host: new URL(SITE.url).host,
  };
}
