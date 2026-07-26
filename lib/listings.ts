// Fuente de datos única de los listados. Se extrajo de app/page.tsx el
// 2026-07-26 porque el sitemap y las páginas de zona necesitan los mismos
// datos que el home, y no se pueden importar desde un componente 'use client'
// sin arrastrar todo el árbol de React al build del servidor.
//
// Cada listado ahora lleva `zone` y `slug`, derivados de `location`, que es lo
// que permite generar /alquiler/<zona> estáticamente.

import {
  Box,
  Coffee,
  Compass,
  Flame,
  Home as HomeIcon,
  Palmtree,
  Sparkles,
  ShieldCheck,
  Smile,
  Star,
  Umbrella,
  Users,
  Waves,
  Wifi,
  Wind,
} from 'lucide-react';

export interface Property {
  id: string;
  name: string;
  location: string;
  /** Zona de la isla, normalizada. Agrupa los listados en landings propias. */
  zone: string;
  /** Slug URL-safe del listado. */
  slug: string;
  priceText: string;
  pricePerNight: number;
  priceOnRequest?: boolean;
  nightsCount: number;
  rating: number;
  categories: string[];
  image: string;
  gallery: string[];
  description: string;
  host: {
    name: string;
    avatar: string;
    tagline: string;
  };
  amenities: { icon: any; name: string }[];
  guestsAllowed: { adults: number; children: number };
}

export const AMENITIES_LUJO = [
  { icon: Waves, name: 'Piscina Infinita' },
  { icon: Wifi, name: 'Wi-Fi de Alta Velocidad' },
  { icon: Wind, name: 'Aire Acondicionado' },
  { icon: Sparkles, name: 'Jacuzzi Privado' },
  { icon: Palmtree, name: 'Vista Panorámica al Mar' }
];

export const AMENITIES_CENTRO = [
  { icon: Wifi, name: 'Wi-Fi de Alta Velocidad' },
  { icon: Wind, name: 'Aire Acondicionado' },
  { icon: Coffee, name: 'Cocina Equipada' },
  { icon: Box, name: 'Estacionamiento Privado' },
  { icon: Sparkles, name: 'TV Smart' }
];

export const AMENITIES_LOS_GERANIOS = [
  { icon: Wifi, name: 'Wi-Fi Constante' },
  { icon: Wind, name: 'Aire Acondicionado' },
  { icon: ShieldCheck, name: 'Seguridad 24/7' },
  { icon: Waves, name: 'Piscina y Cancha Deportiva' },
  { icon: Flame, name: 'Zona de Parrilla' },
  { icon: Smile, name: 'Parque Infantil' },
  { icon: Box, name: 'Estacionamiento Asignado' },
  { icon: Coffee, name: 'Cocina Totalmente Equipada' }
];

export const AMENITIES_PLAYA = [
  { icon: Umbrella, name: 'Acceso Directo a Playa' },
  { icon: Wifi, name: 'Wi-Fi' },
  { icon: Wind, name: 'Aire Acondicionado' },
  { icon: Waves, name: 'Piscina Compartida' },
  { icon: Palmtree, name: 'Terraza Vista al Mar' }
];

const RAW_PROPERTIES: Omit<Property, "zone" | "slug">[] = [
  {
    id: '1',
    name: 'Los Geranios A',
    location: 'Urb. Maneiro, Pampatar, Margarita',
    priceText: 'Consultar precio',
    pricePerNight: 0,
    priceOnRequest: true,
    nightsCount: 2,
    rating: 4.9,
    categories: ['Centro', 'Familiar', 'Piscina'],
    image: '/properties/los-geranios-a/habitacion-principal.jpg',
    gallery: [
      '/properties/los-geranios-a/habitacion-principal.jpg'
    ],
    description: 'Apartamento totalmente equipado en zona céntrica de Pampatar, a solo 5 minutos del C.C. Sambil. Cuenta con seguridad 24/7, piscina, cancha deportiva, zona de parrilla y parque infantil dentro de la urbanización. Ideal para familias: habitación principal con cama queen y baño privado, habitación secundaria con cama queen y gaveta adicional. Todo lo que necesitas cerca, en una de las zonas más cómodas de la isla.',
    host: {
      name: 'Margarita Renace',
      avatar: '/logo.png',
      tagline: 'Anfitrión verificado · Los Geranios'
    },
    amenities: AMENITIES_LOS_GERANIOS,
    guestsAllowed: { adults: 6, children: 0 }
  },
  {
    id: '2',
    name: 'Suite Frente al Mar Pampatar',
    location: 'Pampatar, Margarita',
    priceText: 'US$78 / noche',
    pricePerNight: 78,
    nightsCount: 1,
    rating: 4.9,
    categories: ['Frente al Mar', 'Vista al Mar'],
    image: '/images/photo-1510798831971.jpg',
    gallery: [
      '/images/photo-1510798831971.jpg',
      '/images/photo-1449034446853.jpg',
      '/images/photo-1504280390367.jpg'
    ],
    description: 'Suite moderna con balcón frente a la bahía de Pampatar y su histórico castillo San Carlos de Borromeo. Vistas espectaculares al atardecer, a pasos del malecón, tiendas y la mejor gastronomía de la isla.',
    host: {
      name: 'José Rodríguez',
      avatar: '/images/photo-1507003211169.jpg',
      tagline: 'Especialista en turismo en Margarita'
    },
    amenities: AMENITIES_LUJO,
    guestsAllowed: { adults: 4, children: 2 }
  },
  {
    id: '3',
    name: 'Penthouse Porlamar Centro',
    location: 'Porlamar, Margarita',
    priceText: 'US$95 / noche',
    pricePerNight: 95,
    nightsCount: 3,
    rating: 4.95,
    categories: ['Centro', 'Lujo'],
    image: '/images/photo-1576013551627.jpg',
    gallery: [
      '/images/photo-1576013551627.jpg',
      '/images/photo-1566073771259.jpg',
      '/images/photo-1512917774080.jpg'
    ],
    description: 'Amplio penthouse de lujo en el corazón de Porlamar, cerca de los centros comerciales y las zonas comerciales libres de impuestos. Piscina en la azotea con vista de 360° a la ciudad y al mar Caribe.',
    host: {
      name: 'María Fernández',
      avatar: '/images/photo-1500648767791.jpg',
      tagline: 'Anfitriona premium en Porlamar'
    },
    amenities: AMENITIES_LUJO,
    guestsAllowed: { adults: 4, children: 2 }
  },
  {
    id: '4',
    name: 'Apartamento Costa Azul',
    location: 'Costa Azul, Margarita',
    priceText: 'US$62 / noche',
    pricePerNight: 62,
    nightsCount: 2,
    rating: 4.85,
    categories: ['Piscina', 'Familiar'],
    image: '/images/photo-1580587771525.jpg',
    gallery: [
      '/images/photo-1580587771525.jpg',
      '/images/photo-1600585154340.jpg',
      '/images/photo-1600607687939.jpg'
    ],
    description: 'Apartamento familiar en el exclusivo sector Costa Azul, con conjunto cerrado, piscina y áreas verdes. A minutos de los mejores hoteles, restaurantes y de la playa. Perfecto para vacaciones en familia con total tranquilidad.',
    host: {
      name: 'Luis González',
      avatar: '/images/photo-1534528741775.jpg',
      tagline: 'Atención personalizada para familias'
    },
    amenities: AMENITIES_PLAYA,
    guestsAllowed: { adults: 6, children: 3 }
  },
  {
    id: '5',
    name: 'Studio Playa Parguito',
    location: 'Playa Parguito, Margarita',
    priceText: 'US$38 / noche',
    pricePerNight: 38,
    nightsCount: 1,
    rating: 4.7,
    categories: ['Playa', 'Económico'],
    image: '/images/photo-1533873984035.jpg',
    gallery: [
      '/images/photo-1533873984035.jpg',
      '/images/photo-1470240731273.jpg',
      '/images/photo-1504280390367.jpg'
    ],
    description: 'Estudio acogedor y económico cerca de Playa Parguito, la favorita de los surfistas por su oleaje. Ideal para viajeros jóvenes y parejas que buscan sol, olas y buen ambiente sin gastar de más.',
    host: {
      name: 'Andrea Salazar',
      avatar: '/images/photo-1539571696357.jpg',
      tagline: 'Anfitriona surfer y amante del mar'
    },
    amenities: AMENITIES_PLAYA,
    guestsAllowed: { adults: 2, children: 0 }
  },
  {
    id: '6',
    name: 'Villa Playa Caribe',
    location: 'Playa Caribe, Margarita',
    priceText: 'US$155 / noche',
    pricePerNight: 155,
    nightsCount: 2,
    rating: 4.92,
    categories: ['Frente al Mar', 'Piscina', 'Lujo'],
    image: '/images/photo-1533090161767.jpg',
    gallery: [
      '/images/photo-1533090161767.jpg',
      '/images/photo-1533090161767.jpg',
      '/images/photo-1510798831971.jpg'
    ],
    description: 'Villa de lujo con piscina privada frente a Playa Caribe, en el norte de la isla. Amplios espacios, terraza con parrillera y acceso directo a una de las playas más limpias de Margarita. Perfecta para grupos grandes.',
    host: {
      name: 'Roberto Villarroel',
      avatar: '/images/photo-1492562080023.jpg',
      tagline: 'Villas exclusivas frente al mar'
    },
    amenities: AMENITIES_LUJO,
    guestsAllowed: { adults: 8, children: 4 }
  },
  {
    id: '7',
    name: 'Apartamento Juan Griego',
    location: 'Juan Griego, Margarita',
    priceText: 'US$52 / noche',
    pricePerNight: 52,
    nightsCount: 2,
    rating: 4.8,
    categories: ['Vista al Mar', 'Familiar'],
    image: '/images/photo-1542314831.jpg',
    gallery: [
      '/images/photo-1542314831.jpg',
      '/images/photo-1566073771259.jpg',
      '/images/photo-1576013551627.jpg'
    ],
    description: 'Apartamento con vista a la bahía de Juan Griego, famosa por tener los atardeceres más hermosos de Margarita. Ambiente tranquilo de pueblo pesquero, cerca del Fortín La Galera y ricos restaurantes de mariscos.',
    host: {
      name: 'Gabriela Rojas',
      avatar: '/images/photo-1539571696357.jpg',
      tagline: 'Enamorada de los atardeceres de Juan Griego'
    },
    amenities: AMENITIES_CENTRO,
    guestsAllowed: { adults: 4, children: 2 }
  },
  {
    id: '8',
    name: 'Loft Playa El Yaque',
    location: 'Playa El Yaque, Margarita',
    priceText: 'US$42 / noche',
    pricePerNight: 42,
    nightsCount: 3,
    rating: 4.75,
    categories: ['Playa', 'Económico'],
    image: '/images/photo-1499793983690.jpg',
    gallery: [
      '/images/photo-1499793983690.jpg',
      '/images/photo-1515263487990.jpg',
      '/images/photo-1580587771525.jpg'
    ],
    description: 'Loft ideal para amantes del kitesurf y windsurf, a pasos de Playa El Yaque, reconocida a nivel mundial por sus vientos. Ambiente internacional, relajado y con la mejor energía de la isla.',
    host: {
      name: 'Daniel Millán',
      avatar: '/images/photo-1506794778202.jpg',
      tagline: 'Instructor de kitesurf y anfitrión'
    },
    amenities: AMENITIES_PLAYA,
    guestsAllowed: { adults: 2, children: 1 }
  },
  {
    id: '9',
    name: 'Apartamento Playa Guacuco',
    location: 'Playa Guacuco, Margarita',
    priceText: 'US$66 / noche',
    pricePerNight: 66,
    nightsCount: 1,
    rating: 4.88,
    categories: ['Playa', 'Familiar'],
    image: '/images/photo-1504280390367.jpg',
    gallery: [
      '/images/photo-1504280390367.jpg',
      '/images/photo-1510798831971.jpg',
      '/images/photo-1533090161767.jpg'
    ],
    description: 'Apartamento cómodo y familiar cerca de Playa Guacuco, una amplia playa de aguas tranquilas ideal para niños. Rodeado de naturaleza, con fácil acceso en carro y a minutos de La Asunción, la capital de la isla.',
    host: {
      name: 'Patricia Guerra',
      avatar: '/images/photo-1544005313.jpg',
      tagline: 'Anfitriona familiar y atenta'
    },
    amenities: AMENITIES_PLAYA,
    guestsAllowed: { adults: 5, children: 2 }
  },
  {
    id: '10',
    name: 'Suite Manzanillo',
    location: 'Manzanillo, Margarita',
    priceText: 'US$120 / noche',
    pricePerNight: 120,
    nightsCount: 2,
    rating: 4.97,
    categories: ['Vista al Mar', 'Lujo'],
    image: '/images/photo-1512917774080.jpg',
    gallery: [
      '/images/photo-1512917774080.jpg',
      '/images/photo-1580587771525.jpg',
      '/images/photo-1613490493576.jpg'
    ],
    description: 'Suite de lujo en el tranquilo pueblo de Manzanillo, al norte de la isla, con vistas de postal al mar Caribe. Terraza privada, acabados premium y la paz de una de las zonas más auténticas de Margarita.',
    host: {
      name: 'Alejandra Marín',
      avatar: '/images/photo-1534528741775.jpg',
      tagline: 'Anfitriona de estadías premium'
    },
    amenities: AMENITIES_LUJO,
    guestsAllowed: { adults: 4, children: 2 }
  },
  {
    id: '11',
    name: 'Apartamento Marina Pampatar',
    location: 'Pampatar, Margarita',
    priceText: 'US$84 / noche',
    pricePerNight: 84,
    nightsCount: 2,
    rating: 4.9,
    categories: ['Frente al Mar', 'Piscina'],
    image: '/images/photo-1580587771525.jpg',
    gallery: [
      '/images/photo-1580587771525.jpg',
      '/images/photo-1566073771259.jpg',
      '/images/photo-1512917774080.jpg'
    ],
    description: 'Moderno apartamento en la zona de la marina de Pampatar, con piscina y vista a los yates. Excelente ubicación para disfrutar de la vida nocturna, restaurantes frente al mar y paseos en bote.',
    host: {
      name: 'Héctor Bermúdez',
      avatar: '/images/photo-1500648767791.jpg',
      tagline: 'Anfitrión cerca de la marina'
    },
    amenities: AMENITIES_LUJO,
    guestsAllowed: { adults: 4, children: 1 }
  },
  {
    id: '12',
    name: 'Studio Centro Porlamar',
    location: 'Porlamar, Margarita',
    priceText: 'US$32 / noche',
    pricePerNight: 32,
    nightsCount: 2,
    rating: 4.6,
    categories: ['Centro', 'Económico'],
    image: '/images/photo-1470240731273.jpg',
    gallery: [
      '/images/photo-1470240731273.jpg',
      '/images/photo-1533873984035.jpg',
      '/images/photo-1504280390367.jpg'
    ],
    description: 'Estudio funcional y económico en pleno centro de Porlamar, ideal para viajes de compras o negocios. A pasos de tiendas, bancos y transporte. La opción más práctica para conocer la isla con un presupuesto ajustado.',
    host: {
      name: 'Yolanda Ortega',
      avatar: '/images/photo-1544005313.jpg',
      tagline: 'Anfitriona práctica en el centro'
    },
    amenities: AMENITIES_CENTRO,
    guestsAllowed: { adults: 2, children: 0 }
  }
];

// === CATEGORIES METADATA ===
export const CATEGORIES = [
  { id: 'Todos', label: 'Todos', icon: Compass },
  { id: 'Frente al Mar', label: 'Frente al Mar', icon: Waves },
  { id: 'Playa', label: 'Playa', icon: Umbrella },
  { id: 'Piscina', label: 'Piscina', icon: Sparkles },
  { id: 'Vista al Mar', label: 'Vista al Mar', icon: Palmtree },
  { id: 'Centro', label: 'Centro', icon: HomeIcon },
  { id: 'Familiar', label: 'Familiar', icon: Users },
  { id: 'Lujo', label: 'Lujo', icon: Star },
  { id: 'Económico', label: 'Económico', icon: Box }
];

// === DERIVACIÓN DE ZONA Y SLUG ===

/** Quita acentos y deja un slug apto para URL. */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Saca la zona del campo `location`. Los valores vienen como
 * "Pampatar, Margarita" o "Urb. Maneiro, Pampatar, Margarita": se descarta el
 * sufijo "Margarita" y se toma el último segmento restante, que es la zona
 * reconocible de la isla (y no la urbanización concreta).
 */
function zoneFromLocation(location: string): string {
  const parts = location
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p && p.toLowerCase() !== 'margarita');
  return parts[parts.length - 1] ?? 'Isla de Margarita';
}

export const PROPERTIES: Property[] = RAW_PROPERTIES.map((p) => ({
  ...p,
  zone: zoneFromLocation(p.location),
  slug: slugify(p.name),
}));

export interface Zone {
  name: string;
  slug: string;
  properties: Property[];
  /** Precio más bajo con tarifa publicada; null si todas son "consultar". */
  minPrice: number | null;
}

/** Zonas con al menos un listado, ordenadas por cantidad de listados. */
export const ZONES: Zone[] = Object.values(
  PROPERTIES.reduce<Record<string, Zone>>((acc, property) => {
    const slug = slugify(property.zone);
    acc[slug] ??= { name: property.zone, slug, properties: [], minPrice: null };
    acc[slug].properties.push(property);
    return acc;
  }, {}),
)
  .map((zone) => {
    const prices = zone.properties
      .filter((p) => !p.priceOnRequest && p.pricePerNight > 0)
      .map((p) => p.pricePerNight);
    return { ...zone, minPrice: prices.length ? Math.min(...prices) : null };
  })
  .sort((a, b) => b.properties.length - a.properties.length || a.name.localeCompare(b.name));

export function getZone(slug: string): Zone | undefined {
  return ZONES.find((z) => z.slug === slug);
}
