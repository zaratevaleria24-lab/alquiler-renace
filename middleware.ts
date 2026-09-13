import { NextResponse, type NextRequest } from 'next/server';

import { CUERPO_410, FICHAS_RETIRADAS } from '@/lib/retiradas';

// Separación entre el sitio público y el panel, por subdominio.
//
// ═══════════════════════════════════════════════════════════════════════════
// POR QUÉ YA NO SE REESCRIBE (2026-08-03)
//
// Hasta hoy este middleware REESCRIBÍA: en admin.margaritarenace.com.ve la
// ruta '/' se servía internamente como '/admin', para que la barra de
// direcciones quedara limpia. Las rutas del panel eran '/', '/propiedades'…
//
// Funcionaba en una carga normal de página y FALLABA justo después del login.
// Reproducido en Chrome contra producción el 2026-08-03:
//     POST /login → 303 → acaba en '/' mostrando el SITIO PÚBLICO
//     (cargando '/' a mano con la misma sesión sí salía el panel)
//
// La causa: el formulario de login usa useActionState, así que el envío es una
// llamada a Server Action y el `redirect('/')` de dentro lo resuelve el
// enrutador del CLIENTE, no el navegador. Ese enrutador busca '/' en la tabla
// de rutas de la propia app —donde '/' ES el home público, una página estática
// que además se precarga— y la sirve sin volver a pasar por este middleware.
// La reescritura solo existe a nivel de petición; la caché del enrutador la
// esquiva.
//
// (Antes ya se había intentado la reescritura en nginx, con el mismo síntoma
// por una razón parecida: era invisible para el enrutador de Next.)
//
// Conclusión: mientras '/' signifique dos cosas distintas según el Host, el
// enrutador puede equivocarse. Así que el panel vive en rutas REALES bajo
// /admin y acá no se reescribe nada. La URL muestra /admin/propiedades — en un
// panel privado eso no molesta, y a cambio no hay ambigüedad posible.
// ═══════════════════════════════════════════════════════════════════════════

const HOST_PANEL = 'admin.margaritarenace.com.ve';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0] ?? '';
  const { pathname } = request.nextUrl;

  // ── Dominio público ───────────────────────────────────────────────────────
  // No se reescribe nada. Su vhost ya devuelve 404 para /admin, así que el
  // panel no es alcanzable por ahí.
  //
  // Lo único que se hace es PASAR LA RUTA en una cabecera, porque el layout
  // raíz la necesita y no puede leerla: un layout no recibe el pathname (Next
  // no se lo da a propósito, para poder reutilizarlo entre navegaciones). El
  // layout ya lee cabeceras para distinguir el panel del sitio, así que esto no
  // le cuesta un render dinámico que no estuviera pagando.
  //
  // Para qué: /enlaces —la página de la bio de Instagram— va sin el pie del
  // sitio, que ahí sería más largo que la propia página.
  if (host !== HOST_PANEL) {
    // ── Fichas eliminadas → 410 Gone ────────────────────────────────────────
    // El por qué está en lib/retiradas.ts. Se responde ACÁ y no en la página
    // porque notFound() de Next solo sabe emitir 404: el 410 hay que
    // escribirlo a mano y el middleware es la única capa que puede hacerlo.
    //
    // Se recorta la barra final por si acaso: el redirect de trailingSlash de
    // Next no ha corrido todavía a esta altura.
    const ficha = pathname.startsWith('/propiedad/')
      ? pathname.slice('/propiedad/'.length).replace(/\/$/, '')
      : '';
    if (ficha && FICHAS_RETIRADAS.has(ficha)) {
      return new NextResponse(CUERPO_410, {
        status: 410,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          // Que no se cachee un 410 en Cloudflare más de lo necesario: si
          // algún día se republicara un slug, no queremos la lápida pegada.
          'cache-control': 'public, max-age=3600',
        },
      });
    }

    // Google descubrió «/$» y «/&» (no salen de nuestro HTML): se mandan al
    // inicio con 301 para que las saque del índice en vez de acumular 404.
    if (pathname === '/$' || pathname === '/&' || pathname === '/%24' || pathname === '/%26') {
      return NextResponse.redirect('https://margaritarenace.com.ve/', 301);
    }
    const cabeceras = new Headers(request.headers);
    cabeceras.set('x-ruta', pathname);
    return NextResponse.next({ request: { headers: cabeceras } });
  }

  // ── Subdominio del panel ──────────────────────────────────────────────────
  // Solo existe el panel. Todo lo demás se manda a /admin en vez de servir el
  // sitio público en este host: evita tener la web duplicada en dos dominios
  // (contenido duplicado para Google) y que un enlace mal copiado deje a la
  // dueña mirando la página de un visitante.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();

  // Se preserva la ruta: admin…/propiedades → /admin/propiedades. Así un
  // marcador o un enlace guardado de antes del cambio sigue llevando al mismo
  // sitio en vez de dejar a la dueña en el resumen sin saber por qué.
  url.pathname = pathname === '/' ? '/admin' : `/admin${pathname}`;

  // ⚠️ HAY QUE FIJAR host Y protocol A MANO.
  //
  // En middleware, `request.nextUrl` trae el origen INTERNO —el de nginx hacia
  // Next— y no el que pidió el visitante, aunque el vhost mande bien la
  // cabecera Host. Comprobado el 2026-08-03 con la primera versión de este
  // redirect, que respondía:
  //     location: http://localhost:3002/admin
  // Un rewrite no lo notaba porque nunca sale a la red; un redirect SÍ, y el
  // navegador de la dueña habría intentado abrir localhost:3002 de SU máquina,
  // donde no hay nada. Reproducido igual pasando por nginx y llamando a Next
  // directo, así que es de Next, no del proxy.
  //
  // El esquema se fija en https y no se lee de X-Forwarded-Proto: ese vhost
  // manda 'http' a propósito (el tramo nginx→Next es plano) y el visitante
  // siempre llega por HTTPS, que terminan Cloudflare y nginx.
  url.host = host;
  url.protocol = 'https:';
  url.port = '';
  return NextResponse.redirect(url);
}

export const config = {
  // Se excluyen estáticos y archivos de metadatos: pasan miles de peticiones
  // por ahí y no necesitan pasar por acá.
  matcher: [
    '/((?!_next/static|_next/image|uploads|images|properties|favicon.ico|icon.png|apple-icon.png|logo|robots.txt|sitemap.xml|llms.txt|opengraph-image).*)',
  ],
};
