-- Guía: por qué recomendamos a cada aliado, tres lugares nuevos y un teléfono
-- que no era de acá (2026-09-15).

-- ── 1. El sello del aliado dice PARA QUÉ ────────────────────────────────────
-- «Recomendado por Margarita Renace», igual en los cinco, no dice nada. El
-- texto de la propia guía ya distingue: Caribest y La Perla para el agua, V2
-- para moverte, Ketchup Hot para desayunar, Guuao para tomar algo. Eso baja al
-- sello. Si el motivo está vacío, se pinta el texto genérico de siempre.
ALTER TABLE guia_lugares ADD COLUMN IF NOT EXISTS aliado_motivo text NOT NULL DEFAULT '';

COMMENT ON COLUMN guia_lugares.aliado_motivo IS
  'Completa «Recomendado …» en el sello del aliado. Vacío = «Recomendado por Margarita Renace».';

-- ── 2. Orden entre aliados ──────────────────────────────────────────────────
-- Salían ordenados por número de reseñas de Google, así que Guuao (202) iba
-- primero. El orden lo decide el negocio, no Google: primero lo que un huésped
-- necesita al llegar (agua), luego moverse y desayunar, y de último la licorería.
UPDATE guia_lugares SET aliado_motivo = 'para el agua',        orden = 1 WHERE slug = 'caribest-water-agua-a-domicilio';
UPDATE guia_lugares SET aliado_motivo = 'para el agua',        orden = 2 WHERE slug = 'recargas-la-perla-agua-potable';
UPDATE guia_lugares SET aliado_motivo = 'para moverte',        orden = 3 WHERE slug = 'v2-aventuras-e-bikes-jeeps-y-trekking';
UPDATE guia_lugares SET aliado_motivo = 'para desayunar',      orden = 4 WHERE slug = 'ketchup-hot-empanadas-y-pasteles';
UPDATE guia_lugares SET aliado_motivo = 'para beber algo',     orden = 9 WHERE slug = 'guuao-marketplace';

-- ── 3. Un teléfono que no es de la isla ─────────────────────────────────────
-- «La Mar Restaurant» tenía 689 09 12 89: formato de móvil ESPAÑOL. Vino de un
-- emparejamiento malo de Google (ver GUIA.md, ya pasó con otros). Un teléfono
-- equivocado es peor que ninguno: la persona llama y molesta a un desconocido.
UPDATE guia_lugares SET telefono = NULL WHERE slug = 'la-mar-restaurant' AND telefono = '689 09 12 89';

-- ── 4. Tres paradas de comida de carretera ──────────────────────────────────
-- Las pidió el dueño; los datos (dirección, coordenadas, horario, teléfono,
-- valoración) salen de Google Places, consultados el 2026-09-15. El texto es
-- nuestro y solo afirma lo que el dato sostiene: dónde están y a qué hora
-- abren. Nada de «las mejores de la isla».
INSERT INTO guia_lugares
  (slug, nombre, categoria, municipio, descripcion, consejo, google_place_id,
   rating, resenas, latitud, longitud, direccion, telefono, instagram, horario,
   datos_actualizados, publicado)
VALUES
  ('arepas-hermanos-moya', 'Las Arepas de Los Hermanos Moya', 'comer', 'Antolín del Campo',
   'Parada de carretera en el sector El Salado, sobre la avenida 31 de Julio, yendo hacia Playa El Agua. Arepas y cachapas hechas al momento desde las seis de la mañana.',
   'Es desayuno, no almuerzo: cierran a las doce del mediodía. Si vas a la playa, para a la ida — a la vuelta ya no están.',
   'ChIJa6naSX2RMYwRIfCOwfWOdVg', 4.6, 1366, 11.0854218, -63.8627754,
   'Avenida 31 de julio, sector El Salado, vía playa', '0412-2761176', 'arepashermanosmoya',
   '["lunes: 6:00–12:00","martes: 6:00–12:00","miércoles: 6:00–12:00","jueves: 6:00–12:00","viernes: 6:00–12:00","sábado: 6:00–12:00","domingo: 6:00–12:00"]'::jsonb,
   now(), true),

  ('cachapas-de-pedro', 'Cachapas de Pedro', 'comer', 'Gómez',
   'Cachapas en la bajada del Portachuelo, en Tacarigua, en la vía que cruza la isla hacia la costa norte.',
   'Cierran lunes y martes. De miércoles a viernes abren a las nueve; sábado y domingo, a las ocho.',
   'ChIJb73Mf4KTMYwRZoeeZIWX1Nc', 4.7, 46, 11.0491673, -63.8945161,
   'Bajada del Portachuelo, Tacarigua', '0412-0340429', NULL,
   '["lunes: Cerrado","martes: Cerrado","miércoles: 9:00–17:00","jueves: 9:00–17:00","viernes: 9:00–17:00","sábado: 8:00–17:00","domingo: 8:00–17:00"]'::jsonb,
   now(), true),

  ('la-empanaderia-mgta', 'La Empanadería MGTA', 'comer', 'Arismendi',
   'Empanadas en La Asunción, en la calle La Noria. Abren temprano y cierran a la una de la tarde.',
   'Cuadra la visita a La Asunción por la mañana: con el castillo de Santa Rosa y el museo diocesano cerca, se hace todo de una sola subida.',
   'ChIJCVwKFv-RMYwRpjUd7Au24Co', 4.5, 1088, 11.037929, -63.8622587,
   'Calle La Noria, La Asunción', NULL, 'laempanaderiamgta',
   '["lunes: 7:00–13:00","martes: 7:00–13:00","miércoles: 7:00–13:00","jueves: 7:00–13:00","viernes: 7:00–13:00","sábado: 7:00–13:00","domingo: 7:00–13:00"]'::jsonb,
   now(), true)
ON CONFLICT (slug) DO NOTHING;
