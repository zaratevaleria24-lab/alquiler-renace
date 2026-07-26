// Preguntas frecuentes.
//
// Doble propósito:
//  1. SEO clásico: FAQPage schema + contenido que ataca búsquedas de cola larga
//     ("cuál es la mejor zona para alojarse en Margarita", "se puede pagar en
//     dólares en Margarita").
//  2. GEO (aparecer en respuestas de ChatGPT, Perplexity, Google AI Overviews):
//     los motores generativos citan texto que responde una pregunta de forma
//     directa, autocontenida y verificable. Una respuesta que empieza con la
//     conclusión y no depende del contexto de la página tiene muchas más
//     probabilidades de ser extraída que un párrafo de marketing.
//
// Por eso cada respuesta acá: arranca afirmando, da datos concretos (nombres de
// zonas, meses, condiciones reales de la isla) y evita superlativos vacíos.
// NO promete nada operativo que el negocio no pueda cumplir todavía.

export interface FaqItem {
  q: string;
  a: string;
}

export const HOME_FAQ: FaqItem[] = [
  {
    q: '¿Cuál es la mejor zona para alojarse en la Isla de Margarita?',
    a: 'Depende del viaje. Pampatar y Costa Azul son las más cómodas porque tienen playa y servicios cerca (supermercados, clínicas, el C.C. Sambil), ideales para familias y estadías largas. Porlamar conviene para viajes cortos y compras, ya que casi todo queda a pie. Playa El Yaque es el destino de kitesurf y windsurf por su viento constante. Juan Griego y Manzanillo son las opciones tranquilas, con atardeceres y bahías de agua calma. Playa Parguito es la de olas y ambiente activo.',
  },
  {
    q: '¿En qué moneda se paga el alquiler en Margarita?',
    a: 'Los precios de los alojamientos se manejan en dólares estadounidenses (US$), que es la referencia habitual para alquileres turísticos en la Isla de Margarita. Conviene confirmar con el anfitrión las formas de pago aceptadas antes de viajar.',
  },
  {
    q: '¿Cuál es la mejor época para viajar a la Isla de Margarita?',
    a: 'La isla tiene clima cálido todo el año, con temperaturas que rondan los 27-31 °C y poca variación entre estaciones. La temporada alta coincide con las vacaciones escolares y feriados: Navidad y Año Nuevo, Carnaval, Semana Santa y julio-agosto, cuando hay más gente y las tarifas suben. Los meses de temporada baja ofrecen mejores precios y playas más vacías. Para deportes de viento en El Yaque, la mejor ventana va de enero a agosto.',
  },
  {
    q: '¿Hace falta alquilar un carro en la Isla de Margarita?',
    a: 'Depende de la zona. Si te alojas en Porlamar, Costa Azul o Pampatar puedes resolver casi todo caminando o con trayectos cortos. Si eliges zonas del norte como Manzanillo, Playa Caribe o Juan Griego, o playas del este como Guacuco y Parguito, el carro es prácticamente indispensable porque los servicios y las distancias se alejan.',
  },
  {
    q: '¿Cuánto cuesta alquilar un apartamento en la Isla de Margarita?',
    a: 'Varía según zona, temporada y capacidad. En el catálogo de Margarita Renace hay opciones desde cerca de US$32 por noche en zonas céntricas hasta villas frente al mar por encima de US$150 por noche. Las zonas urbanas como Porlamar tienden a ser las más económicas; las propiedades frente al mar y con piscina privada, las más altas.',
  },
  {
    q: '¿Qué playas de Margarita conviene visitar?',
    a: 'Las más reconocidas son Playa El Agua, la más famosa y turística; Playa Parguito, la referencia del surf; Playa Guacuco, extensa y con ambiente local; Playa Caribe y Manzanillo en el norte, de aguas claras y calmas; y Playa El Yaque en el sur, destino mundial de kitesurf. La bahía de Pampatar es la opción de agua tranquila más cercana a los servicios.',
  },
  {
    q: '¿Dónde queda la Isla de Margarita?',
    a: 'La Isla de Margarita es la principal del estado Nueva Esparta, en el Caribe venezolano, frente a la costa nororiental de Venezuela. Su ciudad más grande es Porlamar y su capital administrativa es La Asunción. Se llega por vía aérea al Aeropuerto Internacional Santiago Mariño o por ferry desde Puerto La Cruz y Cumaná.',
  },
  {
    q: '¿Margarita Renace también alquila autos?',
    a: 'Sí, el proyecto cubre alquiler de apartamentos y de autos en la Isla de Margarita. El catálogo de vehículos se está incorporando al sitio; para consultar disponibilidad de autos conviene escribir directamente.',
  },
];
