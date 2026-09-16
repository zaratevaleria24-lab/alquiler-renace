// Contenido editorial estable: tarifas y capacidad se muestran desde las fichas
// vivas que acompaña cada página. No duplicar aquí precios ni inventario.
export interface Seccion { titulo: string; parrafos: string[] }
export interface PaginaIntencion {
  slug: string; titulo: string; descripcion: string; h1: [string, string]; intro: string;
  secciones: Seccion[]; faq: { q: string; a: string }[]; mostrarApartamentos: boolean; hubs: string[];
}
export const PAGINAS: PaginaIntencion[] = [
  {
    slug: 'apartamentos-con-piscina-en-margarita',
    titulo: 'Apartamentos con piscina en Pampatar, Isla de Margarita',
    descripcion: 'Compara nuestros apartamentos con piscina en Pampatar: Los Geranios, La Caranta y Playa El Ángel. Fotos, capacidad y tarifa por noche; reserva directa por WhatsApp.',
    h1: ['Apartamentos con piscina', 'para compartir en familia'],
    intro: 'Una cocina para desayunar sin apuro, espacio para descansar y la piscina del conjunto al volver de la playa. Nuestros apartamentos están en Pampatar, Isla de Margarita. Aquí puedes comparar las opciones y consultar las fechas de tu viaje.',
    secciones: [
      { titulo: 'Elige el sector que te conviene', parrafos: ['Los Geranios A y Los Geranios Lujo están en la urbanización Los Geranios. Bahía Mágica está en La Caranta y Agua Mar en Playa El Ángel. Los cuatro están en Pampatar: revisa la ubicación de cada ficha para elegir según tus planes, la playa que quieres visitar y cómo vas a moverte.', 'Viajar en familia también es resolver lo cotidiano. En nuestra guía encuentras supermercados, farmacias, comida a domicilio y servicios de la isla. Puedes consultar el mapa para ubicar lo que necesitas antes de salir.'] },
      { titulo: 'Qué revisar antes de reservar', parrafos: ['Compara las fotos, la distribución y la capacidad publicada de cada apartamento. Cuéntanos cuántos adultos y niños viajan para confirmar que el espacio se ajusta al grupo. La piscina pertenece al conjunto residencial: pregunta por sus horarios y normas para las fechas de tu estadía.', 'Si necesitas estacionamiento, acceso sin escaleras, una cama específica o alguna facilidad para un niño pequeño, consúltalo antes de confirmar. Te respondemos sobre el apartamento que elegiste, sin dar por hecho que todos ofrecen lo mismo.'] },
      { titulo: 'Tarifa clara y reserva directa', parrafos: ['Cada ficha muestra su tarifa base por noche. En la calculadora puedes elegir apartamento y fechas para obtener un estimado en dólares, bolívares al BCV y el equivalente en USDT cuando las tasas están disponibles.', 'La consulta llega por WhatsApp con los datos del viaje. Confirmamos disponibilidad, precio final y forma de pago antes de reservar. Un día sin bloqueos en un calendario no sustituye esa confirmación.'] },
    ],
    faq: [
      { q: '¿La piscina es privada?', a: 'Es la piscina del conjunto residencial, compartida con los vecinos. Confirma con nosotros las condiciones de uso y los horarios antes de reservar.' },
      { q: '¿Pueden alojarse familias con niños?', a: 'Sí. Indica cuántos adultos y niños viajan y revisa la capacidad de la ficha. Los niños deben estar acompañados por un adulto en la piscina y las áreas comunes.' },
      { q: '¿Cómo comparo los apartamentos?', a: 'Abre las fichas de abajo para revisar fotos, ubicación, capacidad y tarifa. Si dudas entre dos, cuéntanos tus planes por WhatsApp y te ayudamos a elegir.' },
    ],
    mostrarApartamentos: true, hubs: ['playas', 'donde-comer'],
  },
  {
    slug: 'alquiler-por-mes-en-margarita',
    titulo: 'Alquiler de apartamento por mes en Pampatar, Isla de Margarita',
    descripcion: '¿Vienes por semanas o por un mes a Margarita? Consulta apartamentos en Pampatar, condiciones de estadía larga y una cotización para tus fechas.',
    h1: ['Quedarte un mes', 'en Isla de Margarita'],
    intro: 'Visitar a la familia, trabajar durante el viaje o pasar unas semanas en la isla requiere algo más que elegir una playa. Te ayudamos a comparar apartamentos en Pampatar y a consultar una estadía larga con las condiciones claras desde el principio.',
    secciones: [
      { titulo: 'Pide una cotización para tus fechas', parrafos: ['La tarifa por noche de cada ficha sirve como referencia inicial. Para una estadía por semanas o por mes, escríbenos con llegada, salida y número de huéspedes. Confirmamos el apartamento y la cotización completa para ese período; no prometemos una tarifa mensual sin revisar las fechas.', 'Antes de reservar, dejamos claros los pagos, el uso del apartamento y qué servicios están incluidos. Consulta también la limpieza durante la estadía y cualquier necesidad especial.'] },
      { titulo: 'Si vienes a trabajar, revisemos lo que necesitas', parrafos: ['Cuéntanos si haces videollamadas, necesitas una mesa de trabajo o dependes de una conexión estable. Te confirmamos las condiciones del apartamento que elijas y la información disponible sobre su internet.', 'En Margarita pueden presentarse interrupciones de agua o electricidad. Pregunta por el abastecimiento y las alternativas del conjunto antes de confirmar. Es mejor planificar con información del alojamiento que asumir que todos tienen el mismo respaldo.'] },
      { titulo: 'Resolver el día a día en Pampatar', parrafos: ['Nuestros apartamentos están en Los Geranios, La Caranta y Playa El Ángel. Elige el sector según dónde vas a pasar más tiempo y si contarás con carro. La cercanía a un lugar no significa necesariamente que el trayecto sea cómodo a pie.', 'La guía reúne opciones de supermercado, lavandería, agua a domicilio, salud y comida. Te sirve tanto para preparar la llegada como para encontrar un servicio durante la estadía. Confirma horarios y disponibilidad con cada negocio.'] },
    ],
    faq: [
      { q: '¿Cuánto cuesta alquilar un apartamento por mes?', a: 'La cotización depende del apartamento y de las fechas. Envíanos llegada, salida y número de huéspedes por WhatsApp para confirmar el precio y las condiciones del período completo.' },
      { q: '¿Puedo pagar en bolívares?', a: 'Sí, puedes consultar pago móvil en bolívares al BCV del día del pago. También coordinamos Zelle, efectivo en dólares o USDT al equivalente acordado. La forma y las fechas de pago se confirman antes de reservar.' },
      { q: '¿Cómo sé si sirve para trabajo remoto?', a: 'Indícanos qué conexión y espacio necesitas. Revisamos contigo la información del apartamento antes de confirmar; no garantizamos continuidad de servicios que dependen de proveedores externos.' },
    ],
    mostrarApartamentos: true, hubs: ['servicios', 'donde-comer'],
  },
  {
    slug: 'cuanto-cuesta-viajar-a-margarita',
    titulo: 'Cuánto cuesta viajar a Isla de Margarita: calcula tu presupuesto',
    descripcion: 'Organiza tu presupuesto para Margarita: alojamiento, llegada, comida y paseos. Calcula tu estadía en Pampatar y consulta las tarifas que dependen de tus fechas.',
    h1: ['¿Cuánto cuesta', 'viajar a Margarita?'],
    intro: 'El presupuesto cambia con las fechas, el número de personas y la forma de llegar. Empieza por el alojamiento y suma los gastos del viaje por separado. Así puedes comparar opciones con el total a la vista y sin confundir una tarifa por noche con el costo de todas las vacaciones.',
    secciones: [
      { titulo: '1. Calcula el alojamiento por toda la estadía', parrafos: ['Multiplica la tarifa por noche del apartamento por las noches que necesitas. Si el grupo comparte el apartamento, divide ese subtotal entre los huéspedes para comparar el costo por persona. Respeta siempre la capacidad publicada.', 'La calculadora de reservas hace la cuenta con las tarifas vigentes del catálogo y muestra el equivalente en bolívares y USDT cuando tenemos tasas disponibles. Es un estimado: confirmamos disponibilidad y condiciones por WhatsApp antes de reservar.'] },
      { titulo: '2. Cotiza cómo llegar y cómo moverte', parrafos: ['Pide el precio del vuelo o ferry para tus fechas e incluye equipaje, traslado al alojamiento y regreso. Si viajas con carro en ferry, confirma el costo y los requisitos con el operador. Los horarios y tarifas pueden cambiar.', 'Para un traslado, indica terminal, hora de llegada, personas y equipaje. Si vas a recorrer varias zonas de la isla, compara una cotización de carro con los trayectos que harías en taxi. No hace falta asumir el mismo gasto de transporte para todos los viajes.'] },
      { titulo: '3. Organiza comidas y compras', parrafos: ['Decide cuántas comidas prepararás en el apartamento y cuántas harás fuera. Cuenta también agua para beber, desayunos y cualquier compra para niños. Cocinar parte de las comidas permite ajustar el presupuesto a tu grupo.', 'En la guía puedes buscar supermercados, restaurantes y comida a domicilio. Consulta el menú y la tarifa actual con cada negocio: un precio encontrado en una publicación antigua puede no ser el que esté vigente al viajar.'] },
      { titulo: '4. Reserva una parte para playas y paseos', parrafos: ['Además del traslado, pregunta por toldos, sillas, estacionamiento y actividades si piensas usarlos. Para una excursión, confirma qué incluye: transporte, comida, equipos y condiciones de cancelación.', 'Deja un margen para cambios de planes y gastos pequeños. Antes de pagar en cualquier negocio, confirma la moneda, la tasa aplicada y el total. En Margarita Renace te explicamos esas condiciones antes de confirmar la reserva.'] },
    ],
    faq: [
      { q: '¿La calculadora incluye vuelos y comidas?', a: 'No. Calcula el alojamiento seleccionado y el descuento de un cupón válido si lo aplicas. Cotiza transporte, comidas y paseos por separado para armar el presupuesto completo.' },
      { q: '¿Conviene pagar en dólares o bolívares?', a: 'Revisa el total y la tasa antes de decidir. Nuestra referencia es el dólar BCV; la calculadora muestra bolívares y el equivalente en USDT cuando las tasas están disponibles. Los importes se ajustan el día del pago.' },
      { q: '¿Cuándo conviene pedir disponibilidad?', a: 'Cuando tengas una idea de tus fechas y del grupo. Para vacaciones y feriados, consulta con anticipación. Confirmamos disponibilidad real y condiciones antes de pedirte que reserves.' },
    ],
    mostrarApartamentos: true, hubs: ['playas', 'donde-comer', 'servicios'],
  },
];
export const paginaDe = (slug: string) => PAGINAS.find((p) => p.slug === slug);
