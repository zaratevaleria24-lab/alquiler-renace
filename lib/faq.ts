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
    a: 'Consulta la tarifa base publicada en cada apartamento. Antes de confirmar, acordamos por WhatsApp la disponibilidad, el total de tu estadía y la forma de pago.',
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
    q: '¿Cómo se reserva un apartamento en Margarita Renace?',
    a: 'Elige apartamento, fechas y número de huéspedes. El botón de WhatsApp abre un mensaje con tu consulta y el estimado de la estadía. Te confirmamos disponibilidad, precio final y forma de pago antes de reservar. Si el calendario no tiene información actualizada, las fechas quedan pendientes de confirmación.',
  },
  {
    q: '¿Margarita Renace también alquila autos?',
    a: 'Puedes consultar por WhatsApp las opciones de carro y traslado para tu viaje. Te confirmamos el vehículo, la tarifa y las condiciones antes de acordar el servicio.',
  },
  {
    q: '¿Ofrecen traslado desde el aeropuerto de Margarita?',
    a: 'Sí. Te recogemos en el aeropuerto Santiago Mariño o en el terminal del ferry de Punta de Piedras y te llevamos a tu alojamiento, con hora y precio acordados por WhatsApp antes de viajar. El aeropuerto queda al sur de la isla: son 15-20 minutos a Porlamar, 20-25 a Costa Azul, 25-30 a Pampatar y 40-50 a Juan Griego. También hacemos traslados entre zonas y a las playas del norte.',
  },
];

/** Respuestas verificables sobre comprar en la isla. Se citan en buscadores e IA. */
export const FAQ_VENTA: FaqItem[] = [
  {
    q: '¿En qué moneda se compran los inmuebles en la Isla de Margarita?',
    a: 'El precio se pacta en dólares estadounidenses, que es la referencia del mercado inmobiliario venezolano. El pago puede hacerse en dólares, en USDT o en bolívares a la tasa de mercado del día; el documento de compraventa se protocoliza en bolívares al cambio oficial vigente. En cada inmueble mostramos las cuatro cifras con la tasa del día.',
  },
  {
    q: '¿Puede comprar un extranjero o un venezolano que vive afuera?',
    a: 'Sí. En Venezuela no hay restricción para que un extranjero o un venezolano residente en el exterior compre un inmueble. Hace falta pasaporte o cédula vigente, RIF (se tramita en el SENIAT, también desde afuera con un representante) y, si no puede viajar a firmar, un poder notariado y apostillado a favor de alguien de confianza.',
  },
  {
    q: '¿Qué documentos debe tener un inmueble antes de comprarlo?',
    a: 'Documento de propiedad registrado, cédula catastral vigente, solvencia municipal, ficha del Registro Inmobiliario que confirme que no tiene hipotecas ni prohibiciones de enajenar, y las solvencias de servicios (agua, luz, condominio). Antes de mostrar un inmueble revisamos que estos papeles existan; es lo primero que le pedimos al propietario.',
  },
  {
    q: '¿Cuánto cuesta un apartamento en la Isla de Margarita?',
    a: 'Depende de la zona, el estado y si es frente al mar. En 2026 los apartamentos de dos habitaciones en Porlamar y Costa Azul se anuncian mayormente entre US$ 35.000 y US$ 90.000; en conjuntos frente al mar de Pampatar y Costa Azul, entre US$ 90.000 y US$ 200.000; y las casas en urbanizaciones cerradas de Maneiro y Mariño, desde unos US$ 45.000. Son rangos de anuncios publicados, no tasaciones.',
  },
];

/** Una misma respuesta en el texto visible y en JSON-LD, derivada del catálogo. */
export function homeFaq(properties: { isReal: boolean; priceOnRequest: boolean; pricePerNight: number }[]): FaqItem[] {
  const precios = properties.filter((p) => p.isReal && !p.priceOnRequest && p.pricePerNight > 0).map((p) => p.pricePerNight);
  return HOME_FAQ.map((f) => f.q === '¿Cuánto cuesta alquilar un apartamento en la Isla de Margarita?' && precios.length
    ? { ...f, a: `La tarifa base de nuestros apartamentos publicados parte de US$${Math.min(...precios).toLocaleString('es-VE')} por noche. El total depende de las noches y las condiciones de la estadía. Te confirmamos disponibilidad y precio final por WhatsApp antes de reservar; puedes consultar el estimado en la calculadora.` }
    : f);
}
