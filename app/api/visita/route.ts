import { NextResponse, type NextRequest } from 'next/server';
import {
  EVENTOS,
  type Evento,
  registrarEvento,
  registrarVisita,
} from '@/lib/metricas';

// Endpoint del recolector propio de métricas.
//
// POR QUÉ SE MIDE DESDE EL NAVEGADOR Y NO EN EL SERVIDOR: el sitio es estático y
// lo sirve nginx cacheado, así que muchas peticiones nunca llegan a Node. Pero
// el motivo bueno es otro: un aviso disparado con JavaScript **descarta solos a
// los rastreadores**, que no lo ejecutan. Contar en el servidor daría cifras
// infladas de bots justo en un sitio que invita a los crawlers de IA a entrar.
//
// Responde 204 siempre. Un contador de visitas no puede romperle la página a
// nadie ni retrasarla: si algo falla, se registra en el log del servidor y el
// visitante no se entera.

export const dynamic = 'force-dynamic';

/** La IP solo se usa para calcular el hash del día; nunca se guarda. */
function ipDelVisitante(request: NextRequest): string {
  const h = request.headers;
  return (
    h.get('cf-connecting-ip') ??
    h.get('x-real-ip') ??
    h.get('x-forwarded-for')?.split(',')[0].trim() ??
    'desconocida'
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      path?: unknown;
      kind?: unknown;
      propertyId?: unknown;
      meta?: unknown;
    };

    const path = typeof body.path === 'string' ? body.path : '/';
    const datos = {
      path,
      referrer: request.headers.get('referer'),
      ip: ipDelVisitante(request),
      ua: request.headers.get('user-agent') ?? '',
      // Cloudflare la manda en cada petición y no cuesta nada: país sin
      // consultar ningún servicio externo, que además en Venezuela podría no
      // cargar. Ciudad exigiría una base geográfica local (pendiente).
      pais: request.headers.get('cf-ipcountry') ?? null,
    };

    const kind = typeof body.kind === 'string' ? body.kind : null;
    if (kind && (EVENTOS as readonly string[]).includes(kind)) {
      await registrarEvento(kind as Evento, {
        ...datos,
        propertyId:
          typeof body.propertyId === 'string' ? body.propertyId : null,
        // Se acota lo que se guarda en meta: es un campo libre expuesto a
        // internet. Solo `q` (lo que se buscó) y recortado.
        meta:
          body.meta && typeof body.meta === 'object'
            ? { q: String((body.meta as { q?: unknown }).q ?? '').slice(0, 120) }
            : {},
      });
    } else {
      await registrarVisita(datos);
    }
  } catch (err) {
    console.error('[visita] no se pudo registrar:', err);
  }

  return new NextResponse(null, { status: 204 });
}
