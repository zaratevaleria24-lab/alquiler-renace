-- «Traslados y autos de Margarita Renace» pasa a los destacados (2026-09-15).
--
-- Es nuestro propio servicio y estaba perdido entre los lugares de la categoría
-- «Moverse», ordenado por reseñas de Google — y como es nuestro y no tiene
-- ficha de Google, no tiene reseñas, así que caía al final. Lo pide el dueño
-- en segundo lugar: lo primero que necesita un huésped al aterrizar es cómo
-- llegar del aeropuerto al apartamento.
--
-- Comparte el sello dorado con los aliados. No es un tercero que pasó el filtro
-- (ver /nosotros), pero el nombre del lugar dice «de Margarita Renace», así que
-- nadie puede confundirse sobre de quién es.
--
-- El orden se edita también desde /admin/guia: esto es solo el estado inicial.

UPDATE guia_lugares SET orden = 1 WHERE slug = 'caribest-water-agua-a-domicilio';
UPDATE guia_lugares SET aliado = true, aliado_motivo = 'para llegar del aeropuerto', orden = 2
 WHERE slug = 'traslados-y-autos-de-margarita-renace';
UPDATE guia_lugares SET orden = 3 WHERE slug = 'recargas-la-perla-agua-potable';
UPDATE guia_lugares SET orden = 4 WHERE slug = 'v2-aventuras-e-bikes-jeeps-y-trekking';
UPDATE guia_lugares SET orden = 5 WHERE slug = 'ketchup-hot-empanadas-y-pasteles';
UPDATE guia_lugares SET orden = 9 WHERE slug = 'guuao-marketplace';
