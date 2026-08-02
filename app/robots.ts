import type { MetadataRoute } from 'next';
import { SITE, absoluteUrl } from '@/lib/site';

// Genera /robots.txt en build.
//
// DECISIÓN SOBRE CRAWLERS DE IA (esto es el corazón del GEO): se permiten
// explícitamente. Para que Margarita Renace aparezca en respuestas de ChatGPT,
// Perplexity, Claude o los AI Overviews de Google, esos crawlers tienen que
// poder leer el sitio. Bloquearlos es la razón número uno por la que un
// negocio local no aparece en respuestas generativas.
//
// Nombrarlos en un `allow` explícito además evita que un robots.txt genérico
// futuro los excluya por accidente. Si algún día se quiere revertir, el
// crawler que hay que negar por nombre está en esta lista:
//   GPTBot / OAI-SearchBot  → OpenAI (ChatGPT)
//   ClaudeBot / Claude-User → Anthropic
//   PerplexityBot           → Perplexity
//   Google-Extended         → controla Gemini y AI Overviews, NO el índice
//                             normal de Google (ese es Googlebot)
//   Applebot-Extended       → Apple Intelligence
//   CCBot                   → Common Crawl, del que se nutren muchos modelos
//   Bingbot                 → índice de Bing y también Copilot
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
// por metadata). Estas rutas no se indexan desde ningún user-agent.
const RUTAS_VEDADAS = ['/api/', '/admin/'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: RUTAS_VEDADAS,
      },
      // Los bloques por nombre repiten el `disallow`: en robots.txt un
      // user-agent con bloque propio NO hereda nada del bloque `*`, usa solo el
      // suyo. Sin esta línea, los 16 crawlers de acá abajo tenían permiso
      // EXPLÍCITO para /admin/ mientras el resto lo tenía vedado.
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: RUTAS_VEDADAS,
      })),
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    // `host` sin protocolo: es una directiva de Yandex y espera un nombre de
    // dominio. Con 'https://…' delante la línea es basura que el crawler ignora.
    host: new URL(SITE.url).host,
  };
}
