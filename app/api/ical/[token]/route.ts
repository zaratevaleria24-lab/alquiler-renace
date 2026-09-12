import { NextResponse } from 'next/server';
import { getExportacionIcal } from '@/lib/calendario';
import { generarIcs } from '@/lib/ical';

// Exportación iCal por propiedad: la URL que se pega en Airbnb
// (Calendario → Disponibilidad → Conectar otro sitio web → Importar).
//
// El token es un secreto de 32 hex por propiedad (columna ical_token): la URL
// funciona sin sesión porque quien la consume es el servidor de Airbnb, y el
// secreto es lo único que impide que cualquiera lea el calendario en crudo.
// Regenerar el token = revocar la URL.

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const exportacion = await getExportacionIcal(token);
  if (!exportacion) {
    return NextResponse.json({ error: 'no existe' }, { status: 404 });
  }

  return new NextResponse(generarIcs(exportacion.nombre, exportacion.eventos), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="margarita-renace.ics"',
      // Airbnb consulta cada varias horas; 5 minutos de caché absorben
      // reintentos sin dejar el dato viejo de verdad.
      'Cache-Control': 'private, max-age=300',
      'X-Robots-Tag': 'noindex',
    },
  });
}
