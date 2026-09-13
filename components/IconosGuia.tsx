import type { ReactElement, SVGProps } from 'react';

// Iconografía propia de la guía: trazo fino, puntas redondas y motivos de
// petroglifo guaiquerí (puntos, zigzag, espirales) en vez de emojis. Es parte
// de la identidad —artesanal, de la isla— y se ve igual en todos los teléfonos
// (los emojis cambian según el sistema). 24×24, hereda el color del texto.

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true, ...p });

export const ICONOS: Record<string, (p: P) => ReactElement> = {
  // Sol con rayos de puntos sobre olas en zigzag
  playa: (p) => (<svg {...base(p)}><circle cx="12" cy="9" r="3.2" /><path d="M12 2.5v1.2M5.3 6.3l.9.9M18.7 6.3l-.9.9M3 9h1.3M19.7 9H21" /><path d="M3 16c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0 3-1.4 4.5 0 3 1.4 4.5 0" /><path d="M3 20c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0 3-1.4 4.5 0 3 1.4 4.5 0" /></svg>),
  // Papagayo (cometa) con cola
  actividad: (p) => (<svg {...base(p)}><path d="M12 2.5 19 10l-7 7-7-7z" /><path d="M12 2.5v14.5M5 10h14" /><path d="M12 17c-1 2-1.5 3 .5 4M12.5 21c1.6-.4 2-1.4 3.5-1.4" /></svg>),
  // Budare con arepas y vapor
  comer: (p) => (<svg {...base(p)}><path d="M3 15.5h18" /><path d="M4.5 15.5c0 3 3.4 5 7.5 5s7.5-2 7.5-5" /><circle cx="9" cy="12.5" r="2" /><circle cx="15" cy="12.5" r="2" /><path d="M9 3.5c-1 1.2-1 2.3 0 3.5M12 3c-1 1.2-1 2.3 0 3.5M15 3.5c-1 1.2-1 2.3 0 3.5" /></svg>),
  // Fortín con almenas
  historia: (p) => (<svg {...base(p)}><path d="M4 21V9h3V6h3v3h4V6h3v3h3v12" /><path d="M4 21h16" /><path d="M10 21v-5h4v5" /><path d="M7 13h.01M17 13h.01" strokeWidth="2.2" /></svg>),
  // Hoja con nervaduras punteadas (mangle)
  naturaleza: (p) => (<svg {...base(p)}><path d="M20 4c-9 0-15 5-15 13 0 1.3.2 2.4.6 3.4C13.5 20.6 20 14 20 4z" /><path d="M5.6 20.4C9 15 13 11 18 6.5" /><path d="M10.5 13.5h.01M13.5 10.8h.01M8.4 16.4h.01" strokeWidth="2.2" /></svg>),
  // Sol a medias tras cerros
  mirador: (p) => (<svg {...base(p)}><path d="M5.5 14a6.5 6.5 0 0 1 13 0" /><path d="M12 4.5v1.5M4.2 8.8l1.1 1.1M19.8 8.8l-1.1 1.1" /><path d="M2 19c3-4 6-4 8-1.5M9 18.5c3-4.5 7-5 13 .5" /><path d="M2 21.5h20" /></svg>),
  // Vasija indígena con banda de zigzag
  museo: (p) => (<svg {...base(p)}><path d="M9 3h6l-1 3c3 1 5 3.5 5 7 0 4.5-3 8-7 8s-7-3.5-7-8c0-3.5 2-6 5-7z" /><path d="M6.5 13l1.5-1.5 1.5 1.5 1.5-1.5 1.5 1.5 1.5-1.5 1.5 1.5 1.5-1.5" /></svg>),
  // Trompo (juguete tradicional)
  familia: (p) => (<svg {...base(p)}><path d="M12 2.5v2.5" /><path d="M6 8c0-1.7 2.7-3 6-3s6 1.3 6 3c0 4-3 7-6 13-3-6-6-9-6-13z" /><path d="M6.5 10.5c1.5.8 3.3 1.2 5.5 1.2s4-.4 5.5-1.2" /><path d="M9 8h.01M15 8h.01" strokeWidth="2.2" /></svg>),
  // Luna y estrellas punteadas
  nocturna: (p) => (<svg {...base(p)}><path d="M15.5 3.5a8.5 8.5 0 1 0 5 15.2A9 9 0 0 1 15.5 3.5z" /><path d="M5 5h.01M8 9h.01M4 12h.01M7 16h.01" strokeWidth="2.4" /></svg>),
  // Cesta tejida (mapire)
  compras: (p) => (<svg {...base(p)}><path d="M8 9V7a4 4 0 0 1 8 0v2" /><path d="M4 9h16l-1.5 11H5.5z" /><path d="M6 13h12M6.5 16.5h11" /><path d="M9.5 9v11M14.5 9v11" /></svg>),
  // Moto de reparto
  delivery: (p) => (<svg {...base(p)}><circle cx="6" cy="17" r="2.5" /><circle cx="18" cy="17" r="2.5" /><path d="M8.5 17h7L17 12h-4l-1.5-3H8" /><path d="M13 12l-1.5 5" /><path d="M14 6h4v3h-4z" /></svg>),
  // Carrito con productos
  supermercado: (p) => (<svg {...base(p)}><path d="M3 4h2.5l2 11h10l2-7H7" /><circle cx="9" cy="19.5" r="1.4" /><circle cx="16.5" cy="19.5" r="1.4" /><path d="M10 11h6M11 8V4.5M14 8V6" /></svg>),
  // Botella y vaso
  licores: (p) => (<svg {...base(p)}><path d="M8 2.5h3v3.5c1.5 1 2 2.2 2 4V20a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 20v-10c0-1.8.5-3 1.5-4z" /><path d="M6.5 13h6.5" /><path d="M16 12h5l-.8 8.5h-3.4z" /><path d="M16.3 15.5h4.4" /></svg>),
  // Gota con ondas (tinajero)
  agua: (p) => (<svg {...base(p)}><path d="M12 2.5c3.5 4.5 6 7.7 6 11a6 6 0 0 1-12 0c0-3.3 2.5-6.5 6-11z" /><path d="M8.5 14c1-.9 2-.9 3 0s2 .9 3 0" /><path d="M9.5 17c.8-.7 1.7-.7 2.5 0s1.7.7 2.5 0" /></svg>),
  // Cruz en círculo
  salud: (p) => (<svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7.5v9M7.5 12h9" strokeWidth="2" /></svg>),
  // Carrito por delante (por puesto)
  transporte: (p) => (<svg {...base(p)}><path d="M4 16v-4l2-5.5A1.5 1.5 0 0 1 7.4 5.5h9.2A1.5 1.5 0 0 1 18 6.5L20 12v4" /><path d="M4 16h16v2.5H4z" /><path d="M6 12h12" /><path d="M7 14.3h.01M17 14.3h.01" strokeWidth="2.4" /><path d="M6 18.5v1.5M18 18.5v1.5" /></svg>),
  // Cerro con sendero de puntos y banderín
  aventura: (p) => (<svg {...base(p)}><path d="M2 20 9 7l4 6 3-4 6 11z" /><path d="M2 20h20" /><path d="M8 17h.01M10.5 14.5h.01M13 17.5h.01" strokeWidth="2.4" /><path d="M16 9V4.5l3 1.2-3 1.3" /></svg>),
};

export default function IconoCategoria({ cat, ...p }: P & { cat: string }) {
  const I = ICONOS[cat] ?? ICONOS.actividad;
  return I(p);
}
