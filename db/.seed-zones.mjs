// Contenido editorial por zona de la Isla de Margarita.
//
// POR QUÉ EXISTE ESTE ARCHIVO: una landing por zona que solo repita "alquiler
// en X" con la lista de listados es una doorway page, y Google las penaliza
// explícitamente. Para que /alquiler/<zona> aporte valor real necesita decir
// algo verdadero y distinto de cada lugar. Todo lo de acá es geografía y
// contexto de la isla, verificable — no promesas comerciales.
//
// Al agregar una zona nueva a los listados, agregar su entrada acá. Si falta,
// la página se genera igual pero con texto genérico (ver DEFAULT_ZONE_COPY).


const ZONE_COPY = {
  pampatar: {
    headline: 'Pampatar',
    summary:
      'Pampatar combina bahía tranquila, casco histórico y el mayor centro comercial de la isla. Es la zona más cómoda para quien quiere todo cerca sin renunciar al mar.',
    body: [
      'Pampatar es la capital del municipio Maneiro, en la costa este de la Isla de Margarita. Su bahía es de aguas calmas y poco oleaje, lo que la hace distinta de las playas del lado atlántico: acá se puede nadar tranquilo y los botes de pesca siguen saliendo desde la orilla como hace décadas.',
      'Es la zona con mejor equilibrio entre vida urbana y playa. El Castillo San Carlos de Borromeo, del siglo XVII, está frente al malecón, y a pocos minutos queda el Centro Comercial Sambil Margarita, el más grande de la isla. Eso convierte a Pampatar en la base preferida de quien viaja con familia: farmacias, supermercados, clínicas y restaurantes quedan a distancia corta.',
      'Las urbanizaciones residenciales de la zona suelen ofrecer seguridad 24/7, piscina y estacionamiento, algo poco común en alquileres frente a playas más remotas.',
    ],
    nearby: [
      'Castillo San Carlos de Borromeo',
      'Bahía y malecón de Pampatar',
      'C.C. Sambil Margarita',
      'Costa Azul y Porlamar a pocos minutos',
    ],
    bestFor: 'familias y estadías largas que quieren servicios cerca',
    coast: 'costa este, bahía de aguas calmas',
  },
  porlamar: {
    headline: 'Porlamar',
    summary:
      'Porlamar es el centro comercial y urbano de Margarita: compras, restaurantes y vida nocturna, con playa a pocos minutos.',
    body: [
      'Porlamar es la ciudad más grande de la Isla de Margarita y su corazón comercial. La Avenida Santiago Mariño y la 4 de Mayo concentran tiendas, restaurantes y bancos, herencia de la condición de puerto libre de la isla, que durante décadas la convirtió en destino de compras del Caribe.',
      'Alojarse en Porlamar significa no depender del carro para lo básico: se camina a comer, a comprar y a la playa. Playa El Morro y la costa de Bella Vista quedan dentro de la ciudad, y la zona hotelera de Costa Azul está pegada al este.',
      'Es la mejor opción para viajes cortos, viajes de trabajo o para quien prefiere movimiento urbano antes que aislamiento frente al mar. También es donde hay más oferta de alojamiento por metro cuadrado, así que suele tener las tarifas más competitivas de la isla.',
    ],
    nearby: [
      'Av. Santiago Mariño y 4 de Mayo (compras)',
      'Playa El Morro y Bella Vista',
      'Concha Marina y La Caranta',
      'Aeropuerto Santiago Mariño a ~20 minutos',
    ],
    bestFor: 'viajes cortos, compras y quien quiere todo a pie',
    coast: 'costa sur-este, urbana',
  },
  'costa-azul': {
    headline: 'Costa Azul',
    summary:
      'Costa Azul es la zona hotelera de Porlamar: playa urbana, torres frente al mar y servicios a pocos pasos.',
    body: [
      'Costa Azul es el sector hotelero por excelencia de la Isla de Margarita, en el extremo este de Porlamar. Es donde se concentran las torres residenciales y los hoteles frente al mar, con una playa urbana de arena clara y aguas por lo general tranquilas.',
      'La ventaja de Costa Azul es la combinación difícil de encontrar: se puede estar frente al mar y a la vez a cinco minutos en carro del Sambil y del centro de Porlamar. Para quien no quiere elegir entre playa y servicios, es la zona natural.',
      'Los alquileres acá tienden a ser apartamentos en edificios con piscina, ascensor y vigilancia, más que casas independientes.',
    ],
    nearby: [
      'Playa Costa Azul',
      'C.C. Sambil Margarita',
      'Centro de Porlamar',
      'Bahía de Pampatar',
    ],
    bestFor: 'quien quiere playa y ciudad a la vez',
    coast: 'costa sur-este, playa urbana',
  },
  'playa-el-yaque': {
    headline: 'Playa El Yaque',
    summary:
      'El Yaque es uno de los mejores destinos del mundo para kitesurf y windsurf: viento constante y agua tibia que no pasa de la cintura.',
    body: [
      'Playa El Yaque, en la costa sur de la isla junto al aeropuerto, es un nombre conocido en el circuito internacional de deportes de viento. La combinación es casi única: viento constante casi todo el año, agua tibia y un banco de arena que se extiende decenas de metros con profundidad hasta la cintura.',
      'Eso la vuelve el lugar ideal para aprender kitesurf o windsurf —se puede practicar de pie— y a la vez suficientemente exigente para riders avanzados. La temporada de más viento va de enero a agosto.',
      'El pueblo es pequeño y gira alrededor del deporte: escuelas, posadas, bares en la arena. Si buscas playa de postal para no hacer nada, no es esta; si buscas viento, es la mejor de Venezuela.',
    ],
    nearby: [
      'Escuelas de kitesurf y windsurf en la orilla',
      'Aeropuerto Internacional Santiago Mariño (~10 min)',
      'Playa Punta Arenas',
      'Porlamar a ~25 minutos',
    ],
    bestFor: 'kitesurf, windsurf y viajeros deportivos',
    coast: 'costa sur, viento constante y agua baja',
  },
  'juan-griego': {
    headline: 'Juan Griego',
    summary:
      'Juan Griego tiene fama de los mejores atardeceres de Margarita, vistos desde el Fortín La Galera sobre la bahía.',
    body: [
      'Juan Griego es un pueblo de pescadores en la costa noroeste de la isla, y su bahía mira al oeste: por eso los atardeceres son el motivo por el que la gente sube al Fortín La Galera cada tarde. Es una de las postales reconocibles de Margarita.',
      'El ritmo es de pueblo, no de ciudad. La bahía es de aguas calmas, los botes descargan pescado en la orilla y los restaurantes del malecón sirven mariscos sencillos y buenos. Es más económico y más tranquilo que Porlamar o Costa Azul.',
      'Buena base para explorar el norte de la isla: la Península de Macanao, Playa Caribe y Manzanillo quedan cerca.',
    ],
    nearby: [
      'Fortín La Galera (atardeceres)',
      'Malecón y restaurantes de mariscos',
      'Playa Caribe y Pedro González',
      'Manzanillo y el norte de la isla',
    ],
    bestFor: 'atardeceres, calma y presupuesto ajustado',
    coast: 'costa noroeste, bahía al oeste',
  },
  'playa-caribe': {
    headline: 'Playa Caribe',
    summary:
      'Playa Caribe es una de las playas más limpias del norte de Margarita: agua clara, poco desarrollo y mucho menos gente.',
    body: [
      'Playa Caribe está en la costa norte de la isla, entre Juan Griego y Pedro González. Es una playa de arena clara y agua transparente, con oleaje suave, y una de las que la gente local nombra cuando quiere alejarse del circuito turístico.',
      'El desarrollo es bajo: pocos toldos, algunos restaurantes de pescado frito a pie de arena y poco más. Eso es precisamente su atractivo, y también lo que hay que tener en cuenta: conviene tener carro, porque los servicios no están al lado.',
      'Los alojamientos de la zona tienden a ser villas y casas con piscina en vez de edificios, aprovechando el espacio y la vista.',
    ],
    nearby: [
      'Pedro González',
      'Juan Griego y el Fortín La Galera',
      'Playa Zaragoza',
      'Manzanillo',
    ],
    bestFor: 'quien busca playa tranquila y agua clara',
    coast: 'costa norte, oleaje suave',
  },
  'playa-parguito': {
    headline: 'Playa Parguito',
    summary:
      'Parguito es la playa de las olas: la referencia del surf en Margarita y la más animada de la costa atlántica.',
    body: [
      'Playa Parguito, en la costa este de la isla, es donde rompen las mejores olas de Margarita. Es la playa del surf por antonomasia y también una de las más animadas: toldos, música, comida en la arena y ambiente joven, sobre todo los fines de semana.',
      'Al ser costa atlántica, el oleaje es fuerte y el agua más fresca que en las bahías del sur. Hay que respetar las corrientes: es una playa para nadadores con experiencia o para quedarse en la orilla.',
      'Está en el eje de las playas del este —El Agua, El Cardón, Guacuco— así que sirve de base para recorrerlas todas.',
    ],
    nearby: [
      'Playa El Agua',
      'Playa El Cardón',
      'Playa Guacuco',
      'La Asunción, capital del estado',
    ],
    bestFor: 'surf, olas y ambiente de playa activo',
    coast: 'costa este atlántica, oleaje fuerte',
  },
  'playa-guacuco': {
    headline: 'Playa Guacuco',
    summary:
      'Guacuco es una playa larga y abierta del este de la isla, favorita de los margariteños y con mucho menos turismo.',
    body: [
      'Playa Guacuco, en el municipio Arismendi, es una playa extensa de arena dorada bordeada de cocoteros. Tiene oleaje moderado —más que las bahías del sur, menos que Parguito— y es una de las preferidas por la gente de la isla, lo que le da un ambiente más local que turístico.',
      'Su longitud permite caminar bastante sin cruzarse con nadie, algo raro en las playas más conocidas. Hay restaurantes y toldos en el acceso principal, pero el resto queda abierto.',
      'Está muy cerca de La Asunción, la capital del estado Nueva Esparta, con su casco histórico y el Castillo Santa Rosa: una buena combinación de playa y algo que ver que no sea playa.',
    ],
    nearby: [
      'La Asunción y el Castillo Santa Rosa',
      'Playa Parguito y Playa El Agua',
      'Campo de golf de Guacuco',
      'Pampatar a ~15 minutos',
    ],
    bestFor: 'playa amplia con ambiente local',
    coast: 'costa este, oleaje moderado',
  },
  manzanillo: {
    headline: 'Manzanillo',
    summary:
      'Manzanillo es un pueblo de pescadores en el extremo norte, de bahía protegida y aguas muy calmas.',
    body: [
      'Manzanillo está en la punta norte de la Isla de Margarita, y su bahía en forma de herradura es de las más protegidas de la isla: agua calma, casi sin oleaje, ideal para nadar y para niños.',
      'Sigue siendo un pueblo de pescadores: los botes de colores en la arena son parte del paisaje y el pescado se compra recién llegado. La zona tiene desarrollo residencial de bajo perfil, con casas y villas más que edificios.',
      'Es la elección de quien quiere desconexión real. La contrapartida es la distancia: Porlamar queda a unos 45 minutos, así que el carro es prácticamente indispensable.',
    ],
    nearby: [
      'Bahía de Manzanillo',
      'Playa Puerto Viejo y Puerto Cruz',
      'Playa Escondida',
      'Pedro González y Playa Caribe',
    ],
    bestFor: 'desconexión, aguas calmas y familias con niños',
    coast: 'costa norte, bahía protegida',
  },
};

const DEFAULT_ZONE_COPY = {
  summary:
    'Alojamientos disponibles en esta zona de la Isla de Margarita, con reserva directa.',
  body: [
    'Zona de la Isla de Margarita, en el estado Nueva Esparta, Venezuela. Consulta los alojamientos disponibles y escríbenos si necesitas orientación sobre cuál encaja mejor con tu viaje.',
  ],
  nearby: [],
  bestFor: 'estadías en la Isla de Margarita',
  coast: 'Isla de Margarita, Nueva Esparta',
};

export { ZONE_COPY };
