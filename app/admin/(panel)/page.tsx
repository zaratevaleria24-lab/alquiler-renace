import Link from 'next/link';
import { getInventoryHealth, getProperties, getZones } from '@/lib/queries';

// Resumen del panel.
//
// Muestra SOLO lo que se puede calcular de verdad hoy. El recolector de visitas
// aún no existe (paso 5 del plan), así que no hay tarjetas de "visitas" con
// ceros ni gráficas de ejemplo: un panel que muestra datos falsos es peor que
// uno que muestra menos, porque enseña a desconfiar de todo lo que hay en él.

export const dynamic = 'force-dynamic';

function Cifra({
  valor,
  etiqueta,
  nota,
  tono = 'normal',
}: {
  valor: number | string;
  etiqueta: string;
  nota?: string;
  tono?: 'normal' | 'aviso';
}) {
  return (
    <div className="rounded-card border border-line bg-white p-6">
      <p className="label-eyebrow text-ink-subtle">{etiqueta}</p>
      <p
        className={`mt-3 font-mono text-[2rem] leading-none tabular-nums ${
          tono === 'aviso' ? 'text-coral' : 'text-ink'
        }`}
      >
        {valor}
      </p>
      {nota && <p className="mt-3 text-meta text-ink-muted">{nota}</p>}
    </div>
  );
}

export default async function AdminHome() {
  const [health, properties, zones] = await Promise.all([
    getInventoryHealth(),
    getProperties(),
    getZones(),
  ]);

  const relleno = properties.filter((p) => !p.isReal);

  return (
    <div>
      <header>
        <p className="label-eyebrow text-ink-subtle">Resumen</p>
        <h1 className="mt-3 font-serif text-headline font-normal track-headline text-ink">
          Estado del <em className="headline-italic">inventario</em>
        </h1>
      </header>

      {/* El aviso va PRIMERO y no escondido en una pestaña: es el problema más
          caro que tiene el sitio ahora mismo. */}
      {health.relleno > 0 && (
        <section className="mt-10 rounded-card border border-coral/35 bg-coral/5 p-6 md:p-7">
          <h2 className="font-serif text-title font-normal track-title text-ink">
            Hay {health.relleno} listados de relleno publicados
          </h2>
          <div className="mt-4 space-y-3 text-body text-ink-soft">
            <p>
              Tienen anfitriones inventados, fotos de stock y valoraciones que no
              vienen de ninguna reseña. Es el mayor lastre de posicionamiento del
              sitio: el sistema de contenido útil de Google apunta justo a esto, y
              en respuestas de IA es peor, porque los motores que verifican datos
              descubren que esas propiedades no existen y dejan de citar el sitio.
            </p>
            <p className="text-meta text-ink-muted">
              Un sitio con {health.reales}{' '}
              {health.reales === 1 ? 'propiedad real' : 'propiedades reales'}{' '}
              posiciona mejor que uno con {health.publicadas} inventadas.
            </p>
          </div>
          <ul className="mono-data mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-ink-muted">
            {relleno.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
          <p className="mt-6">
            <Link href="/propiedades" className="btn-outline">
              Revisar propiedades
            </Link>
          </p>
        </section>
      )}

      <section className="mt-12">
        <h2 className="label-eyebrow text-ink-subtle">Inventario</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Cifra
            valor={health.publicadas}
            etiqueta="Publicadas"
            nota={
              health.total > health.publicadas
                ? `${health.total - health.publicadas} en borrador`
                : 'todas visibles en la web'
            }
          />
          <Cifra
            valor={health.reales}
            etiqueta="Inventario real"
            nota="marcadas como propiedad verdadera"
          />
          <Cifra
            valor={health.sinFotoPropia}
            etiqueta="Sin foto propia"
            tono={health.sinFotoPropia > 0 ? 'aviso' : 'normal'}
            nota="usan imágenes de stock, no del alojamiento"
          />
          <Cifra
            valor={health.vehiculos}
            etiqueta="Vehículos"
            nota={
              health.vehiculos === 0
                ? 'la estructura está lista, faltan los datos'
                : 'publicados'
            }
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="label-eyebrow text-ink-subtle">
          Zonas con inventario publicado
        </h2>
        <div className="mt-5 overflow-x-auto rounded-card border border-line bg-white">
          <table className="w-full min-w-[32rem] text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="label-eyebrow px-5 py-4 text-ink-subtle">Zona</th>
                <th className="label-eyebrow px-5 py-4 text-ink-subtle">
                  Alojamientos
                </th>
                <th className="label-eyebrow px-5 py-4 text-ink-subtle">Desde</th>
                <th className="label-eyebrow px-5 py-4 text-ink-subtle">Landing</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.slug} className="border-b border-line last:border-0">
                  <td className="px-5 py-4 text-body text-ink">{z.name}</td>
                  <td className="mono-data px-5 py-4 text-ink-muted">
                    {z.properties.length}
                  </td>
                  <td className="mono-data px-5 py-4 text-ink-muted">
                    {z.minPrice !== null ? `US$${z.minPrice}` : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <a
                      href={`https://margaritarenace.com.ve/alquiler/${z.slug}`}
                      target="_blank"
                      rel="noopener"
                      className="text-meta text-brand underline-offset-4 hover:underline"
                    >
                      /alquiler/{z.slug}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Honestidad sobre lo que todavía no mide. */}
      <section className="mt-12 rounded-card border border-line bg-paper-warm p-6 md:p-7">
        <h2 className="font-serif text-title font-normal track-title text-ink">
          Métricas de visitas: <em className="headline-italic">en camino</em>
        </h2>
        <p className="mt-4 max-w-2xl text-body text-ink-soft">
          El recolector propio todavía no está montado, así que esta sección no
          muestra tarjetas de visitas: preferimos no enseñar ceros ni datos de
          ejemplo. Cuando esté, medirá visitas por zona, propiedades más vistas,
          qué busca la gente en el buscador y clics de contacto — sin Google
          Analytics, porque en Venezuela sus recursos se bloquean y no cargaría
          para buena parte del público.
        </p>
      </section>
    </div>
  );
}
