// Helpers de presentación de «En venta»: convierten un inmueble propio o un
// anuncio de la isla en los datos que pintan TarjetaVenta y DetalleInmueble.
// Viven acá y no en la página porque Next no permite exportar nada que no sea
// de ruta desde un page.tsx.

import type { DatosTarjeta } from '@/components/TarjetaVenta';
import { TIPOS, type InmuebleVenta, type Prospecto } from './ventas';

export const dias = (desde: Date) => Math.max(1, Math.round((Date.now() - desde.getTime()) / 86400e3));
export const tipoLabel = (t: string) => TIPOS.find((x) => x.key === t)?.label ?? 'Inmueble';

export function tarjetaDePropio(i: InmuebleVenta): DatosTarjeta {
  return {
    href: `/en-venta/${i.slug}`, titulo: i.titulo, foto: i.image || null, fotos: i.images.length, zona: i.zone,
    tipo: tipoLabel(i.tipo), precioUsd: i.precioUsd, aConsultar: i.precioAConsultar,
    habitaciones: i.habitaciones, banos: i.banos, m2: i.m2Construccion, propio: true,
  };
}
/**
 * Título para mostrar. Los vendedores escriben «Venta Casa», «Bajo de Precio»
 * o «En venta»: con eso la tarjeta no dice nada. Si el título es vago, se
 * compone uno con lo que sí sabemos: tipo + zona + habitaciones.
 */
export function tituloBonito(p: Prospecto): string {
  // «Apartamento 4 de mayo / 2 Habitaciones / 2 Baños / …»: el vendedor mete la
  // ficha entera en el título. Se queda el primer tramo; el resto ya está en los
  // datos con icono.
  const t = p.tituloLimpio.trim().split(/\s+[\/|•·–—-]\s+/)[0].trim().slice(0, 70);
  const sinLugar = t.replace(/\b(isla de margarita|margarita|isla)\b/gi, '').trim();
  const vago = sinLugar.split(' ').filter(Boolean).length <= 3 && /^(casa|apartamento|apto|venta|vendo|se vende|en venta|oportunidad|bajo de precio|inmueble|propiedad|remodelad[oa]|[\s.]|de|la|el|en)+\.?$/i.test(sinLugar);
  if (!vago) return t;
  const tipo = /casa|villa|quinta|townhouse/i.test(t + ' ' + p.descripcion.slice(0, 120)) ? 'Casa' : /terreno|parcela/i.test(t) ? 'Terreno' : /posada|hotel/i.test(t) ? 'Posada' : 'Apartamento';
  const zona = p.zoneName ?? p.ciudad ?? 'Isla de Margarita';
  const hab = p.habitaciones ? ` · ${p.habitaciones} hab` : '';
  return `${tipo} en ${zona}${hab}`;
}

export function tipoDeProspecto(p: Prospecto): string {
  const t = p.tituloLimpio + ' ' + p.descripcion.slice(0, 160);
  if (/posada|hotel/i.test(p.tituloLimpio)) return 'Posada';
  if (/terreno|parcela|lote/i.test(p.tituloLimpio)) return 'Terreno';
  if (/local|oficina|galp[oó]n/i.test(p.tituloLimpio)) return 'Local comercial';
  if (/casa|villa|quinta|townhouse|town house/i.test(t)) return 'Casa';
  return 'Apartamento';
}

export function tarjetaDeProspecto(p: Prospecto): DatosTarjeta {
  return {
    href: `/en-venta/${p.slug}`, titulo: tituloBonito(p), foto: p.fotosLocales[0] ?? null, fotos: p.fotosLocales.length,
    zona: p.zoneName ?? p.ciudad ?? 'Isla de Margarita', tipo: tipoDeProspecto(p), precioUsd: p.precioUsd ?? 0, aConsultar: !p.precioUsd,
    habitaciones: p.habitaciones, banos: p.banos, m2: p.m2, nuevo: dias(p.vistoPrimero) <= 7,
  };
}

