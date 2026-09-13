import { NextResponse } from 'next/server';
import { usuarioActual } from '@/lib/auth';
import { listarContactos } from '@/lib/contactos';
// CSV para importar en la herramienta de correo que se use.
export const dynamic = 'force-dynamic';
export async function GET() {
  if (!(await usuarioActual())) return new NextResponse('No autorizado', { status: 401 });
  const filas = await listarContactos();
  const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = ['nombre,email,telefono,cupon,origen,pagina,utm_source,utm_campaign,consentimiento,fecha', ...filas.map((c) => [c.nombre, c.email, c.telefono, c.cupon, c.origen, c.pagina, c.utm.utm_source ?? '', c.utm.utm_campaign ?? '', c.consentimiento ? 'si' : 'no', c.createdAt.slice(0, 10)].map(esc).join(','))].join('\n');
  return new NextResponse('\ufeff' + csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="contactos-margarita-renace-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
