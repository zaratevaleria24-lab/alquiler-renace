// Fechas de estadía, sin zona horaria del dispositivo ni fechas de ejemplo.
export function hoyReserva(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Caracas', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
export function fechaValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const ms = Date.parse(`${fecha}T00:00:00Z`);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === fecha;
}
export function sumarNoches(fecha: string, noches: number): string {
  if (!fechaValida(fecha) || !Number.isInteger(noches)) return '';
  return new Date(Date.parse(`${fecha}T00:00:00Z`) + noches * 86_400_000).toISOString().slice(0, 10);
}
export function nochesEntre(llegada: string, salida: string): number {
  if (!fechaValida(llegada) || !fechaValida(salida)) return 0;
  return Math.max(0, (Date.parse(`${salida}T00:00:00Z`) - Date.parse(`${llegada}T00:00:00Z`)) / 86_400_000);
}
export function fechasDeBusqueda(q: URLSearchParams, minimo = 1, hoy = hoyReserva()) {
  const checkIn = q.get('llegada') ?? '', checkOut = q.get('salida') ?? '';
  const noches = nochesEntre(checkIn, checkOut);
  return checkIn >= hoy && noches >= minimo ? { checkIn, checkOut, noches } : null;
}
export function consultaReserva(llegada: string, salida: string, personas: number): string {
  const q = new URLSearchParams();
  if (nochesEntre(llegada, salida) > 0 && llegada >= hoyReserva()) { q.set('llegada', llegada); q.set('salida', salida); }
  if (Number.isInteger(personas) && personas > 0) q.set('personas', String(personas));
  return q.size ? `?${q}` : '';
}

export interface DisponibilidadPublica {
  hoy: string;
  ocupado: { desde: string; hasta: string }[];
  sincronizado: boolean;
  actualizado: string | null;
}
/** Una respuesta vacía o un error nunca equivale a fechas disponibles. */
export function leerDisponibilidad(valor: unknown): DisponibilidadPublica | null {
  if (!valor || typeof valor !== 'object') return null;
  const d = valor as Partial<DisponibilidadPublica>;
  if (typeof d.hoy !== 'string' || !fechaValida(d.hoy) || !Array.isArray(d.ocupado)) return null;
  if (!d.ocupado.every((r) => r && typeof r.desde === 'string' && typeof r.hasta === 'string' && fechaValida(r.desde) && fechaValida(r.hasta) && r.hasta > r.desde)) return null;
  return { hoy: d.hoy, ocupado: d.ocupado, sincronizado: d.sincronizado === true, actualizado: typeof d.actualizado === 'string' ? d.actualizado : null };
}
