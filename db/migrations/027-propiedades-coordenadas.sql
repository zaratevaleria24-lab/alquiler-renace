-- Coordenadas de los alojamientos, para el mapa de la isla (/mapa).
--
-- POR QUÉ APROXIMADAS Y NO EXACTAS: son casas donde duerme gente. La dirección
-- exacta de un apartamento alquilado, publicada en un mapa abierto, es un dato
-- de seguridad del huésped, no un dato de marketing. Se guarda el punto de la
-- urbanización o del sector —lo mismo que ya dice `location` en la ficha— y la
-- interfaz lo declara como aproximado. Airbnb hace exactamente esto y por el
-- mismo motivo.
--
-- Nulas por defecto: una propiedad sin coordenadas no sale en el mapa y no
-- rompe nada.
ALTER TABLE properties ADD COLUMN IF NOT EXISTS latitud  double precision;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS longitud double precision;

COMMENT ON COLUMN properties.latitud  IS 'Aproximada: punto de la urbanización o sector, nunca la puerta.';
COMMENT ON COLUMN properties.longitud IS 'Aproximada: punto de la urbanización o sector, nunca la puerta.';

-- Los cuatro publicados, con el punto del sector que ya nombra su ficha.
UPDATE properties SET latitud = 10.9949018, longitud = -63.8160553 WHERE slug IN ('los-geranios-a', 'los-geranios-lujo') AND latitud IS NULL;
UPDATE properties SET latitud = 10.9849432, longitud = -63.8040162 WHERE slug = 'agua-mar'     AND latitud IS NULL;
UPDATE properties SET latitud = 10.9976128, longitud = -63.7856542 WHERE slug = 'bahia-magica' AND latitud IS NULL;
