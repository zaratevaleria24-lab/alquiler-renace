import Link from 'next/link';
import { ZONES } from '@/lib/listings';
import { CONTACT, SITE } from '@/lib/site';

// Footer del sitio. Deliberadamente pequeño: tres franjas finas y nada más.
//
// Se evitó el footer de cuatro columnas con enlaces inventados —"Nosotros",
// "Blog", "Términos"— que es el relleno típico y apunta a páginas que no
// existen. Los enlaces de zona sí valen la pena: son reales, y reparten enlazado
// interno hacia las 9 landings desde todas las páginas del sitio.
//
// Los datos de contacto aparecen solos cuando existan en lib/site.ts. Hoy están
// en null, así que esa franja simplemente no se renderiza en vez de mostrar un
// teléfono de relleno.

export function SiteFooter() {
  const year = 2026;

  return (
    <footer className="mt-0 border-t border-line bg-paper-warm">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-16">
        {/* Marca */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-serif text-title text-brand-deep">
              Margarita Renace
            </p>
            <p className="mt-2 max-w-md text-meta text-ink-muted">
              {SITE.shortDescription}
            </p>
          </div>

          {(CONTACT.whatsapp || CONTACT.email) && (
            <div className="flex flex-wrap gap-3">
              {CONTACT.whatsapp && (
                <a
                  className="btn-outline"
                  href={`https://wa.me/${CONTACT.whatsapp}`}
                  rel="noopener"
                >
                  WhatsApp
                </a>
              )}
              {CONTACT.email && (
                <a className="btn-outline" href={`mailto:${CONTACT.email}`}>
                  Escríbenos
                </a>
              )}
            </div>
          )}
        </div>

        {/* Zonas — enlazado interno real */}
        <nav aria-label="Zonas de la isla" className="mt-12 border-t border-line pt-8">
          <h2 className="label-eyebrow text-ink-subtle">Zonas de la isla</h2>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2.5">
            {ZONES.map((zone) => (
              <li key={zone.slug}>
                <Link
                  href={`/alquiler/${zone.slug}`}
                  className="text-meta text-ink-soft underline-offset-4 transition-colors hover:text-brand hover:underline"
                >
                  {zone.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Línea legal */}
        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-ui text-ink-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} Margarita Renace · {SITE.region.island},{' '}
            {SITE.region.state}
          </p>
          <p>Tarifas en dólares estadounidenses (US$)</p>
        </div>
      </div>
    </footer>
  );
}
