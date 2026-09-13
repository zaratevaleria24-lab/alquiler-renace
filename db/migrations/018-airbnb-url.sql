-- Enlace al anuncio de Airbnb de cada propiedad: lo usa la página de enlaces
-- (carrusel bajo «Reservar por Airbnb») y puede usarse en la ficha pública.
ALTER TABLE properties ADD COLUMN IF NOT EXISTS airbnb_url text NOT NULL DEFAULT '';
