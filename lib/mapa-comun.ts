// Tipos y cálculos PUROS del mapa. SEGURO PARA CLIENTE: no abre Postgres ni
// lee archivos, igual que lib/guia-comun.ts y por el mismo motivo —lo importa
// el componente del mapa, que es 'use client'.
import { CATEGORIAS } from './guia-comun';

export interface PuntoMapa {
  tipo: 'lugar' | 'alojamiento';
  slug: string;
  nombre: string;
  categoria: string;
  lat: number;
  lng: number;
  foto: string | null;
  zona: string;
  /** Valoración de Google (lugares) o de Airbnb (alojamientos). */
  rating: number | null;
  resenas: number | null;
  telefono: string | null;
  /** Nuestro consejo, recortado: en la ficha del mapa hay sitio para dos líneas. */
  consejo: string;
  aliado: boolean;
  /** Solo alojamientos: precio por noche en US$ y capacidad. */
  precio?: number;
  personas?: number;
}

/** Emoji por categoría, con el de los alojamientos, que no está en CATEGORIAS. */
export const EMOJI: Record<string, string> = {
  ...Object.fromEntries(CATEGORIAS.map((c) => [c.key, c.emoji])),
  alojamiento: '🏠',
};

/** Distancia en kilómetros entre dos puntos (Haversine). */
export function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180, la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** «800 m» o «2,4 km»: en la isla todo queda cerca y los metros se leen mejor. */
export function distanciaCorta(d: number): string {
  return d < 1 ? `${Math.round(d * 1000 / 50) * 50} m` : `${d.toFixed(1).replace('.', ',')} km`;
}
