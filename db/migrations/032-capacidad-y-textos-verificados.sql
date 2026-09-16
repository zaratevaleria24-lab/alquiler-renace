-- 2026-09-16: el propietario confirma que LOS CUATRO apartamentos admiten
-- seis personas en total, no seis adultos MÁS niños. Los campos existentes
-- almacenan cupos aditivos; se normalizan a 6 + 0 y la web expresa «personas».
-- Actualización de datos, sin cambios de esquema. Idempotente.
BEGIN;
UPDATE properties
SET guests_adults = 6, guests_children = 0
WHERE is_real AND slug IN ('los-geranios-a', 'los-geranios-lujo', 'agua-mar', 'bahia-magica')
  AND (guests_adults <> 6 OR guests_children <> 0);

-- Textos del inicio editables desde el panel: oferta concreta y ubicación
-- coherente con la ficha. Se conserva la foto actual.
INSERT INTO site_settings (key, value) VALUES
('hero_subtitulo', 'Apartamentos para hasta 6 personas en Pampatar. Consulta fotos y tarifa, calcula tu estadía y reserva por WhatsApp con quien te recibe.'),
('hero_kicker', 'Pampatar · Isla de Margarita · Venezuela')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
UPDATE site_settings SET value = 'Bahía Mágica · La Caranta, Pampatar, Isla de Margarita'
WHERE key = 'hero_image_alt' AND value LIKE '%Bahía Mágica%' AND value LIKE '%Costa Azul%';
COMMIT;
