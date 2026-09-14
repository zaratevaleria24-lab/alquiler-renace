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
      query?: unknown;
      ref?: unknown;
      kind?: unknown;
      propertyId?: unknown;
      meta?: unknown;
    };

    const path = typeof body.path === 'string' ? body.path : '/';
    const datos = {
      path,
      // LA PROCEDENCIA LA MANDA EL NAVEGADOR, no la cabecera. El aviso sale de
      // la propia página, así que su `Referer` es esa misma página y nunca el
      // sitio que enlazó — por eso `referrer_host` estuvo siempre vacío hasta
      // hoy. `document.referrer` sí guarda de dónde vino la persona, y no
      // cambia al navegar dentro del sitio, que es justo lo que hace falta para
      // atribuir la visita a su origen. La cabecera queda de respaldo.
      referrer:
        (typeof body.ref === 'string' && body.ref.slice(0, 500)) ||
        request.headers.get('referer'),
      // Solo la cola de parámetros, recortada. Se clasifica en el servidor y se
      // guarda únicamente la etiqueta resultante.
      query: typeof body.query === 'string' ? body.query.slice(0, 300) : null,
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
        // internet. Solo `q` —lo que se buscó, o el slug del enlace tocado— y
        // recortado.
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
