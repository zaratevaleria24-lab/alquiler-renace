// Tipos de enlace de la página /enlaces: qué icono y qué color lleva cada uno.
//
// SEGURO PARA CLIENTE: solo importa de lucide-react. Vive aparte de
// lib/enlaces.ts —que abre Postgres y es solo servidor— porque esta tabla la
// necesitan las TRES caras: la página pública (cliente), el formulario del
// panel (servidor) y la validación de las Server Actions.
// Es el mismo reparto que lib/icons.ts hace para las amenidades.
//
// ── SOBRE LOS ICONOS DE MARCA ───────────────────────────────────────────────
// Estos NO son los logotipos oficiales de WhatsApp, TikTok ni Airbnb. Lucide
// —el juego de iconos del sitio— retiró casi todas las marcas por licencia, y
// pegar los originales significaría meter SVG ajenos con sus reglas de uso.
//
// No se pierde reconocimiento porque el color hace ese trabajo: el verde de
// WhatsApp y el coral de Airbnb se identifican antes que su silueta, y además
// cada botón lleva el nombre escrito al lado. Los redondos, que van sin texto,
// llevan su nombre accesible para lectores de pantalla.
//
// Si algún día se quieren los logotipos exactos, se sustituyen acá y nada más:
// el resto del código solo pide `TIPOS[tipo].icono`.

import {
  BedDouble,
  Building2,
  CalendarCheck,
  Compass,
  Globe,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Phone,
  type LucideIcon,
} from 'lucide-react';

export interface TipoEnlace {
  /** Nombre del tipo en el selector del panel. */
  nombre: string;
  icono: LucideIcon;
  /** Color del medallón. Los de marca son el oficial de cada plataforma. */
  color: string;
  /**
   * Clave de /admin/contenido de la que sale la URL cuando se deja vacía.
   * Evita tener el mismo dato escrito en dos sitios y que uno se quede viejo.
   */
  desde?: 'whatsapp' | 'instagram' | 'email' | 'telefono';
  /** Texto de apoyo bajo el campo URL en el panel. */
  ayuda?: string;
}

export const TIPOS = {
  whatsapp: {
    nombre: 'WhatsApp',
    icono: MessageCircle,
    color: '#1FA855',
    desde: 'whatsapp',
    ayuda:
      'Déjalo vacío y usa el número de la sección Contenido; se abre el chat con un saludo ya escrito.',
  },
  instagram: {
    nombre: 'Instagram',
    icono: Instagram,
    color: '#C13584',
    desde: 'instagram',
    ayuda: 'Déjalo vacío y usa el Instagram de la sección Contenido.',
  },
  tiktok: {
    nombre: 'TikTok',
    icono: Music2,
    color: '#111111',
    ayuda: 'La URL de tu perfil: https://www.tiktok.com/@tucuenta',
  },
  airbnb: {
    nombre: 'Airbnb',
    icono: BedDouble,
    color: '#FF5A5F',
    ayuda:
      'El enlace de tu anuncio o de tu perfil de anfitriona en Airbnb.',
  },
  booking: {
    nombre: 'Booking',
    icono: Building2,
    color: '#003580',
    ayuda: 'El enlace de tu alojamiento en Booking.com.',
  },
  guia: {
    nombre: 'Guía turística',
    icono: Compass,
    color: '#126e8b',
    ayuda: 'La guía del sitio: /guia. Es la misma que abre el QR de los apartamentos.',
  },
  reserva: {
    nombre: 'Reservar aquí',
    icono: CalendarCheck,
    // El color de acción de la casa: este botón es el que no paga comisión.
    color: '#22565d',
    ayuda:
      'Una página de este mismo sitio. Escríbela empezando por barra: / para el inicio, /autos para los vehículos.',
  },
  sitio: {
    nombre: 'Otra página web',
    icono: Globe,
    color: '#6e9b98',
    ayuda: 'URL completa, empezando por https://',
  },
  correo: {
    nombre: 'Correo',
    icono: Mail,
    color: '#b98a63',
    desde: 'email',
    ayuda: 'Déjalo vacío y usa el correo de la sección Contenido.',
  },
  telefono: {
    nombre: 'Teléfono',
    icono: Phone,
    color: '#8a9578',
    desde: 'telefono',
    ayuda: 'Déjalo vacío y usa el teléfono de la sección Contenido.',
  },
  mapa: {
    nombre: 'Cómo llegar',
    icono: MapPin,
    color: '#c0563c',
    ayuda: 'El enlace de Google Maps con la ubicación.',
  },
} as const satisfies Record<string, TipoEnlace>;

export type ClaveTipo = keyof typeof TIPOS;

/** La misma tabla con el tipo ensanchado, para recorrerla y para indexarla con
 *  una cadena que viene de la base. Mismo motivo que CAMPOS_UI en settings.ts. */
export const TIPOS_UI: Record<string, TipoEnlace> = TIPOS;

export function esTipoValido(v: string): v is ClaveTipo {
  return v in TIPOS;
}

/** Nunca devuelve undefined: una fila con un tipo retirado sigue dibujándose
 *  como enlace genérico en vez de romper la página. */
export function tipoDe(clave: string): TipoEnlace {
  return TIPOS_UI[clave] ?? TIPOS.sitio;
}
