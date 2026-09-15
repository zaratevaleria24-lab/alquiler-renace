-- Rafa's Casual Food, aliado para hamburguesas (2026-09-15).
--
-- Lo pide el dueño. Está en la urbanización Playa El Ángel, la misma de
-- nuestro apartamento Agua Mar, y es el primer restaurante de esa zona en la
-- guía. OJO con la distancia: son 3,4 km del centro de Pampatar, no «a un
-- paso» — se midió antes de escribirlo.
--
-- DE DÓNDE SALE CADA DATO:
--   · Dirección, Instagram y teléfono: los dio el dueño. La dirección de Google
--     era un plus code («X5RH+HG5, Pampatar»), que no le sirve a nadie.
--   · Coordenadas, valoración y horario: Google Places, consultado hoy.
--   · El teléfono es el de PEDIDOS (0424-8261577), que es el que el dueño quiso
--     publicar. Google lista otro (0414-4210181), que es la línea del local.
--     Se publica uno solo y es el que resuelve lo que la gente va a querer.
--
-- Va en «Dónde comer» con «A domicilio» de categoría extra: se come ahí y
-- también lleva a la casa, y así aparece en las dos listas.

INSERT INTO guia_lugares
  (slug, nombre, categoria, categorias_extra, municipio, descripcion, consejo,
   google_place_id, rating, resenas, latitud, longitud, direccion, telefono,
   instagram, horario, aliado, aliado_motivo, orden, datos_actualizados, publicado)
VALUES
  ('rafas-casual-food', 'Rafa''s Casual Food', 'comer', ARRAY['delivery'], 'Maneiro',
   'Hamburguesas en la urbanización Playa El Ángel, la misma donde está nuestro apartamento Agua Mar. Es la sede en Margarita de la cocina del chef Rafa, que tiene locales también en Valencia, Caracas, Maracay y Barquisimeto.',
   'Piden por WhatsApp y llevan a domicilio. Abren desde las 11:30 y de jueves a sábado cierran una hora más tarde.',
   'ChIJtwxvWQCPMYwRncxOlhWYmt8', 4.5, 24, 10.9913923, -63.8211451,
   'Av. Aldonza Manrique, casa A, urb. Playa El Ángel, Pampatar', '0424-8261577',
   'rafascasualfood',
   '["lunes: 11:30–22:30","martes: 11:30–22:30","miércoles: 11:30–22:30","jueves: 11:30–23:30","viernes: 11:30–23:30","sábado: 11:30–23:30","domingo: 11:30–22:30"]'::jsonb,
   true, 'para hamburguesas', 6, now(), true)
ON CONFLICT (slug) DO NOTHING;
