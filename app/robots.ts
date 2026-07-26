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

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // El sitio no tiene panel ni API todavía, pero cuando el admin exista
        // (va en subdominio aparte) conviene que estas rutas nunca se indexen.
        disallow: ['/api/', '/admin/'],
      },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: '/' })),
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE.url,
  };
}
