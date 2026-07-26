-- Migración 001 — alquiler de vehículos
--
-- POR QUÉ UNA MIGRACIÓN Y NO EDITAR schema.sql: el schema.sql solo se ejecuta
-- cuando Docker CREA el volumen por primera vez. La base ya existe con los 12
-- listados, así que editar aquel archivo no cambiaría nada en la base real y
-- además dejaría los dos archivos discrepando. Las migraciones se numeran y se
-- aplican en orden; schema.sql queda como la foto del estado inicial.
--
-- Aplicar:
--   docker exec -i margarita_postgres psql -U margarita -d margarita \
--     < db/migrations/001-vehiculos.sql
--
-- Es idempotente (IF NOT EXISTS), así que correrla dos veces no rompe nada.

BEGIN;

-- Los vehículos NO se fuerzan dentro de la tabla de propiedades. El CLAUDE.md
-- del repo ya lo advertía: `Property` tiene campos que solo aplican a
-- alojamientos (huéspedes, noches, zona) y un carro tiene los suyos
-- (transmisión, puestos, precio por día). Meterlos juntos obliga a dejar la
-- mitad de las columnas en NULL y a llenar el código de condicionales.

CREATE TABLE IF NOT EXISTS vehicles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,

  -- 'Toyota Corolla', 'Chevrolet Aveo'…
  brand           text NOT NULL,
  model           text NOT NULL,
  year            int,
  -- Nombre para mostrar. Se guarda aparte porque a veces conviene algo más
  -- comercial que "marca + modelo" (p. ej. "Corolla automático 2019").
  display_name    text NOT NULL,

  -- 'automatica' | 'sincronica'. En Venezuela la distinción pesa al elegir.
  transmission    text NOT NULL DEFAULT 'automatica'
                    CHECK (transmission IN ('automatica', 'sincronica')),
  seats           int NOT NULL DEFAULT 5,
  doors           int NOT NULL DEFAULT 4,
  has_ac          boolean NOT NULL DEFAULT true,
  -- 'gasolina' | 'gasoil' | 'hibrido'
  fuel            text NOT NULL DEFAULT 'gasolina',
  -- Tipo de carrocería para filtrar: 'sedan', 'suv', 'hatchback', 'camioneta'.
  body_type       text NOT NULL DEFAULT 'sedan',

  description     text NOT NULL DEFAULT '',

  -- Precio POR DÍA, no por noche: es la unidad del alquiler de vehículos y
  -- mezclarla con la de alojamiento confundiría al visitante.
  price_text      text NOT NULL DEFAULT 'Consultar precio',
  price_per_day   int NOT NULL DEFAULT 0,
  price_on_request boolean NOT NULL DEFAULT false,
  -- Depósito o garantía, y mínimo de días. Son las dos preguntas que todo el
  -- mundo hace y que casi ningún sitio responde antes de escribir.
  deposit_text    text NOT NULL DEFAULT '',
  min_days        int NOT NULL DEFAULT 1,

  -- Zona donde se entrega. Referencia las mismas zonas que los alojamientos:
  -- así el filtro por zona sirve para todo el catálogo.
  pickup_zone_slug text REFERENCES zones(slug) ON UPDATE CASCADE,
  -- Nota de entrega: 'Entrega en el aeropuerto sin costo', etc.
  pickup_note     text NOT NULL DEFAULT '',

  -- Mismos dos marcadores que en properties, por las mismas razones.
  is_real         boolean NOT NULL DEFAULT true,
  is_published    boolean NOT NULL DEFAULT false,
  -- Disponibilidad operativa, distinta de la publicación: un carro puede estar
  -- publicado y alquilado esta semana.
  is_available    boolean NOT NULL DEFAULT true,

  sort_order      int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vehicles_published_idx ON vehicles(is_published, sort_order);

CREATE TABLE IF NOT EXISTS vehicle_images (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id  uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  -- Ruta local. Nunca URL externa: Venezuela bloquea los CDNs de terceros.
  path        text NOT NULL,
  alt         text NOT NULL DEFAULT '',
  is_cover    boolean NOT NULL DEFAULT false,
  sort_order  int NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS vehicle_images_veh_idx
  ON vehicle_images(vehicle_id, sort_order);

-- Una sola portada por vehículo, garantizado por la base.
CREATE UNIQUE INDEX IF NOT EXISTS vehicle_images_one_cover
  ON vehicle_images(vehicle_id) WHERE is_cover;

-- Extras del vehículo: 'Bluetooth', 'Cámara de reversa', 'Puesto de niño'.
-- Catálogo propio y no reutilizando `amenities`, porque las de alojamiento no
-- aplican y mezclarlas llenaría los selectores del panel de opciones absurdas.
CREATE TABLE IF NOT EXISTS vehicle_features (
  key         text PRIMARY KEY,
  name        text NOT NULL,
  icon_key    text NOT NULL DEFAULT 'check',
  sort_order  int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS vehicle_vehicle_features (
  vehicle_id  uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  feature_key text NOT NULL REFERENCES vehicle_features(key) ON UPDATE CASCADE,
  sort_order  int NOT NULL DEFAULT 0,
  PRIMARY KEY (vehicle_id, feature_key)
);

-- Extras iniciales. Son los habituales del alquiler de vehículos; el panel
-- permitirá añadir más. NO se crea ningún vehículo: los 5 reales los carga la
-- dueña desde el panel, y inventar el inventario es justo lo que no se hace acá.
INSERT INTO vehicle_features (key, name, icon_key, sort_order) VALUES
  ('aire-acondicionado', 'Aire acondicionado', 'wind', 0),
  ('bluetooth',          'Bluetooth',          'radio', 1),
  ('camara-reversa',     'Cámara de reversa',  'video', 2),
  ('puesto-nino',        'Puesto para niño',   'baby', 3),
  ('maletero-amplio',    'Maletero amplio',    'box', 4),
  ('gps',                'GPS',                'map-pin', 5),
  ('kilometraje-libre',  'Kilometraje libre',  'gauge', 6),
  ('seguro-incluido',    'Seguro incluido',    'shield-check', 7)
ON CONFLICT (key) DO NOTHING;

-- updated_at automático, igual que en properties y zones.
CREATE OR REPLACE TRIGGER vehicles_touch BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

COMMIT;
