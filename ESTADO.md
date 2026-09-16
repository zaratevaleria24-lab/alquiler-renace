# ESTADO.md — dónde estamos

> **Corte: 2026-09-16.** Este documento caduca. Los criterios que no caducan
> están en `MARCA.md`, `PRINCIPIOS.md` y `AGENTES.md`. Si algo de acá no cuadra
> con la base de datos, la base tiene razón: corrige esta página.
>
> La lista viva de tareas **no está acá**: la calcula `lib/pendientes.ts` desde
> el estado real y se ve en `/admin/pendientes`. Esto es el panorama, no el
> pendiente del día.

## Mejora de reservas y textos — 2026-09-16

El propietario confirmó **6 personas en total en los cuatro apartamentos**.
Migración 032 aplicada con respaldo: se normalizaron los cupos aditivos a 6+0;
la web habla de personas, sin reservar plazas adicionales por edad. Los niños
forman parte del total. El panel permite seguir editando la capacidad.

- Inicio centrado en Pampatar: texto corto, precio base del catálogo y accesos
  a apartamentos/calculadora visibles en móvil. Pie de Bahía Mágica corregido.
- Fechas reales en el buscador; se conservan en ficha y WhatsApp. Validación de
  fechas, mínimos y aforo en la calculadora; API fallida no significa libre.
- Calendario público informa si tiene sincronización vigente; sin feeds se
  ofrece consulta por WhatsApp sin asegurar disponibilidad.
- FAQ del inicio deriva su precio de las propiedades reales publicadas. Textos
  de piscina, estadía mensual y presupuesto revisados sin tarifas externas ni
  promesas de conectividad sin comprobar.
- Sitemap refleja el catálogo actual, sin fechas de build presentadas como
  actualización de contenido. ItemList enlaza cada ficha; metadescripciones
  de guía incluyen el nombre del lugar.
- Imágenes de tarjetas adaptadas al tamaño con optimización en el propio
  dominio; la foto de hero no se descarga en móvil. Lecturas de propiedades y
  ajustes se deduplican dentro del render con React.cache (no caché global).
- Métricas distinguen visitantes-día y clics de WhatsApp. Cerrar el cupón se
  respeta durante la sesión, sin exigir completar el formulario.

Pruebas de regresión: `node scripts/verificar-reservas.cjs`. Evidencia de
navegador y rastreo en `/root/auditorias/margarita-2026-09-16/`.
Quedan pendientes fotos propias adicionales y conectar calendarios reales.
No se modificaron las amenidades cuya verificación requiere al anfitrión.

## El negocio, en números reales

| | |
|---|---|
| Apartamentos publicados | **4**, todos en Pampatar, hasta 6 personas cada uno, US$65 / noche |
| Lugares en la guía de la isla | **126** (110 en el mapa), con 5 aliados con sello «Recomendado» |
| Anuncios de terceros en «En venta» | 22 prospectos de Facebook Marketplace |
| Inmuebles propios en venta | 0 |
| Autos | 0 — la sección existe, el inventario no |
| Contratos firmados | 1 |
| Contactos en el CRM | 5 |
| Reseñas transcritas | 0 (las estrellas que se ven salen de Airbnb en vivo) |

Los cuatro apartamentos son reales y están enlazados a sus anuncios de Airbnb.
Quedan **8 alojamientos inventados** en la base, sin publicar y ya sin fotos:
son restos del andamio inicial. Al no publicarse, no constituyen por sí mismos un problema de indexación; no deben volver al catálogo público.

## Tráfico real

Medido sobre siete días de logs de nginx, hasta el 2026-09-14:

| Origen | Peticiones |
|---|---|
| La IP del servidor (la dueña por su proxy) | 9.143 |
| Local: pruebas y el cron del calendario | 5.015 |
| Escáner buscando la API de Docker | 3.475 |
| Bots declarados (Google, Ahrefs, IA) | ~3.000 |
| **Personas reales ajenas al negocio** | **389 páginas, 139 direcciones** |

Son unas **20 personas al día**, y solo 12 en toda la semana vieron cinco páginas
o más. Hay señal de que llegan por donde se esperaba: 25 entradas con la etiqueta
del QR o del enlace de Instagram, y 9 vistas a una página de contrato, que solo
abre un huésped. Pero el volumen orgánico todavía es mínimo: **al leer cualquier
cifra de este sitio hay que descontar primero la IP del servidor.**

### Actualización del 2026-09-16: el SEO empezó a mover algo

- **Googlebot pasó de 12-29 hits/día a 192 / 197 / 104 / 81** los días 13 al 16.
  El salto es exacto con los commits de SEO del 13/09.
- **Clics reales de Google: de ~5 en once días (02-12) a ~9 en tres y medio.**
  De 0,45/día a 2,6/día. Poco en absoluto, pero el país cambió: **6 de los
  últimos 9 son de Venezuela**, uno de ellos desde *Corporación Visual Nueva
  Esparta* — un proveedor de la isla.
- **Aterrizan en `/guia/*`, y en servicios del día a día**, no en turismo:
  Farmatodo, agua a domicilio, cisterna, Al Costo Market, clínicas. Ahí hay una
  veta de contenido con demanda probada — pero es tráfico de autoridad y
  audiencia local, **no de conversión**: quien busca Farmatodo no alquila.
- **El GEO va por delante del SEO.** `ChatGPT-User` (se dispara solo cuando una
  persona le pregunta a ChatGPT y ChatGPT va a leer la página) aparece 1-3 veces
  al día desde IPs de Azure. Y el 15/09 alguien llegó desde ChatGPT y vio **15
  fichas de `/en-venta` en 90 segundos**.

**Tres trampas al medir este sitio** (costaron tiempo, quedan anotadas):

1. Descontar `46.224.138.26` (el propio servidor) y `127.0.0.1`: el 13/09 se
   hizo 6.784 peticiones a sí mismo con Playwright.
2. **`2001:4860:7::/48` es la red de Google, no personas.** Llegan con Chrome
   normal y `Referer: google.com`, así que parecen clics: el 15/09 inflaban 26
   «clics» que en realidad eran 2.
3. Buena parte de los hits con UA `ChatGPT-User` / `Claude-User` /
   `Perplexity-User` son **escáneres falsificando ese user-agent** para buscar
   `.env` y credenciales. Los picos del 8 y el 12/09 son eso. `block-scanners`
   les responde 444. Los legítimos son los que dan 200 desde Azure.

## Qué está vivo

- **Sitio público** — home, fichas, 9 landings de zona, `/guia` (con hub móvil y
  QR), `/en-venta`, `/autos`, `/enlaces`, `/reservas` con calculadora,
  `/nosotros`, `/politicas`, y las páginas de intención `/[tema]`.
- **Panel** en `admin.margaritarenace.com.ve`: propiedades y fotos, vehículos,
  zonas, guía, ventas, enlaces, contenido del sitio, contactos, contratos,
  calendario, plantillas de Instagram, crecimiento, pendientes y métricas.
- **Contratos con firma** — firma a mano, código por correo, sello Ed25519,
  bitácora y página de verificación pública.
- **Correo saliente** por Resend vía HTTPS (el SMTP saliente está bloqueado en el
  VPS). Recepción por Cloudflare Email Routing hacia Gmail.
- **Calendario** — sincronización iCal cada 10 minutos por cron, más el pipeline
  de notificaciones de Airbnb por correo, desplegado y probado.
- **Métricas propias**, sin Google Analytics ni cookies, con la tabla de fuentes
  de tráfico añadida el 2026-09-14.

## Lo último que se hizo (2026-09-16)

**Mapa de la isla, propio y sin Google (`/mapa`).** Pestaña nueva con los 110
lugares de la guía que tienen coordenadas y los 4 apartamentos, un radio de 1 km
«a pie desde» cada apartamento, ficha con foto, distancia y «cómo llegar», y la
misma lista en HTML debajo para Google y para quien no cargue el mapa. Las
teselas son un archivo PMTiles de 17 MB (OpenStreetMap vía Protomaps) servido
desde `/uploads/mapa/` por nuestro nginx: sin clave, sin cuota y sin pedirle nada
a un dominio ajeno, que es la razón por la que el mapa de Google nunca abrió acá.
Pesa 830 KB en teléfono, dentro del presupuesto. Se borró `MapaGuia.tsx` (el de
Google, desconectado desde el 15/09) y la guía ahora enlaza al mapa. Migración
027: `latitud`/`longitud` **aproximadas** en `properties` —la urbanización, no la
puerta—. Detalle de servidor: el sitio público pasó a
`snippets/security-headers-geo.conf` para permitir la geolocalización del
visitante. Todo en `MAPA.md`, con las tres trampas que costaron tiempo.


**La guía, hacia los servicios de Pampatar.** 18 entradas nuevas (salud, moverse,
prácticos, agua y gas), 11 de ellas en Pampatar, que es donde duermen los
huéspedes y donde la guía no tenía casi nada. Sale de lo que dicen los logs: los
clics de Google aterrizan en `/guia/farmatodo` y en agua y cisternas, no en las
playas. El importador aceptó un `--solo=` para no reescribir los otros 108
lugares. Detalle: `/guia` cachea una hora y el importador no invalida, así que lo
nuevo aparece al vencer la hora o al guardar algo en `/admin/guia`. Ver `GUIA.md`.


**SEO/GEO: precio marcado y el negocio con ciudad.** Dos pendientes que estaban
en `SEO.md` desde agosto y se habían quedado colgados porque su condición ya se
había cumplido sin que nadie volviera:

1. **`offers` en las fichas reales.** Estaba bloqueado hasta limpiar el
   inventario; el inventario se limpió el 14/09. Ahora `propertySchema` emite
   precio (US$65), moneda y **tarifa por noche** con el mínimo de noches real,
   con `isReal` como guarda. Sin `availability`: `ical_feeds` sigue vacía y el
   sitio no sabe si una fecha está libre.
2. **`addressLocality`.** No faltaba el dato, faltaba **el campo**: se añadió la
   clave `ciudad` (por defecto Pampatar) en `/admin/contenido`.
3. **Los logs de nginx ya guardan el país.** Cloudflare manda `CF-IPCountry` en
   cada petición y se estaba tirando: para saber de dónde venía un clic había
   que hacer `whois` a mano. Formato `pais` en `conf.d/01-log-pais.conf`, que es
   `combined` + `cc=XX` al final, así que lo que ya leía estos logs sigue
   funcionando.

## Lo último que se hizo (2026-09-14)

Dos commits, ambos desplegados y verificados:

1. **Fuentes de tráfico en el panel.** El medidor no mandaba ni los parámetros
   del enlace ni `document.referrer`, así que el enlace de Instagram y el QR eran
   invisibles y la columna de procedencia llevaba vacía desde agosto. Ahora hay
   columna `fuente` (migración 025), atribución por la primera visita de cada
   persona del día, y contactos de WhatsApp por fuente. Se añadió
   `METRICAS_IPS_EXCLUIDAS` al `.env` para que la propia navegación de la dueña
   deje de contarse como público.
2. **Fuera las fotos de banco.** 31 filas borradas (migración 026). Los cuatro
   publicados conservan su foto propia; los ocho inventados quedaron sin
   ninguna. Eso destapó que cinco vistas pintaban la portada sin comprobar que
   existiera, y se añadió `components/SinFoto.tsx`. La foto de Agua Mar, borrada
   desde el panel esa misma mañana, se recuperó del respaldo de las 03:45.

3. **Arreglado el «panel negro».** Quince `redirect()` del módulo de propiedades
   iban a `/propiedades/<id>` sin el prefijo `/admin`, así que tras borrar o
   subir una foto el enrutador del cliente pintaba el layout público —navbar
   oscura— dentro del panel. La escritura sí se hacía; solo la pantalla mentía.

## Qué falta, y de quién depende

**De la dueña / el dueño** — nada de esto lo puede resolver un agente:

- Los **4 iCal de Airbnb** en `/admin/calendario`: la tabla `ical_feeds` está
  vacía, así que la disponibilidad todavía no se sincroniza de verdad.
- ~~Credenciales de Cloudflare R2~~ — **hecho el 2026-09-15.** El token existe,
  el panel sube al bucket y las 353 fotos que había se migraron. El sitio las
  sirve desde `media.margaritarenace.com.ve`.
- **Apagar la «Public Development URL» del bucket** (`pub-….r2.dev`). No la usa
  nadie, pero mientras exista hay una vía por la que las fotos podrían acabar
  sirviéndose desde un dominio ajeno, y Venezuela los bloquea. Es un clic.
- **Un segundo token de Cloudflare con permiso de purga de caché.** Hoy, al
  borrar una foto, desaparece del bucket pero el borde la sigue sirviendo hasta
  un año (TTL de la regla de caché). No molesta en la práctica —los nombres
  llevan marca de tiempo y el sitio deja de enlazarla— pero sin purga una foto
  retirada sigue accesible para quien tenga el enlace directo.
- **`GA4_ID` y `META_PIXEL_ID`** en `/etc/margarita-renace/marketing.env`, que no
  existe todavía. Sin ese archivo no hay banner de consentimiento ni medición de
  campañas, y las campañas estaban previstas para dentro de días.
- **Datos legales del contrato**: razón social, RIF y cédula del representante.
  Solo está cargado el nombre del representante.
- **Ficha de Google del negocio** y reenviar el sitemap en Search Console.
- ~~DMARC en Cloudflare~~ — **ya está puesto** (verificado el 2026-09-15:
  `_dmarc` con `p=quarantine`, y SPF por Cloudflare Email Routing).
- **Dominio autorizado en la clave de Google Maps**, o el mapa de la guía no
  carga en producción.

### Qué se puede y qué no se puede hacer desde el panel

Auditado el 2026-09-14. La mayoría del panel es un CMS completo, pero hay
huecos concretos, y explican por qué faltan datos en la base:

| Sección | Crear | Editar | Borrar |
|---|---|---|---|
| Propiedades | sí | sí | **no existe** |
| Fotos de propiedad | sí | orden, portada y alt | sí |
| Reseñas | sí | — | sí |
| Guía (lugares) | sí | sí | solo despublicar |
| Enlaces | sí | sí | sí |
| En venta (propios) | sí | sí | **no existe** |
| Contactos | sí | tipo y usado | sí |
| Contratos | sí | — | anular (correcto: son documentos legales) |
| Calendario y iCal | sí | sí | sí |
| **Vehículos** | **no** | **no** | **no** — la pantalla dice «En construcción» |
| **Zonas** | **no** | **no** | **no** — pantalla de relleno |

Consecuencias directas: los 8 alojamientos de relleno **no se pueden quitar
desde el panel** porque no hay acción de borrar una propiedad, solo
despublicarla. Y hay 0 vehículos porque la pantalla para cargarlos nunca se
construyó, aunque las tablas y la página pública `/autos` sí existen.

**Del lado técnico:**

- Los 8 alojamientos de relleno siguen en la base. Mientras existan no se puede
  emitir marcado de valoraciones ni reseñas en todo el dominio.
- Sin autos y sin inmuebles propios en venta, dos secciones del menú llevan a
  pantallas vacías.
- El escáner de Docker desde `185.177.72.x` lleva 3.475 peticiones en una semana
  y fail2ban no lo detiene. Falta añadir sus rutas al jail de escáneres.
- El código de acceso al panel sigue siendo provisional (`panel.env`).

## Infraestructura

Hetzner, 3,7 GB de RAM compartidos con otros dos productos: los builds van con
`nice -n 15`. Next.js en PM2 (`margarita-renace`, `127.0.0.1:3002`), Postgres 16
en Docker (`127.0.0.1:5434`), nginx con TLS de Let's Encrypt, y Cloudflare por
delante en modo SSL «Full», no «Full (strict)». Fotos subidas en
`/var/www/margarita-uploads`. Respaldo diario a las 03:45 —base y fotos— con
retención de 7 días; es la única vuelta atrás que existe para una foto subida.
Detalles y trampas del servidor en `DESPLIEGUE.md`.

### Cierre de verificación de las mejoras del 2026-09-16

Despliegue terminado, PM2 online e IndexNow HTTP 200. Rastreo público de 154
URLs correcto; pruebas de navegador de fechas, aforo, error 503 y noches
ocupadas correctas. Tipos limpios y 18 comprobaciones de regresión locales.
Tarjetas móviles optimizadas: 14–24 KB por foto en 390 px/DPR 1.
