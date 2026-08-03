import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getInventoryHealth, getProperties, getZones } from '@/lib/queries';
import { getAjustes } from '@/lib/settings';
import { Aviso, Cifra, Seccion, Tarjeta } from './_ui';

// Resumen del panel.
//
// Muestra SOLO lo que se puede calcular de verdad hoy. El recolector de visitas
// aún no existe (paso 5 del plan), así que no hay tarjetas de "visitas" con
// ceros ni gráficas de ejemplo: un panel que muestra datos falsos es peor que
// uno que muestra menos, porque enseña a desconfiar de todo lo que hay en él.

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const [health, properties, zones, ajustes] = await Promise.all([
    getInventoryHealth(),
    getProperties(),
    getZones(),
    getAjustes(),
  ]);

  const relleno = properties.filter((p) => !p.isReal);
  const sinWhatsApp = ajustes.whatsapp.trim() === '';

  return (
    <div>
      <header>
        <p className="text-meta font-semibold text-ink-subtle">Resumen</p>
        <h1 className="mt-2 font-serif text-headline font-normal track-headline text-ink">
          Estado del <em className="headline-italic">inventario</em>
        </h1>
      </header>

      {/* El WhatsApp va PRIMERO cuando falta: sin él la web no tiene ninguna
          forma de que un interesado escriba, así que es más urgente incluso que
          los listados de relleno. */}
      {sinWhatsApp && (
        <Aviso tono="atencion" titulo="Falta tu WhatsApp">
          <p>
            Los botones de «Reservar» del sitio están apagados porque no hay a
            dónde escribir. Es el cambio que más mueve la aguja y toma un minuto.
          </p>
          <p className="mt-4">
            <Link href="/admin/contenido" className="btn-solid">
              Poner mi WhatsApp
            </Link>
          </p>
        </Aviso>
      )}

      {health.relleno > 0 && (
        <Aviso
          tono="error"
          titulo={`Hay ${health.relleno} listados de relleno publicados`}
        >
          <p>
            Tienen anfitriones inventados, fotos de stock y valoraciones que no
            vienen de ninguna reseña. Es el mayor lastre de posicionamiento del
            sitio: el sistema de contenido útil de Google apunta justo a esto, y
            en respuestas de IA es peor, porque los motores que verifican datos
            descubren que esas propiedades no existen y dejan de citar el sitio.
          </p>
          <p className="mt-3 text-meta text-ink-muted">
            Un sitio con {health.reales}{' '}
            {health.reales === 1 ? 'propiedad real' : 'propiedades reales'}{' '}
            posiciona mejor que uno con {health.publicadas} inventadas.
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-meta text-ink-muted">
            {relleno.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
          <p className="mt-5">
            <Link href="/admin/propiedades" className="btn-outline">
              Revisar propiedades
            </Link>
          </p>
        </Aviso>
      )}

      <Seccion id="inventario" titulo="Inventario">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      </Seccion>

      <Seccion
        id="zonas"
        titulo="Zonas con"
        cursiva="inventario publicado"
        descripcion="Cada zona con al menos un alojamiento tiene su propia página en la web."
      >
        <Tarjeta className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left">
              <thead>
                <tr className="border-b border-line bg-paper/40">
                  <th className="px-5 py-3.5 text-meta font-semibold text-ink-muted">
                    Zona
                  </th>
                  <th className="px-5 py-3.5 text-meta font-semibold text-ink-muted">
                    Alojamientos
                  </th>
                  <th className="px-5 py-3.5 text-meta font-semibold text-ink-muted">
                    Desde
                  </th>
                  <th className="px-5 py-3.5 text-meta font-semibold text-ink-muted">
                    Página
                  </th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <tr
                    key={z.slug}
                    className="border-b border-line/70 transition-colors last:border-0 hover:bg-paper/40"
                  >
                    <td className="px-5 py-3.5 text-body text-ink">{z.name}</td>
                    <td className="px-5 py-3.5 font-mono text-ui tabular-nums text-ink-muted">
                      {z.properties.length}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-ui tabular-nums text-ink-muted">
                      {z.minPrice !== null ? `US$${z.minPrice}` : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <a
                        href={`https://margaritarenace.com.ve/alquiler/${z.slug}`}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center gap-1.5 text-meta text-brand underline-offset-4 hover:underline"
                      >
                        /alquiler/{z.slug}
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tarjeta>
      </Seccion>

      {/* Honestidad sobre lo que todavía no mide. */}
      <Seccion id="metricas" titulo="Métricas de visitas" cursiva="en camino">
        <Tarjeta className="p-6">
          <p className="max-w-2xl text-body text-ink-soft">
            El recolector propio todavía no está montado, así que esta sección no
            muestra tarjetas de visitas: preferimos no enseñar ceros ni datos de
            ejemplo. Cuando esté, medirá visitas por zona, propiedades más
            vistas, qué busca la gente en el buscador y clics de contacto — sin
            Google Analytics, porque en Venezuela sus recursos se bloquean y no
            cargaría para buena parte del público.
          </p>
        </Tarjeta>
      </Seccion>
    </div>
  );
}
