// Una URL editorial por intención; los filtros de /guia no crean copias SEO.
import type { Categoria } from './guia-comun';
export interface Hub { slug: string; titulo: string; h1: [string, string]; descripcion: string; categorias: Categoria[]; intro: string[] }
export const HUBS: Hub[] = [
  { slug: 'playas', titulo: 'Playas de Isla de Margarita: elige tu próximo paseo', h1: ['Playas de Isla de Margarita:', 'elige tu próximo paseo'], categorias: ['playa'],
    descripcion: 'Explora las playas de Margarita: El Agua, Parguito, El Yaque y Guacuco. Consulta ubicación, servicios y consejos para elegir tu paseo y organizar el traslado.',
    intro: ['Elegir una playa es elegir cómo quieres pasar el día: cerca de servicios, con un paseo por la costa o buscando una actividad en el mar. Compara la ubicación y la información de cada ficha antes de organizar el traslado.',
      'Con niños, busca sombra, baños y un regreso sencillo. El oleaje y el viento varían: ninguna descripción sustituye revisar las condiciones al llegar. El mapa ayuda a situar cada playa; no todas quedan cerca de Pampatar.'] },
  { slug: 'donde-comer', titulo: 'Dónde comer en Margarita: restaurantes y delivery', h1: ['Dónde comer en Margarita:', 'restaurantes y delivery'], categorias: ['comer', 'delivery'],
    descripcion: 'Encuentra dónde comer en Isla de Margarita y opciones de delivery. Explora restaurantes y comida por ubicación, con teléfonos y horarios cuando están disponibles.',
    intro: ['Una comida puede ser parte del paseo o una solución al volver a casa. Aquí reunimos restaurantes y opciones a domicilio para que compares su ubicación, el tipo de comida y los datos de contacto disponibles.',
      'Consulta directamente el menú, los precios y el horario antes de desplazarte. Si pides delivery, confirma que llega a tu dirección y cuánto cuesta el envío; aparecer en esta lista no garantiza cobertura en toda la isla.'] },
  { slug: 'servicios', titulo: 'Servicios en Margarita: farmacias, agua y transporte', h1: ['Servicios en Isla de Margarita:', 'lo útil para tu día a día'], categorias: ['supermercado', 'licores', 'agua', 'salud', 'transporte', 'practico'],
    descripcion: 'Ubica farmacias, supermercados, agua a domicilio, transporte y otros servicios de Isla de Margarita. Consulta sus fichas, contactos y ubicaciones en el mapa.',
    intro: ['Para quienes visitan Margarita y quienes viven aquí: un directorio de servicios que puedes consultar por necesidad y ubicación. Incluye supermercados, farmacias, agua, transporte y otros contactos útiles.',
      'Los negocios con una recomendación de Margarita Renace se identifican en su ficha. El resto forma parte del directorio y no implica una relación con nosotros. Confirma disponibilidad, cobertura y precio con cada prestador antes de contratar.'] },
  { slug: 'aventura', titulo: 'Excursiones en Margarita: senderismo, kite y buceo', h1: ['Excursiones y aventura en Margarita:', 'cerros, viento y mar'], categorias: ['aventura', 'actividad'],
    descripcion: 'Explora excursiones en Margarita: senderismo, kite, buceo y paseos a Coche y Cubagua. Compara actividades, ubicación y datos de contacto para organizar tu salida.',
    intro: ['La guía reúne actividades en tierra y en el mar. Elige por tu experiencia, el tiempo que quieres dedicar y el transporte que necesitas. Consulta las fichas para distinguir una ruta, un destino y un operador que organiza salidas.',
      'Coche, Cubagua y Los Frailes requieren cruce marítimo. Confirma punto de embarque, regreso, equipo incluido y condiciones del mar. Para senderismo o deportes acuáticos, consulta requisitos y acompañamiento; no atribuimos una certificación a todos los operadores del directorio.'] },
];
export const hubDe = (slug: string) => HUBS.find((h) => h.slug === slug);
export const hubsDeCategoria = (c: string) => HUBS.filter((h) => (h.categorias as string[]).includes(c));
