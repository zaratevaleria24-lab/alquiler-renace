-- Página de enlaces (2026-08-09). La que va en la bio de Instagram y TikTok.
--
-- POR QUÉ EN LA BASE Y NO EN UN ARCHIVO: un Linktree se cambia el día que se
-- abre una cuenta nueva, se estrena un anuncio o se cae un enlace. Si vive en
-- el código, cada cambio son cinco minutos míos y un despliegue; en la base es
-- un formulario. Es la misma razón por la que el contacto salió de lib/site.ts
-- (ver la nota de la migración 004).
--
-- POR QUÉ TABLA PROPIA Y NO site_settings: site_settings es clave/valor, y esto
-- es una LISTA ordenada de cosas que se agregan, se quitan y se reordenan.
-- Meterla en clave/valor obligaría a inventar claves numeradas (enlace_1_url,
-- enlace_2_url…) y a tocar el código cada vez que se sume una fila.

CREATE TABLE IF NOT EXISTS enlaces (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Clave estable para las MÉTRICAS. El nombre visible cambia («Escríbenos» →
  -- «Habla con nosotros») y si los clics se contaran por nombre, el historial
  -- se partiría en dos series al primer retoque. El slug no se toca.
  slug        text NOT NULL UNIQUE,

  -- Decide el icono y el color del medallón, no el destino. Ver TIPOS en
  -- lib/enlaces.ts: ahí está la lista cerrada y qué significa cada uno.
  tipo        text NOT NULL DEFAULT 'sitio',

  etiqueta    text NOT NULL,
  descripcion text NOT NULL DEFAULT '',

  -- Puede quedar VACÍA a propósito:
  --   · tipo 'whatsapp'  → se arma con el número de /admin/contenido
  --   · tipo 'instagram' → cae al Instagram de /admin/contenido
  -- Un enlace sin URL ni origen automático NO SE MUESTRA. Es lo que permite
  -- dejar sembrado «TikTok» antes de tener la cuenta sin publicar un botón
  -- muerto: el panel lo marca como pendiente y el visitante no lo ve.
  url         text NOT NULL DEFAULT '',

  -- 'boton'  → tarjeta ancha con medallón, para las acciones que dan plata.
  -- 'circulo'→ icono redondo en la tira de redes, sin texto.
  -- Es la única decisión de maquetación que se delega al panel, porque es la
  -- que de verdad cambia según qué se esté empujando esa temporada.
  forma       text NOT NULL DEFAULT 'boton'
                CHECK (forma IN ('boton', 'circulo')),

  orden       int     NOT NULL DEFAULT 0,
  activo      boolean NOT NULL DEFAULT true,

  -- Solo uno debería estar destacado: es el que se lleva el borde de tinta y la
  -- sombra dura. Dos destacados no destacan ninguno.
  destacado   boolean NOT NULL DEFAULT false,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE enlaces IS
  'Botones de la página /enlaces, la de la bio de Instagram y TikTok. Se editan en /admin/enlaces.';

CREATE INDEX IF NOT EXISTS enlaces_orden_idx ON enlaces (activo, orden, created_at);

-- ── Siembra ──────────────────────────────────────────────────────────────────
-- Los cinco que se pidieron el 2026-08-09, en el orden en que conviene que los
-- vea alguien que llega de Instagram: primero hablar, después reservar directo,
-- y Airbnb al final —manda tráfico propio a la plataforma que cobra comisión,
-- así que va después de la vía sin intermediario, no antes.
--
-- ON CONFLICT DO NOTHING por slug: volver a correr la migración no duplica ni
-- pisa lo que la dueña ya haya editado.
INSERT INTO enlaces (slug, tipo, etiqueta, descripcion, url, forma, orden, destacado) VALUES
  ('whatsapp',  'whatsapp',  'Escríbenos por WhatsApp',
   'Te respondemos nosotros, no un robot.',                      '',  'boton',   10, true),
  ('reservar',  'reserva',   'Reservar con nosotros',
   'Precio directo, sin comisión de plataforma.',                '/', 'boton',   20, false),
  ('airbnb',    'airbnb',    'Alquilar por Airbnb',
   'Si prefieres pagar con la protección de Airbnb.',            '',  'boton',   30, false),
  ('instagram', 'instagram', 'Instagram', '',                    '',  'circulo', 40, false),
  ('tiktok',    'tiktok',    'TikTok',    '',                    '',  'circulo', 50, false)
ON CONFLICT (slug) DO NOTHING;
