import Link from 'next/link';
import { getZones } from '@/lib/queries';
import { SITE } from '@/lib/site';
import { getContacto } from '@/lib/settings';

// Footer del sitio. Deliberadamente pequeño: dos franjas finas y nada más.
//
// Se evitó el footer de cuatro columnas con enlaces inventados —"Nosotros",
// "Blog", "Términos"— que es el relleno típico y apunta a páginas que no
// existen. Los enlaces de zona sí valen la pena: son reales, y reparten enlazado
// interno hacia las landings publicadas desde todas las páginas del sitio.
//
// Los datos de contacto aparecen solos en cuanto se guarden en /admin/contenido.
// Mientras no existan, esa franja simplemente no se renderiza, en vez de mostrar
// un teléfono de relleno.
//
// COMPACTADO EL 2026-08-11, en dos pasadas. Llegó a medir ~500px de alto para
// 44 palabras y seis enlaces: tres bloques apilados, tres separadores y saltos
// de 48/32/40px. Al bajar el inventario a 4 alojamientos las zonas pasaron de 9
// a 4 y quedó siendo casi todo aire.
//
// Ahora son DOS FILAS y un solo separador:
//   1. marca + descripción en una línea · todos los enlaces a la derecha
//   2. línea legal
//
// Los rótulos "Zonas de la isla" y "Secciones" se quitaron de la vista —cada
// nav conserva su `aria-label`, así que el lector de pantalla los sigue
// distinguiendo—. Eran dos encabezados para seis enlaces: más andamiaje que
// contenido, y de ahí salía buena parte del alto.
//
// Los enlaces NO se tocaron: son enlazado interno real hacia las landings de
// zona y hacia /autos desde todas las páginas, y quitarlos costaría rastreo.
// Lo que se redujo es el espacio, no el contenido.

export async function SiteFooter() {
  const CONTACT = await getContacto();
  // Server Component: consulta directa. Va en el layout, así que las zonas
  // aparecen en el footer de TODAS las páginas y su enlazado interno viaja con él.
  const zones = await getZones();
  const year = 2026;

  const enlace =
    'text-meta text-ink-soft underline-offset-4 transition-colors hover:text-brand hover:underline';

  return (
    <footer className="mt-0 border-t border-line bg-paper-warm">
      <div className="mx-auto max-w-7xl px-5 py-7 md:px-8 md:py-8">
        {/* Fila 1: marca a la izquierda, todos los enlaces a la derecha */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-10">
          <p className="text-meta text-ink-muted">
            <span className="font-serif text-ink">Margarita Renace</span>
            <span className="mx-2 text-ink-faint">·</span>
            {SITE.shortDescription}
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {/* Va en el layout, así que /autos queda enlazada desde TODAS las
                páginas: sin esto solo la alcanzaría el menú del home y sería
                casi huérfana para los rastreadores. */}
            <nav aria-label="Secciones" className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href="/" className={enlace}>
                Apartamentos
              </Link>
              <Link href="/autos" className={enlace}>
                Alquiler de carros
              </Link>
              <Link href="/en-venta" className={enlace}>
                En venta
              </Link>
              <Link href="/reservas" className={enlace}>
                Reservar
              </Link>
              <Link href="/nosotros" className={enlace}>
                Quiénes somos
              </Link>
              <Link href="/politicas" className={enlace}>
                Políticas
              </Link>
              <Link href="/guia" className={enlace}>
                Guía turística
              </Link>
            </nav>

            <span aria-hidden="true" className="hidden h-3 w-px bg-line-strong sm:block" />

            <nav aria-label="Zonas de la isla" className="flex flex-wrap gap-x-5 gap-y-2">
              {zones.map((zone) => (
                <Link key={zone.slug} href={`/alquiler/${zone.slug}`} className={enlace}>
                  {zone.name}
                </Link>
              ))}
            </nav>

            {(CONTACT.whatsapp || CONTACT.email) && (
              <>
                <span aria-hidden="true" className="hidden h-3 w-px bg-line-strong sm:block" />
                {/* Enlaces, no botones: un `btn-outline` acá volvía a meter peso
                    justo donde se está quitando. */}
                {CONTACT.whatsapp && (
                  <a className={enlace} href={`https://wa.me/${CONTACT.whatsapp}`} rel="noopener">
                    WhatsApp
                  </a>
                )}
                {CONTACT.email && (
                  <a className={enlace} href={`mailto:${CONTACT.email}`}>
                    Escríbenos
                  </a>
                )}
              </>
            )}
          </div>
        </div>

        {/* Fila 2: línea legal */}
        <div className="mt-5 flex flex-col gap-1 border-t border-line pt-4 text-micro text-ink-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} Margarita Renace · {SITE.region.island},{' '}
            {SITE.region.state}
          </p>
          <p>Tarifas en US$</p>
        </div>
      </div>
    </footer>
  );
}
