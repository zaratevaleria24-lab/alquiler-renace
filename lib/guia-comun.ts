// Tipos, categorías y ayudantes PUROS de la guía. SEGURO PARA CLIENTE: no abre
// Postgres ni lee archivos; lo importan las tarjetas (cliente) y lib/guia.ts
// (servidor), que lo reexporta para que el resto del código no cambie.

export type Categoria =
  | 'playa' | 'historia' | 'naturaleza' | 'mirador' | 'museo' | 'comer'
  | 'actividad' | 'aventura' | 'nocturna' | 'compras' | 'familia'
  // Servicios: lo que un huésped necesita RESOLVER desde el apartamento.
  | 'delivery' | 'supermercado' | 'licores' | 'agua' | 'salud' | 'transporte' | 'practico';

export type Grupo = 'descubrir' | 'resolver';

export const CATEGORIAS: { key: Categoria; label: string; plural: string; emoji: string; grupo: Grupo; sub: string }[] = [
  { key: 'playa', label: 'Playa', plural: 'Playas', emoji: '🏖', grupo: 'descubrir', sub: 'Dónde bañarte hoy' },
  { key: 'actividad', label: 'Paseos', plural: 'Paseos y tours', emoji: '🪁', grupo: 'descubrir', sub: 'Lanchas, islas, excursiones' },
  { key: 'aventura', label: 'Aventura', plural: 'Aventura y deporte', emoji: '🥾', grupo: 'descubrir', sub: 'Senderismo, kite, buceo, surf' },
  { key: 'comer', label: 'Comer', plural: 'Dónde comer', emoji: '🍽', grupo: 'descubrir', sub: 'Los más recomendados' },
  { key: 'historia', label: 'Historia', plural: 'Historia', emoji: '🏰', grupo: 'descubrir', sub: 'Castillos, fortines, iglesias' },
  { key: 'naturaleza', label: 'Naturaleza', plural: 'Naturaleza', emoji: '🌿', grupo: 'descubrir', sub: 'Lagunas, cerros, manglares' },
  { key: 'mirador', label: 'Mirador', plural: 'Miradores', emoji: '🌅', grupo: 'descubrir', sub: 'Para el atardecer' },
  { key: 'museo', label: 'Museo', plural: 'Museos', emoji: '🖼', grupo: 'descubrir', sub: 'Una hora fuera del sol' },
  { key: 'familia', label: 'Con niños', plural: 'Con niños', emoji: '🎡', grupo: 'descubrir', sub: 'Parques y planes' },
  { key: 'nocturna', label: 'Noche', plural: 'De noche', emoji: '🌙', grupo: 'descubrir', sub: 'Bares y música' },
  { key: 'compras', label: 'Compras', plural: 'Compras', emoji: '🛍', grupo: 'descubrir', sub: 'Centros comerciales y mercados' },
  { key: 'delivery', label: 'A domicilio', plural: 'Pedir a domicilio', emoji: '🛵', grupo: 'resolver', sub: 'Comida hasta tu puerta' },
  { key: 'supermercado', label: 'Supermercado', plural: 'Supermercados', emoji: '🛒', grupo: 'resolver', sub: 'Sigo, Río, mercados' },
  { key: 'licores', label: 'Licores', plural: 'Licores y bebidas', emoji: '🍾', grupo: 'resolver', sub: 'Guuao, Prolicor, delivery' },
  { key: 'agua', label: 'Agua y gas', plural: 'Agua y gas', emoji: '💧', grupo: 'resolver', sub: 'Botellones, cisterna, bombonas' },
  { key: 'salud', label: 'Salud', plural: 'Farmacias y clínicas', emoji: '➕', grupo: 'resolver', sub: 'Farmacias 24 h y clínicas' },
  { key: 'transporte', label: 'Moverse', plural: 'Moverse', emoji: '🚕', grupo: 'resolver', sub: 'Taxis, apps, alquiler de carros' },
  { key: 'practico', label: 'Prácticos', plural: 'Servicios prácticos', emoji: '🧺', grupo: 'resolver', sub: 'Lavandería, cambio, SIM, gasolina' },
];
// Tarjetas por tanda en la lista de la guía (paginación automática al bajar).
// Vive acá y no en FiltroGuia: un 'use client' no exporta constantes a un
// componente de servidor —llega un proxy, no el número.
export const POR_PAGINA = 18;
export const esServicio = (c: string) => CATEGORIAS.find((x) => x.key === c)?.grupo === 'resolver';
// Todas las categorías de un lugar (principal + extras), para filtrar y contar.
export const categoriasDe = (l: { categoria: string; categoriasExtra: string[] }) => [l.categoria, ...l.categoriasExtra];
export const enCategoria = (l: { categoria: string; categoriasExtra: string[] }, c: string) => categoriasDe(l).includes(c);
export const categoriaLabel = (c: string) => CATEGORIAS.find((x) => x.key === c)?.label ?? c;
export const categoriaPlural = (c: string) => CATEGORIAS.find((x) => x.key === c)?.plural ?? c;

export interface FotoGuia { path: string; alt: string; credito: string; licencia: string; fuente: 'propia' | 'commons' | 'duena' | 'instagram' }
export interface FotoGoogle { name: string; autor: string }

export interface Lugar {
  id: string; slug: string; nombre: string; categoria: Categoria;
  zoneSlug: string | null; zone: string | null; municipio: string;
  descripcion: string; consejo: string; mejorMomento: string; duracion: string; costo: string;
  googlePlaceId: string | null; rating: number | null; resenas: number | null;
  latitud: number | null; longitud: number | null; direccion: string;
  telefono: string | null; web: string | null; instagram: string | null; mapsUrl: string | null;
  horario: string[] | null; nivelPrecio: string | null; resumenGoogle: string | null;
  fotosGoogle: FotoGoogle[]; datosActualizados: string | null;
  fotos: FotoGuia[]; destacado: boolean; aliado: boolean;
  /** Completa «Recomendado …» en el sello. Vacío = el texto genérico. */
  aliadoMotivo: string;
  orden: number; publicado: boolean; categoriasExtra: string[];
}

export interface Consejo { id: string; tema: string; titulo: string; texto: string; orden: number; publicado: boolean }

/**
 * Número de WhatsApp de un teléfono, o null si ese teléfono NO puede tenerlo.
 *
 * POR QUÉ IMPORTA EL PREFIJO: hasta el 2026-09-15 bastaba con que el número
 * tuviera nueve dígitos para pintarle un botón de WhatsApp. Auditado ese día:
 * de 58 lugares con teléfono, **19 no podían tenerlo** —18 fijos 0295/0212 y
 * uno con formato extranjero—. Un tercio de la guía ofrecía un botón que abre
 * WhatsApp y responde «número no válido». Peor que no tener el botón.
 *
 * Móviles de Venezuela: 0412 y 0422 (Digitel), 0414 y 0424 (Movistar),
 * 0416 y 0426 (Movilnet). Todo lo que empieza por 2 es fijo.
 */
export function waDeTelefono(tel: string | null | undefined): string | null {
  if (!tel) return null;
  const d = tel.replace(/\D/g, '').replace(/^58/, '').replace(/^0/, '');
  return /^4(12|14|16|22|24|26)\d{7}$/.test(d) ? `58${d}` : null;
}

/** ¿Esta URL ya es un enlace de WhatsApp? (algunos negocios ponen wa.me de web) */
export const esEnlaceWa = (u: string | null | undefined) =>
  !!u && /wa\.(me|link)|whatsapp\.com/.test(u);

/** Versión chica (480px) de una foto guardada: `x.webp` → `x-s.webp`. Las de
 *  Google van por el proxy con `?w=480`. Para tarjetas y mapa; la galería usa la grande. */
export function miniatura(src: string): string {
  if (src.startsWith('/api/guia/foto/')) return `${src}?w=480`;
  return src.replace(/\.webp$/, '-s.webp');
}

/** Foto de portada: propia/Commons primero; si no hay, la primera de Google vía proxy. */
export function portadaDe(l: Lugar): { src: string; alt: string; credito: string } | null {
  if (l.fotos[0]) return { src: l.fotos[0].path, alt: l.fotos[0].alt, credito: l.fotos[0].credito };
  if (l.fotosGoogle[0]) return { src: `/api/guia/foto/${l.id}/0`, alt: `${l.nombre}, Isla de Margarita`, credito: `Foto: ${l.fotosGoogle[0].autor} · Google` };
  return null;
}
export function galeriaDe(l: Lugar): { src: string; alt: string; credito: string }[] {
  const propias = l.fotos.map((f) => ({ src: f.path, alt: f.alt, credito: f.credito }));
  const google = l.fotosGoogle.slice(0, 6).map((f, k) => ({ src: `/api/guia/foto/${l.id}/${k}`, alt: `${l.nombre}, Isla de Margarita — foto ${k + 1}`, credito: `Foto: ${f.autor} · Google` }));
  return [...propias, ...google].slice(0, 8);
}

/** Horario de hoy, si Places lo trajo. */
export function horarioHoy(l: Lugar): string | null {
  if (!l.horario?.length) return null;
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const hoy = dias[new Date().getDay()];
  const linea = l.horario.find((h) => h.toLowerCase().startsWith(hoy));
  return linea ? linea.replace(/^[^:]+:\s*/, '') : null;
}
