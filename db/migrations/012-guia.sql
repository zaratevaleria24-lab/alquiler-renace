-- Migración 012 — Guía turística (/guia)
--
-- Lugares para visitar y cosas para hacer en la isla, pensados para leerse
-- desde el teléfono (QR en cada apartamento). Cada lugar combina:
--   · texto NUESTRO (descripcion, consejo): escrito con la voz de IDENTIDAD.md.
--   · datos de Google Places (rating, horario, teléfono, coordenadas): se
--     refrescan; Google permite guardar el place_id indefinidamente y el resto
--     hasta 30 días, por eso `datos_actualizados`.
--   · fotos: propias o de Wikimedia Commons con licencia libre (se guardan en el
--     servidor con su crédito). Las de Google NO se guardan: se sirven al vuelo
--     por /api/guia/foto con su atribución, como exigen sus términos.
--
-- Aplicar: docker exec -i margarita_postgres psql -U margarita -d margarita < db/migrations/012-guia.sql

BEGIN;

CREATE TABLE IF NOT EXISTS guia_lugares (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text UNIQUE NOT NULL,
  nombre            text NOT NULL,
  -- playa | historia | naturaleza | mirador | museo | comer | actividad | nocturna | compras | familia
  categoria         text NOT NULL,
  zone_slug         text REFERENCES zones(slug) ON UPDATE CASCADE ON DELETE SET NULL,
  municipio         text NOT NULL DEFAULT '',
  descripcion       text NOT NULL DEFAULT '',
  consejo           text NOT NULL DEFAULT '',   -- el tip de quien vive acá
  mejor_momento     text NOT NULL DEFAULT '',   -- "temprano", "atardecer", "tarde con viento"
  duracion          text NOT NULL DEFAULT '',   -- "medio día", "2 horas"
  costo             text NOT NULL DEFAULT '',   -- "gratis", "US$ 5 la entrada"

  google_place_id   text UNIQUE,
  rating            numeric(2,1),
  resenas           integer,
  latitud           double precision,
  longitud          double precision,
  direccion         text NOT NULL DEFAULT '',
  telefono          text,
  web               text,
  instagram         text,
  maps_url          text,
  horario           jsonb,                      -- weekdayDescriptions de Places
  nivel_precio      text,
  resumen_google    text,                       -- editorialSummary (contenido de Google, se refresca)
  fotos_google      jsonb NOT NULL DEFAULT '[]', -- [{name, autor}] referencias, no archivos
  datos_actualizados timestamptz,

  -- [{path, alt, credito, licencia, fuente:'propia'|'commons'|'dueña'}]
  fotos             jsonb NOT NULL DEFAULT '[]',

  destacado         boolean NOT NULL DEFAULT false,
  orden             integer NOT NULL DEFAULT 0,
  publicado         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS guia_lugares_cat_idx ON guia_lugares (publicado, categoria, orden);

-- Consejos generales para el viajero (dinero, transporte, seguridad, sol…):
-- se editan desde el panel, se muestran al pie de la guía.
CREATE TABLE IF NOT EXISTS guia_consejos (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tema      text NOT NULL,     -- dinero | transporte | seguridad | playa | comida | salud
  titulo    text NOT NULL,
  texto     text NOT NULL,
  orden     integer NOT NULL DEFAULT 0,
  publicado boolean NOT NULL DEFAULT true
);

COMMIT;
