import Link from 'next/link';
import { Bath, BedDouble, Car, LandPlot, MapPin, Ruler, Share2 } from 'lucide-react';
import { SITE, absoluteUrl } from '@/lib/site';
import GaleriaInmueble, { type FotoGaleria } from './GaleriaInmueble';
import PrecioVenta from './PrecioVenta';
import { getTasas } from '@/lib/tasas';
import TarjetaVenta, { type DatosTarjeta } from './TarjetaVenta';

// Ficha de inmueble en venta: UNA sola para los propios y los de la isla.
// Patrón de las mejores referencias del rubro (Airbnb, Idealista, Compass):
// galería en mosaico arriba, datos duros con icono en una tira, descripción a
// la izquierda y a la derecha una tarjeta pegajosa con precio y acción. En
// móvil la acción baja a una barra fija al pie: el pulgar la alcanza siempre.

export interface DatosDetalle {
  titulo: string;
  tipo: string;
  zona: string;
  zoneSlug: string | null;
  ubicacion: string;
  ref: string;
  path: string;
  fotos: FotoGaleria[];
  precioUsd: number;
  aConsultar: boolean;
  habitaciones: number | null;
  banos: number | null;
  m2: number | null;
  m2Terreno: number | null;
  estacionamientos: number | null;
  descripcion: string;
  lat: number | null;
  lng: number | null;
  propio: boolean;
  dias: number;
  whatsapp: string | null;
  relacionados: DatosTarjeta[];
}

export default async function DetalleInmueble({ d }: { d: DatosDetalle }) {
  const tasas = await getTasas().catch(() => null);
  const url = absoluteUrl(d.path);
  const wa = d.whatsapp
    ? `https://wa.me/${d.whatsapp}?text=${encodeURIComponent(`Hola, me interesa «${d.titulo}» (${d.zona}, ref. ${d.ref}) que vi en ${url}. ¿Me pasan más información y coordinamos una visita?`)}`
    : null;
  const compartir = `https://wa.me/?text=${encodeURIComponent(`Mirá este inmueble en Margarita: ${d.titulo} — ${url}`)}`;
  const mapa = d.lat != null && d.lng != null
    ? `https://www.google.com/maps/search/?api=1&query=${d.lat},${d.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${d.ubicacion || d.zona}, Isla de Margarita`)}`;
  const precio = d.aConsultar || d.precioUsd <= 0 ? 'Consultar' : `US$ ${d.precioUsd.toLocaleString('es-VE')}`;

  const datos = [
    d.habitaciones != null && { icono: BedDouble, k: 'Habitaciones', v: String(d.habitaciones) },
    d.banos != null && { icono: Bath, k: 'Baños', v: String(d.banos) },
    d.m2 != null && { icono: Ruler, k: 'Construcción', v: `${d.m2} m²` },
    d.m2Terreno != null && { icono: LandPlot, k: 'Terreno', v: `${d.m2Terreno} m²` },
    d.estacionamientos != null && { icono: Car, k: 'Puestos', v: String(d.estacionamientos) },
  ].filter(Boolean) as { icono: typeof BedDouble; k: string; v: string }[];

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-0">
      <header className="max-w-6xl mx-auto px-5 pt-8 md:px-8 md:pt-12">
        <nav aria-label="Ruta de navegación" className="text-ui">
          <ol className="flex flex-wrap items-center gap-2 text-ink-muted">
            <li><Link href="/" className="hover:text-brand hover:underline underline-offset-4">Inicio</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/en-venta" className="hover:text-brand hover:underline underline-offset-4">En venta</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-ink">{d.zona}</li>
          </ol>
        </nav>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="label-eyebrow text-brand">
              {d.tipo} en venta · {d.zona}{d.propio ? ' · Verificado por Margarita Renace' : ''}
            </p>
            <h1 className="mt-2 font-serif text-display font-normal leading-[1.05] track-display text-ink">{d.titulo}</h1>
            {d.ubicacion && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-body text-ink-soft">
                <MapPin className="h-4 w-4 stroke-[1.6] text-brand" aria-hidden="true" />{d.ubicacion}, {SITE.region.island}
              </p>
            )}
          </div>
          <a href={compartir} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-chip border border-line bg-white px-3.5 py-2 text-ui font-medium text-brand-deep transition-all hover:border-ink hover:shadow-hard-sm">
            <Share2 className="h-4 w-4" aria-hidden="true" />Compartir
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8 md:px-8 md:py-10">
        <GaleriaInmueble fotos={d.fotos} titulo={d.titulo} />

        <div className="mt-12 grid gap-12 md:grid-cols-[1fr_22rem] lg:gap-16">
          <div className="min-w-0">
            {datos.length > 0 && (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {datos.map(({ icono: Icono, k, v }) => (
                  <li key={k} className="rounded-card border border-line bg-white p-4">
                    <Icono className="h-5 w-5 stroke-[1.6] text-brand" aria-hidden="true" />
                    <p className="mono-data mt-3 text-title-sm text-ink">{v}</p>
                    <p className="text-ui text-ink-muted">{k}</p>
                  </li>
                ))}
              </ul>
            )}

            <section aria-labelledby="sobre" className="mt-12">
              <h2 id="sobre" className="font-serif text-headline text-ink font-normal track-headline">Sobre este <em className="headline-italic">inmueble</em></h2>
              {d.descripcion ? (
                <p className="mt-5 max-w-prose whitespace-pre-line text-body text-ink/80 leading-relaxed">{d.descripcion}</p>
              ) : (
                <p className="mt-5 text-body text-ink/70">El anuncio no trae descripción. Escribinos y te pasamos detalles y más fotos.</p>
              )}
            </section>

            <section aria-labelledby="ubicacion" className="mt-12">
              <h2 id="ubicacion" className="font-serif text-headline text-ink font-normal track-headline">Ubicación</h2>
              <div className="mt-5 flex flex-wrap gap-3">
                <a href={mapa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-chip border border-line bg-white px-4 py-2.5 text-meta font-medium text-brand-deep transition-all hover:border-ink hover:shadow-hard-sm">
                  <MapPin className="h-4 w-4" aria-hidden="true" />{d.lat != null ? 'Ver en Google Maps' : 'Ver la zona en Google Maps'}
                </a>
                {d.zoneSlug && (
                  <Link href={`/alquiler/${d.zoneSlug}`} className="inline-flex items-center rounded-chip border border-line bg-white px-4 py-2.5 text-meta font-medium text-brand-deep transition-all hover:border-ink hover:shadow-hard-sm">
                    Cómo es {d.zona}
                  </Link>
                )}
              </div>
              {d.lat == null && <p className="mt-3 text-meta text-ink-muted">La dirección exacta se comparte al coordinar la visita.</p>}
            </section>
          </div>

          <aside className="hidden h-fit space-y-4 md:sticky md:top-6 md:block">
            <PrecioVenta usd={d.precioUsd} aConsultar={d.aConsultar} tasas={tasas} />
            {wa && <a href={wa} className="btn-solid w-full justify-center" rel="noopener">Me interesa · WhatsApp</a>}
            <p className="text-meta text-ink-muted">
              {d.propio
                ? `Inmueble representado por ${SITE.name}: documento de propiedad, catastro y solvencias verificados con el propietario.`
                : `Anuncio publicado en la isla y gestionado por ${SITE.name}: verificamos precio y papeles con el propietario y coordinamos la visita.`}
              {' '}Ref. {d.ref} · publicado hace {d.dias} {d.dias === 1 ? 'día' : 'días'}.
            </p>
          </aside>
        </div>

        {d.relacionados.length > 0 && (
          <section aria-labelledby="relacionados" className="section-gap">
            <h2 id="relacionados" className="font-serif text-headline text-ink font-normal track-headline">También <em className="headline-italic">en venta</em></h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {d.relacionados.map((r) => <TarjetaVenta key={r.href} d={r} tasas={tasas} />)}
            </ul>
          </section>
        )}
      </main>

      {/* Barra fija móvil: precio + acción siempre a mano */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 py-3 backdrop-blur-md md:hidden [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="mono-data text-title-sm text-brand-deep">{precio}</p>
            <p className="text-ui text-ink-muted">Ref. {d.ref}</p>
          </div>
          {wa && <a href={wa} className="btn-solid" rel="noopener">Me interesa</a>}
        </div>
      </div>
    </div>
  );
}
