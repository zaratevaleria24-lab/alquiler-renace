-- ════════════════════════════════════════════════════════════════════════════
-- Esquema de Margarita Renace
--
-- REGLA DE DISEÑO: este esquema es un espejo campo por campo del tipo
-- `Property` de lib/listings.ts. Si se agrega una columna acá, hay que
-- reflejarla allá y viceversa, o el panel y la web dejarán de coincidir — que
-- es exactamente lo que este CMS no puede permitirse.
--
-- Ver CMS-PLAN.md para el razonamiento completo.
-- ════════════════════════════════════════════════════════════════════════════

-- Para generar identificadores sin depender de la app.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Catálogos cerrados ──────────────────────────────────────────────────────
-- Categorías y amenidades son catálogos, no texto libre. Motivo concreto: las
-- categorías funcionan como CLAVES DE FILTRO en el home (`Playa`, `Frente al
-- Mar`…). Si el panel dejara escribirlas a mano, un "playa" en minúscula
-- rompería el filtro sin dar ningún error visible.

CREATE TABLE categories (
  key         text PRIMARY KEY,          -- 'Playa', 'Frente al Mar'…
  label       text NOT NULL,
  -- Clave del icono, no el componente: Lucide son componentes de React y no
  -- caben en una columna. El front traduce clave → componente con un registro.
  icon_key    text NOT NULL,
  sort_order  int  NOT NULL DEFAULT 0
);

CREATE TABLE amenities (
  key         text PRIMARY KEY,          -- 'wifi', 'piscina', 'parrilla'…
  name        text NOT NULL,             -- 'Wi-Fi de Alta Velocidad'
  icon_key    text NOT NULL,
  sort_order  int  NOT NULL DEFAULT 0
);

-- ── Zonas de la isla ────────────────────────────────────────────────────────
-- De acá salen las 9 landings /alquiler/<slug> y sus entradas del sitemap.
-- El contenido editorial vive en columnas y no en el código, para que se pueda
-- editar sin desplegar.

CREATE TABLE zones (
  slug        text PRIMARY KEY,          -- 'pampatar', 'playa-el-yaque'
  name        text NOT NULL,             -- 'Pampatar'
  coast       text NOT NULL DEFAULT '',  -- 'costa este, bahía de aguas calmas'
  summary     text NOT NULL DEFAULT '',  -- meta description de la landing
  body        text[] NOT NULL DEFAULT '{}',  -- párrafos de contexto
  nearby      text[] NOT NULL DEFAULT '{}',  -- referencias cercanas
  best_for    text NOT NULL DEFAULT '',
  sort_order  int  NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Anfitriones ─────────────────────────────────────────────────────────────

CREATE TABLE hosts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  tagline     text NOT NULL DEFAULT '',
  avatar_path text,
  -- Igual que en properties: distingue a la anfitriona real (Margarita Renace)
  -- de los nombres inventados que hoy acompañan a los listados de relleno.
  is_real     boolean NOT NULL DEFAULT false
);

-- ── Propiedades ─────────────────────────────────────────────────────────────

CREATE TABLE properties (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Slug estable para URLs. Se deriva del nombre al crear, pero se guarda: si
  -- alguien renombra la propiedad, la URL no debe romperse sola.
  slug              text UNIQUE NOT NULL,
  name              text NOT NULL,
  zone_slug         text NOT NULL REFERENCES zones(slug) ON UPDATE CASCADE,
  -- Dirección legible ('Urb. Maneiro, Pampatar, Margarita'). La ZONA ya no se
  -- deriva partiendo este texto por comas —como hacía lib/listings.ts— porque
  -- era frágil: ahora es un campo propio con selección cerrada.
  location          text NOT NULL,
  description       text NOT NULL DEFAULT '',

  -- Precio. price_text es lo que se MUESTRA ('US$78 / noche', 'Consultar
  -- precio') y price_per_night es el número con el que se FILTRA y se ordena.
  -- Van separados a propósito: el texto admite matices que un número no.
  price_text        text NOT NULL DEFAULT 'Consultar precio',
  price_per_night   int  NOT NULL DEFAULT 0,
  price_on_request  boolean NOT NULL DEFAULT false,
  nights_count      int  NOT NULL DEFAULT 2,

  -- NULLABLE a propósito. De los 12 listados actuales solo uno es real; los
  -- otros 11 llevan valoraciones inventadas. Un rating obligatorio obliga a
  -- inventar, y el markup de reseñas falsas se castiga con acción manual de
  -- Google sobre todo el dominio (ver SEO.md).
  rating            numeric(2,1) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),

  guests_adults     int NOT NULL DEFAULT 2,
  guests_children   int NOT NULL DEFAULT 0,

  -- Marca el inventario verdadero. Permite avisar en el panel "tienes 11
  -- listados de relleno publicados" y esconderlos sin borrarlos.
  is_real           boolean NOT NULL DEFAULT false,
  is_published      boolean NOT NULL DEFAULT true,
  sort_order        int NOT NULL DEFAULT 0,

  host_id           uuid REFERENCES hosts(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX properties_zone_idx      ON properties(zone_slug);
CREATE INDEX properties_published_idx ON properties(is_published, sort_order);

-- ── Fotos ───────────────────────────────────────────────────────────────────
-- Una fila por foto, con orden explícito y una marcada como portada. Sustituye
-- al par `image` + `gallery[]` del código, donde la portada se duplicaba dentro
-- de la galería y era fácil que quedaran desincronizadas.

CREATE TABLE property_images (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  -- Ruta pública servida por nginx desde uploads/, o /images/… para las
  -- heredadas. Nunca una URL externa: Venezuela bloquea los CDNs de terceros.
  path        text NOT NULL,
  alt         text NOT NULL DEFAULT '',
  is_cover    boolean NOT NULL DEFAULT false,
  sort_order  int NOT NULL DEFAULT 0
);

CREATE INDEX property_images_prop_idx ON property_images(property_id, sort_order);

-- Solo una portada por propiedad, garantizado por la base y no por la app.
CREATE UNIQUE INDEX property_images_one_cover
  ON property_images(property_id) WHERE is_cover;

-- ── Relaciones N:M ──────────────────────────────────────────────────────────

CREATE TABLE property_amenities (
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  amenity_key text NOT NULL REFERENCES amenities(key) ON UPDATE CASCADE,
  sort_order  int NOT NULL DEFAULT 0,
  PRIMARY KEY (property_id, amenity_key)
);

CREATE TABLE property_categories (
  property_id  uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  category_key text NOT NULL REFERENCES categories(key) ON UPDATE CASCADE,
  PRIMARY KEY (property_id, category_key)
);

-- ── Acceso al panel ─────────────────────────────────────────────────────────

CREATE TABLE admin_users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text UNIQUE NOT NULL,
  -- Hash scrypt, con formato scrypt$N$r$p$salt$hash (ver lib/auth.ts; decía
  -- argon2id, que nunca se llegó a usar: requiere compilación nativa y este
  -- servidor ya sufrió un OOM compilando dependencias).
  -- NUNCA la contraseña en claro, ni un hash rápido tipo SHA:
  -- si la base se filtra, un SHA se revienta con diccionario en minutos.
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

CREATE TABLE sessions (
  -- Se guarda el HASH del token, no el token. Así, con la base en la mano,
  -- nadie puede fabricar una cookie válida.
  token_hash  text PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sessions_expiry_idx ON sessions(expires_at);

-- Registro de intentos de login para limitar por fuerza bruta. El panel queda
-- expuesto a internet, así que esto no es opcional.
CREATE TABLE login_attempts (
  id         bigserial PRIMARY KEY,
  ip_hash    text NOT NULL,
  email      text,
  ok         boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX login_attempts_recent_idx ON login_attempts(ip_hash, created_at DESC);

-- ── Analítica propia ────────────────────────────────────────────────────────
-- Recolección de primera parte, no Google Analytics. En Venezuela los recursos
-- de terceros se bloquean —GA no cargaría para buena parte del público— y sin
-- cookies no hace falta banner de consentimiento.

CREATE TABLE page_views (
  id            bigserial PRIMARY KEY,
  path          text NOT NULL,
  -- Solo el DOMINIO del referente, no la URL completa: para saber de dónde
  -- viene el tráfico no hace falta guardar qué página exacta miraba antes.
  referrer_host text,
  device        text,              -- 'movil' | 'escritorio' | 'tablet'
  country       text,              -- de la cabecera CF-IPCountry
  -- Hash de IP + user-agent + sal del DÍA. Permite contar visitantes únicos
  -- por jornada sin poder seguir a nadie entre días, porque la sal cambia.
  visitor_day   text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX page_views_created_idx ON page_views(created_at DESC);
CREATE INDEX page_views_path_idx    ON page_views(path, created_at DESC);

CREATE TABLE events (
  id          bigserial PRIMARY KEY,
  -- 'busqueda' | 'ver_detalle' | 'clic_whatsapp' | 'clic_correo' | 'filtro'
  kind        text NOT NULL,
  path        text,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  -- Carga variable según el tipo: el término buscado, las fechas, el número de
  -- huéspedes. En jsonb para no añadir una columna por cada dato nuevo.
  meta        jsonb NOT NULL DEFAULT '{}',
  visitor_day text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX events_kind_idx    ON events(kind, created_at DESC);
CREATE INDEX events_created_idx ON events(created_at DESC);

-- ── Mantener updated_at al día sin que la app tenga que acordarse ───────────

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER properties_touch BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER zones_touch BEFORE UPDATE ON zones
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
