# Plan del CMS y dashboard — admin.margaritarenace.com.ve

Escrito el 2026-07-26. Estado: en construcción.

## El requisito que manda sobre todos: CONGRUENCIA

El CMS no es un producto nuevo, es el panel de **este** sitio. Si el panel y la
web discrepan en un nombre, un precio o una foto, el CMS no sirve. Por eso la
regla de arranque es:

> El esquema de la base de datos es un espejo campo por campo del tipo
> `Property` de `lib/listings.ts`, y la carga inicial se **genera desde ese
> archivo**, no se escribe a mano.

Así, el día uno la base de datos contiene exactamente los 12 listados que hoy
están publicados: mismos nombres, precios, descripciones, fotos, anfitriones,
amenidades y capacidades. Nada cambia en la web. A partir de ahí, editar en el
panel es lo que mueve la web.

Las tres piezas que exigen cuidado extra para no romper la congruencia:

1. **Iconos de amenidades.** Hoy son componentes de React de Lucide
   (`{ icon: Wifi, name: 'Wi-Fi' }`). Un componente no cabe en una columna de
   Postgres. Se guarda una **clave estable de texto** (`wifi`, `piscina`,
   `parrilla`…) y el front la traduce a componente con un registro. El registro
   se genera desde las amenidades actuales, así que las 8 que existen hoy quedan
   cubiertas y el panel solo ofrece claves válidas.
2. **Categorías.** Son cadenas en español que funcionan como claves de filtro
   (`Playa`, `Frente al Mar`, `Lujo`…). El panel las ofrece como selección
   cerrada; escribirlas libres rompería los filtros del home.
3. **Zona.** Hoy se deriva del texto de `location` partiéndolo por comas. Es
   frágil. En la base pasa a ser **campo explícito** con selección cerrada, y de
   ahí salen las 9 landings `/alquiler/<zona>` y el sitemap.

## Decisión de arquitectura: la web sigue siendo estática

Hoy el sitio es estático (SSG): el HTML sale del build y nginx lo sirve por
Node sin tocar base de datos. Eso es lo que lo hace rápido y barato, y en
Venezuela la velocidad no es un lujo.

**No se cambia a renderizado dinámico.** El CMS escribe en Postgres y luego
dispara una **revalidación puntual** de las rutas afectadas
(`revalidatePath('/')` y la zona correspondiente). El visitante siempre recibe
HTML estático; la publicación es lo único que regenera.

Alternativa descartada: leer de la base en cada visita. Añadiría una consulta a
Postgres por request, latencia, y un punto de fallo que hoy no existe.

## Stack, siguiendo las convenciones del servidor

Se copia el patrón de Leiros, que ya lleva 21 días en producción sin incidentes:

| Pieza | Decisión | Por qué |
|---|---|---|
| App | Next.js 15 + TypeScript + Tailwind | Mismo stack que la web, y **reutiliza `app/globals.css`**: el panel usará los mismos tokens, así que se verá como el mismo producto |
| Base | Postgres 16 en Docker, `127.0.0.1:5434` | Puerto propio. **NO se comparte el de Leiros (5433)**: son productos independientes, es la regla del servidor |
| Acceso a datos | driver `pg` directo + `schema.sql` | Es lo que usa Leiros. Sin ORM: el esquema es pequeño y una dependencia menos que mantener |
| Proceso | ~~PM2 `margarita-admin` en 3003~~ → **el mismo proceso, rutas `/admin`** | Ver el cambio de decisión abajo |
| Fotos | disco en `uploads/`, servidas por **nginx** | Las fotos de propiedades son públicas, así que las sirve nginx directo sin pasar por Node. (Distinto de Leiros, donde los uploads son documentos de identidad y NO deben ser públicos) |
| Auth | contraseña con hash argon2 + cookie de sesión firmada, httpOnly | Una sola dueña. Simple pero real: sin tokens en localStorage, con límite de intentos |

### Corrección (2026-08-03): rutas REALES bajo /admin, sin reescritura

El panel sigue en la misma app, pero **ya no se reescribe `/` → `/admin`**. Ese
truco hacía que entrar al panel acabara mostrando **el sitio público**:

- Reproducido en Chrome contra producción: `POST /login` → 303 → se quedaba en
  `/` con el home público, mientras que cargar `/` a mano con la misma sesión sí
  daba el panel.
- Causa: el login usa `useActionState`, así que el envío es una Server Action y
  su `redirect('/')` lo resuelve el enrutador del **cliente**. Ese enrutador
  busca `/` en la tabla de rutas de la app —donde `/` ES el home público, además
  estático y precargado— y lo sirve sin volver a pasar por el middleware. La
  reescritura solo existe por petición; la caché del enrutador la esquiva.

Mientras `/` signifique dos cosas según el `Host`, el enrutador puede
equivocarse. Ahora las rutas del panel son `/admin`, `/admin/propiedades`… y el
middleware **redirige** (no reescribe) cualquier otra ruta del subdominio a su
equivalente con prefijo. La URL muestra `/admin/...`: en un panel privado no
molesta y a cambio no hay ambigüedad.

**Trampa al hacer ese redirect:** en middleware, `request.nextUrl` trae el
origen INTERNO, así que el primer intento respondía
`location: http://localhost:3002/admin` — el navegador de la dueña habría
intentado abrir *su* localhost. Hay que fijar `url.host` (de la cabecera Host) y
`url.protocol = 'https:'` a mano. Un rewrite no lo notaba porque nunca sale a la
red. Ver el comentario en `middleware.ts`.

### Cambio de decisión (2026-07-26): el panel vive en la MISMA app

El plan original preveía una segunda app de Next en el puerto 3003. Se descartó
al empezar a construirla, por tres razones:

1. **El requisito de que el panel se vea como el sitio.** Compartiendo el
   codebase hereda `app/globals.css` tal cual: las mismas tres tipografías, el
   sello romana/cursiva, la paleta y el ritmo. Con dos proyectos habría que
   duplicar los tokens, y dos copias de un sistema de diseño se desincronizan
   siempre — es cuestión de cuándo.
2. **Reutiliza `lib/queries.ts` y `lib/icons.ts` sin exportar nada.** Con dos
   apps habría que publicar un paquete compartido o copiar archivos.
3. **RAM.** El servidor tiene 3.7GB con tres productos. Un segundo proceso de
   Next son ~80MB de más para no ganar nada.

Cómo se resuelve el subdominio: nginx apunta `admin.margaritarenace.com.ve` al
mismo proceso reescribiendo a `/admin`. Y en el vhost del dominio público
`/admin` devuelve 404, para que el panel solo sea alcanzable por su subdominio.

Las rutas del panel son dinámicas y las del sitio estáticas; Next lo admite en el
mismo build y lo declara por ruta.

### Contraseñas: `crypto.scrypt` de Node, sin dependencias

El plan decía argon2. Se cambió a **scrypt, que viene en Node**, porque los
paquetes de argon2 requieren compilación nativa y este servidor ya sufrió un OOM
compilando (ver las notas de RAM). scrypt es memory-hard y OWASP lo acepta junto
a argon2 y bcrypt: es una elección legítima, no un atajo. Y cero dependencias
nuevas que mantener.

## Esquema de datos

```
zones        slug, name, coast, summary, body[], nearby[], best_for, sort_order
properties   id, slug, name, zone_slug→zones, location, description,
             price_text, price_per_night, price_on_request, nights_count,
             rating (NULLABLE), guests_adults, guests_children,
             is_real, is_published, sort_order, created_at, updated_at
property_images   property_id, path, alt, is_cover, sort_order
property_amenities property_id, amenity_key→amenities
amenities    key, name, icon_key
categories   key, label, icon_key
property_categories property_id, category_key→categories
hosts        id, name, tagline, avatar_path
admin_users  id, email, password_hash, created_at, last_login_at
sessions     token_hash, user_id, expires_at, created_at
page_views   id, path, referrer_host, device, country, created_at
events       id, kind, path, property_id, meta jsonb, created_at
```

Dos columnas que existen por lo aprendido en `SEO.md`:

- **`rating` acepta NULL.** De los 12 listados solo uno es real; los otros 11
  tienen valoraciones inventadas. Un rating obligatorio fuerza a inventar.
- **`is_real`.** Marca cuáles son inventario verdadero. Permite al panel avisar
  "tienes 11 listados de relleno publicados" y, cuando se quiera, esconderlos
  sin borrarlos. Es el mayor lastre de SEO que tiene el sitio hoy.

## Dashboard de métricas y analítica

Recolección **propia**, no Google Analytics. Dos razones: en Venezuela los
recursos de terceros se bloquean —GA simplemente no cargaría para buena parte
del público— y un recolector propio no pone cookies, así que no hace falta
banner de consentimiento.

Es un endpoint del propio dominio que registra la visita en Postgres. Sin
cookies: para distinguir visitantes se usa un hash diario de IP + user-agent,
que no permite seguir a nadie entre días.

Qué mostrará el panel:

- **Visitas** por día y por página, con las 9 landings de zona separadas: dice
  qué zona interesa de verdad, que es información de negocio, no vanidad.
- **Propiedades más vistas** y más abiertas en detalle.
- **Búsquedas realizadas**: qué escribe la gente en "Dónde", qué fechas y cuántos
  huéspedes. Esto es oro: revela demanda que el inventario no cubre.
- **Clics de contacto** (WhatsApp, correo) por propiedad — el proxy de
  conversión más cercano que existe sin sistema de reservas.
- **Origen del tráfico** (dominio referente) y reparto móvil/escritorio.
- **Salud del inventario**: publicados vs borradores, listados sin foto propia,
  listados marcados como relleno, zonas sin inventario.

## Orden de trabajo

1. **Base de datos y carga inicial** ← empezando por acá
   Contenedor, `schema.sql`, y un generador que produce el seed leyendo
   `lib/listings.ts`. Verificación: los 12 listados en la base coinciden uno a
   uno con los publicados.
2. **Capa de datos y lectura desde la web**
   `lib/db.ts` con el patrón de Leiros, consultas, y que `lib/listings.ts` pase
   a leer de la base manteniendo el MISMO tipo `Property` — así ni `page.tsx` ni
   las landings ni el sitemap se enteran del cambio.
3. **App admin en el 3003** con auth y el layout del panel.
4. **CRUD de propiedades** con subida de fotos y revalidación al publicar.
   *✅ COMPLETO 2026-08-03: edición, publicar/despublicar, alta (nace como
   borrador, slug autogenerado) y fotos (subida múltiple → WebP 1600px con
   sharp, portada, borrar). Las fotos viven en `/var/www/margarita-uploads`
   —NO en el proyecto: nginx no sirve desde /root— con `location ^~ /uploads/`
   en ambos vhosts (el `^~` importa: la location regex de extensiones del vhost
   admin se lo comía) y van al backup diario. Los slugs nuevos renderizan a
   demanda (`dynamicParams=true`): crear ya no exige rebuild.*
4b. **Contenido del sitio** (`/admin/contenido`) — ✅ 2026-08-03.
   Foto de portada (subida y optimizada a WebP, con "volver a la original"),
   textos del encabezado y **datos de contacto**. Tabla `site_settings` de
   clave/valor: los valores por defecto y los tipos viven en `lib/settings.ts`,
   no en la base, así que sin fila el sitio muestra lo de siempre y borrar la
   fila revierte. Esto retiró la constante `CONTACT` de `lib/site.ts`, que
   estaba en `null` a mano: **el WhatsApp ya se pone sin tocar código**, y al
   guardarlo se encienden todos los botones de reservar del sitio.

5. **Recolector de métricas** y el dashboard.
6. **nginx + TLS** para el subdominio, y **script de backup** en el crontab:
   por primera vez habrá datos que se pueden perder.

## Riesgos anotados

- **RAM.** El servidor tiene 3.7GB con tres productos corriendo. Un Postgres más
  son ~50-80MB en reposo, y la app admin otros ~80MB. Entra, pero conviene mirar
  `free -h` tras levantar todo.
- **Backups.** Hoy Margarita no tiene script porque no tiene datos. En cuanto la
  base exista, hay que crear `/root/backups/backup-margarita.sh` y sumarlo al
  cron. Sin eso, un error borra el inventario sin vuelta atrás.
- **El panel es una superficie nueva expuesta a internet.** Va detrás de
  Cloudflare, con límite de intentos de login y sin listar en robots.txt (ya
  está el `Disallow: /admin/`).
