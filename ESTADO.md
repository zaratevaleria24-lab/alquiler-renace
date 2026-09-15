# ESTADO.md — dónde estamos

> **Corte: 2026-09-14.** Este documento caduca. Los criterios que no caducan
> están en `MARCA.md`, `PRINCIPIOS.md` y `AGENTES.md`. Si algo de acá no cuadra
> con la base de datos, la base tiene razón: corrige esta página.
>
> La lista viva de tareas **no está acá**: la calcula `lib/pendientes.ts` desde
> el estado real y se ve en `/admin/pendientes`. Esto es el panorama, no el
> pendiente del día.

## El negocio, en números reales

| | |
|---|---|
| Apartamentos publicados | **4**, todos en Pampatar, US$65 / noche |
| Lugares en la guía de la isla | 103, con 5 aliados con sello «Recomendado» |
| Anuncios de terceros en «En venta» | 22 prospectos de Facebook Marketplace |
| Inmuebles propios en venta | 0 |
| Autos | 0 — la sección existe, el inventario no |
| Contratos firmados | 1 |
| Contactos en el CRM | 5 |
| Reseñas transcritas | 0 (las estrellas que se ven salen de Airbnb en vivo) |

Los cuatro apartamentos son reales y están enlazados a sus anuncios de Airbnb.
Quedan **8 alojamientos inventados** en la base, sin publicar y ya sin fotos:
son el resto del andamio inicial y el mayor lastre pendiente de SEO.

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
- **Crear el token de API de R2.** Verificado el 2026-09-15: el bucket
  `margarita-renace` existe y el endpoint responde desde el servidor, pero el
  token **nunca se creó** — la conversación donde se planteó quedó a medias. Sin
  Access Key y Secret no hay forma de escribir en el bucket. Y al conectarlo,
  las fotos deben servirse desde `media.margaritarenace.com.ve` (que todavía no
  existe en DNS), **nunca desde una URL `r2.dev`**: es un dominio ajeno y
  Venezuela bloquea CDNs externos, que es la regla que obligó a autohospedar
  todas las imágenes en julio.
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
