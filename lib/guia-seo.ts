// Presentación editorial: no atribuir al autor una visita o una revisión que
// la fecha de sincronización de Google Places no acredita.
export function descripcionGuia(nombre: string, descripcion: string): string {
  const texto = `${nombre}: ${descripcion}`.replace(/\s+/g, ' ').trim();
  if (texto.length <= 165) return texto;
  const corte = texto.slice(0, 162);
  const espacio = corte.lastIndexOf(' ');
  return `${corte.slice(0, espacio > 100 ? espacio : corte.length).replace(/[.,;:!?]$/, '')}…`;
}

export function requiereCruceMaritimo(slug: string): boolean {
  return /(^|[-])(coche|cubagua|frailes)([-]|$)/.test(slug);
}

export function fechaDatosGuia(fecha: string | null): string | null {
  if (!fecha) return null;
  const d = new Date(fecha);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Caracas' });
}
