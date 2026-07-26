# SEO y GEO — Margarita Renace

Estado al 2026-07-26. GEO = *Generative Engine Optimization*: aparecer en las
respuestas de ChatGPT, Perplexity, Claude y los AI Overviews de Google, no solo
en los diez resultados azules.

---

## 🚨 Lo más importante: Cloudflare está bloqueando a los crawlers de IA

**Esto hay que arreglarlo en el panel de Cloudflare. No se puede tocar desde el
servidor, y mientras siga así el trabajo de GEO no rinde.**

Cloudflare tiene activada su *Content Signals Policy* / AI Crawl Control, que
**inyecta su propio contenido delante de la `robots.txt` del sitio**. Lo que
sirve el dominio hoy son 116 líneas: las primeras 61 son de Cloudflare, y de la
62 en adelante viene la que genera Next.

En el bloque de Cloudflare hay `Disallow: /` para:

```
Amazonbot · Applebot-Extended · Bytespider · CCBot · ClaudeBot
CloudflareBrowserRenderingCrawler · Google-Extended · GPTBot · meta-externalagent
```

Es decir: **GPTBot (ChatGPT), ClaudeBot y Google-Extended (Gemini y AI
Overviews) están bloqueados**. Nuestra `robots.txt` los permite explícitamente,
pero queda en segundo lugar y con reglas contradictorias para el mismo
user-agent: cada crawler resuelve el empate a su manera y varios se quedan con
el primer grupo que encuentran, o sea el `Disallow`.

Ojo con un matiz: `Google-Extended` **no** afecta al índice normal de Google
—eso es `Googlebot`, que sí está permitido— solo a Gemini y los AI Overviews.
El SEO clásico no está en riesgo; el GEO sí.

**Cómo arreglarlo:** panel de Cloudflare → dominio `margaritarenace.com.ve` →
sección **AI Crawl Control** (según el plan puede aparecer bajo *Security* →
*Bots*) → desactivar la gestión automática de `robots.txt` / poner las señales
de contenido `ai-train` y `search` en permitido. Al terminar, verificar con:

```bash
curl -s https://margaritarenace.com.ve/robots.txt | head -5
# Debe empezar en "User-Agent: *", sin el preámbulo de Content Signals.
```

---

## Implementado

### Fundamento técnico

| Qué | Dónde | Detalle |
|---|---|---|
| Metadata completa | `app/layout.tsx` | `metadataBase`, plantilla de títulos, canonical, Open Graph `es_VE`, Twitter card, keywords |
| `lang="es-VE"` | `app/layout.tsx` | Señal geográfica, no solo de idioma. Antes era `es` |
| `max-image-preview:large` | `app/layout.tsx` | Sin esto Google recorta las miniaturas. En un sitio de alojamientos es de los ajustes con más impacto en Imágenes y Discover |
| Metas geográficas | `app/layout.tsx` | `geo.region`, `geo.position`, `ICBM` con las coordenadas de la isla |
| `robots.txt` | `app/robots.ts` | Generado en build. Permite explícitamente 16 crawlers, de IA incluidos |
| `sitemap.xml` | `app/sitemap.ts` | Home + 9 zonas, derivado de los mismos datos que las landings: no se puede desincronizar |
| Tarjeta social 1200×630 | `app/opengraph-image.tsx` | Generada con `next/og`. Es lo que se ve al compartir por WhatsApp, que en Venezuela es *el* canal |
| `llms.txt` | `public/llms.txt` | Resumen estructurado del sitio y de la isla para motores generativos |

### Contenido y estructura

- **9 landings de zona** en `/alquiler/<zona>`: Pampatar, Porlamar, Costa Azul,
  Juan Griego, Manzanillo, Playa Caribe, Playa El Yaque, Playa Guacuco, Playa
  Parguito. Server Components estáticos, con `h1` propio, metadata propia,
  contenido real de cada lugar y enlazado cruzado entre todas.

  **Por qué son el mayor golpe:** el home solo puede competir por "alquiler Isla
  de Margarita", la búsqueda más disputada. La intención real de la gente es
  específica —"apartamentos en Pampatar", "alojamiento El Yaque"— y eso necesita
  URL propia con contenido propio. El texto de cada zona vive en
  `lib/zones-content.ts` y es geografía verificable, no relleno: una landing que
  solo repita "alquiler en X" es una *doorway page* y Google las penaliza.

- **`h1` del home reescrito.** Decía solo *"Vive la Isla como en Casa"*: cero
  palabras por las que alguien busque. Ahora la frase de marca sigue siendo el
  texto dominante y la keyword va dentro del mismo `h1`, en segunda línea. El
  diseño no cambió.

- **Preguntas frecuentes** (`lib/faq.ts`, 8 preguntas) con `FAQPage` schema.
  Es la pieza que más mueve la aguja en GEO: los motores generativos citan
  respuestas directas y autocontenidas. Cada respuesta arranca afirmando y da
  datos concretos. Se renderizan con `<details>` nativo, así que el texto está
  en el HTML sin depender de JavaScript.

- **Sección de contexto del destino** con información real de la isla (accesos,
  clima, temporadas, las dos costas).

- **Enlazado interno**: el home enlaza a las 9 zonas y cada zona a las otras 8.
  Sin esto las landings serían huérfanas: en el sitemap pero sin un enlace
  apuntándolas, que es la vía rápida a que Google las considere de bajo valor.

### Rendimiento e imágenes

- Foto del hero: `fetchPriority="high"`, sin lazy, con `width`/`height`. Es la
  LCP de la página y en Venezuela la conexión es lenta.
- Resto de imágenes: `loading="lazy"`, `decoding="async"` y dimensiones fijas
  para que no haya salto de layout (CLS).
- `alt` reescritos con zona e isla. Uno decía literalmente `Gallery image 0`:
  en inglés e inútil, tanto para lectores de pantalla como para Google Imágenes.
- Estáticos con hash cacheados un año como inmutables en nginx.

### Datos estructurados

`lib/schema.ts`. En el home: `Organization` + `LocalBusiness`, `WebSite`,
`FAQPage`. En cada zona: `BreadcrumbList`, `Place`, `ItemList` con
`Accommodation`.

**Regla que no se rompe: no se emite `aggregateRating`, `Review` ni `Offer`
para los listados de relleno.** De los 12 listados, solo "Los Geranios A" es
real; los otros 11 tienen anfitriones inventados, fotos de stock y ratings de
4.6 a 4.97 que no vienen de ninguna reseña. Marcarlos como datos estructurados
sería markup de reseñas fabricadas: lo prohíben las políticas de Google y se
castiga con **acción manual, que quita los rich results de todo el dominio**, no
solo del marcado infractor. Cuando los listados sean reales y tengan reseñas
verificables, entonces sí corresponde.

Tampoco se declara `SearchAction` (el sitelinks searchbox): la búsqueda del home
es solo client-side y no tiene URL propia, así que declararla sería falso.

---

## Pendientes que necesitan decisión o datos de la dueña

Ordenados por impacto.

1. **Desbloquear los crawlers de IA en Cloudflare** (ver arriba). Sin esto no
   hay GEO.

2. **Los 11 listados de relleno son el mayor lastre de SEO.** Anfitriones
   inventados, fotos de stock y ratings falsos. El sistema de contenido útil de
   Google apunta justo a esto, y en GEO es peor: los motores que verifican datos
   descubren que esas propiedades no existen y dejan de citar el sitio. Lo
   recomendable es dejar solo el inventario real —hoy Los Geranios A— y sumar
   listados a medida que existan. Un sitio con una propiedad real posiciona
   mejor que uno con doce inventadas.

3. **Datos de contacto reales** (`CONTACT` en `lib/site.ts`, hoy todo en
   `null`): teléfono, WhatsApp, correo y dirección. El SEO local depende de un
   NAP consistente entre el sitio, Google y los directorios. No se inventaron a
   propósito. Al llenarlos se propagan solos al JSON-LD.

4. **Google Business Profile.** Es lo que mete un negocio local en el mapa y en
   el paquete local, y no se puede hacer desde el código. Para un alquiler
   turístico en Margarita probablemente pesa más que cualquier otra acción de
   esta lista.

5. **Google Search Console y Bing Webmaster Tools.** Verificar el dominio y
   enviar el sitemap. El hueco para los códigos está comentado en
   `app/layout.tsx`. Search Console además es la única forma de ver qué
   búsquedas traen tráfico de verdad.

6. **Pasar Cloudflare a SSL "Full (strict)".** No es SEO, pero ya es seguro:
   el origen tiene certificado válido de Let's Encrypt.

7. **Fotos reales.** Dos imágenes son sustitutos de fotos que Unsplash borró
   (ver `DESPLIEGUE.md`), y las de stock no generan confianza en un alquiler.
   Las fotos propias también son las que pueden posicionar en Google Imágenes.

8. **Búsqueda con URL propia** (`/?zona=...&huespedes=...`). Haría la búsqueda
   enlazable y compartible, y habilitaría declarar `SearchAction` de forma
   honesta.

---

## Cómo verificar después de un cambio

```bash
cd /root/proyectos/margarita-renace
nice -n 15 npm run build && pm2 restart margarita-renace

B=https://margaritarenace.com.ve
curl -s $B/sitemap.xml | grep -c '<loc>'          # 10 URLs
curl -s $B/robots.txt | head -3                   # ¿sigue el preámbulo de CF?
curl -s $B/ | grep -o 'application/ld+json' | wc -l
curl -sI $B/opengraph-image | head -1
```

Validadores externos: Rich Results Test de Google, validator.schema.org, y el
depurador de enlaces compartidos de WhatsApp o Facebook para la tarjeta OG.
