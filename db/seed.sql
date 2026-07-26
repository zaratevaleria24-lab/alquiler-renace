-- GENERADO por db/generate-seed.mjs — NO editar a mano.
-- Refleja exactamente los 12 listados publicados al momento de generarlo.
-- Regenerar con: node db/generate-seed.mjs > db/seed.sql

BEGIN;

-- Categorías
INSERT INTO categories (key, label, icon_key, sort_order) VALUES ('Frente al Mar', 'Frente al Mar', 'waves', 0) ON CONFLICT (key) DO NOTHING;
INSERT INTO categories (key, label, icon_key, sort_order) VALUES ('Playa', 'Playa', 'umbrella', 1) ON CONFLICT (key) DO NOTHING;
INSERT INTO categories (key, label, icon_key, sort_order) VALUES ('Piscina', 'Piscina', 'sparkles', 2) ON CONFLICT (key) DO NOTHING;
INSERT INTO categories (key, label, icon_key, sort_order) VALUES ('Vista al Mar', 'Vista al Mar', 'palmtree', 3) ON CONFLICT (key) DO NOTHING;
INSERT INTO categories (key, label, icon_key, sort_order) VALUES ('Centro', 'Centro', 'homeicon', 4) ON CONFLICT (key) DO NOTHING;
INSERT INTO categories (key, label, icon_key, sort_order) VALUES ('Familiar', 'Familiar', 'users', 5) ON CONFLICT (key) DO NOTHING;
INSERT INTO categories (key, label, icon_key, sort_order) VALUES ('Lujo', 'Lujo', 'star', 6) ON CONFLICT (key) DO NOTHING;
INSERT INTO categories (key, label, icon_key, sort_order) VALUES ('Económico', 'Económico', 'box', 7) ON CONFLICT (key) DO NOTHING;

-- Amenidades
INSERT INTO amenities (key, name, icon_key, sort_order) VALUES ('wi-fi-constante', 'Wi-Fi Constante', 'wifi', 0) ON CONFLICT (key) DO NOTHING;
INSERT INTO amenities (key, name, icon_key, sort_order) VALUES ('aire-acondicionado', 'Aire Acondicionado', 'wind', 1) ON CONFLICT (key) DO NOTHING;
INSERT INTO amenities (key, name, icon_key, sort_order) VALUES ('seguridad-24-7', 'Seguridad 24/7', 'shieldcheck', 2) ON CONFLICT (key) DO NOTHING;
INSERT INTO amenities (key, name, icon_key, sort_order) VALUES ('piscina-y-cancha-deportiva', 'Piscina y Cancha Deportiva', 'waves', 3) ON CONFLICT (key) DO NOTHING;
INSERT INTO amenities (key, name, icon_key, sort_order) VALUES ('zona-de-parrilla', 'Zona de Parrilla', 'flame', 4) ON CONFLICT (key) DO NOTHING;
INSERT INTO amenities (key, name, icon_key, sort_order) VALUES ('parque-infantil', 'Parque Infantil', 'smile', 5) ON CONFLICT (key) DO NOTHING;
INSERT INTO amenities (key, name, icon_key, sort_order) VALUES ('estacionamiento-asignado', 'Estacionamiento Asignado', 'box', 6) ON CONFLICT (key) DO NOTHING;
INSERT INTO amenities (key, name, icon_key, sort_order) VALUES ('cocina-totalmente-equipada', 'Cocina Totalmente Equipada', 'coffee', 7) ON CONFLICT (key) DO NOTHING;
INSERT INTO amenities (key, name, icon_key, sort_order) VALUES ('piscina-infinita', 'Piscina Infinita', 'waves', 8) ON CONFLICT (key) DO NOTHING;
INSERT INTO amenities (key, name, icon_key, sort_order) VALUES ('wi-fi-de-alta-velocidad', 'Wi-Fi de Alta Velocidad', 'wifi', 9) ON CONFLICT (key) DO NOTHING;
INSERT INTO amenities (key, name, icon_key, sort_order) VALUES ('jacuzzi-privado', 'Jacuzzi Privado', 'sparkles', 10) ON CONFLICT (key) DO NOTHING;
INSERT INTO amenities (key, name, icon_key, sort_order) VALUES ('vista-panoramica-al-mar', 'Vista Panorámica al Mar', 'palmtree', 11) ON CONFLICT (key) DO NOTHING;
INSERT INTO amenities (key, name, icon_key, sort_order) VALUES ('acceso-directo-a-playa', 'Acceso Directo a Playa', 'umbrella', 12) ON CONFLICT (key) DO NOTHING;
INSERT INTO amenities (key, name, icon_key, sort_order) VALUES ('wi-fi', 'Wi-Fi', 'wifi', 13) ON CONFLICT (key) DO NOTHING;
INSERT INTO amenities (key, name, icon_key, sort_order) VALUES ('piscina-compartida', 'Piscina Compartida', 'waves', 14) ON CONFLICT (key) DO NOTHING;
INSERT INTO amenities (key, name, icon_key, sort_order) VALUES ('terraza-vista-al-mar', 'Terraza Vista al Mar', 'palmtree', 15) ON CONFLICT (key) DO NOTHING;
INSERT INTO amenities (key, name, icon_key, sort_order) VALUES ('cocina-equipada', 'Cocina Equipada', 'coffee', 16) ON CONFLICT (key) DO NOTHING;
INSERT INTO amenities (key, name, icon_key, sort_order) VALUES ('estacionamiento-privado', 'Estacionamiento Privado', 'box', 17) ON CONFLICT (key) DO NOTHING;
INSERT INTO amenities (key, name, icon_key, sort_order) VALUES ('tv-smart', 'TV Smart', 'sparkles', 18) ON CONFLICT (key) DO NOTHING;

-- Zonas, con su contenido editorial
INSERT INTO zones (slug, name, coast, summary, body, nearby, best_for, sort_order) VALUES ('pampatar', 'Pampatar', 'costa este, bahía de aguas calmas', 'Pampatar combina bahía tranquila, casco histórico y el mayor centro comercial de la isla. Es la zona más cómoda para quien quiere todo cerca sin renunciar al mar.', ARRAY['Pampatar es la capital del municipio Maneiro, en la costa este de la Isla de Margarita. Su bahía es de aguas calmas y poco oleaje, lo que la hace distinta de las playas del lado atlántico: acá se puede nadar tranquilo y los botes de pesca siguen saliendo desde la orilla como hace décadas.', 'Es la zona con mejor equilibrio entre vida urbana y playa. El Castillo San Carlos de Borromeo, del siglo XVII, está frente al malecón, y a pocos minutos queda el Centro Comercial Sambil Margarita, el más grande de la isla. Eso convierte a Pampatar en la base preferida de quien viaja con familia: farmacias, supermercados, clínicas y restaurantes quedan a distancia corta.', 'Las urbanizaciones residenciales de la zona suelen ofrecer seguridad 24/7, piscina y estacionamiento, algo poco común en alquileres frente a playas más remotas.']::text[], ARRAY['Castillo San Carlos de Borromeo', 'Bahía y malecón de Pampatar', 'C.C. Sambil Margarita', 'Costa Azul y Porlamar a pocos minutos']::text[], 'familias y estadías largas que quieren servicios cerca', 0) ON CONFLICT (slug) DO NOTHING;
INSERT INTO zones (slug, name, coast, summary, body, nearby, best_for, sort_order) VALUES ('porlamar', 'Porlamar', 'costa sur-este, urbana', 'Porlamar es el centro comercial y urbano de Margarita: compras, restaurantes y vida nocturna, con playa a pocos minutos.', ARRAY['Porlamar es la ciudad más grande de la Isla de Margarita y su corazón comercial. La Avenida Santiago Mariño y la 4 de Mayo concentran tiendas, restaurantes y bancos, herencia de la condición de puerto libre de la isla, que durante décadas la convirtió en destino de compras del Caribe.', 'Alojarse en Porlamar significa no depender del carro para lo básico: se camina a comer, a comprar y a la playa. Playa El Morro y la costa de Bella Vista quedan dentro de la ciudad, y la zona hotelera de Costa Azul está pegada al este.', 'Es la mejor opción para viajes cortos, viajes de trabajo o para quien prefiere movimiento urbano antes que aislamiento frente al mar. También es donde hay más oferta de alojamiento por metro cuadrado, así que suele tener las tarifas más competitivas de la isla.']::text[], ARRAY['Av. Santiago Mariño y 4 de Mayo (compras)', 'Playa El Morro y Bella Vista', 'Concha Marina y La Caranta', 'Aeropuerto Santiago Mariño a ~20 minutos']::text[], 'viajes cortos, compras y quien quiere todo a pie', 1) ON CONFLICT (slug) DO NOTHING;
INSERT INTO zones (slug, name, coast, summary, body, nearby, best_for, sort_order) VALUES ('costa-azul', 'Costa Azul', 'costa sur-este, playa urbana', 'Costa Azul es la zona hotelera de Porlamar: playa urbana, torres frente al mar y servicios a pocos pasos.', ARRAY['Costa Azul es el sector hotelero por excelencia de la Isla de Margarita, en el extremo este de Porlamar. Es donde se concentran las torres residenciales y los hoteles frente al mar, con una playa urbana de arena clara y aguas por lo general tranquilas.', 'La ventaja de Costa Azul es la combinación difícil de encontrar: se puede estar frente al mar y a la vez a cinco minutos en carro del Sambil y del centro de Porlamar. Para quien no quiere elegir entre playa y servicios, es la zona natural.', 'Los alquileres acá tienden a ser apartamentos en edificios con piscina, ascensor y vigilancia, más que casas independientes.']::text[], ARRAY['Playa Costa Azul', 'C.C. Sambil Margarita', 'Centro de Porlamar', 'Bahía de Pampatar']::text[], 'quien quiere playa y ciudad a la vez', 2) ON CONFLICT (slug) DO NOTHING;
INSERT INTO zones (slug, name, coast, summary, body, nearby, best_for, sort_order) VALUES ('playa-parguito', 'Playa Parguito', 'costa este atlántica, oleaje fuerte', 'Parguito es la playa de las olas: la referencia del surf en Margarita y la más animada de la costa atlántica.', ARRAY['Playa Parguito, en la costa este de la isla, es donde rompen las mejores olas de Margarita. Es la playa del surf por antonomasia y también una de las más animadas: toldos, música, comida en la arena y ambiente joven, sobre todo los fines de semana.', 'Al ser costa atlántica, el oleaje es fuerte y el agua más fresca que en las bahías del sur. Hay que respetar las corrientes: es una playa para nadadores con experiencia o para quedarse en la orilla.', 'Está en el eje de las playas del este —El Agua, El Cardón, Guacuco— así que sirve de base para recorrerlas todas.']::text[], ARRAY['Playa El Agua', 'Playa El Cardón', 'Playa Guacuco', 'La Asunción, capital del estado']::text[], 'surf, olas y ambiente de playa activo', 3) ON CONFLICT (slug) DO NOTHING;
INSERT INTO zones (slug, name, coast, summary, body, nearby, best_for, sort_order) VALUES ('playa-caribe', 'Playa Caribe', 'costa norte, oleaje suave', 'Playa Caribe es una de las playas más limpias del norte de Margarita: agua clara, poco desarrollo y mucho menos gente.', ARRAY['Playa Caribe está en la costa norte de la isla, entre Juan Griego y Pedro González. Es una playa de arena clara y agua transparente, con oleaje suave, y una de las que la gente local nombra cuando quiere alejarse del circuito turístico.', 'El desarrollo es bajo: pocos toldos, algunos restaurantes de pescado frito a pie de arena y poco más. Eso es precisamente su atractivo, y también lo que hay que tener en cuenta: conviene tener carro, porque los servicios no están al lado.', 'Los alojamientos de la zona tienden a ser villas y casas con piscina en vez de edificios, aprovechando el espacio y la vista.']::text[], ARRAY['Pedro González', 'Juan Griego y el Fortín La Galera', 'Playa Zaragoza', 'Manzanillo']::text[], 'quien busca playa tranquila y agua clara', 4) ON CONFLICT (slug) DO NOTHING;
INSERT INTO zones (slug, name, coast, summary, body, nearby, best_for, sort_order) VALUES ('juan-griego', 'Juan Griego', 'costa noroeste, bahía al oeste', 'Juan Griego tiene fama de los mejores atardeceres de Margarita, vistos desde el Fortín La Galera sobre la bahía.', ARRAY['Juan Griego es un pueblo de pescadores en la costa noroeste de la isla, y su bahía mira al oeste: por eso los atardeceres son el motivo por el que la gente sube al Fortín La Galera cada tarde. Es una de las postales reconocibles de Margarita.', 'El ritmo es de pueblo, no de ciudad. La bahía es de aguas calmas, los botes descargan pescado en la orilla y los restaurantes del malecón sirven mariscos sencillos y buenos. Es más económico y más tranquilo que Porlamar o Costa Azul.', 'Buena base para explorar el norte de la isla: la Península de Macanao, Playa Caribe y Manzanillo quedan cerca.']::text[], ARRAY['Fortín La Galera (atardeceres)', 'Malecón y restaurantes de mariscos', 'Playa Caribe y Pedro González', 'Manzanillo y el norte de la isla']::text[], 'atardeceres, calma y presupuesto ajustado', 5) ON CONFLICT (slug) DO NOTHING;
INSERT INTO zones (slug, name, coast, summary, body, nearby, best_for, sort_order) VALUES ('playa-el-yaque', 'Playa El Yaque', 'costa sur, viento constante y agua baja', 'El Yaque es uno de los mejores destinos del mundo para kitesurf y windsurf: viento constante y agua tibia que no pasa de la cintura.', ARRAY['Playa El Yaque, en la costa sur de la isla junto al aeropuerto, es un nombre conocido en el circuito internacional de deportes de viento. La combinación es casi única: viento constante casi todo el año, agua tibia y un banco de arena que se extiende decenas de metros con profundidad hasta la cintura.', 'Eso la vuelve el lugar ideal para aprender kitesurf o windsurf —se puede practicar de pie— y a la vez suficientemente exigente para riders avanzados. La temporada de más viento va de enero a agosto.', 'El pueblo es pequeño y gira alrededor del deporte: escuelas, posadas, bares en la arena. Si buscas playa de postal para no hacer nada, no es esta; si buscas viento, es la mejor de Venezuela.']::text[], ARRAY['Escuelas de kitesurf y windsurf en la orilla', 'Aeropuerto Internacional Santiago Mariño (~10 min)', 'Playa Punta Arenas', 'Porlamar a ~25 minutos']::text[], 'kitesurf, windsurf y viajeros deportivos', 6) ON CONFLICT (slug) DO NOTHING;
INSERT INTO zones (slug, name, coast, summary, body, nearby, best_for, sort_order) VALUES ('playa-guacuco', 'Playa Guacuco', 'costa este, oleaje moderado', 'Guacuco es una playa larga y abierta del este de la isla, favorita de los margariteños y con mucho menos turismo.', ARRAY['Playa Guacuco, en el municipio Arismendi, es una playa extensa de arena dorada bordeada de cocoteros. Tiene oleaje moderado —más que las bahías del sur, menos que Parguito— y es una de las preferidas por la gente de la isla, lo que le da un ambiente más local que turístico.', 'Su longitud permite caminar bastante sin cruzarse con nadie, algo raro en las playas más conocidas. Hay restaurantes y toldos en el acceso principal, pero el resto queda abierto.', 'Está muy cerca de La Asunción, la capital del estado Nueva Esparta, con su casco histórico y el Castillo Santa Rosa: una buena combinación de playa y algo que ver que no sea playa.']::text[], ARRAY['La Asunción y el Castillo Santa Rosa', 'Playa Parguito y Playa El Agua', 'Campo de golf de Guacuco', 'Pampatar a ~15 minutos']::text[], 'playa amplia con ambiente local', 7) ON CONFLICT (slug) DO NOTHING;
INSERT INTO zones (slug, name, coast, summary, body, nearby, best_for, sort_order) VALUES ('manzanillo', 'Manzanillo', 'costa norte, bahía protegida', 'Manzanillo es un pueblo de pescadores en el extremo norte, de bahía protegida y aguas muy calmas.', ARRAY['Manzanillo está en la punta norte de la Isla de Margarita, y su bahía en forma de herradura es de las más protegidas de la isla: agua calma, casi sin oleaje, ideal para nadar y para niños.', 'Sigue siendo un pueblo de pescadores: los botes de colores en la arena son parte del paisaje y el pescado se compra recién llegado. La zona tiene desarrollo residencial de bajo perfil, con casas y villas más que edificios.', 'Es la elección de quien quiere desconexión real. La contrapartida es la distancia: Porlamar queda a unos 45 minutos, así que el carro es prácticamente indispensable.']::text[], ARRAY['Bahía de Manzanillo', 'Playa Puerto Viejo y Puerto Cruz', 'Playa Escondida', 'Pedro González y Playa Caribe']::text[], 'desconexión, aguas calmas y familias con niños', 8) ON CONFLICT (slug) DO NOTHING;

-- Anfitriones
INSERT INTO hosts (name, tagline, avatar_path, is_real) VALUES ('Margarita Renace', 'Anfitrión verificado · Los Geranios', '/logo-avatar.png', true);
INSERT INTO hosts (name, tagline, avatar_path, is_real) VALUES ('José Rodríguez', 'Especialista en turismo en Margarita', '/images/photo-1507003211169.webp', false);
INSERT INTO hosts (name, tagline, avatar_path, is_real) VALUES ('María Fernández', 'Anfitriona premium en Porlamar', '/images/photo-1500648767791.webp', false);
INSERT INTO hosts (name, tagline, avatar_path, is_real) VALUES ('Luis González', 'Atención personalizada para familias', '/images/photo-1534528741775.webp', false);
INSERT INTO hosts (name, tagline, avatar_path, is_real) VALUES ('Andrea Salazar', 'Anfitriona surfer y amante del mar', '/images/photo-1539571696357.webp', false);
INSERT INTO hosts (name, tagline, avatar_path, is_real) VALUES ('Roberto Villarroel', 'Villas exclusivas frente al mar', '/images/photo-1492562080023.webp', false);
INSERT INTO hosts (name, tagline, avatar_path, is_real) VALUES ('Gabriela Rojas', 'Enamorada de los atardeceres de Juan Griego', '/images/photo-1539571696357.webp', false);
INSERT INTO hosts (name, tagline, avatar_path, is_real) VALUES ('Daniel Millán', 'Instructor de kitesurf y anfitrión', '/images/photo-1506794778202.webp', false);
INSERT INTO hosts (name, tagline, avatar_path, is_real) VALUES ('Patricia Guerra', 'Anfitriona familiar y atenta', '/images/photo-1544005313.webp', false);
INSERT INTO hosts (name, tagline, avatar_path, is_real) VALUES ('Alejandra Marín', 'Anfitriona de estadías premium', '/images/photo-1534528741775.webp', false);
INSERT INTO hosts (name, tagline, avatar_path, is_real) VALUES ('Héctor Bermúdez', 'Anfitrión cerca de la marina', '/images/photo-1500648767791.webp', false);
INSERT INTO hosts (name, tagline, avatar_path, is_real) VALUES ('Yolanda Ortega', 'Anfitriona práctica en el centro', '/images/photo-1544005313.webp', false);

-- Propiedades, con fotos, amenidades y categorías

-- 1. Los Geranios A
WITH nueva AS (
  INSERT INTO properties (
    slug, name, zone_slug, location, description, price_text,
    price_per_night, price_on_request, nights_count, rating,
    guests_adults, guests_children, is_real, is_published, sort_order, host_id
  ) VALUES (
    'los-geranios-a', 'Los Geranios A', 'pampatar', 'Urb. Maneiro, Pampatar, Margarita', 'Apartamento totalmente equipado en zona céntrica de Pampatar, a solo 5 minutos del C.C. Sambil. Cuenta con seguridad 24/7, piscina, cancha deportiva, zona de parrilla y parque infantil dentro de la urbanización. Ideal para familias: habitación principal con cama queen y baño privado, habitación secundaria con cama queen y gaveta adicional. Todo lo que necesitas cerca, en una de las zonas más cómodas de la isla.', 'Consultar precio',
    0, true, 2, 4.9,
    6, 0, true, true, 0,
    (SELECT id FROM hosts WHERE name = 'Margarita Renace' LIMIT 1)
  ) RETURNING id
)
INSERT INTO property_images (property_id, path, alt, is_cover, sort_order) VALUES
    ((SELECT id FROM nueva), '/properties/los-geranios-a/habitacion-principal.webp', 'Los Geranios A — alojamiento en Pampatar, Isla de Margarita', true, 0);
INSERT INTO property_amenities (property_id, amenity_key, sort_order) VALUES
    ((SELECT id FROM properties WHERE slug = 'los-geranios-a'), 'wi-fi-constante', 0),
    ((SELECT id FROM properties WHERE slug = 'los-geranios-a'), 'aire-acondicionado', 1),
    ((SELECT id FROM properties WHERE slug = 'los-geranios-a'), 'seguridad-24-7', 2),
    ((SELECT id FROM properties WHERE slug = 'los-geranios-a'), 'piscina-y-cancha-deportiva', 3),
    ((SELECT id FROM properties WHERE slug = 'los-geranios-a'), 'zona-de-parrilla', 4),
    ((SELECT id FROM properties WHERE slug = 'los-geranios-a'), 'parque-infantil', 5),
    ((SELECT id FROM properties WHERE slug = 'los-geranios-a'), 'estacionamiento-asignado', 6),
    ((SELECT id FROM properties WHERE slug = 'los-geranios-a'), 'cocina-totalmente-equipada', 7);
INSERT INTO property_categories (property_id, category_key) VALUES
    ((SELECT id FROM properties WHERE slug = 'los-geranios-a'), 'Centro'),
    ((SELECT id FROM properties WHERE slug = 'los-geranios-a'), 'Familiar'),
    ((SELECT id FROM properties WHERE slug = 'los-geranios-a'), 'Piscina');

-- 2. Suite Frente al Mar Pampatar
WITH nueva AS (
  INSERT INTO properties (
    slug, name, zone_slug, location, description, price_text,
    price_per_night, price_on_request, nights_count, rating,
    guests_adults, guests_children, is_real, is_published, sort_order, host_id
  ) VALUES (
    'suite-frente-al-mar-pampatar', 'Suite Frente al Mar Pampatar', 'pampatar', 'Pampatar, Margarita', 'Suite moderna con balcón frente a la bahía de Pampatar y su histórico castillo San Carlos de Borromeo. Vistas espectaculares al atardecer, a pasos del malecón, tiendas y la mejor gastronomía de la isla.', 'US$78 / noche',
    78, false, 1, 4.9,
    4, 2, false, true, 1,
    (SELECT id FROM hosts WHERE name = 'José Rodríguez' LIMIT 1)
  ) RETURNING id
)
INSERT INTO property_images (property_id, path, alt, is_cover, sort_order) VALUES
    ((SELECT id FROM nueva), '/images/photo-1510798831971.webp', 'Suite Frente al Mar Pampatar — alojamiento en Pampatar, Isla de Margarita', true, 0),
    ((SELECT id FROM nueva), '/images/photo-1449034446853.webp', 'Suite Frente al Mar Pampatar — alojamiento en Pampatar, Isla de Margarita', false, 1),
    ((SELECT id FROM nueva), '/images/photo-1504280390367.webp', 'Suite Frente al Mar Pampatar — alojamiento en Pampatar, Isla de Margarita', false, 2);
INSERT INTO property_amenities (property_id, amenity_key, sort_order) VALUES
    ((SELECT id FROM properties WHERE slug = 'suite-frente-al-mar-pampatar'), 'piscina-infinita', 0),
    ((SELECT id FROM properties WHERE slug = 'suite-frente-al-mar-pampatar'), 'wi-fi-de-alta-velocidad', 1),
    ((SELECT id FROM properties WHERE slug = 'suite-frente-al-mar-pampatar'), 'aire-acondicionado', 2),
    ((SELECT id FROM properties WHERE slug = 'suite-frente-al-mar-pampatar'), 'jacuzzi-privado', 3),
    ((SELECT id FROM properties WHERE slug = 'suite-frente-al-mar-pampatar'), 'vista-panoramica-al-mar', 4);
INSERT INTO property_categories (property_id, category_key) VALUES
    ((SELECT id FROM properties WHERE slug = 'suite-frente-al-mar-pampatar'), 'Frente al Mar'),
    ((SELECT id FROM properties WHERE slug = 'suite-frente-al-mar-pampatar'), 'Vista al Mar');

-- 3. Penthouse Porlamar Centro
WITH nueva AS (
  INSERT INTO properties (
    slug, name, zone_slug, location, description, price_text,
    price_per_night, price_on_request, nights_count, rating,
    guests_adults, guests_children, is_real, is_published, sort_order, host_id
  ) VALUES (
    'penthouse-porlamar-centro', 'Penthouse Porlamar Centro', 'porlamar', 'Porlamar, Margarita', 'Amplio penthouse de lujo en el corazón de Porlamar, cerca de los centros comerciales y las zonas comerciales libres de impuestos. Piscina en la azotea con vista de 360° a la ciudad y al mar Caribe.', 'US$95 / noche',
    95, false, 3, 4.95,
    4, 2, false, true, 2,
    (SELECT id FROM hosts WHERE name = 'María Fernández' LIMIT 1)
  ) RETURNING id
)
INSERT INTO property_images (property_id, path, alt, is_cover, sort_order) VALUES
    ((SELECT id FROM nueva), '/images/photo-1576013551627.webp', 'Penthouse Porlamar Centro — alojamiento en Porlamar, Isla de Margarita', true, 0),
    ((SELECT id FROM nueva), '/images/photo-1566073771259.webp', 'Penthouse Porlamar Centro — alojamiento en Porlamar, Isla de Margarita', false, 1),
    ((SELECT id FROM nueva), '/images/photo-1512917774080.webp', 'Penthouse Porlamar Centro — alojamiento en Porlamar, Isla de Margarita', false, 2);
INSERT INTO property_amenities (property_id, amenity_key, sort_order) VALUES
    ((SELECT id FROM properties WHERE slug = 'penthouse-porlamar-centro'), 'piscina-infinita', 0),
    ((SELECT id FROM properties WHERE slug = 'penthouse-porlamar-centro'), 'wi-fi-de-alta-velocidad', 1),
    ((SELECT id FROM properties WHERE slug = 'penthouse-porlamar-centro'), 'aire-acondicionado', 2),
    ((SELECT id FROM properties WHERE slug = 'penthouse-porlamar-centro'), 'jacuzzi-privado', 3),
    ((SELECT id FROM properties WHERE slug = 'penthouse-porlamar-centro'), 'vista-panoramica-al-mar', 4);
INSERT INTO property_categories (property_id, category_key) VALUES
    ((SELECT id FROM properties WHERE slug = 'penthouse-porlamar-centro'), 'Centro'),
    ((SELECT id FROM properties WHERE slug = 'penthouse-porlamar-centro'), 'Lujo');

-- 4. Apartamento Costa Azul
WITH nueva AS (
  INSERT INTO properties (
    slug, name, zone_slug, location, description, price_text,
    price_per_night, price_on_request, nights_count, rating,
    guests_adults, guests_children, is_real, is_published, sort_order, host_id
  ) VALUES (
    'apartamento-costa-azul', 'Apartamento Costa Azul', 'costa-azul', 'Costa Azul, Margarita', 'Apartamento familiar en el exclusivo sector Costa Azul, con conjunto cerrado, piscina y áreas verdes. A minutos de los mejores hoteles, restaurantes y de la playa. Perfecto para vacaciones en familia con total tranquilidad.', 'US$62 / noche',
    62, false, 2, 4.85,
    6, 3, false, true, 3,
    (SELECT id FROM hosts WHERE name = 'Luis González' LIMIT 1)
  ) RETURNING id
)
INSERT INTO property_images (property_id, path, alt, is_cover, sort_order) VALUES
    ((SELECT id FROM nueva), '/images/photo-1580587771525.webp', 'Apartamento Costa Azul — alojamiento en Costa Azul, Isla de Margarita', true, 0),
    ((SELECT id FROM nueva), '/images/photo-1600585154340.webp', 'Apartamento Costa Azul — alojamiento en Costa Azul, Isla de Margarita', false, 1),
    ((SELECT id FROM nueva), '/images/photo-1600607687939.webp', 'Apartamento Costa Azul — alojamiento en Costa Azul, Isla de Margarita', false, 2);
INSERT INTO property_amenities (property_id, amenity_key, sort_order) VALUES
    ((SELECT id FROM properties WHERE slug = 'apartamento-costa-azul'), 'acceso-directo-a-playa', 0),
    ((SELECT id FROM properties WHERE slug = 'apartamento-costa-azul'), 'wi-fi', 1),
    ((SELECT id FROM properties WHERE slug = 'apartamento-costa-azul'), 'aire-acondicionado', 2),
    ((SELECT id FROM properties WHERE slug = 'apartamento-costa-azul'), 'piscina-compartida', 3),
    ((SELECT id FROM properties WHERE slug = 'apartamento-costa-azul'), 'terraza-vista-al-mar', 4);
INSERT INTO property_categories (property_id, category_key) VALUES
    ((SELECT id FROM properties WHERE slug = 'apartamento-costa-azul'), 'Piscina'),
    ((SELECT id FROM properties WHERE slug = 'apartamento-costa-azul'), 'Familiar');

-- 5. Studio Playa Parguito
WITH nueva AS (
  INSERT INTO properties (
    slug, name, zone_slug, location, description, price_text,
    price_per_night, price_on_request, nights_count, rating,
    guests_adults, guests_children, is_real, is_published, sort_order, host_id
  ) VALUES (
    'studio-playa-parguito', 'Studio Playa Parguito', 'playa-parguito', 'Playa Parguito, Margarita', 'Estudio acogedor y económico cerca de Playa Parguito, la favorita de los surfistas por su oleaje. Ideal para viajeros jóvenes y parejas que buscan sol, olas y buen ambiente sin gastar de más.', 'US$38 / noche',
    38, false, 1, 4.7,
    2, 0, false, true, 4,
    (SELECT id FROM hosts WHERE name = 'Andrea Salazar' LIMIT 1)
  ) RETURNING id
)
INSERT INTO property_images (property_id, path, alt, is_cover, sort_order) VALUES
    ((SELECT id FROM nueva), '/images/photo-1533873984035.webp', 'Studio Playa Parguito — alojamiento en Playa Parguito, Isla de Margarita', true, 0),
    ((SELECT id FROM nueva), '/images/photo-1470240731273.webp', 'Studio Playa Parguito — alojamiento en Playa Parguito, Isla de Margarita', false, 1),
    ((SELECT id FROM nueva), '/images/photo-1504280390367.webp', 'Studio Playa Parguito — alojamiento en Playa Parguito, Isla de Margarita', false, 2);
INSERT INTO property_amenities (property_id, amenity_key, sort_order) VALUES
    ((SELECT id FROM properties WHERE slug = 'studio-playa-parguito'), 'acceso-directo-a-playa', 0),
    ((SELECT id FROM properties WHERE slug = 'studio-playa-parguito'), 'wi-fi', 1),
    ((SELECT id FROM properties WHERE slug = 'studio-playa-parguito'), 'aire-acondicionado', 2),
    ((SELECT id FROM properties WHERE slug = 'studio-playa-parguito'), 'piscina-compartida', 3),
    ((SELECT id FROM properties WHERE slug = 'studio-playa-parguito'), 'terraza-vista-al-mar', 4);
INSERT INTO property_categories (property_id, category_key) VALUES
    ((SELECT id FROM properties WHERE slug = 'studio-playa-parguito'), 'Playa'),
    ((SELECT id FROM properties WHERE slug = 'studio-playa-parguito'), 'Económico');

-- 6. Villa Playa Caribe
WITH nueva AS (
  INSERT INTO properties (
    slug, name, zone_slug, location, description, price_text,
    price_per_night, price_on_request, nights_count, rating,
    guests_adults, guests_children, is_real, is_published, sort_order, host_id
  ) VALUES (
    'villa-playa-caribe', 'Villa Playa Caribe', 'playa-caribe', 'Playa Caribe, Margarita', 'Villa de lujo con piscina privada frente a Playa Caribe, en el norte de la isla. Amplios espacios, terraza con parrillera y acceso directo a una de las playas más limpias de Margarita. Perfecta para grupos grandes.', 'US$155 / noche',
    155, false, 2, 4.92,
    8, 4, false, true, 5,
    (SELECT id FROM hosts WHERE name = 'Roberto Villarroel' LIMIT 1)
  ) RETURNING id
)
INSERT INTO property_images (property_id, path, alt, is_cover, sort_order) VALUES
    ((SELECT id FROM nueva), '/images/photo-1533090161767.webp', 'Villa Playa Caribe — alojamiento en Playa Caribe, Isla de Margarita', true, 0),
    ((SELECT id FROM nueva), '/images/photo-1510798831971.webp', 'Villa Playa Caribe — alojamiento en Playa Caribe, Isla de Margarita', false, 1);
INSERT INTO property_amenities (property_id, amenity_key, sort_order) VALUES
    ((SELECT id FROM properties WHERE slug = 'villa-playa-caribe'), 'piscina-infinita', 0),
    ((SELECT id FROM properties WHERE slug = 'villa-playa-caribe'), 'wi-fi-de-alta-velocidad', 1),
    ((SELECT id FROM properties WHERE slug = 'villa-playa-caribe'), 'aire-acondicionado', 2),
    ((SELECT id FROM properties WHERE slug = 'villa-playa-caribe'), 'jacuzzi-privado', 3),
    ((SELECT id FROM properties WHERE slug = 'villa-playa-caribe'), 'vista-panoramica-al-mar', 4);
INSERT INTO property_categories (property_id, category_key) VALUES
    ((SELECT id FROM properties WHERE slug = 'villa-playa-caribe'), 'Frente al Mar'),
    ((SELECT id FROM properties WHERE slug = 'villa-playa-caribe'), 'Piscina'),
    ((SELECT id FROM properties WHERE slug = 'villa-playa-caribe'), 'Lujo');

-- 7. Apartamento Juan Griego
WITH nueva AS (
  INSERT INTO properties (
    slug, name, zone_slug, location, description, price_text,
    price_per_night, price_on_request, nights_count, rating,
    guests_adults, guests_children, is_real, is_published, sort_order, host_id
  ) VALUES (
    'apartamento-juan-griego', 'Apartamento Juan Griego', 'juan-griego', 'Juan Griego, Margarita', 'Apartamento con vista a la bahía de Juan Griego, famosa por tener los atardeceres más hermosos de Margarita. Ambiente tranquilo de pueblo pesquero, cerca del Fortín La Galera y ricos restaurantes de mariscos.', 'US$52 / noche',
    52, false, 2, 4.8,
    4, 2, false, true, 6,
    (SELECT id FROM hosts WHERE name = 'Gabriela Rojas' LIMIT 1)
  ) RETURNING id
)
INSERT INTO property_images (property_id, path, alt, is_cover, sort_order) VALUES
    ((SELECT id FROM nueva), '/images/photo-1542314831.webp', 'Apartamento Juan Griego — alojamiento en Juan Griego, Isla de Margarita', true, 0),
    ((SELECT id FROM nueva), '/images/photo-1566073771259.webp', 'Apartamento Juan Griego — alojamiento en Juan Griego, Isla de Margarita', false, 1),
    ((SELECT id FROM nueva), '/images/photo-1576013551627.webp', 'Apartamento Juan Griego — alojamiento en Juan Griego, Isla de Margarita', false, 2);
INSERT INTO property_amenities (property_id, amenity_key, sort_order) VALUES
    ((SELECT id FROM properties WHERE slug = 'apartamento-juan-griego'), 'wi-fi-de-alta-velocidad', 0),
    ((SELECT id FROM properties WHERE slug = 'apartamento-juan-griego'), 'aire-acondicionado', 1),
    ((SELECT id FROM properties WHERE slug = 'apartamento-juan-griego'), 'cocina-equipada', 2),
    ((SELECT id FROM properties WHERE slug = 'apartamento-juan-griego'), 'estacionamiento-privado', 3),
    ((SELECT id FROM properties WHERE slug = 'apartamento-juan-griego'), 'tv-smart', 4);
INSERT INTO property_categories (property_id, category_key) VALUES
    ((SELECT id FROM properties WHERE slug = 'apartamento-juan-griego'), 'Vista al Mar'),
    ((SELECT id FROM properties WHERE slug = 'apartamento-juan-griego'), 'Familiar');

-- 8. Loft Playa El Yaque
WITH nueva AS (
  INSERT INTO properties (
    slug, name, zone_slug, location, description, price_text,
    price_per_night, price_on_request, nights_count, rating,
    guests_adults, guests_children, is_real, is_published, sort_order, host_id
  ) VALUES (
    'loft-playa-el-yaque', 'Loft Playa El Yaque', 'playa-el-yaque', 'Playa El Yaque, Margarita', 'Loft ideal para amantes del kitesurf y windsurf, a pasos de Playa El Yaque, reconocida a nivel mundial por sus vientos. Ambiente internacional, relajado y con la mejor energía de la isla.', 'US$42 / noche',
    42, false, 3, 4.75,
    2, 1, false, true, 7,
    (SELECT id FROM hosts WHERE name = 'Daniel Millán' LIMIT 1)
  ) RETURNING id
)
INSERT INTO property_images (property_id, path, alt, is_cover, sort_order) VALUES
    ((SELECT id FROM nueva), '/images/photo-1499793983690.webp', 'Loft Playa El Yaque — alojamiento en Playa El Yaque, Isla de Margarita', true, 0),
    ((SELECT id FROM nueva), '/images/photo-1515263487990.webp', 'Loft Playa El Yaque — alojamiento en Playa El Yaque, Isla de Margarita', false, 1),
    ((SELECT id FROM nueva), '/images/photo-1580587771525.webp', 'Loft Playa El Yaque — alojamiento en Playa El Yaque, Isla de Margarita', false, 2);
INSERT INTO property_amenities (property_id, amenity_key, sort_order) VALUES
    ((SELECT id FROM properties WHERE slug = 'loft-playa-el-yaque'), 'acceso-directo-a-playa', 0),
    ((SELECT id FROM properties WHERE slug = 'loft-playa-el-yaque'), 'wi-fi', 1),
    ((SELECT id FROM properties WHERE slug = 'loft-playa-el-yaque'), 'aire-acondicionado', 2),
    ((SELECT id FROM properties WHERE slug = 'loft-playa-el-yaque'), 'piscina-compartida', 3),
    ((SELECT id FROM properties WHERE slug = 'loft-playa-el-yaque'), 'terraza-vista-al-mar', 4);
INSERT INTO property_categories (property_id, category_key) VALUES
    ((SELECT id FROM properties WHERE slug = 'loft-playa-el-yaque'), 'Playa'),
    ((SELECT id FROM properties WHERE slug = 'loft-playa-el-yaque'), 'Económico');

-- 9. Apartamento Playa Guacuco
WITH nueva AS (
  INSERT INTO properties (
    slug, name, zone_slug, location, description, price_text,
    price_per_night, price_on_request, nights_count, rating,
    guests_adults, guests_children, is_real, is_published, sort_order, host_id
  ) VALUES (
    'apartamento-playa-guacuco', 'Apartamento Playa Guacuco', 'playa-guacuco', 'Playa Guacuco, Margarita', 'Apartamento cómodo y familiar cerca de Playa Guacuco, una amplia playa de aguas tranquilas ideal para niños. Rodeado de naturaleza, con fácil acceso en carro y a minutos de La Asunción, la capital de la isla.', 'US$66 / noche',
    66, false, 1, 4.88,
    5, 2, false, true, 8,
    (SELECT id FROM hosts WHERE name = 'Patricia Guerra' LIMIT 1)
  ) RETURNING id
)
INSERT INTO property_images (property_id, path, alt, is_cover, sort_order) VALUES
    ((SELECT id FROM nueva), '/images/photo-1504280390367.webp', 'Apartamento Playa Guacuco — alojamiento en Playa Guacuco, Isla de Margarita', true, 0),
    ((SELECT id FROM nueva), '/images/photo-1510798831971.webp', 'Apartamento Playa Guacuco — alojamiento en Playa Guacuco, Isla de Margarita', false, 1),
    ((SELECT id FROM nueva), '/images/photo-1533090161767.webp', 'Apartamento Playa Guacuco — alojamiento en Playa Guacuco, Isla de Margarita', false, 2);
INSERT INTO property_amenities (property_id, amenity_key, sort_order) VALUES
    ((SELECT id FROM properties WHERE slug = 'apartamento-playa-guacuco'), 'acceso-directo-a-playa', 0),
    ((SELECT id FROM properties WHERE slug = 'apartamento-playa-guacuco'), 'wi-fi', 1),
    ((SELECT id FROM properties WHERE slug = 'apartamento-playa-guacuco'), 'aire-acondicionado', 2),
    ((SELECT id FROM properties WHERE slug = 'apartamento-playa-guacuco'), 'piscina-compartida', 3),
    ((SELECT id FROM properties WHERE slug = 'apartamento-playa-guacuco'), 'terraza-vista-al-mar', 4);
INSERT INTO property_categories (property_id, category_key) VALUES
    ((SELECT id FROM properties WHERE slug = 'apartamento-playa-guacuco'), 'Playa'),
    ((SELECT id FROM properties WHERE slug = 'apartamento-playa-guacuco'), 'Familiar');

-- 10. Suite Manzanillo
WITH nueva AS (
  INSERT INTO properties (
    slug, name, zone_slug, location, description, price_text,
    price_per_night, price_on_request, nights_count, rating,
    guests_adults, guests_children, is_real, is_published, sort_order, host_id
  ) VALUES (
    'suite-manzanillo', 'Suite Manzanillo', 'manzanillo', 'Manzanillo, Margarita', 'Suite de lujo en el tranquilo pueblo de Manzanillo, al norte de la isla, con vistas de postal al mar Caribe. Terraza privada, acabados premium y la paz de una de las zonas más auténticas de Margarita.', 'US$120 / noche',
    120, false, 2, 4.97,
    4, 2, false, true, 9,
    (SELECT id FROM hosts WHERE name = 'Alejandra Marín' LIMIT 1)
  ) RETURNING id
)
INSERT INTO property_images (property_id, path, alt, is_cover, sort_order) VALUES
    ((SELECT id FROM nueva), '/images/photo-1512917774080.webp', 'Suite Manzanillo — alojamiento en Manzanillo, Isla de Margarita', true, 0),
    ((SELECT id FROM nueva), '/images/photo-1580587771525.webp', 'Suite Manzanillo — alojamiento en Manzanillo, Isla de Margarita', false, 1),
    ((SELECT id FROM nueva), '/images/photo-1613490493576.webp', 'Suite Manzanillo — alojamiento en Manzanillo, Isla de Margarita', false, 2);
INSERT INTO property_amenities (property_id, amenity_key, sort_order) VALUES
    ((SELECT id FROM properties WHERE slug = 'suite-manzanillo'), 'piscina-infinita', 0),
    ((SELECT id FROM properties WHERE slug = 'suite-manzanillo'), 'wi-fi-de-alta-velocidad', 1),
    ((SELECT id FROM properties WHERE slug = 'suite-manzanillo'), 'aire-acondicionado', 2),
    ((SELECT id FROM properties WHERE slug = 'suite-manzanillo'), 'jacuzzi-privado', 3),
    ((SELECT id FROM properties WHERE slug = 'suite-manzanillo'), 'vista-panoramica-al-mar', 4);
INSERT INTO property_categories (property_id, category_key) VALUES
    ((SELECT id FROM properties WHERE slug = 'suite-manzanillo'), 'Vista al Mar'),
    ((SELECT id FROM properties WHERE slug = 'suite-manzanillo'), 'Lujo');

-- 11. Apartamento Marina Pampatar
WITH nueva AS (
  INSERT INTO properties (
    slug, name, zone_slug, location, description, price_text,
    price_per_night, price_on_request, nights_count, rating,
    guests_adults, guests_children, is_real, is_published, sort_order, host_id
  ) VALUES (
    'apartamento-marina-pampatar', 'Apartamento Marina Pampatar', 'pampatar', 'Pampatar, Margarita', 'Moderno apartamento en la zona de la marina de Pampatar, con piscina y vista a los yates. Excelente ubicación para disfrutar de la vida nocturna, restaurantes frente al mar y paseos en bote.', 'US$84 / noche',
    84, false, 2, 4.9,
    4, 1, false, true, 10,
    (SELECT id FROM hosts WHERE name = 'Héctor Bermúdez' LIMIT 1)
  ) RETURNING id
)
INSERT INTO property_images (property_id, path, alt, is_cover, sort_order) VALUES
    ((SELECT id FROM nueva), '/images/photo-1580587771525.webp', 'Apartamento Marina Pampatar — alojamiento en Pampatar, Isla de Margarita', true, 0),
    ((SELECT id FROM nueva), '/images/photo-1566073771259.webp', 'Apartamento Marina Pampatar — alojamiento en Pampatar, Isla de Margarita', false, 1),
    ((SELECT id FROM nueva), '/images/photo-1512917774080.webp', 'Apartamento Marina Pampatar — alojamiento en Pampatar, Isla de Margarita', false, 2);
INSERT INTO property_amenities (property_id, amenity_key, sort_order) VALUES
    ((SELECT id FROM properties WHERE slug = 'apartamento-marina-pampatar'), 'piscina-infinita', 0),
    ((SELECT id FROM properties WHERE slug = 'apartamento-marina-pampatar'), 'wi-fi-de-alta-velocidad', 1),
    ((SELECT id FROM properties WHERE slug = 'apartamento-marina-pampatar'), 'aire-acondicionado', 2),
    ((SELECT id FROM properties WHERE slug = 'apartamento-marina-pampatar'), 'jacuzzi-privado', 3),
    ((SELECT id FROM properties WHERE slug = 'apartamento-marina-pampatar'), 'vista-panoramica-al-mar', 4);
INSERT INTO property_categories (property_id, category_key) VALUES
    ((SELECT id FROM properties WHERE slug = 'apartamento-marina-pampatar'), 'Frente al Mar'),
    ((SELECT id FROM properties WHERE slug = 'apartamento-marina-pampatar'), 'Piscina');

-- 12. Studio Centro Porlamar
WITH nueva AS (
  INSERT INTO properties (
    slug, name, zone_slug, location, description, price_text,
    price_per_night, price_on_request, nights_count, rating,
    guests_adults, guests_children, is_real, is_published, sort_order, host_id
  ) VALUES (
    'studio-centro-porlamar', 'Studio Centro Porlamar', 'porlamar', 'Porlamar, Margarita', 'Estudio funcional y económico en pleno centro de Porlamar, ideal para viajes de compras o negocios. A pasos de tiendas, bancos y transporte. La opción más práctica para conocer la isla con un presupuesto ajustado.', 'US$32 / noche',
    32, false, 2, 4.6,
    2, 0, false, true, 11,
    (SELECT id FROM hosts WHERE name = 'Yolanda Ortega' LIMIT 1)
  ) RETURNING id
)
INSERT INTO property_images (property_id, path, alt, is_cover, sort_order) VALUES
    ((SELECT id FROM nueva), '/images/photo-1470240731273.webp', 'Studio Centro Porlamar — alojamiento en Porlamar, Isla de Margarita', true, 0),
    ((SELECT id FROM nueva), '/images/photo-1533873984035.webp', 'Studio Centro Porlamar — alojamiento en Porlamar, Isla de Margarita', false, 1),
    ((SELECT id FROM nueva), '/images/photo-1504280390367.webp', 'Studio Centro Porlamar — alojamiento en Porlamar, Isla de Margarita', false, 2);
INSERT INTO property_amenities (property_id, amenity_key, sort_order) VALUES
    ((SELECT id FROM properties WHERE slug = 'studio-centro-porlamar'), 'wi-fi-de-alta-velocidad', 0),
    ((SELECT id FROM properties WHERE slug = 'studio-centro-porlamar'), 'aire-acondicionado', 1),
    ((SELECT id FROM properties WHERE slug = 'studio-centro-porlamar'), 'cocina-equipada', 2),
    ((SELECT id FROM properties WHERE slug = 'studio-centro-porlamar'), 'estacionamiento-privado', 3),
    ((SELECT id FROM properties WHERE slug = 'studio-centro-porlamar'), 'tv-smart', 4);
INSERT INTO property_categories (property_id, category_key) VALUES
    ((SELECT id FROM properties WHERE slug = 'studio-centro-porlamar'), 'Centro'),
    ((SELECT id FROM properties WHERE slug = 'studio-centro-porlamar'), 'Económico');

COMMIT;
