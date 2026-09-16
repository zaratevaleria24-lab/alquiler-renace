# SEO y GEO — Margarita Renace

Estado al 2026-07-26. GEO = *Generative Engine Optimization*: aparecer en las
respuestas de ChatGPT, Perplexity, Claude y los AI Overviews de Google, no solo
en los diez resultados azules.

---

## ✅ Resuelto: el bloqueo de crawlers de IA en Cloudflare

**Estado: corregido por la dueña el 2026-07-26. Verificado.**

Cloudflare tenía activada su *Content Signals Policy* / AI Crawl Control, que
**inyectaba su propio contenido delante de la `robots.txt` del sitio**. El
dominio servía 116 líneas: las primeras 61 de Cloudflare y de la 62 en adelante
la que genera Next. En el bloque de Cloudflare había `Disallow: /` para
Amazonbot, Applebot-Extended, Bytespider, CCBot, **ClaudeBot**, Google-Extended,
**GPTBot** y meta-externalagent.

O sea: ChatGPT, Claude y Gemini/AI Overviews estaban bloqueados. Nuestra
`robots.txt` los permitía, pero quedaba en segundo lugar y con reglas
contradictorias para el mismo user-agent, que cada crawler resuelve a su manera.

Tras desactivarlo, el dominio sirve exactamente nuestras 55 líneas, con 17
grupos de user-agent declarados y ningún `Disallow: /`. Se comprobó además que
Cloudflare no les cierra la puerta por otra vía —protección de bots—: GPTBot,
ClaudeBot, PerplexityBot, Googlebot y bingbot reciben los mismos 79.806 bytes
que un navegador, con el FAQPage schema, los 8 pares pregunta/respuesta y los 9
enlaces a zonas dentro del HTML.

**Si en algún momento el sitio deja de aparecer en respuestas de IA, revisar
esto primero:**

```bash
curl -s "https://margaritarenace.com.ve/robots.txt?x=$RANDOM" | head -5
# Debe empezar en "User-Agent: *". Si aparece un preámbulo sobre
# "Content Signals", Cloudflare volvió a activar la inyección.

# Y que no les sirva un desafío en vez de la página:
curl -s -o /dev/null -w '%{http_code}\n' \
  -A "Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)" \
  https://margaritarenace.com.ve/
# Debe ser 200.
```

Matiz útil para el futuro: `Google-Extended` solo afecta a Gemini y a los AI
Overviews, **no** al índice normal de Google (ese es `Googlebot`). Bloquearlo no
hunde el SEO clásico, solo el GEO.

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

## 2026-08-11 — inventario reducido a 4 alojamientos

Decisión del cliente: dejar solo 4 apartamentos publicados. Ejecutado así:

- **Se usó `is_published = false`, no `DELETE`.** El esquema previó exactamente
  esto ("esconder sin borrar"), así que los 8 listados retirados son
  recuperables. Respaldo previo de la base en
  `/root/backups/margarita/pre-limpieza-listados-20260811-150447.sql`.
- **Se publicó `Los Geranios A`**, que es el único inventario real y estaba
  **despublicado mientras los 11 de relleno estaban en vivo** — la situación
  estaba invertida.
- Los otros 3 publicados se eligieron en **zonas distintas** (Porlamar, Costa
  Azul, Playa El Yaque) para no dejar todas las landings de zona vacías. Siguen
  siendo listados de relleno: hay que reemplazarlos por inventario real.

Consecuencias, todas correctas y verificadas:

| | Antes | Ahora |
|---|---|---|
| Propiedades publicadas | 12 (11 de relleno) | **4** (1 real + 3 de relleno) |
| URLs en el sitemap | 22 | **10** |
| Landings de zona | 10 | **4** (las 6 sin alojamientos dan 404) |

Las 6 zonas sin listados dan 404 y **el sitemap las quitó solo**, porque se
genera desde los datos. Eso evita el error "Enviada pero devuelve 404" en Search
Console. No hubo pérdida de posiciones: se comprobó que Google todavía no había
leído el sitemap ("Última lectura" vacía).

### Rediseño de la tarjeta

Con 4 alojamientos en vez de 12, la retícula pasó de 4 columnas estrechas a
**2×2 con fotos grandes** (`aspect-[3/2]` en vez de 4:3). La tarjeta ahora
muestra zona sobre un degradado, capacidad, descripción y el precio en serif
grande. Se limpiaron además dos colisiones de clases que traía: un
`transition-all` duplicado y un `hover:shadow-hard` que peleaba con un
`hover:shadow-[...]` arbitrario.

**Cambio con criterio propio:** la valoración ahora se muestra **solo si
`isReal`**. Los listados de relleno llevan ratings inventados (4.6–5.0) y
enseñárselos al visitante es pedirle que confíe en un dato falso — el mismo
motivo por el que `lib/schema.ts` no emite `aggregateRating`. Hoy se renderiza
una sola estrella en toda la home, la de Los Geranios A.

### Autos: la tabla está vacía

`vehicles` tiene **0 filas**, así que no había nada que reducir. `/autos` sirve
su estado vacío (292 palabras). Para publicar 4 vehículos hacen falta datos que
no se pueden inventar: marca, modelo, año, transmisión, plazas, precio por día y
fotos.

---

## Auditoría técnica del 2026-08-11 — el código ya está al día

Se midió todo contra producción buscando qué más se podía optimizar. **No se
encontró nada roto.** Queda registrado para no repetir el trabajo:

| Aspecto | Medición |
|---|---|
| TTFB | 271 ms |
| Protocolo y compresión | HTTP/2 + Brotli |
| Imágenes | WebP autohospedado, 34–96 KB, 12/13 con `width`/`height` |
| Ruta del LCP | primera imagen en `eager` + 2 `preload as=image` |
| Caché de assets | `max-age=31536000, immutable` |
| Las 22 URLs del sitemap | todas 200, ninguna con `noindex` |
| Schema | `Accommodation`, `BreadcrumbList`, `ItemList`, `FAQPage`, `LocalBusiness` |
| Enlazado interno | zonas entre sí, propiedades → su zona + relacionadas, home → 9 zonas |
| `robots.txt` | accesible a Googlebot, declara `Sitemap:` |
| `admin` | `x-robots-tag: noindex, nofollow, noarchive` |

Profundidad de contenido: home 1120 palabras · zonas ~465 · `/autos` 310 ·
propiedades 249.

### La única optimización que queda, y por qué no se hizo

Las imágenes **no llevan `srcset`**, así que un teléfono descarga las mismas
~600 KB de fotos que un escritorio; con imágenes responsivas se ahorrarían unos
350 KB en móvil. Implica convertir los `<img>` a `next/image` dentro de
`HomeClient.tsx` (72 KB) y recompilar Next.js en un servidor de 3.7 GB donde los
builds pesados pueden quedarse sin memoria (regla #2 del README del servidor).

Se decidió **no hacerlo por ahora**: es una mejora de Core Web Vitals que vale
décimas de segundo, y el sitio no está frenado por rendimiento. Está frenado por
lo de la lista de abajo. Refactorizar código que funciona para ganar décimas,
mientras faltan la ficha de Google y los listados reales, es movimiento sin
avance.

### Panorama competitivo (comprobado el 2026-08-11)

La primera página orgánica de "alquiler apartamentos Isla Margarita" y de
"alquiler apartamento Pampatar por días" está ocupada por MercadoLibre, Airbnb,
Booking, RE/MAX, Mitula, Vrbo, Tripadvisor y Likibu. Son dominios con millones
de enlaces y más de una década de historia.

**Conclusión estratégica: no se gana ahí, se gana en el paquete local.** Ninguno
de esos marketplaces aparece en el bloque de mapa, porque no son negocios con
dirección en Margarita. Y el paquete local se muestra **encima** de los
resultados orgánicos. Esa es la vía realista al primer resultado, y depende de la
ficha de Google Business y de las reseñas, no del código.

---

## Pendientes que necesitan decisión o datos de la dueña

Ordenados por impacto.

1. **Los 11 listados de relleno son el mayor lastre de SEO.** Anfitriones
   inventados, fotos de stock y ratings falsos. El sistema de contenido útil de
   Google apunta justo a esto, y en GEO es peor: los motores que verifican datos
   descubren que esas propiedades no existen y dejan de citar el sitio. Lo
   recomendable es dejar solo el inventario real —hoy Los Geranios A— y sumar
   listados a medida que existan. Un sitio con una propiedad real posiciona
   mejor que uno con doce inventadas.

   **Depende de esto una mejora concreta** (hallazgo del 2026-08-11): el
   `Accommodation` de cada propiedad **no declara `offers` ni `priceCurrency`**,
   así que Google no puede mostrar el precio en los resultados — algo de mucho
   valor en alquileres, donde el precio decide el clic. Pero marcar precios de
   propiedades inventadas amplifica el problema en vez de arreglarlo: primero se
   limpia el inventario, después se le pone precio estructurado a lo real.

   **✅ Resuelto el 2026-09-16.** El inventario se limpió el 2026-09-14
   (migración 026: los 8 inventados sin publicar y sin fotos), así que la
   condición se cumplió y esta tarea se había quedado colgada. `propertySchema`
   emite ahora `offers` con `price`, `priceCurrency: USD`, la tarifa marcada
   **por noche** (`UnitPriceSpecification` con `referenceQuantity` de 1 DAY —
   sin eso, US$65 se lee como el precio de la estadía entera) y el mínimo de
   noches real en `eligibleQuantity`. La guarda es `isReal`, no «hay relleno o
   no»: si algún día se vuelve a publicar un listado inventado, no se le marca
   precio solo. **No se emite `availability`**: `ical_feeds` está vacía, el
   sitio no sabe si una fecha está libre, y declarar `InStock` sería inventar
   disponibilidad.

   Matiz honesto sobre el alcance: para alquiler vacacional, el precio en el
   resultado enriquecido de Google sale de un feed de Hotel Center, no del
   JSON-LD (ver las fuentes de más abajo). Esto no pinta un precio en los diez
   resultados azules de la noche a la mañana. Lo que sí hace es que el precio
   sea un dato explícito y atribuible para los motores generativos — que es por
   donde hoy llega la tracción real (ver la sección de tráfico del 2026-09-16).

   Nota tranquilizadora: se verificó que **no hay `aggregateRating` ni `review`
   en el JSON-LD**. Los ratings de relleno son solo visuales, no están marcados,
   así que no hay riesgo de acción manual por reseñas falsas — que es el
   escenario grave de este tipo de contenido.

2. **Datos de contacto reales.** El SEO local depende de un NAP consistente
   entre el sitio, Google y los directorios. No se inventaron a propósito.

   **Ya no se editan en código.** Desde el 2026-08-03 viven en la base
   (`site_settings`) y se cambian desde **`/admin/contenido`**; de ahí se
   propagan solos al JSON-LD. `lib/site.ts` solo conserva lo que es constante
   del sitio. Esta descripción decía "`CONTACT` en `lib/site.ts`, hoy todo en
   `null`" y quedó desactualizada.

   Comprobado en producción el 2026-08-11: la entidad `LocalBusiness` del
   JSON-LD **sigue sin `telephone`**, y su `address` solo lleva
   `addressRegion: Nueva Esparta` y `addressCountry: VE` — **falta
   `addressLocality`**, o sea la ciudad. Para Google el negocio está "en algún
   lugar de Nueva Esparta", que es lo peor que puede pasarle a un negocio que
   compite en búsqueda local. Es lo de mayor retorno por minuto invertido de
   toda esta lista: llenar un formulario en el panel.

   **✅ Resuelto.** `telephone` entró el 2026-09-12 con el número de la dueña.
   `addressLocality` seguía faltando un mes después, y no era un dato que
   faltara: era que **no existía el campo donde ponerlo**. Se añadió la clave
   `ciudad` a `lib/settings.ts` (editable en `/admin/contenido`, por defecto
   **Pampatar**, que es donde opera el negocio y donde están los 4 apartamentos)
   y `organizationSchema` la emite como `addressLocality`. Verificado el
   2026-09-16: `{ addressLocality: "Pampatar", addressRegion: "Nueva Esparta",
   addressCountry: "VE" }`.

   Sigue faltando `streetAddress`, que es dato de la dueña y va en el mismo
   formulario.

3. **Google Business Profile.** Es lo que mete un negocio local en el mapa y en
   el paquete local, y no se puede hacer desde el código. Para un alquiler
   turístico en Margarita probablemente pesa más que cualquier otra acción de
   esta lista.

4. **Google Search Console y Bing Webmaster Tools.** Verificar el dominio y
   enviar el sitemap. Search Console es la única forma de ver qué búsquedas
   traen tráfico de verdad.

   **En curso el 2026-08-11.** Se eligió propiedad de tipo **Dominio** (no
   "Prefijo de URL"): cubre el apex, `www` y `admin`, y http y https, en una
   sola propiedad, en vez de una propiedad por variante con los datos partidos.
   Se verifica por TXT en Cloudflare, que es donde vive el DNS
   (`stanley/penny.ns.cloudflare.com`), así que no hace falta el hueco de
   `app/layout.tsx` — la verificación por meta tag solo sirve para propiedades
   de tipo prefijo.

   Antes de elegir Dominio se comprobó que el subdominio del CMS no se filtre:
   `admin.margaritarenace.com.ve` responde con
   `x-robots-tag: noindex, nofollow, noarchive`, así que no va a aparecer en los
   informes ni en Google. (Contraste: `form.brandia.eqnio.com`, del proyecto
   Leiros, sí está abierto a todos los rastreadores.)

   Tras verificar: **Sitemaps** → enviar
   `https://margaritarenace.com.ve/sitemap.xml` (22 URLs).

5. **Pasar Cloudflare a SSL "Full (strict)".** No es SEO, pero ya es seguro:
   el origen tiene certificado válido de Let's Encrypt.

6. **Fotos reales.** Dos imágenes son sustitutos de fotos que Unsplash borró
   (ver `DESPLIEGUE.md`), y las de stock no generan confianza en un alquiler.
   Las fotos propias también son las que pueden posicionar en Google Imágenes.

7. **Búsqueda con URL propia** (`/?zona=...&huespedes=...`). Haría la búsqueda
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

---

## 2026-09-12 — Auditoría a fondo y plan (apartamentos vacacionales)

Datos de partida: Search Console del 13-jun al 3-sep (244 impresiones, 5 clics,
CTR 2 %; 8 «no encontrado», 1 «con redirección», 6 «rastreada sin indexar») y
las métricas propias (36 visitantes en 30 días, 47 vistas, todos sin referrer).

### Lectura honesta de los números

- **Los 8 «404» son los 8 listados retirados el 11-ago**, que responden 410 a
  propósito. Correcto: Google los está sacando del índice. Van a desaparecer
  solos del informe.
- **La «página con redirección» y parte de las «sin indexar» eran las 5 zonas
  sin inventario**, que redirigían a la home (308). Cinco URLs con 300-400
  palabras de geografía real desperdiciadas. **Corregido hoy** (abajo).
- **Las «rastreadas sin indexar» que quedan son los 3 listados de relleno**
  (Penthouse Porlamar, Apartamento Costa Azul, Loft El Yaque): 190-230
  caracteres de descripción, 3 fotos de stock, anfitrión inventado. Google los
  lee y decide que no valen un lugar. Ninguna optimización compensa esto.
- **Todo el tráfico real llega sin referrer** = enlaces compartidos por
  WhatsApp e Instagram (las apps no mandan origen). Google todavía no manda
  gente. Es lo esperable a los 3 meses con 4 páginas de zona.
- **La única búsqueda con clic fue «apartamentos en alquiler en margarita
  porlamar 4 de mayo»**: la gente busca por avenida/sector, no por «Margarita
  Renace». Nadie busca la marca todavía.
- **El clic de Australia es real**: Search Console solo cuenta clics en
  resultados de Google, nunca de Instagram ni WhatsApp. Diáspora.

### 🔴 Lo más grave no es SEO: no hay número de WhatsApp

`site_settings` está vacío. El botón de reservar dice literalmente
**«WhatsApp — muy pronto»** y en todo el HTML del sitio no aparece ni un
`wa.me/`. 36 visitantes al mes y **ninguno puede reservar**. Se arregla en
`/admin/contenido` (WhatsApp, teléfono, Instagram) en dos minutos, sin
desplegar nada. Hasta que no esté, todo lo demás es decorativo.

**Resuelto el mismo día:** la dueña pasó el número (+58 422 1161238) y el
Instagram (@margaritarenace.ve); quedaron en `site_settings`. Verificado: el
botón de reservar abre WhatsApp en las 4 propiedades, las zonas vacías tienen
CTA, `/enlaces` resuelve WhatsApp e Instagram, y el JSON-LD lleva `telephone` y
`sameAs`. Se editan desde `/admin/contenido`.

### Hecho hoy (código, desplegado)

| Cambio | Por qué |
|---|---|
| Las tarjetas de la portada enlazan con `<a>` real a `/propiedad/<slug>` | En el HTML que recibe Google la portada no enlazaba a **ningún** apartamento (solo `onClick`). Eran huérfanos, conocidos solo por el sitemap |
| Las 9 zonas tienen landing, con o sin inventario (`getZonesAll`) | Se recuperan 5 URLs con contenido real. Sin apartamentos muestran aviso honesto + WhatsApp + enlaces a zonas con inventario. Sin `ItemList` vacío |
| Sitemap con las 9 zonas (prioridad 0.6 las vacías) | |
| `GeoCoordinates` por zona en `Place` y `containedInPlace`; `hasMap`; `additionalType: Apartment` | «Pampatar» pasa de ser una palabra a ser un punto del mapa para buscadores y motores de IA |
| ISR (`revalidate = 3600`) en zona y propiedad (● SSG en el build) | Estáticas y regeneradas por hora; el panel las invalida al guardar. La home siguió saliendo ƒ dinámica: algo en `HomeClient` la fuerza; con TTFB de 130 ms no vale la pena perseguirlo hoy |
| FAQ nueva: «¿Cómo se reserva?» | Es la pregunta de intención más alta; los motores de IA citan respuestas directas |
| Trabajo de agosto (36 archivos) commiteado y en GitHub | Estaba en producción sin respaldo desde el 3-ago |

### Lo que solo puede hacer la dueña — en este orden

1. **WhatsApp + Instagram en `/admin/contenido`.** Hoy. Sin esto no hay negocio.
2. **Los 4 apartamentos reales** (`DATOS-PENDIENTES.md`), cada uno con
   **mínimo 8 fotos propias** (dormitorio, baño, área común — es el mínimo que
   pide Google para alojamientos), descripción de 150+ palabras con lo que se
   ve desde la ventana y a cuántos minutos queda la playa, **precio publicado**
   (la competencia en Booking/Airbnb muestra US$35-220; «consultar precio» hace
   que Google no pueda comparar y la gente cierre la pestaña), coordenadas del
   edificio, y retirar los 3 de relleno. Un sitio con 4 reales posiciona
   mejor que uno con 12 inventados.
3. **Perfil de Empresa en Google (Google Maps) para «Margarita Renace» como
   agencia de alquiler vacacional**, no para cada apartamento (los alquileres
   individuales no son elegibles; una empresa que gestiona alquileres, sí, como
   negocio de área de servicio). Ahí caen las reseñas reales, que es el factor
   local #1 en 2026, y es la vía a «alquiler apartamento Margarita» en el mapa.
4. **Pedir reseña por WhatsApp a cada huésped al salir**, con el enlace del
   perfil de Google. Con 5-10 reseñas reales ya se puede emitir
   `aggregateRating` en el JSON-LD (hoy está prohibido por ser ficticio).
5. **Instagram/TikTok con el enlace al sitio en la bio** y, en cada
   publicación de apartamento, el enlace a SU página `/propiedad/…`, no a la
   home. Cada visita compartida es una señal.

### Plan 30 / 60 / 90 días (después de lo anterior)

**30 días — inventario real y conversión**
- Cargar los 4 reales; retirar relleno; `aggregateRating` cuando haya reseñas.
- Página de propiedad: sección «Cómo llegar y qué hay a 5 minutos» con
  distancias reales (playa, supermercado, farmacia, Sambil), «Reglas y
  check-in» y «Qué incluye». Son las secciones que Airbnb tiene y nosotros no,
  y las que los motores de IA citan.
- Botón de WhatsApp visible en el hero de la home (hoy solo en el drawer).

**60 días — contenido que responde lo que la gente busca**
- **Guías por sector, no solo por zona**: «Alquiler en la Av. 4 de Mayo»,
  «Costa Azul frente al mar», «Urb. Maneiro / Pampatar». La única búsqueda con
  clic fue de sector. 600-900 palabras, mapa, qué hay cerca, enlace a los
  apartamentos.
- **Guías de temporada**: «Carnaval en Margarita: cuándo reservar y precios»,
  «Semana Santa», «Temporada baja (mayo-junio): la más barata». La
  estacionalidad es el patrón de búsqueda #1 en vacacional.
- **Precios**: «¿Cuánto cuesta alquilar un apartamento en Margarita en 2026?»
  con una tabla real por zona y temporada. Contenido que nadie más publica →
  es lo que los motores de IA citan (dato propio).
- **Versión en inglés de home + zonas** (`/en/`) con `hreflang`: 20 % de los
  clics vienen de EE. UU. y Australia; parte es diáspora que busca en español,
  parte no.

**90 días — visibilidad fuera del sitio**
- **Google Vacation Rentals**: salir con calendario y precio dentro de Google
  es gratis y de alta intención, pero requiere un *connectivity partner*
  aprobado (Lodgify, Hostaway, etc., US$15-40/mes) o el programa de Hotel
  Center. Evaluar cuando haya 4+ reales con calendario; el iCal ya existe.
- Directorios y menciones: Mitula/Properati (indexan alquileres en Venezuela),
  guías de turismo de la isla, posadas/agencias aliadas. NAP idéntico en todos.
- Medir: Search Console (clics, no impresiones), WhatsApp abiertos desde el
  sitio (evento propio), reseñas en Google. Objetivo a 90 días: 30 clics/mes,
  10 reseñas, 4 reales publicados.

### GEO (aparecer en ChatGPT, Perplexity, AI Overviews)

Ya resuelto: robots abierto a 16 bots de IA (Cloudflare desbloqueado),
`llms.txt`, FAQ con `FAQPage`, respuestas autocontenidas. Lo que falta es lo
mismo que para Google: **datos propios verificables** (precios reales, fotos
reales, reseñas reales). En 2026 los AI Overviews aparecen en ~42 % de las
búsquedas y citan páginas que responden en la primera frase con un dato
concreto. Cada guía nueva debe abrir con la respuesta, no con introducción.

### Fuentes consultadas (2026)

- Google — [VacationRental structured data](https://developers.google.com/search/docs/appearance/structured-data/vacation-rental): 8 fotos mínimo, geo con 5 decimales, `containsPlace.occupancy`; el rich result exige Hotel Center.
- Google — [Elegibilidad de Perfil de Empresa](https://support.google.com/business/answer/13763036): propiedades en alquiler no son elegibles; la empresa gestora sí.
- Google — [Vacation rentals partners](https://support.google.com/hotelprices/answer/11946834); [Lodgify: Google Vacation Rentals guía 2026](https://www.lodgify.com/blog/google-vacation-rentals-guide/); [Rental Scale-Up: conexión directa vs. partner](https://www.rentalscaleup.com/how-to-list-on-google-vacation-rentals-part-3-direct-connection-or-connectivity-providers/).
- [CraftedStays: Vacation Rental SEO + AI Search 2026](https://craftedstays.co/vacation-rental-seo/); [VillaMarketers: guía completa 2026](https://villamarketers.com/vacation-rental-seo-guide); [Boostly: 7 tácticas para reserva directa](https://boostly.co.uk/vacation-rental-seo-tips/); [Houfy: Google Business Profile para vacacionales 2026](https://www.houfy.com/blog/google-business-profile-for-vacation-rentals-2026).
- [Search Engine Land: GEO 2026](https://searchengineland.com/mastering-generative-engine-optimization-in-2026-full-guide-469142); [HubSpot: GEO para pequeños negocios](https://blog.hubspot.com/marketing/generative-engine-optimization-small-business); [Megabant: factores de SEO local 2026](https://www.megabant.com/local-seo-ranking-factors-what-matters-most-in-2026/).

## Auditoría 2026-09-13 (tras guía, En venta, contratos, enlaces)

**Escaneo real** (curl sobre el sitio en producción): títulos, descripciones,
canonical, robots, H1, JSON-LD, alt, enlaces internos, peso y TTFB de 11 URLs;
robots.txt, sitemap (120 URLs con lastmod: 104 de la guía), llms.txt.

### Corregido en el acto
- **/guia pesaba 1,25 MB** (303 KB gzip): Next duplicaba el árbol de 103 tarjetas
  en el payload RSC. La lista pasó a componente cliente (`components/ListaGuia.tsx`)
  con datos compactos → **0,73 MB / 88 KB gzip**, mismo HTML para Google.
- 100 miniaturas de la guía con `alt=""` → ahora «Nombre, Isla de Margarita».
- /guia tenía **dos H1** (móvil y escritorio) → uno solo con spans responsivos.
- Títulos de 94–119 caracteres en la guía → ≤ 86 (`Nombre · Categoría en Isla de
  Margarita`, la plantilla antepone la marca). Descripciones de 194–237 → ≤ 166.
- Helpers puros de la guía en `lib/guia-comun.ts` (seguro para cliente).

### Estado
| Página | Título | Desc. | H1 | Canonical | JSON-LD | Peso |
|---|---|---|---|---|---|---|
| / | 67 | 160 | 1 | ✓ | Organization+LocalBusiness, WebSite, FAQPage | 99 KB |
| /guia | 72 | 147 | 1 | ✓ | BreadcrumbList, ItemList | 734 KB (88 gz) |
| /guia/[slug] | 61–86 | 143–155 | 1 | ✓ | Breadcrumb + Beach/Restaurant/LocalBusiness… | ~97 KB |
| /en-venta | 69 | 163 | 1 | ✓ | Breadcrumb, FAQPage | 195 KB |
| /propiedad/[slug] | 75 | 155 | 1 | ✓ | Breadcrumb, Accommodation; og:image = portada | ~55 KB |
| /alquiler/[zona] | 74 | 162 | 1 | ✓ | Place, ItemList | 58 KB |
| /autos | 70 | 166 | 1 | ✓ | Breadcrumb | 46 KB |
| /enlaces | noindex a propósito | | | | | 32 KB |

### Plan de mejora (prioridad → impacto)
1. **Search Console + Business Profile** (dueño): verificar propiedad (el TXT
   google-site-verification ya está en DNS), enviar sitemap, crear/reclamar la
   ficha de Google Business «Margarita Renace» en Pampatar con fotos, horario y
   el WhatsApp; enlazarla desde `sameAs` del LocalBusiness. Es el mayor salto
   para búsquedas locales («apartamentos en Pampatar»).
2. **Contenido por intención de búsqueda**: hoy las landings de zona (9) tienen
   160 palabras; ampliar cada una a 400–600 con qué hay cerca, precios medios,
   cómo llegar, y enlazar a los lugares de la guía de esa zona (interlinking
   guía ↔ alojamientos en ambos sentidos; ya existe «Dormí cerca» en la guía,
   falta el sentido inverso en /propiedad y /alquiler).
3. **Guía como imán de tráfico**: 103 fichas indexables con datos únicos.
   Añadir a cada ficha 2–3 preguntas frecuentes reales (FAQPage) y `TouristTrip`
   / `TouristAttraction` con `geo` y `openingHours` completos (ya hay lat/lng y
   horario de Google). Crear 4 páginas «hub» editoriales: /guia/playas,
   /guia/donde-comer, /guia/servicios, /guia/aventura (hoy son filtros ?c= con
   canonical a /guia: no rankean por sí mismos).
4. **Reseñas propias**: pedir a cada huésped una reseña en Google Business y
   mostrar `aggregateRating` SOLO de reseñas propias en el sitio (las de Airbnb no
   se pueden marcar). Cuando haya 5+, activar el markup en /propiedad.
5. **Core Web Vitals**: /guia todavía 734 KB de HTML; objetivo < 400 KB:
   servir solo la primera tanda en HTML y traer el resto por fetch al bajar
   (hoy va todo oculto). Imágenes: pasar miniaturas a AVIF + WebP con `srcset`
   (llega con R2). Medir con PageSpeed cuando el dueño habilite la API.
6. **Señales de confianza**: página «Quiénes somos» con foto del equipo, RIF y
   dirección (E-E-A-T), política de cancelación y de datos (ya están en el
   contrato: enlazarlas como páginas), y autor visible en la guía («Escrito por
   Valeria, anfitriona en Pampatar»).
7. **Higiene**: el filtro ?c= podría llevar `noindex,follow` además del canonical;
   revisar 404/410 en Search Console; añadir `hreflang` solo si algún día hay
   inglés (la diáspora busca en español, no hace falta hoy).
8. **Correo/marca**: DMARC (pendiente en Cloudflare) también mejora la reputación
   del dominio para Google.

### Ejecutado el mismo día (2026-09-13, tarde)
- Hubs editoriales: /guia/playas, /guia/donde-comer, /guia/servicios, /guia/aventura
  (`lib/guia-hubs.ts`; se sirven desde `app/guia/[slug]`), en sitemap y enlazados
  desde /guia, cada ficha y las landings de zona.
- Fichas de la guía: FAQ visible + FAQPage (horario, cómo llegar, costo, mejor
  momento, contacto), `openingHours`, línea de autor («Escrito por Valeria…»).
- Interlinking guía ↔ alojamientos: /propiedad/<slug> y /alquiler/<zona> muestran
  «Cerca, según nuestra guía» (lugares con el mismo zone_slug) y los hubs.
- Páginas nuevas: /nosotros (AboutPage, valores, quién atiende, RIF), /politicas
  (cancelación, depósito, normas, datos), /reservas (calculadora con fechas,
  disponibilidad real, US$ + Bs a tasa USDT, WhatsApp armado; FAQPage).
- `?c=` en /guia → `noindex, follow`; `/$` y `/&` → 301 al inicio (Search Console
  los reportaba como 404; no salen de nuestro HTML).
- Search Console (dato del dueño): dominio YA verificado, 244 impresiones / 5 clics,
  9 indexadas / 15 no. Los «404» de /alquiler/juan-griego etc. hoy responden 200;
  /propiedad/studio-* devuelven 410 a propósito (listados de relleno retirados).
  Falta: **reenviar el sitemap** (Google leyó 10 URLs el 10/09; hoy trae 127) y
  pedir indexación de /guia, los 4 hubs y /reservas.

### Rendimiento e indexación (2026-09-13, noche)
- **/guia: 1,25 MB → 359 KB (67 KB gzip)**. `ListaGuia` es dueña del filtro y la
  paginación: el servidor pinta solo la primera tanda (18) y manda los 103 lugares
  como datos compactos; el navegador pinta al filtrar o al bajar (botón «Ver más»
  + IntersectionObserver). FiltroGuia y HubGuia solo avisan `guia:elegir`.
- **IndexNow** (`scripts/indexnow.cjs`): al desplegar con `npm run deploy` se
  avisa a Bing/Yandex/DuckDuckGo de las URLs nuevas (estado en
  `/root/backups/margarita/indexnow-enviadas.json`). Clave en
  `/etc/margarita-renace/indexnow.env`, archivo público `public/<clave>.txt`.
  Primer envío: 127 URLs, HTTP 202. Google no usa IndexNow → sitemap + Search Console.
- Regla operativa: **URL nueva → reenviar sitemap + solicitar indexación en Search
  Console; texto cambiado → nada.** Despliegue estándar: `npm run deploy`.

### Campañas y consentimiento (2026-09-13, noche)
- **Cookies**: el sitio sigue sin cookies propias. `components/Consentimiento.tsx`
  (Consent Mode v2) muestra el aviso SOLO si hay IDs en
  `/etc/margarita-renace/marketing.env` (`GA4_ID=G-…`, `META_PIXEL_ID=…`). Con
  «Aceptar» carga gtag y el Pixel; con «Solo lo necesario» gtag queda en modo
  denegado (mediciones anónimas, sin cookies). La decisión vive en localStorage
  `mr:consentimiento`; «Cookies» en el pie la reabre. Sección «Cookies» en /politicas.
  **Falta**: que el dueño cree la propiedad GA4 y el Pixel y pase los IDs.
- **Landings de zona ampliadas** (`lib/zones-content-extra.ts`): 518–907 palabras
  por zona con distancias, servicios de la guía, precios y cuándo ir; las zonas sin
  inventario lo dicen con honestidad y remiten a Pampatar/Costa Azul/Porlamar.

### Páginas por intención de búsqueda (2026-09-13, noche)
`lib/paginas-intencion.ts` + `app/[tema]/page.tsx` (`dynamicParams=false`: solo
los slugs declarados; el resto sigue 404). Article + FAQPage, apartamentos
propios, enlaces a hubs y CTA a /reservas. En sitemap y en el pie:
- /apartamentos-con-piscina-en-margarita
- /alquiler-por-mes-en-margarita (precio mensual «a consultar», sin inventar)
- /cuanto-cuesta-viajar-a-margarita (presupuesto 5 noches con rangos honestos)
Para agregar otra: una entrada más en PAGINAS; el sitemap y la ruta salen solos.
