// Tipos compartidos entre servidor y cliente.
//
// CLAVE DEL DISEÑO: acá NO hay componentes de React. Los iconos viajan como
// CLAVE DE TEXTO (`iconKey`), no como componente.
//
// Por qué importa: antes el tipo era `amenities: { icon: any; name: string }[]`
// donde `icon` era un componente de Lucide. Eso ataba los datos al framework y
// hacía imposible guardarlos en Postgres: un componente no cabe en una columna.
// Ahora la base guarda 'wifi' y el cliente lo traduce con el registro de
// lib/icons.ts. El mismo dato sirve para la web, el panel y una futura API.

export interface Amenity {
  key: string;
  name: string;
  iconKey: string;
}

export interface Category {
  key: string;   // 'Playa', 'Frente al Mar' — también es la clave de filtro
  label: string;
  iconKey: string;
}

export interface PropertyImage {
  path: string;
  alt: string;
  isCover: boolean;
}

export interface Host {
  name: string;
  tagline: string;
  avatarPath: string | null;
}

export interface Property {
  id: string;
  slug: string;
  name: string;
  /** Nombre de la zona para mostrar: 'Pampatar'. */
  zone: string;
  /** Slug de la zona para enlazar: 'pampatar'. */
  zoneSlug: string;
  location: string;
  description: string;

  priceText: string;
  pricePerNight: number;
  priceOnRequest: boolean;
  nightsCount: number;

  /** NULL cuando no hay reseñas reales. Ver la nota en lib/schema o SEO.md. */
  rating: number | null;

  guestsAllowed: { adults: number; children: number };

  /** Marca el inventario verdadero frente a los listados de relleno. */
  isReal: boolean;

  /** Portada. Derivada de images, para no repetir la lógica en cada vista. */
  image: string;
  gallery: string[];
  images: PropertyImage[];

  categories: string[];
  amenities: Amenity[];
  host: Host | null;
}

export interface Zone {
  slug: string;
  name: string;
  coast: string;
  summary: string;
  body: string[];
  nearby: string[];
  bestFor: string;
  properties: Property[];
  /** Precio más bajo con tarifa publicada; null si todas son "consultar". */
  minPrice: number | null;
}

export interface Vehicle {
  id: string;
  slug: string;
  brand: string;
  model: string;
  year: number | null;
  displayName: string;
  transmission: 'automatica' | 'sincronica';
  seats: number;
  doors: number;
  hasAc: boolean;
  fuel: string;
  bodyType: string;
  description: string;
  priceText: string;
  pricePerDay: number;
  priceOnRequest: boolean;
  /** Las dos dudas que frenan a la gente antes de escribir. */
  depositText: string;
  minDays: number;
  pickupZoneSlug: string | null;
  pickupNote: string;
  isAvailable: boolean;
  image: string | null;
  images: PropertyImage[];
  features: Amenity[];
}
