// Páginas «hub» de la guía: /guia/playas, /guia/donde-comer, /guia/servicios,
// /guia/aventura. Cada una es una página propia (título, texto editorial,
// canonical) que agrupa categorías; los filtros ?c= de /guia no rankean solos.
import type { Categoria } from './guia-comun';

export interface Hub { slug: string; titulo: string; h1: [string, string]; descripcion: string; categorias: Categoria[]; intro: string[] }

export const HUBS: Hub[] = [
  { slug: 'playas', titulo: 'Playas de Isla de Margarita: cuál elegir y cómo llegar', h1: ['Las playas de la isla,', 'una por una'], categorias: ['playa'],
    descripcion: 'Playa El Agua, Parguito, El Yaque, Caribe, Guacuco y más: oleaje, servicios, para quién es cada una y cómo llegar desde Pampatar y Porlamar.',
    intro: ['Margarita tiene más de 50 playas y no se parecen entre sí: El Agua es la de los restaurantes y la fila de toldos; Parguito, la de las olas y el surf; El Yaque, agua plana con viento para kite; Caribe y Puerto Cruz, las tranquilas del norte. Elegir bien la playa del día cambia las vacaciones.',
      'Aquí están las que recomendamos a nuestros huéspedes, con el consejo que daría un margariteño: a qué hora ir, si hay sombra, si el mar es para niños y qué llevar. Casi todas quedan a menos de 40 minutos de nuestros apartamentos en Pampatar (Los Geranios, La Caranta y Playa El Ángel).'] },
  { slug: 'donde-comer', titulo: 'Dónde comer en Isla de Margarita y qué pedir a domicilio', h1: ['Dónde comer,', 'y qué pedir sin salir'], categorias: ['comer', 'delivery'],
    descripcion: 'Empanadas de cazón, pescado fresco, comida árabe y pizza a domicilio: los sitios más valorados de Porlamar, Pampatar y la costa, con horarios y teléfonos.',
    intro: ['La isla se come temprano y con el mar al frente: empanadas de cazón a las 7 de la mañana, pescado frito al mediodía en la playa, y de noche pizza o comida árabe a domicilio mientras los niños duermen. Esta es la lista corta de lo que probamos y volvemos a pedir.',
      'Cada sitio trae valoración de Google, horario de hoy y un botón para llamar o escribir por WhatsApp. Los de «a domicilio» llegan a nuestros apartamentos; pide antes de las 9 los fines de semana.'] },
  { slug: 'servicios', titulo: 'Servicios en Isla de Margarita: agua, supermercados, farmacias, taxis', h1: ['Lo que necesitas', 'resolver desde el apartamento'], categorias: ['supermercado', 'licores', 'agua', 'salud', 'transporte', 'practico'],
    descripcion: 'Supermercados Sigo y Río, agua por botellón o cisterna, farmacias 24 horas, clínicas, taxis y Ridery, alquiler de carros, lavandería y cambio: todo con teléfono y ubicación.',
    intro: ['Vivir unos días en la isla tiene su logística: el agua se compra en botellón, la luz a veces se va, y conviene saber qué farmacia abre de noche y a quién llamar para un taxi seguro. Esto es lo que resolvemos por nuestros huéspedes y ahora dejamos por escrito para todos.',
      'Los marcados como «Recomendado por Margarita Renace» son aliados que pasaron nuestro filtro: precio transparente e igual para todos, respuesta inmediata por WhatsApp, negocio local, y salen del catálogo si dos huéspedes reportan informalidad. Caribest Water y Recargas La Perla para el agua, V2 Aventuras para moverte distinto, Ketchup Hot para desayunar. Si algo falla en el apartamento, primero escríbenos: casi siempre lo resolvemos nosotros.'] },
  { slug: 'aventura', titulo: 'Aventura en Isla de Margarita: senderismo, kite, buceo, paseos en lancha', h1: ['La isla activa:', 'cerros, viento y mar'], categorias: ['aventura', 'actividad'],
    descripcion: 'Senderismo al Matasiete y al Copey, kitesurf en El Yaque, buceo en Los Frailes, lanchas a Coche y Cubagua, jeeps y e-bikes por Macanao, con operadores certificados.',
    intro: ['Margarita es más que playa: hay cerros de 900 metros con niebla, viento constante que la hace capital sudamericana del kite, arrecifes a 30 minutos en lancha y una península —Macanao— casi vacía para recorrer en jeep o bicicleta eléctrica.',
      'Reunimos a los operadores que conocemos y recomendamos, con guías certificados y salidas frecuentes. Reserva con anticipación en temporada; nosotros coordinamos la salida desde tu apartamento.'] },
];
export const hubDe = (slug: string) => HUBS.find((h) => h.slug === slug);
export const hubsDeCategoria = (c: string) => HUBS.filter((h) => (h.categorias as string[]).includes(c));
