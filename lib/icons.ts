// Registro de iconos: traduce la clave de texto que guarda la base al componente
// de Lucide que dibuja el cliente.
//
// Es la pieza que permite que los datos vivan en Postgres. La base guarda
// 'wifi'; acá se resuelve a <Wifi />. Sin este puente habría que guardar
// componentes de React en una columna, que no se puede.
//
// SEGURO PARA CLIENTE: solo importa de lucide-react, nada de servidor.

import {
  Baby,
  Box,
  Check,
  Coffee,
  Compass,
  Flame,
  Gauge,
  Home,
  MapPin,
  Palmtree,
  Radio,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Umbrella,
  Users,
  Video,
  Waves,
  Wifi,
  Wind,
  type LucideIcon,
} from 'lucide-react';

// Las claves se normalizan antes de buscar (ver `iconFor`), así que basta
// registrar una forma canónica en kebab-case.
//
// Nota de mantenimiento: el generador del seed derivó las claves del NOMBRE del
// componente, y produjo variantes como 'shieldcheck' (de ShieldCheck) y
// 'homeicon' (del alias `Home as HomeIcon`). La normalización de `iconFor` las
// resuelve igual, así que no hace falta migrar la base para que funcionen.
const REGISTRY: Record<string, LucideIcon> = {
  baby: Baby,
  box: Box,
  check: Check,
  coffee: Coffee,
  compass: Compass,
  flame: Flame,
  gauge: Gauge,
  home: Home,
  homeicon: Home,
  mappin: MapPin,
  palmtree: Palmtree,
  radio: Radio,
  shieldcheck: ShieldCheck,
  smile: Smile,
  sparkles: Sparkles,
  star: Star,
  umbrella: Umbrella,
  users: Users,
  video: Video,
  waves: Waves,
  wifi: Wifi,
  wind: Wind,
};

/**
 * Devuelve el componente de icono para una clave.
 *
 * Normaliza quitando guiones y bajando a minúsculas, de modo que 'shield-check',
 * 'shieldcheck' y 'Shield_Check' resuelvan al mismo icono. Es deliberado: las
 * claves las va a escribir una persona en el panel, y no tiene sentido que el
 * icono desaparezca por un guion de más.
 *
 * Si la clave no existe cae en `Check`, un icono neutro. Nunca devuelve
 * undefined: un `undefined` renderizado como componente tumba la página entera,
 * y un dato mal escrito en el panel no debería poder hacer eso.
 */
export function iconFor(iconKey: string | null | undefined): LucideIcon {
  if (!iconKey) return Check;
  const normal = iconKey.toLowerCase().replace(/[^a-z0-9]/g, '');
  return REGISTRY[normal] ?? Check;
}

/** Claves disponibles, para poblar el selector del panel. */
export const ICON_KEYS = Object.keys(REGISTRY).sort();
