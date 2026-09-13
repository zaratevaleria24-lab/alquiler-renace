# Guía turística — /guia

Creada el 2026-09-13 a pedido de la mamá de la dueña. Pensada para abrirse desde
un **QR pegado en cada apartamento** (`/guia/qr` imprime el cartel; el QR en
`public/qr-guia.png` y `.svg` apunta a `/guia?desde=qr`).

## Qué es

52 lugares y planes de la isla en 10 categorías (playas, qué hacer, dónde comer,
historia, naturaleza, miradores, museos, con niños, de noche, compras) más 7
consejos de viaje (dinero, transporte, seguridad, playa, comida, temporadas,
servicios). Cada ficha: fotos, cuándo ir, cuánto dura, cuánto cuesta, horario de
hoy, valoración de Google, descripción y **el consejo de Margarita Renace**,
«Cómo llegar» (Google Maps con ruta), Instagram, teléfono, y «Duerme cerca» con
nuestros apartamentos de la zona.

## Las tres fuentes y sus reglas

| Fuente | Qué aporta | Regla |
|---|---|---|
| **Nosotros** (`scripts/guia-semilla.ts`, editable en `/admin/guia`) | descripción, consejo, mejor momento, duración, costo, categoría | Voz de `IDENTIDAD.md`: datos y no adjetivos |
| **Google Places (New)** | rating, reseñas, coordenadas, dirección, teléfono, web, horario, resumen, fotos | `place_id` se guarda para siempre; el resto ≤30 días → botón «Refrescar» en el panel. **Las fotos NO se guardan**: `/api/guia/foto/<id>/<n>` las sirve al vuelo con caché de horas y crédito del autor |
| **Wikimedia Commons** | fotos libres (CC0, dominio público, CC BY, CC BY-SA) | Se descargan a `/var/www/margarita-uploads/guia/<slug>/` con crédito y licencia en `fotos[]`. Revisar a ojo: «Los Frailes» trajo un monasterio y «Sambil» un techo (se quitaron a mano el mismo día) |
| **Fotos propias** | subidas desde el panel | Van primero: son la portada. Credito «Margarita Renace» |

**Instagram** se investigó con Apify (`instagram-hashtag-scraper`, ~US$0,07): los
posts recientes de #islademargarita son ruido (tiendas, policía), pero los
hashtags de actividad sí revelan operadores reales (@scubadivingmargarita,
@margaritakite, @cochekite). Se usan como enlace «Ver en Instagram» por lugar;
**no se republican fotos de Instagram** (derechos + enlaces que caducan).

## Archivos

- `db/migrations/012-guia.sql` — `guia_lugares`, `guia_consejos`.
- `lib/guia.ts` — tipos, consultas con caché `TAG_GUIA`, Places, proxy de fotos, horario de hoy.
- `scripts/guia-semilla.ts` + `scripts/guia-importar.ts` — semilla curada e importador (idempotente):
  `export $(grep -h '^POSTGRES_URL=' .env | head -1) && npx tsx scripts/guia-importar.ts`.
  Los volcados de Places usados para «comer» y «noche» están en el scratchpad de la sesión; el script los ignora si no existen.
- `app/guia/page.tsx`, `app/guia/[slug]/page.tsx`, `app/guia/qr/page.tsx`, `app/api/guia/foto/[id]/[n]/route.ts`.
- `components/TarjetaLugar.tsx`, `components/MapaGuia.tsx` (Google Maps, se carga solo al tocar «Ver en el mapa»), reutiliza `GaleriaInmueble`.
- `app/admin/(panel)/guia/` — lista, crear (busca en Google), editar, fotos, imperdible, publicar, refrescar Google.
- Claves: `/etc/margarita-renace/google.env` (`PLACES_KEY`, `MAPS_JS_KEY`, copiadas de PROYECTO X). **Pendiente del dueño**: agregar `https://margaritarenace.com.ve/*` a los referentes de la clave de Maps o el mapa no carga (la lista funciona igual).

## Decisiones de diseño

- Móvil primero: cabecera corta, categorías en tira deslizable pegada bajo la barra, tarjetas grandes con foto, barra fija «Ir» en la ficha.
- Sin Lenis en `/guia` (igual que `/en-venta`): scroll nativo.
- El mapa es un extra bajo demanda (~150 KB de SDK que la lista no paga).
- La zona mostrada es el **municipio** real, no la zona del sitio más cercana (que engañaba: «Playa El Agua · Manzanillo»). «Duerme cerca» sí usa la zona más cercana si está a ≤12 km.
- Indexable y en el sitemap: es contenido propio y es la mejor pieza SEO del sitio («qué hacer en Margarita», «Playa El Agua horario», etc.).


## Servicios y hub móvil (2026-09-13)

- La guía también **resuelve**: 6 categorías de servicio (`grupo: 'resolver'` en
  `CATEGORIAS`): `delivery`, `supermercado`, `licores`, `agua` (botellones,
  cisterna, gas), `salud` (farmacias y clínicas), `transporte` (Ridery, taxis,
  alquiler de carros, nuestro traslado). 22 entradas en `scripts/guia-semilla.ts`,
  descubiertas con Google Places e Instagram (Apify): @tucisternamargarita,
  @aguagraterol, @elabuelopachangueromgta, @alcostomgta, @farmaciaelcrucero.mgta.
- Los servicios usan `components/TarjetaServicio.tsx` (foto chica, acciones
  WhatsApp / Llamar / Ir / Instagram a la vista); los lugares siguen con
  `TarjetaLugar`. `esServicio(cat)` decide cuál.
- **Teléfono** (8 de cada 10 visitas): `components/HubGuia.tsx` muestra baldosas
  «Resolver» y «Descubrir» en vez de la lista; tocar una dispara `guia:elegir`,
  `FiltroGuia` filtra y baja a `#resultados-guia`; aparece la tira de chips con
  «← Inicio» para volver. En escritorio (`md:`) el hub no existe y quedan los chips.
- **Bienvenida** (`components/Bienvenida.tsx`, Motion v12): emblema con resorte,
  nombre y barra que sigue la carga real (`load`), tope 2,4 s, una vez por sesión
  (`sessionStorage guia:bienvenida`), solo en teléfono o con `?desde=qr` (el QR
  apunta ahí y en ese caso viene ya en el HTML del servidor). Con
  `prefers-reduced-motion` no se muestra.
- Entradas cuyo match de Google fue erróneo se dejaron sin datos de Google a
  mano (El Abuelo Pachanguero, TequeDun, Yummy, Tu Cisterna, Traslados MR): si se
  vuelve a correr el importador con `--sin-fotos` NO las toca (solo rellena las que
  no tienen `google_place_id`… revisar el log y volver a anular si hace falta).
- Peso de `/guia`: 154 KB gzip de HTML (82 tarjetas), TTFB ≈ 0,1 s cacheado.


## Aliados, aventura, iconografía y voz (2026-09-13, tarde)

- **Voz venezolana, no rioplatense.** Todo el sitio (código, semilla, BD de la guía,
  IDENTIDAD.md) pasó de voseo a «tú»: «pide», «escríbenos», «para ti». Script en el
  scratchpad de la sesión (`venezolano.py`); si vuelve a aparecer un «pedí» o «querés»,
  es un error. Cuidado: el pase tocó `animate` → `anímate` en props de Motion una vez;
  ya está corregido, pero no correr reemplazos ciegos sobre código.
- **Categoría `aventura`** (senderismo, kite, buceo, surf) separada de `actividad`
  (ahora «Paseos y tours»). Operadores encontrados en Instagram con Apify:
  @senderosmargarita (68 k, Premio Nacional de Turismo 2024), @exploramargarita
  (43 k), @espartanostrekkingmgta, @margaritalaperladelcaribe.
- **Aliados** (`guia_lugares.aliado`, migración 013): negocios con trato directo.
  Van primero en su categoría, con franja «Recomendado por Margarita Renace» y
  borde de marca. Se marcan en Admin → Guía → Estado, o con `aliado: true` en la
  semilla. Hoy: **Caribest Water** (@caribest_water, agua, Pampatar/Terranova/Jorge
  Coll) y **Ketchup Hot** (@ketchuphot, empanadas). **Ventura** (bicicletas y
  recorridos, socio) NO apareció en Instagram con ese nombre: falta el @ exacto.
- **Una sola tarjeta** (`components/TarjetaGuia.tsx`) para lugares y servicios:
  compacta en teléfono (foto cuadrada), vertical en escritorio (foto 16:10 arriba);
  siempre valoración, horario de hoy, dónde está (sin plus codes de Google), consejo y
  fila de acciones WhatsApp / Llamar / Instagram / Web / Ir (máximo 4; WhatsApp
  sale del teléfono o de un enlace wa.me/wa.link en `web`).
- **Iconografía propia** (`components/IconosGuia.tsx`): trazo fino con motivos de
  petroglifo (puntos, zigzag, vasija, papagayo, trompo, mapire). Sustituye a los
  emojis en hub, chips, tarjetas y ficha; el mapa sigue usando emoji como etiqueta.
- **Hub móvil** (`HubGuia`): dos paneles «Resolver» (6) y «Descubrir» (11 + «Ver
  todo» = 3×4) tipo control remoto, filas de 3 con líneas finas.
- **Fotos de Instagram**: para 14 servicios sin foto de Google ni de Commons se
  guardó la imagen de perfil del negocio (`/uploads/guia/<slug>/ig.webp`,
  `fuente: 'instagram'`, crédito «Foto: @cuenta · Instagram»). Es la imagen con la que
  el negocio se presenta públicamente; si alguno pide quitarla, se borra desde Admin.
- Semilla: `busqueda: ''` = no consultar Google (negocios que Google confunde con
  otro). El importador ya no vuelve a consultar Places si la fila tiene place_id.
- Apify: consumido US$2,04 de 5 este mes tras estas búsquedas.
