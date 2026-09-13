import { NextResponse } from 'next/server';
import { getFeeds, sincronizarFeeds } from '@/lib/calendario';
import { autorizado } from '@/lib/calendario-secreto';

// Sincronización forzada de todos los feeds iCal. La llama el cron cada 10
// minutos (scripts/cron-calendario.sh) y sirve para probar a mano:
//   curl -H "Authorization: Bearer $CALENDARIO_SECRETO" https://margaritarenace.com.ve/api/calendario/sync
// Sin el secreto responde 404, como si no existiera.
export const dynamic = 'force-dynamic';

async function correr(req: Request) {
  if (!autorizado(req)) return new NextResponse(null, { status: 404 });
  await sincronizarFeeds(false);
  const feeds = await getFeeds();
  return NextResponse.json({
    ok: true,
    feeds: feeds.map((f) => ({ propiedad: f.propertyId, nombre: f.nombre, ok: f.syncOk, eventos: f.syncEventos, error: f.syncError, sync: f.syncAt })),
  }, { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}
export const GET = correr;
export const POST = correr;
