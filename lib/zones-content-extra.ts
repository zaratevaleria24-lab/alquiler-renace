// Ampliación editorial de las landings de zona (2026-09-13): Google marcó
// /alquiler/playa-guacuco como «rastreada, sin indexar» por contenido corto y
// parecido entre zonas. Cada zona suma párrafos con datos propios —distancias,
// qué hay cerca según la guía, cuándo ir, cuánto cuesta— para llegar a 400–600
// palabras únicas. Voz de IDENTIDAD.md: tú, datos, sin adjetivos vacíos.
export const ZONE_EXTRA: Record<string, string[]> = {
  pampatar: [
    'Distancias reales desde Pampatar: el aeropuerto Santiago Mariño queda a 25 minutos en carro (unos US$15–20 en taxi, o con nuestro traslado a precio cerrado); Playa El Agua a 30 minutos; El Yaque a 30; Porlamar a 10. La bahía tiene tres playas urbanas —Pampatar frente al castillo, Playa Moreno y Playa El Ángel— para un baño rápido sin manejar.',
    'Para resolver el día a día: Sigo y Río (supermercados) están a menos de 10 minutos; Farmatodo abre hasta tarde; el agua en botellón la traen Caribest Water y Recargas La Perla, nuestros aliados; y para comer, en la propia bahía hay pescado fresco en los restaurantes del malecón y, a domicilio, empanadas de Ketchup Hot y El Rey de las Empanadas. Todo eso está en nuestra guía con teléfono y horario de hoy.',
    'Nuestros cuatro apartamentos están en Pampatar: Los Geranios A y Los Geranios · Depto de lujo en la urbanización Los Geranios (conjunto cerrado con vigilancia, piscina, cancha y parque infantil, a 5 minutos del Sambil); Bahía Mágica en La Caranta, el sector del castillo y el malecón; y Agua Mar en Playa El Ángel, entre Pampatar y Porlamar, frente a la playa y con piscina. Cuestan US$65 la noche para hasta 6 personas, en dólares a tasa BCV, en bolívares al BCV del día o en USDT al equivalente, con contrato de hospedaje firmado desde el teléfono.',
    'Cuándo venir: la temporada alta es Carnaval, Semana Santa, agosto y del 20 de diciembre al 6 de enero; en esas fechas conviene reservar con un mes de anticipación. De mayo a julio y de septiembre a noviembre la isla está tranquila, el mar en calma y los precios de vuelos bajan. Pampatar tiene menos viento que El Yaque y menos ruido que Porlamar, por eso es la zona que recomendamos a familias con niños pequeños.',
  ],
  porlamar: [
    'Porlamar está a 15 minutos del aeropuerto y es el nudo de transporte de la isla: de aquí salen los carritos por puesto hacia todas las playas y aquí operan Ridery y las líneas de taxi. Si vienes sin carro, es la zona que menos te obliga a alquilar uno. La avenida 4 de Mayo, la Santiago Mariño y el bulevar Gómez concentran el comercio; el Centro Comercial La Vela y Rattan Plaza están en la salida hacia Pampatar.',
    'Comer en Porlamar es fácil y barato: el desayuno margariteño de empanadas de cazón en El Empanadazo (Playa La Caracola, desde las 7), Rosita Cocina en la calle Marcano, Francelina Food y El Remo entre los más reseñados de la ciudad, y de noche los clubes 1900, GOA y El Patio. La comunidad árabe de la isla dejó una cocina propia: Zaituzaatar lleva shawarma y kibbe a domicilio.',
    'No tenemos apartamento dentro del casco de Porlamar: el más cercano es Agua Mar, en Playa El Ángel (Pampatar), a 10 minutos en carro del centro: apartamento frente a la playa con piscina, US$65 la noche para hasta 6 personas, valoración 4.8 en Airbnb.',
    'Un dato práctico: Porlamar es donde más se paga en bolívares por pago móvil y donde más cajeros hay; para cambiar dólares en efectivo está Italcambio en el Sambil (a 15 minutos). Playa El Morro y la costa de Bella Vista son para caminar al atardecer más que para bañarse; para nadar, Pampatar o Costa Azul quedan a 10 minutos.',
  ],
  'costa-azul': [
    'Costa Azul es la zona hotelera moderna de la isla, entre Porlamar y Pampatar: avenida Bolívar, edificios altos frente al mar, el Sambil a 5 minutos y Playa Moreno y Playa El Ángel a distancia de caminar. Es donde más restaurantes nuevos abren y donde está la Central Taxi Costa Azul, útil de noche.',
    'Nuestro apartamento más cercano a Costa Azul es Bahía Mágica, en La Caranta (Pampatar), a 5 minutos: conjunto cerrado con piscina y áreas verdes, US$65 la noche para hasta 6 personas, valoración 5.0 en Airbnb. Desde ahí, el Castillo de Pampatar queda a 5 minutos, el aeropuerto a 25 y Playa El Agua a 35.',
    'Para quien viene a hacer compras o a comer bien, Costa Azul es el punto medio perfecto: Guuao Marketplace para licores y una copa de noche (cierra a las 12), Sigo Costa Azul para el mercado grande al llegar, farmacias abiertas hasta tarde y decenas de restaurantes en la avenida. El agua a domicilio la resuelven Caribest Water y Agua Light, ambos con reparto en la zona.',
    'La playa de Costa Azul es urbana y de oleaje suave, buena para caminar y para un baño rápido; para pasar el día en playa grande conviene ir a El Agua o Parguito (35 minutos) o a El Yaque (30). Si viajas con adolescentes, es la zona con más movimiento nocturno seguro de la isla.',
  ],
  'playa-el-yaque': [
    'El Yaque está a 5 minutos del aeropuerto, en la costa sur, y su fama es mundial por una razón física: viento constante del este de 15 a 30 nudos casi todas las tardes, agua plana y poca profundidad durante cientos de metros. Por eso concentra escuelas de kitesurf y windsurf, alquiler de equipos y una comunidad de viajeros europeos que pasa aquí el invierno.',
    'El pueblo es pequeño y se recorre a pie: hoteles frente a la playa, bares con música al atardecer y restaurantes con pescado y pasta. Desde el embarcadero salen lanchas a la isla de Coche (20–30 minutos), otra meca del kite con menos gente, y excursiones a Cubagua.',
    'No tenemos apartamentos propios en El Yaque; nuestros huéspedes que vienen por el kite se alojan en Pampatar (30 minutos) y van a la playa con carro alquilado o traslado. Si tu viaje es 100 % deportivo, te conviene dormir en El Yaque; si combinas playa con familia y compras, Pampatar. Te lo decimos con honestidad porque preferimos que vuelvas.',
    'Consejo de la guía: el viento arranca hacia el mediodía; para bañarte tranquilo ve en la mañana, para ver kites de 1 a 5. Hay estacionamiento en la avenida principal y los toldos se alquilan por día.',
  ],
  'juan-griego': [
    'Juan Griego, en la costa noroeste, es la ciudad del atardecer: el sol se hunde en la bahía frente al Fortín de La Galera, y los restaurantes del malecón sirven pescado con esa vista. Está a 40 minutos de Pampatar y a 45 del aeropuerto por la carretera que cruza la isla por La Asunción.',
    'Es una zona de precios más bajos y ritmo de pueblo: mercado local, panaderías, y las playas del norte a minutos —Playa Caribe (10 minutos), Playa Zaragoza y Pedro González (15)—. La Laguna de La Restinga y la península de Macanao quedan hacia el oeste, a 30 minutos.',
    'Hoy no tenemos apartamentos propios en Juan Griego; si es tu zona, te ayudamos a encontrar alojamiento con anfitriones que conocemos y te llevamos desde el aeropuerto. Nuestra guía tiene el fortín, las playas del norte y los sitios donde comer en la bahía, con horario y cómo llegar.',
  ],
  'playa-caribe': [
    'Playa Caribe está en la costa norte, entre Juan Griego y Manzanillo: arena clara, agua transparente y oleaje moderado, con pocos toldos y mucho espacio. Es de las playas más limpias y menos ruidosas de la isla, y la elegimos para el «día de playa tranquila» de nuestros huéspedes. Desde Pampatar son 45 minutos en carro.',
    'Hay pocos servicios: dos o tres kioscos de pescado frito y cerveza, estacionamiento a la sombra de los árboles y nada más. Lleva agua, sombrilla y efectivo. Al lado quedan Playa Zaragoza, con su pueblo de pescadores de casas coloniales, y Pedro González; en 15 minutos estás en el atardecer de Juan Griego.',
    'No hay oferta de apartamentos nuestros aquí; es zona de excursión de día desde Pampatar, Pampatar, donde sí tenemos hospedaje a US$65 la noche. Con carro alquilado (DG Automóviles entrega en el apartamento) o con nuestro traslado por día se hace cómodo.',
  ],
  'playa-parguito': [
    'Parguito es la playa del surf y de la gente joven: pegada a El Agua pero con carácter propio, oleaje fuerte del Atlántico, arena gruesa y menos toldos. Está en el municipio Antolín del Campo, costa este, a 30 minutos de Pampatar y 40 del aeropuerto.',
    'En la orilla alquilan tablas y dan clases; los kioscos sirven pescado y cerveza fría; los fines de semana hay música. Si viajas con niños pequeños, mejor bañarlos en El Agua o Puerto Cruz, al lado: aquí las olas rompen cerca de la orilla.',
    'No tenemos apartamentos propios en Parguito. Nuestros huéspedes surfistas se quedan en Pampatar (Los Geranios, La Caranta o Playa El Ángel) y vienen en carro por la mañana, cuando el mar está más ordenado. Playa El Agua, con cuatro kilómetros de restaurantes, queda a 5 minutos para almorzar.',
  ],
  'playa-guacuco': [
    'Playa Guacuco está en la costa este, a 15 minutos de Porlamar y 20 de Pampatar por la carretera de La Asunción: playa larga y abierta, oleaje moderado, palmeras, y ambiente local de fin de semana. Su nombre viene del guacuco, la almeja pequeña que se recoge en la orilla y se come en sopa en los kioscos.',
    'Servicios: restaurantes de pescado a lo largo de la playa, alquiler de toldos y sillas, estacionamiento. A 10 minutos está La Asunción, la capital del estado, con el Castillo de Santa Rosa y la Casa de la Cultura; y a 15 el cruce de Guacuco, donde la Farmacia El Crucero hace delivery gratis.',
    'Es una excelente playa de «medio día» para quien se aloja con nosotros en Pampatar o Porlamar: sales a las 8, te bañas cuando el sol todavía es amable, comes guacuco y pescado, y a las 2 estás de vuelta en la piscina del apartamento. Nuestros apartamentos quedan a 20 minutos y cuestan US$65 la noche.',
    'El acceso es fácil por carretera asfaltada y hay carritos por puesto desde Porlamar; si vas en temporada alta, llega antes de las 10 para estacionar cerca.',
  ],
  manzanillo: [
    'Manzanillo es un pueblo de pescadores en el extremo norte de la isla, a 50 minutos de Pampatar: bahía protegida de aguas calmas, botes de colores, y un mirador en la carretera desde donde se ve toda la costa norte. Es la zona de desconexión: casi no hay tráfico, el mar es para niños, y la vida gira alrededor de la llegada de los pescadores en la tarde.',
    'Cerca quedan Playa Caribe (10 minutos), Playa Puerto Cruz y El Agua (15), así que sirve de base para recorrer el norte. Los servicios son básicos: bodegas, restaurantes de pescado y poco más; para mercado grande hay que bajar a Juan Griego o a Porlamar.',
    'No tenemos apartamentos propios en Manzanillo. Si buscas esa calma, te recomendamos alojarte en Pampatar o Costa Azul y venir de excursión con carro alquilado; con nuestro traslado por día te llevamos y te buscamos.',
  ],
};
