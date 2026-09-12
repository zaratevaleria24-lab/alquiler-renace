import Link from 'next/link';
import { SITE } from '@/lib/site';
import { textoPublico, type Prospecto } from '@/lib/ventas';
import PrecioVenta from '@/components/PrecioVenta';

// Ficha pública de un anuncio de Marketplace. Lo que NO lleva, a propósito:
// el teléfono del vendedor, su nombre ni el enlace a Facebook. El visitante
// escribe a Margarita Renace, que es quien gestiona el contacto: ese es el
// negocio. El texto pasa por textoPublico(), que quita teléfonos, correos y
// enlaces del anuncio original.

export default function FichaProspecto({ p, whatsapp }: { p: Prospecto; whatsapp: string | null }) {
  const zona = p.zoneName ?? p.ciudad ?? 'Isla de Margarita';
  const ref = `M-${p.fbId.slice(-6)}`;
  const wa = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hola, me interesa «${p.tituloLimpio}» (${zona}, ref. ${ref}) que vi en margaritarenace.com.ve/en-venta. ¿Me pasan más información y coordinamos una visita?`)}`
    : null;
  const mapa = p.latitud != null && p.longitud != null
    ? `https://www.google.com/maps/search/?api=1&query=${p.latitud},${p.longitud}`
    : null;
  const ficha = [
    p.habitaciones != null && ['Habitaciones', String(p.habitaciones)],
    p.banos != null && ['Baños', String(p.banos)],
    p.m2 != null && ['Superficie', `${p.m2} m²`],
    p.municipio && ['Municipio', p.municipio],
  ].filter(Boolean) as [string, string][];
  const [portada, ...resto] = p.fotosLocales;
  const texto = textoPublico(p.descripcion);

  return (
    <div className="min-h-screen bg-paper">
      <header className="relative bg-brand-deep text-white">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-accent" />
        <div className="max-w-5xl mx-auto px-5 py-14 md:px-8 md:py-20">
          <nav aria-label="Ruta de navegación" className="mb-8 text-ui">
            <ol className="flex flex-wrap items-center gap-2 text-white/80">
              <li><Link href="/" className="underline hover:text-white">Inicio</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/en-venta" className="underline hover:text-white">En venta</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-white">{p.tituloLimpio}</li>
            </ol>
          </nav>
          <p className="label-eyebrow mb-4 text-accent">En venta · {zona} · {SITE.region.island} · ref. {ref}</p>
          <h1 className="font-serif text-display font-normal leading-[1.05] track-display max-w-3xl">{p.tituloLimpio}</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-16 md:px-8 md:py-24">
        {portada && (
          <section aria-label="Fotos del inmueble">
            <div className="overflow-hidden rounded-card border border-line">
              <img src={portada} alt={`${p.tituloLimpio} — en venta en ${zona}, Isla de Margarita`} width={1200} height={800} fetchPriority="high" decoding="async" className="aspect-[3/2] w-full object-cover" />
            </div>
            {resto.length > 0 && (
              <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {resto.map((f, idx) => (
                  <li key={f} className="overflow-hidden rounded-card border border-line">
                    <img src={f} alt={`Foto ${idx + 2} de ${p.tituloLimpio}`} width={400} height={300} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className="mt-14 grid gap-12 md:grid-cols-[1fr_22rem]">
          <div>
            {ficha.length > 0 && (
              <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                {ficha.map(([k, v]) => (
                  <div key={k} className="rounded-card border border-line bg-white p-4">
                    <dt className="label-eyebrow text-ink-subtle">{k}</dt>
                    <dd className="mono-data mt-1.5 text-title-sm text-brand-deep">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
            <h2 className="mt-10 font-serif text-headline text-ink font-normal track-headline">Sobre este inmueble</h2>
            {texto ? (
              <p className="mt-5 whitespace-pre-line text-body text-ink/80 leading-relaxed">{texto}</p>
            ) : (
              <p className="mt-5 text-body text-ink/70">El anuncio no trae descripción. Escribinos y te pasamos los detalles y más fotos.</p>
            )}
            <p className="mt-8 text-body">
              {mapa && (<><a href={mapa} target="_blank" rel="noopener noreferrer" className="text-brand-deep underline underline-offset-4">Ver la ubicación aproximada en Google Maps</a>{' · '}</>)}
              {p.zoneSlug && <Link href={`/alquiler/${p.zoneSlug}`} className="text-brand-deep underline underline-offset-4">Cómo es {p.zoneName}</Link>}
            </p>
          </div>
          <aside className="h-fit space-y-4 md:sticky md:top-6">
            <PrecioVenta usd={p.precioUsd ?? 0} aConsultar={!p.precioUsd} />
            {wa && <a href={wa} className="btn-solid w-full justify-center" rel="noopener">Me interesa · WhatsApp</a>}
            <p className="text-meta text-ink-muted">
              Anuncio publicado en la isla y gestionado por {SITE.name}: verificamos con el propietario
              el precio, los papeles y coordinamos la visita. Publicado hace {Math.max(1, Math.round((Date.now() - p.vistoPrimero.getTime()) / 86400e3))} día(s).
            </p>
          </aside>
        </section>
      </main>
    </div>
  );
}
