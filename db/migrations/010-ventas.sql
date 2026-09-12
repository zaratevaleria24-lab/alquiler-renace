-- Migración 010 — inmuebles en venta y prospectos de Marketplace
--
-- DOS TABLAS SEPARADAS A PROPÓSITO:
--
--   prospectos_venta  = lo que trae el scraper de Facebook Marketplace. Es
--                       material AJENO: sirve para que la dueña llame al
--                       vendedor y le ofrezca representar la propiedad. NUNCA
--                       se publica en la web (contenido copiado, fotos que
--                       caducan y que Venezuela bloquea, precios falsos).
--   inmuebles_venta   = lo que Margarita Renace representa de verdad, con sus
--                       fotos y su texto. Esto SÍ se publica en /en-venta.
--
-- Un prospecto "captado" se convierte en un inmueble borrador (columna
-- prospecto_fb_id guarda de dónde salió), y ahí la dueña le carga fotos.
--
-- Aplicar:
--   docker exec -i margarita_postgres psql -U margarita -d margarita \
--     < db/migrations/010-ventas.sql
-- Idempotente.

BEGIN;

CREATE TABLE IF NOT EXISTS prospectos_venta (
  -- El id del anuncio en Facebook es la clave natural: si vuelve a aparecer
  -- en otra búsqueda, se actualiza "visto_ultimo" en vez de duplicarse.
  fb_id            text PRIMARY KEY,
  url              text NOT NULL,
  titulo           text NOT NULL,
  titulo_limpio    text NOT NULL DEFAULT '',
  descripcion      text NOT NULL DEFAULT '',

  -- Lo que dice Facebook (poco fiable: la gente pone "1" para no mostrar).
  precio_fb        numeric,
  moneda_fb        text,
  -- Lo que se LEE del texto del anuncio ("Ref 45000 $"): el precio de verdad.
  precio_usd       integer,
  -- Teléfono leído del texto. Facebook no entrega el del vendedor.
  telefono         text,
  m2               integer,
  habitaciones     integer,
  banos            integer,

  municipio        text NOT NULL DEFAULT '',
  ciudad           text NOT NULL DEFAULT '',
  latitud          double precision,
  longitud         double precision,
  -- Zona del sitio asignada por coordenadas (la más cercana).
  zone_slug        text REFERENCES zones(slug) ON UPDATE CASCADE ON DELETE SET NULL,

  foto_url         text,           -- caduca en horas; solo para mirar en el panel
  fotos            integer NOT NULL DEFAULT 0,
  vivo             boolean NOT NULL DEFAULT true,
  vendido          boolean NOT NULL DEFAULT false,

  estado           text NOT NULL DEFAULT 'nuevo'
                     CHECK (estado IN ('nuevo', 'contactado', 'descartado', 'captado')),
  notas            text NOT NULL DEFAULT '',

  visto_primero    timestamptz NOT NULL DEFAULT now(),
  visto_ultimo     timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS prospectos_venta_estado_idx ON prospectos_venta (estado, visto_ultimo DESC);

-- Registro de cada corrida del scraper: cuánto trajo y cuánto costó. Es la
-- factura de la dueña; tiene que poder ver en qué se fue el crédito.
CREATE TABLE IF NOT EXISTS ventas_corridas (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corrida_apify    text,
  url_busqueda     text NOT NULL,
  pedidos          integer NOT NULL,
  con_detalle      boolean NOT NULL DEFAULT true,
  traidos          integer NOT NULL DEFAULT 0,
  nuevos           integer NOT NULL DEFAULT 0,
  costo_usd        numeric(8,4),
  error            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inmuebles_venta (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text UNIQUE NOT NULL,
  titulo           text NOT NULL,
  -- 'apartamento' | 'casa' | 'terreno' | 'local'
  tipo             text NOT NULL DEFAULT 'apartamento'
                     CHECK (tipo IN ('apartamento', 'casa', 'terreno', 'local')),
  zone_slug        text NOT NULL REFERENCES zones(slug) ON UPDATE CASCADE,
  ubicacion        text NOT NULL DEFAULT '',   -- "Urb. Paraíso II, Porlamar"
  descripcion      text NOT NULL DEFAULT '',

  -- Precio en dólares. Las demás monedas se calculan al vuelo con la tasa del
  -- día (lib/tasas.ts); guardar bolívares sería guardar un número vencido.
  precio_usd       integer NOT NULL DEFAULT 0,
  precio_a_consultar boolean NOT NULL DEFAULT false,

  m2_construccion  integer,
  m2_terreno       integer,
  habitaciones     integer,
  banos            integer,
  estacionamientos integer,
  latitud          double precision,
  longitud         double precision,

  is_published     boolean NOT NULL DEFAULT false,
  sort_order       integer NOT NULL DEFAULT 0,
  prospecto_fb_id  text REFERENCES prospectos_venta(fb_id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inmuebles_venta_images (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inmueble_id      uuid NOT NULL REFERENCES inmuebles_venta(id) ON DELETE CASCADE,
  path             text NOT NULL,
  alt              text NOT NULL DEFAULT '',
  is_cover         boolean NOT NULL DEFAULT false,
  sort_order       integer NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS inmuebles_venta_images_one_cover
  ON inmuebles_venta_images (inmueble_id) WHERE is_cover;
CREATE INDEX IF NOT EXISTS inmuebles_venta_images_idx
  ON inmuebles_venta_images (inmueble_id, sort_order);

COMMIT;
