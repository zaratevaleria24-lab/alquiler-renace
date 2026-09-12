-- Migración 011 — los prospectos de Marketplace se PUBLICAN en /en-venta
--
-- Cambio de decisión de la dueña (2026-09-12): los anuncios que trae el scraper
-- sí salen en la web, con precio y fotos; lo que queda privado es el contacto
-- del vendedor (el público escribe a Margarita Renace). Las fichas van con
-- noindex porque son textos y fotos de terceros; las propias sí se indexan.
--
-- Las fotos de la galería de Facebook caducan en menos de dos horas (403), así
-- que se descargan al servidor en el momento de la búsqueda y acá se guardan
-- las rutas locales.
--
-- Aplicar: docker exec -i margarita_postgres psql -U margarita -d margarita < db/migrations/011-prospectos-publicos.sql

BEGIN;
ALTER TABLE prospectos_venta ADD COLUMN IF NOT EXISTS publicado boolean NOT NULL DEFAULT true;
ALTER TABLE prospectos_venta ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE prospectos_venta ADD COLUMN IF NOT EXISTS fotos_locales text[] NOT NULL DEFAULT '{}';
CREATE UNIQUE INDEX IF NOT EXISTS prospectos_venta_slug_idx ON prospectos_venta (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS prospectos_venta_publico_idx ON prospectos_venta (publicado, vivo, vendido, estado);
COMMIT;
