-- Reseñas de huéspedes, transcritas a mano desde Airbnb (o recibidas por
-- WhatsApp/correo) con nombre, fecha, texto y enlace a la fuente. NUNCA se
-- inventan: solo se copian reseñas reales que existen en otro sitio o que el
-- huésped escribió. Las de Airbnb no llevan markup de Review (política de Google).
CREATE TABLE IF NOT EXISTS resenas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  autor       text NOT NULL,                 -- nombre de pila, como aparece en Airbnb
  fecha       date NOT NULL,
  texto       text NOT NULL,
  puntuacion  integer CHECK (puntuacion IS NULL OR (puntuacion BETWEEN 1 AND 5)),
  fuente      text NOT NULL DEFAULT 'airbnb', -- airbnb, whatsapp, google, directo
  url         text NOT NULL DEFAULT '',
  publicada   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS resenas_prop_idx ON resenas (property_id, fecha DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON resenas TO margarita_app;
