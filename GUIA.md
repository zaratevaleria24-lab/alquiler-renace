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


## Segunda tanda (2026-09-13, noche)

- **Ventura = V2 Aventuras** (@v2aventuras, 13,7 k; jeeps, e-bikes, cuatrimotos,
  trekking; 0414-2016635; v2aventuras.com.ve). Aliado, en `aventura` + extra
  `transporte`. **La Perla = Recargas La Perla C.A.** (@recargaslaperla, C.C. Paseo
  Pampatar, 0412-5860310), aliado en `agua`. Los encontró Google Places, no Instagram.
- **Varias categorías por lugar**: `guia_lugares.categorias_extra text[]`
  (migración 014). Guuao Marketplace es `licores` + `nocturna` (cierra a las 12).
  `data-cat` de la tarjeta lleva todas; `enCategoria()/categoriasDe()` en lib/guia.ts;
  en admin, chips «También aparece en».
- **Categoría `practico`** (Prácticos): Lavandería San Jorge (@lavanderiasanjorge,
  delivery), Lavandería La Caracola, Italcambio (Sambil), Digitel/Movistar (SIM).
  Icono: nudo de chinchorro.
- **Hub 3×3 + 3×4**: «Resolver» cierra con «Anfitrión» (WhatsApp) y «Emergencia 911»
  (tel:911); «Descubrir» con «Ver todo». Se quitó la barra azul de WhatsApp (ya está
  el botón). Cabecera móvil tipo app: «¿Qué necesitas hoy?» + una línea; el
  titular editorial queda solo en escritorio.
- Bienvenida: dura entre 2,2 y 3,4 s (antes se iba antes de verse).
- Total: 103 entradas.

- **Paginación automática** (2026-09-13): la lista muestra 18 tarjetas por tanda
  (`POR_PAGINA` en lib/guia.ts, duplicado a mano en FiltroGuia porque ese
  componente no puede importar lib/guia.ts —abre Postgres—). El servidor manda las
  que pasan de la tanda con `hidden` + clase `paginada`; un centinela `#mas-guia`
  con IntersectionObserver va soltando más al bajar; `<noscript>` las muestra todas.
  Al cambiar de categoría se vuelve a la primera tanda.

- **Lista cliente (2026-09-13 noche):** `components/ListaGuia.tsx` filtra y pagina
  en React (ya no se manipulan `hidden`/`.paginada` en el DOM). El servidor solo
  pinta 18 tarjetas; los hubs `/guia/<tema>` (lib/guia-hubs.ts) listan cada tema
  con `escucha={false}`. Fichas con FAQ + FAQPage, openingHours y autor.

## Servicios de Pampatar (2026-09-16)

La guía tenía 39 servicios y casi todos estaban en Porlamar, que es donde no
duerme nadie nuestro. Los cuatro apartamentos publicados están en **Pampatar**,
así que un huésped con una fiebre a las diez de la noche, o con un caucho abajo,
no tenía a quién llamar cerca. Se sumaron **18 entradas**, 11 de ellas en
Pampatar:

- **Salud** (4 → 11): Centro Médico La Fe y Tu Médico Margarita (ambos marcados
  24 h por Google, en Pampatar), Ambulatorio de Pampatar, Farmahorro Caribe,
  Farmacia San Jorge/Farmamás, **Bomberos de Porlamar** y **Protección Civil
  Nueva Esparta** — los dos últimos son números de emergencia, no negocios.
- **Moverse** (4 → 9): R24 Asistencia Vial y Grúa Luis Mario (24 h), Cauchera
  Los Robles (24 h, Pampatar), Todo Cauchos Margarita y el taller Multiservicios
  RGF. Media isla se alquila un carro y nadie tenía dónde reparar un caucho.
- **Prácticos** (4 → 8): la bomba E/S PDV Maneiro (frente al Sambil), la
  ferretería Ferremar, Lavandería Bahía y el Banco de Venezuela de Pampatar.
- **Agua y gas** (9 → 11): Tricada Gas y el Gas Comunal de San Antonio. Antes
  solo había botellones y cisternas; las bombonas no estaban.

**Por qué esto y no más playas:** los logs de nginx del 3 al 16 de septiembre
tienen pocos clics de Google, pero los que hay aterrizan en `/guia/farmatodo`,
`/guia/agua-potable-margarita-cisterna-24-h` y `/guia/v2-aventuras…`, no en las
playas. La demanda probada está en los servicios. Ojo con la lectura: es tráfico
de autoridad y de gente de la isla, **no de conversión** (quien busca Farmatodo
no alquila) — sirve para el dominio y para el huésped que ya está acá.

### Cómo se hizo, y el `--solo`

Los 18 salieron de un volcado de Places con 16 consultas
(«farmacia en Pampatar», «cauchera Pampatar», «bombona de gas…»), y cada uno se
verificó contra su `busqueda` antes de escribirlo: los 18 devuelven el mismo
negocio. El texto es nuestro; el rating, el horario y la dirección son de Google.

El importador ahora acepta **`--solo=texto,texto`**:

```
export $(grep -h '^POSTGRES_URL=' .env | head -1) && npx tsx scripts/guia-importar.ts --sin-fotos --solo='ferremar,tricada'
```

Sin ese filtro, el importador reescribe los textos de los 126 lugares con lo que
diga la semilla, y **pisa lo que la dueña haya editado a mano en el panel**. Con
`--solo` toca nada más lo que se nombra, y se salta el bloque de «descubiertos».

Dos detalles que quedan anotados:

- **La caché de `/guia` es de una hora** (`unstable_cache`, `TAG_GUIA`). El
  importador no la invalida: solo lo hacen las acciones del panel. Lo importado
  a mano aparece en el sitio cuando vence la hora, o antes si se guarda
  cualquier cosa desde `/admin/guia`.
- `importarDescubiertos()` apunta a un scratchpad de una sesión vieja que ya no
  existe, así que no hace nada desde hace tiempo. Sus dos consejos seguían en
  voseo («Andá y volvé») del pase a español venezolano; quedaron corregidos por
  si el bloque vuelve a correr.

## El mapa se mudó a /mapa (2026-09-16)

El mapa de Google que vivía en esta página estaba desconectado desde el 15/09
(la clave no autoriza el dominio). Se rehizo entero con teselas propias y ahora
es su propia pestaña: **`MAPA.md`**. `components/MapaGuia.tsx` se borró; en su
lugar la guía tiene un enlace «Verlo en el mapa».

## Logos de Instagram en tres fichas (2026-09-16)

Rafa's Casual Food, Aurelio's Pizza y nuestro propio «Traslados y autos» eran
las tres fichas sin ninguna foto: Google no les dio ninguna y en Commons no hay
nada de un local de la isla. Ahora las tres tienen portada.

- **Rafa's y Aurelio's**: la **foto de perfil** (el logo) de su Instagram, traída
  con Apify (`apify/instagram-profile-scraper`, US$0,006 las dos) y **copiada a
  nuestro almacenamiento**. Acreditadas como «Logo: @cuenta · Instagram».
- **Traslados y autos de Margarita Renace**: somos nosotros, así que lleva el
  emblema del sitio sobre el papel de la marca, generado con sharp desde
  `public/logo-mark-teal.svg` (el `logo.png` no sirve: trae fondo blanco y
  quedaba un recuadro dentro de la tarjeta).

**Esto es una excepción acotada a la regla de más arriba** («no se republican
fotos de Instagram»). El logo no es contenido del feed: identifica al negocio,
es lo que el negocio usa para que lo reconozcan, y acá no se enlaza el CDN de
Meta —que caduca en horas— sino una copia nuestra. Se hace **solo con aliados**
y conviene tener el sí por WhatsApp. Una foto de un plato o de un cliente, no.

Se repite con:

```
export $(grep -h '^POSTGRES_URL=' .env | head -1) && npx tsx scripts/guia-foto-instagram.ts <slug> [<slug>…]
```

### Dos cosas que hicieron perder media hora

1. **La caché de datos de Next sobrevive al `npm run build`.** `unstable_cache`
   guarda en `.next/cache/fetch-cache`, que el build NO borra: se cambió la foto
   en la base, se reconstruyó, se reinició… y el sitio seguía sirviendo la ficha
   vieja. Lo que funciona de verdad es
   `rm -rf .next/cache/fetch-cache && pm2 restart margarita-renace`, o guardar
   cualquier cosa en `/admin/guia` (eso sí invalida la etiqueta).
2. **Reemplazar una foto en la MISMA ruta no se ve**: Cloudflare ya tiene
   cacheado el `0.webp` y todavía no hay token de purga (`ESTADO.md`). La
   segunda versión del emblema se publicó como `1.webp`. Mientras no exista la
   purga, **una foto corregida va con nombre nuevo**.
