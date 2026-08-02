import { NextResponse, type NextRequest } from 'next/server';

// Enrutado por subdominio: admin.margaritarenace.com.ve sirve las rutas /admin
// del mismo proceso, con la URL del navegador limpia.
//
// ═══════════════════════════════════════════════════════════════════════════
// POR QUÉ ESTO TIENE QUE VIVIR EN NEXT Y NO EN NGINX
//
// Se intentó primero con `rewrite` en nginx. Sirve la primera carga, pero rompe
// la navegación: la reescritura de nginx es INVISIBLE para el enrutador de Next.
// Tras el login, `redirect('/')` provoca una navegación del lado del cliente;
// Next resuelve '/' contra SU tabla de rutas, donde '/' es el home público, y
// mostraba el sitio web en vez del panel. Es exactamente el síntoma que se vio:
// "me lleva a la web".
//
// Con un rewrite de middleware, Next lo aplica también a las peticiones RSC de
// las navegaciones cliente, así que servidor y cliente coinciden.
//
// El primer intento de middleware dio 500 con "wrong version number" de OpenSSL:
// el vhost enviaba `X-Forwarded-Proto: https`, Next daba la reescritura por
// EXTERNA e intentaba un fetch a https://localhost:3002, que habla HTTP plano.
// Esa cabecera se quitó del vhost del panel; la cookie de sesión no la
// necesitaba porque lleva `secure: true` explícito.
// ═══════════════════════════════════════════════════════════════════════════

const HOST_PANEL = 'admin.margaritarenace.com.ve';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0] ?? '';

  // Dominio público: no se toca. Su vhost ya devuelve 404 para /admin, así que
  // el panel no es alcanzable por ahí.
  if (host !== HOST_PANEL) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Ya viene con prefijo: se deja pasar para no acabar en /admin/admin.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === '/' ? '/admin' : `/admin${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Se excluyen estáticos y archivos de metadatos: pasan miles de peticiones por
  // ahí y no necesitan reescritura.
  matcher: [
    '/((?!_next/static|_next/image|uploads|images|properties|favicon.ico|icon.png|apple-icon.png|logo|robots.txt|sitemap.xml|llms.txt|opengraph-image).*)',
  ],
};
