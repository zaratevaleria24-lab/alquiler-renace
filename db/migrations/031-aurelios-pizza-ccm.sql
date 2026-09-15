-- Aurelio's Pizza (CCM), aliado «para pizza» (2026-09-15). Lo pide el dueño.
--
-- DE DÓNDE SALEN LOS DATOS, porque esta vez costó:
--   · Google Places NO lo tiene. Se buscó por nombre, por variantes sin
--     apóstrofo, y con una búsqueda de restaurantes en 400 m alrededor del CCM:
--     veinte resultados y ninguno era este. Pasa seguido con negocios
--     venezolanos que viven en Instagram y no en Google.
--   · El perfil @aureliospizza.mgta, leído con Apify (el mismo token del
--     scraper de Marketplace, ver VENTAS.md). De ahí salen las TRES sedes y el
--     WhatsApp: su propia biografía dice «SOLO WHATSAPP CCM» y enlaza a
--     wa.me/584127955395, así que ese número es el de esta sede, no el general.
--   · Las coordenadas son las del Centro Comercial CCM (Calle Los Uveros,
--     Porlamar), que sí está en Google. «Cómo llegar» lleva al centro
--     comercial, que es lo correcto para un local dentro de un centro comercial.
--
-- SIN VALORACIÓN NI HORARIO a propósito: no los tenemos de ninguna fuente y no
-- se inventan. La ficha los omite sola cuando faltan.

INSERT INTO guia_lugares
  (slug, nombre, categoria, categorias_extra, municipio, descripcion, consejo,
   latitud, longitud, direccion, telefono, instagram,
   aliado, aliado_motivo, orden, publicado)
VALUES
  ('aurelios-pizza-ccm', 'Aurelio''s Pizza — CCM', 'comer', ARRAY['delivery'], 'Mariño',
   'Pizzería con tres sedes en la isla: el local 43 del Centro Comercial CCM, el nivel feria de La Vela y el Sambil Margarita. Esta ficha es la del CCM.',
   'La sede del CCM toma los pedidos solo por WhatsApp, y el número de acá es el de esa sede. Si estás en La Vela o en el Sambil, ahí tienen puesto propio.',
   10.9811069, -63.8203007,
   'Centro Comercial CCM, local 43, Calle Los Uveros, Porlamar', '0412-7955395',
   'aureliospizza.mgta',
   true, 'para pizza', 7, true)
ON CONFLICT (slug) DO NOTHING;
