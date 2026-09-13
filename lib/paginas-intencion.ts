// Páginas por intención de búsqueda: lo que la gente escribe en Google antes
// de reservar. Cada una responde la pregunta con datos nuestros y termina en
// /reservas. Se sirven desde app/[tema]/page.tsx; URLs cortas y con palabras
// clave en la raíz del sitio. Sin inventar precios: lo que no sabemos cierto se
// dice como referencia o «a consultar» (IDENTIDAD.md).
export interface Seccion { titulo: string; parrafos: string[] }
export interface PaginaIntencion {
  slug: string; titulo: string; descripcion: string; h1: [string, string]; intro: string;
  secciones: Seccion[]; faq: { q: string; a: string }[]; mostrarApartamentos: boolean; hubs: string[];
}

export const PAGINAS: PaginaIntencion[] = [
  {
    slug: 'apartamentos-con-piscina-en-margarita',
    titulo: 'Apartamentos con piscina en Isla de Margarita para 6 personas',
    descripcion: 'Cuatro apartamentos en conjuntos cerrados con piscina en Pampatar —Los Geranios, La Caranta y Playa El Ángel—: US$60 la noche para hasta 6 personas, reserva directa por WhatsApp.',
    h1: ['Apartamentos con piscina', 'para toda la familia'],
    intro: 'En Margarita la piscina no es lujo: es lo que salva la tarde cuando el sol pega a las 2 y los niños ya no quieren arena. Nuestros cuatro apartamentos están en conjuntos cerrados con piscina, vigilancia y estacionamiento, a minutos del Sambil y de las playas del este.',
    secciones: [
      { titulo: 'Qué incluye cada apartamento', parrafos: ['Dos habitaciones, dos baños, cocina equipada, aire acondicionado, Wi-Fi y capacidad para 6 personas (Bahía Mágica admite hasta 9 con niños). Piscina del conjunto, y en Agua Mar piscina en la azotea con vista al mar. Sábanas, toallas y una guía de la isla con QR en la puerta.', 'Los cuatro tienen valoración 4.8–5.0 en Airbnb con reseñas reales; puedes reservar allá o directo con nosotros al mismo precio y sin comisión.'] },
      { titulo: 'Los Geranios, La Caranta o Playa El Ángel: cuál elegir', parrafos: ['Los cuatro están en Pampatar. Los Geranios A y el Depto de lujo, en la urbanización Los Geranios, si viajas con niños pequeños: cancha y parque infantil dentro del conjunto, Sambil a 5 minutos. Bahía Mágica, en La Caranta, si quieres el castillo, el malecón y la bahía calmada caminando. Agua Mar, en Playa El Ángel, si prefieres piscina en la azotea con vista al mar y Porlamar a 10 minutos.'] },
      { titulo: 'Cuánto cuesta y cómo se paga', parrafos: ['US$60 la noche en los cuatro, para hasta 6 personas. Se paga en dólares (Zelle, Binance/USDT, efectivo) o en bolívares por pago móvil a la tasa USDT del día. Confirmas con el 50 % y firmas el contrato de hospedaje desde tu teléfono; el saldo, al llegar.'] },
    ],
    faq: [
      { q: '¿La piscina es privada o compartida?', a: 'Es la del conjunto residencial, compartida con los vecinos y con horario (normalmente de 8 de la mañana a 6 de la tarde). En Agua Mar está en la azotea del edificio.' },
      { q: '¿Aceptan niños?', a: 'Sí. Los apartamentos son familiares: dos habitaciones, parque infantil en Los Geranios y piscina con área baja. Los menores deben estar siempre con un adulto en la piscina.' },
      { q: '¿Cuántas personas caben?', a: 'Hasta 6 en Los Geranios A, Agua Mar y el Depto de lujo; Bahía Mágica hasta 9 contando niños. Todas las personas se declaran en la reserva y presentan cédula o pasaporte al llegar.' },
    ],
    mostrarApartamentos: true, hubs: ['playas', 'donde-comer'],
  },
  {
    slug: 'alquiler-por-mes-en-margarita',
    titulo: 'Alquiler de apartamento por mes en Isla de Margarita',
    descripcion: 'Estadías largas en Pampatar (Los Geranios, La Caranta y Playa El Ángel): apartamentos amoblados con piscina, internet y contrato, para nómadas, familias que vuelven y trabajo remoto. Precio mensual a consultar.',
    h1: ['Quedarte un mes', 'en la isla'],
    intro: 'Cada vez más gente viene a Margarita por semanas: venezolanos de afuera que visitan a la familia en diciembre, parejas que trabajan remoto frente al mar, personas que vienen a resolver papeles o una venta. Para eso hace falta más que una habitación: cocina de verdad, internet que aguante videollamadas, lavandería cerca y alguien que responda cuando se va el agua.',
    secciones: [
      { titulo: 'Qué cambia en una estadía larga', parrafos: ['Precio: la tarifa por noche es US$60; para 28 noches o más hacemos un precio mensual cerrado, a consultar según fechas y apartamento (no lo publicamos porque depende de la temporada y preferimos decirte un número real que uno de folleto). Incluye agua, luz e internet; la limpieza semanal se acuerda aparte.', 'Contrato: el mismo contrato de hospedaje con firma electrónica, con la cláusula de duración adaptada. No es arrendamiento de vivienda ni genera derecho de permanencia: es hospedaje temporal, con fecha de salida.', 'Servicios: te dejamos conectados con nuestros aliados —agua en botellón a domicilio, lavandería con delivery, alquiler de carro por semanas, farmacia— y la guía con los supermercados y los sitios donde comer barato entre semana.'] },
      { titulo: 'Internet y trabajo remoto', parrafos: ['Los apartamentos tienen Wi-Fi de fibra; te decimos la velocidad real del que elijas antes de reservar. Los cortes de luz existen en la isla: te contamos cómo son en cada zona y qué hacer (Porlamar y Pampatar suelen tener mejor servicio que el norte). Para datos móviles, Digitel es la operadora con mejor cobertura; con el pasaporte compras una línea en el Sambil.'] },
      { titulo: 'Zonas para vivir un mes', parrafos: ['Nuestros cuatro apartamentos están en Pampatar, la zona más cómoda para el día a día (Sambil, clínicas, farmacias, bahía calmada). Los Geranios para familias, La Caranta para vivir frente al castillo y el malecón, Playa El Ángel a mitad de camino de Porlamar. Todos a menos de 25 minutos del aeropuerto.'] },
    ],
    faq: [
      { q: '¿Cuánto cuesta un apartamento por mes en Margarita?', a: 'Nuestra tarifa base es US$60 la noche; para un mes hacemos un precio cerrado según temporada y apartamento, siempre menor que 30 noches sueltas. Escríbenos con las fechas y te respondemos con el número exacto en el día.' },
      { q: '¿Puedo pagar en bolívares mes a mes?', a: 'Sí, por pago móvil a la tasa USDT del día de cada pago, o en dólares por Zelle o Binance. El contrato deja por escrito la forma y las fechas de pago.' },
      { q: '¿Se puede recibir correspondencia o trabajar desde el apartamento?', a: 'Sí a ambas. Cada apartamento tiene mesa de trabajo y Wi-Fi; la correspondencia llega a la conserjería del conjunto.' },
    ],
    mostrarApartamentos: true, hubs: ['servicios', 'donde-comer'],
  },
  {
    slug: 'cuanto-cuesta-viajar-a-margarita',
    titulo: 'Cuánto cuesta viajar a Isla de Margarita: presupuesto real por 5 noches',
    descripcion: 'Alojamiento, traslado, comida, playas y salidas: cuánto gastan de verdad dos personas o una familia en cinco noches en Margarita, en dólares y bolívares a tasa USDT.',
    h1: ['¿Cuánto cuesta', 'ir a Margarita?'],
    intro: 'La pregunta que más nos hacen por WhatsApp. Aquí va la respuesta con nuestros precios reales y referencias de la isla a septiembre de 2026; lo que varía con la temporada lo decimos como rango. Todo en dólares, que es como se cotiza en la isla; en bolívares se paga a la tasa USDT del día.',
    secciones: [
      { titulo: 'Alojamiento: lo único que sabemos exacto', parrafos: ['Apartamento nuestro con piscina para hasta 6 personas: US$60 la noche → US$300 por 5 noches, sin comisión de plataforma. Dividido entre 4 personas son US$15 por persona y noche, menos que una habitación de hotel. En Airbnb el mismo apartamento cuesta lo mismo más la comisión de la plataforma.'] },
      { titulo: 'Llegar y moverse', parrafos: ['Traslado aeropuerto–apartamento: precio cerrado por WhatsApp con nosotros; un taxi de la parada del aeropuerto a Pampatar suele pedir US$15–20. Carrito por puesto dentro de la isla: menos de un dólar en bolívares por tramo. Ridery (carros por app) en Porlamar–Pampatar: US$3–6 por viaje. Alquiler de carro por día: desde unos US$35–50 según modelo, útil solo si vas a recorrer el norte y Macanao.'] },
      { titulo: 'Comer', parrafos: ['Desayuno margariteño de empanadas de cazón y jugo: US$3–5 por persona. Almuerzo de pescado frito en la playa con acompañantes: US$10–15. Cena en restaurante de Porlamar o Costa Azul: US$12–25 por persona. Pizza o comida árabe a domicilio para 4: US$25–35. Mercado en Sigo o Río para cocinar en el apartamento: una compra de US$60–80 rinde varios días para 4 personas. El agua en botellón de 19 litros a domicilio: US$2–3.'] },
      { titulo: 'Playas y salidas', parrafos: ['Las playas son gratis; toldo y dos sillas se alquilan por US$5–10 el día. Castillos y museos: entrada económica en bolívares. Lancha a Coche o Cubagua: excursión por persona a consultar con el operador (en la guía están sus teléfonos). Clase de kite en El Yaque: por horas, la más cara de las actividades. Senderismo guiado al Matasiete: por persona, según ruta.'] },
      { titulo: 'El total, para que planifiques', parrafos: ['Pareja, 5 noches, sin carro, comiendo mitad afuera y mitad en el apartamento: alojamiento US$300 + traslados US$40 + comida US$180–250 + playas y salidas US$60–100 ≈ US$600–700 sin vuelos. Familia de 4 en el mismo plan: alojamiento igual (US$300), comida US$350–450, traslados y salidas US$120–180 ≈ US$800–950. Lo que más cambia el total es el vuelo o el ferry, no la isla.'] },
    ],
    faq: [
      { q: '¿Es más barato pagar en bolívares o en dólares?', a: 'Da igual si la tasa es la USDT del día, que es la que usamos nosotros y la mayoría de los comercios. Cuidado con quien cobra a tasa BCV en bolívares y luego «redondea»: pregunta siempre la tasa antes de pagar.' },
      { q: '¿Cuánto efectivo debo llevar?', a: 'Poco. Casi todo se paga con pago móvil (necesitas cuenta venezolana) o con dólares en efectivo en billetes pequeños. Trae US$100–200 en billetes de 1, 5, 10 y 20 para taxis, playa y propinas; el resto por Zelle o Binance.' },
      { q: '¿Cuándo es más barato viajar?', a: 'Mayo–julio y septiembre–noviembre: vuelos más baratos, isla tranquila y disponibilidad. Carnaval, Semana Santa, agosto y del 20 de diciembre al 6 de enero es temporada alta: reserva con un mes de anticipación.' },
    ],
    mostrarApartamentos: true, hubs: ['playas', 'donde-comer', 'servicios'],
  },
];
export const paginaDe = (slug: string) => PAGINAS.find((p) => p.slug === slug);
