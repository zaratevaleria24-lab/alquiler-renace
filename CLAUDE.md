# CLAUDE.md

Guía para el agente que trabaja en este repositorio. Se carga en **cada** sesión,
así que es el mapa y no la enciclopedia: lo específico vive en los documentos que
se listan abajo, y el estado del día vive en `ESTADO.md`.

Todo el repositorio está en español, incluida esta guía. El producto se le habla
a venezolanos y las decisiones se discuten con la dueña: documentar en otro
idioma obliga a traducir dos veces y se pierde el matiz.

## Qué es Margarita Renace

Un negocio **real y en producción**, no un ejercicio. Alquiler de apartamentos en
Isla de Margarita, Venezuela, con cuatro anuncios propios en Pampatar, y alrededor
de eso: autos, inmuebles en venta, una guía turística de la isla y contratos de
hospedaje con firma. La dueña es Valeria Zarate; el público es venezolano, dentro
del país y en la diáspora, que reserva por WhatsApp.

Dos superficies sobre el mismo código:

| | |
|---|---|
| Sitio público | `https://margaritarenace.com.ve` |
| Panel | `https://admin.margaritarenace.com.ve` (mismo proceso, `app/admin/`) |

Lo que se publica lo lee gente que va a mandar dinero a la otra punta del país
por un apartamento que no ha visto. Esa es la razón de la regla más importante
del proyecto: **nada inventado** — ni precios, ni reseñas, ni fotos de otro
apartamento presentadas como propias. «A consultar» antes que un número falso.

## Orden de lectura

Antes de tocar nada:

1. **`ESTADO.md`** — dónde estamos hoy: qué está vivo, qué falta y de quién
   depende. Es lo primero que hay que mirar para no proponer algo ya hecho.
2. **`AGENTES.md`** — el arnés de trabajo del agente: cómo verificar, cómo hacer
   algo irreversible sin romper nada, qué es «terminado». Léelo entero una vez.
3. **`MARCA.md`** — la visión del negocio: filtro de aliados, filosofía de
   precios, la experiencia QR → WhatsApp. Toda decisión de producto sale de acá.
4. **`PRINCIPIOS.md`** — cómo se construye: medir antes de opinar, presupuesto de
   rendimiento para conexiones venezolanas, datos y derechos, lista de publicación.
5. **`IDENTIDAD.md`** — antes de escribir **cualquier** texto que vea el público.
   Español venezolano, de tú a tú. Nunca voseo argentino.

Por módulo: `SEO.md` · `VENTAS.md` (En venta) · `GUIA.md` (`/guia`) ·
`CALENDARIO.md` y `AIRBNB-CORREO.md` (disponibilidad) · `CONTRATOS.md` ·
`CRM.md` · `ENLACES.md` · `INSTAGRAM.md` · `SEGURIDAD.md` · `DESPLIEGUE.md`
(este servidor) · `ESTRATEGIA.md` (el negocio a largo plazo).

## Arquitectura real

Next.js 15 (App Router) + React 19 + Tailwind 4 + TypeScript, sobre **PostgreSQL
16** en Docker. Nació como applet de Google AI Studio y quedan restos del andamio
(el `picsum.photos` de `next.config.ts` no se usa).

- **Hay base de datos.** Postgres en `127.0.0.1:5434`, base `margarita`. La app
  conecta como `margarita_app`, de mínimo privilegio; el rol `margarita` es solo
  para migraciones. Un `Pool` de `pg` en `lib/db.ts`, sin ORM.
- **Los datos se leen en Server Components** (`lib/queries.ts`) y bajan al
  cliente como props. `lib/db.ts` **nunca** debe entrar en un componente
  `'use client'`: el navegador no habla con Postgres y el bundler falla.
- **`app/page.tsx` son 48 líneas**, un Server Component que carga datos y monta
  `app/HomeClient.tsx` (~1500 líneas, el cliente). Si lees en algún lado que
  «todo el producto es un componente cliente con un array hardcodeado», es
  documentación vieja: `lib/listings.ts` quedó de reliquia y solo lo importan dos
  actions del panel.
- **Migraciones numeradas** en `db/migrations/NNN-nombre.sql`, idempotentes, con
  el porqué escrito arriba. Se aplican a mano:
  `docker exec -i margarita_postgres psql -v ON_ERROR_STOP=1 -U margarita -d margarita < db/migrations/NNN-….sql`.
  No hay tabla de control ni runner: el orden lo lleva el número.
- **`db/schema.sql` + migraciones + `db/seed.sql` tienen que poder levantar una
  base desde cero.** Se verifica creando una base de prueba y aplicándolos en
  orden; si tocas el esquema, hazlo antes de dar por bueno el cambio.
- **Las fotos subidas van a Cloudflare R2 y al disco** (desde el 2026-09-15).
  El sitio las sirve desde `media.margaritarenace.com.ve` y la base guarda esa
  URL completa; la copia en `/var/www/margarita-uploads` es la que recoge el
  respaldo nocturno. Ver `lib/r2.ts` y `lib/uploads.ts`. **Nunca apuntes una
  imagen a la URL `r2.dev` del bucket**: es un dominio ajeno y Venezuela los
  bloquea, que es la razón por la que en julio hubo que autohospedar las 26
  originales.
- **Métricas propias, sin Google Analytics** (`lib/metricas.ts`): sus recursos se
  bloquean en Venezuela. No se guarda ninguna IP, solo un hash con sal diaria que
  se borra. Ver la migración 007 antes de tocar nada de esto.
- **Panel**: sesión por código en `/etc/margarita-renace/panel.env`, rutas bajo
  `app/admin/(panel)/`, piezas de interfaz en `_ui.tsx` y **sin JavaScript** —
  `input` reales con la caja escondida, para que funcione con conexión mala.

## Diseño

Dirección **«Amanecer»**, elegida por la dueña el 2026-09-12: fondo claro cálido,
degradado durazno→agua (`.bg-luz`) en hero y cabeceras, líneas de 1 px, sombras
suaves, radios moderados. Teal profundo `#0b4a5c` para acciones y la mitad en
cursiva de los titulares; terracota `#c0563c` solo para el nombre y acentos
mínimos. **La dueña rechazó el brutalismo** (sombras negras macizas, bordes de
2 px): «muy agresivo».

Los colores viven en `app/globals.css` como tokens (`--color-brand`,
`--color-ink`, `--color-coral`…). **Míralos ahí antes de escribir un color**, y
usa el token, nunca el hexadecimal suelto. Una sola navbar, la flotante:
`components/NavBar.tsx`. Tipografías Fraunces (serif, titulares) y Jost (sans,
cuerpo) por `next/font/google`, que las autohospeda al compilar.

**Cero CDNs externos.** Venezuela los bloquea y las fotos sencillamente no
cargan para el público al que le hablamos. Fotos, fuentes y scripts salen de
nuestro dominio; lo de Google va por proxy propio. Las imágenes son `<img>`
planas con `width`/`height` y `loading="lazy"`; la portada de cada página es el
elemento LCP y lleva `fetchPriority="high"`. El `alt` menciona zona e isla.

Un alojamiento puede no tener foto: usa `components/SinFoto.tsx`, nunca
`<img src="">` — el navegador lo resuelve contra la propia página.

## Comandos

```bash
npx tsc --noEmit    # SIEMPRE antes de compilar; los errores de TS no se ignoran
npm run deploy      # build + pm2 restart --update-env + aviso a IndexNow
npm run dev         # desarrollo en :3000
npm run lint        # eslint (no bloquea el build, por configuración)
```

No hay suite de pruebas. La verificación es `tsc`, compilar, y `curl` contra las
rutas tocadas — ver `AGENTES.md`.

Despliegue: **`npm run deploy`**, nunca los pasos sueltos. Un `build` fallido con
la salida entubada dejó el sitio en 502 unos minutos el 2026-09-13. Compilar con
`nice -n 15`: el servidor tiene 3,7 GB de RAM compartidos con otros dos productos.

Entorno en `.env` (no `.env.local`, y no está en git): `POSTGRES_URL`,
`POSTGRES_PASSWORD`, `METRICAS_IPS_EXCLUIDAS`. Los secretos de servicios externos
van en `/etc/margarita-renace/*.env` con permisos 600 y **jamás** en el repo.
