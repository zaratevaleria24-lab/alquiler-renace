-- Datos del anuncio de Airbnb que dan confianza en el carrusel de /enlaces:
-- valoración, número de reseñas y el resumen «2 habitaciones · 3 camas · 2 baños».
-- Se copian a mano desde Airbnb en el panel (no se raspa su web).
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS airbnb_rating numeric(2,1) CHECK (airbnb_rating IS NULL OR (airbnb_rating >= 0 AND airbnb_rating <= 5)),
  ADD COLUMN IF NOT EXISTS airbnb_resenas integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS airbnb_detalle text NOT NULL DEFAULT '';
