import Link from 'next/link';
import { ArrowUpRight, Home, Plus, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { getInventoryHealth, getProperties, getZones } from '@/lib/queries';
import { getAjustes } from '@/lib/settings';
import { MONEDAS, type Moneda, getTasas, tasaDe } from '@/lib/tasas';
import { Aviso, Cifra, Seccion, Tarjeta, Tasa } from './_ui';
import Conversor from './Conversor';
import { refrescarTasasAction } from './actions';

// Panel de inicio.
//
// ── POR QUÉ DEJÓ DE SER UN "RESUMEN" (2026-08-03) ─────────────────────────
// Era un INFORME: contaba el estado del inventario y no se podía hacer nada con
// él. Se leía una vez y se salía. Un panel que alguien abre todos los días tiene
// que servir para trabajar, no para enterarse.
//
// Y en este negocio el trabajo diario tiene una herramienta clarísima: la TASA.
// Se cobra en dólares y el cliente paga en bolívares, así que cada conversación
// de WhatsApp necesita la tasa del día — y hoy había que ir a buscarla afuera.
// Por eso las tasas y el conversor van ARRIBA, antes del inventario: es lo que
// se usa a diario, mientras el estado del inventario se revisa de vez en cuando.
//
// El modelo de tasas viene de Siberia, el otro producto del servidor. Ver
// lib/tasas.ts para qué se copió, qué no y por qué.

export const dynamic = 'force-dynamic';

function haceCuanto(d: Date | null): string {
  if (!d) return 'sin datos';
  const min = Math.round((Date.now() - d.getTime()) / 60_000);
  if (min < 1) return 'hace segundos';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
}

export default async function AdminHome() {
  const [health, properties, zones, ajustes, tasas] = await Promise.all([
    getInventoryHealth(),
    getProperties(),
    getZones(),
    getAjustes(),
    getTasas(),
  ]);

  const relleno = properties.filter((p) => !p.isReal);
  const sinWhatsApp = ajustes.whatsapp.trim() === '';

  // Se serializan las tasas para el conversor, que es componente cliente y no
  // puede recibir funciones ni abrir la base.
  const tasasCliente = Object.fromEntries(
    MONEDAS.map((m) => [m.key, tasaDe(m.key, tasas)]),
  ) as Record<Moneda, number | null>;

  return (
    <div>
      <header>
        <p className="text-meta font-semibold text-ink-subtle">Panel</p>
        <h1 className="mt-2 font-serif text-headline font-normal track-headline text-ink">
          Herramientas <em className="headline-italic">del día</em>
        </h1>
      </header>

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

      {/* ── Tasas ─────────────────────────────────────────────────────────── */}
      <Seccion
        id="tasas"
        titulo="Tasa"
        cursiva="de hoy"
        descripcion={`Actualizada ${haceCuanto(tasas.obtenidoAt)}. Se refresca sola cada 15 minutos.`}
        acciones={
          <form action={refrescarTasasAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-control border border-line bg-white px-3.5 py-2 text-meta font-medium text-ink-soft transition-colors hover:border-line-strong hover:text-brand"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>
          </form>
        }
      >
        {tasas.vencido && tasas.obtenidoAt && (
          <Aviso tono="error">
            No se pudo contactar a las fuentes en el último intento. Lo que ves es
            el último dato bueno, de {haceCuanto(tasas.obtenidoAt)} — confírmalo
            antes de cobrar con él.
          </Aviso>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* La de mercado va primera y destacada: es la que se usa para cobrar.
              La del BCV es la referencia legal, no el precio real de la calle. */}
          <Tasa
            etiqueta="Dólar de mercado"
            valor={tasas.mercado}
            fuente="Binance P2P · mediana de 10 ofertas"
            destacada
          />
          <Tasa
            etiqueta="Dólar BCV"
            valor={tasas.bcvUsd}
            fuente={`oficial · ${haceCuanto(tasas.bcvAt)}`}
          />
          <Tasa etiqueta="Euro BCV" valor={tasas.bcvEur} fuente="oficial" />
          <Tarjeta className="p-5">
            <p className="text-meta font-semibold text-ink-muted">Brecha</p>
            <p className="mt-2.5 font-mono text-[1.75rem] leading-none tabular-nums text-accent">
              {tasas.brecha === null
                ? '—'
                : `${tasas.brecha > 0 ? '+' : ''}${tasas.brecha.toLocaleString('es-VE', { maximumFractionDigits: 1 })}%`}
            </p>
            <p className="mt-2.5 text-ui text-ink-subtle">
              cuánto está el mercado sobre el BCV
            </p>
          </Tarjeta>
        </div>

        <p className="mt-4 text-meta text-ink-muted">
          Pago Móvil cotiza más bajo que el resto de los métodos:{' '}
          <span className="font-mono tabular-nums">
            {tasas.binancePm?.toLocaleString('es-VE', {
              maximumFractionDigits: 2,
            }) ?? '—'}
          </span>{' '}
          frente a{' '}
          <span className="font-mono tabular-nums">
            {tasas.binance?.toLocaleString('es-VE', {
              maximumFractionDigits: 2,
            }) ?? '—'}
          </span>
          . La tasa de arriba es el promedio de las dos.
        </p>
      </Seccion>

      {/* ── Conversor ─────────────────────────────────────────────────────── */}
      <Seccion
        id="conversor"
        titulo="Conversor"
        descripcion="Para decirle a un cliente cuántos bolívares son, sin salir del panel."
      >
        <Tarjeta className="p-6">
          <Conversor tasas={tasasCliente} monedas={MONEDAS} />
        </Tarjeta>
      </Seccion>

      {/* ── Acciones rápidas ──────────────────────────────────────────────── */}
      <Seccion id="acciones" titulo="Ir directo a">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              href: '/admin/propiedades/nueva',
              icono: Plus,
              titulo: 'Nueva propiedad',
              texto: 'Cargar un alojamiento y sus fotos',
            },
            {
              href: '/admin/propiedades',
              icono: Home,
              titulo: 'Editar inventario',
              texto: 'Precios, fotos, publicar y despublicar',
            },
            {
              href: '/admin/contenido',
              icono: ImageIcon,
              titulo: 'Contenido del sitio',
              texto: 'Portada, textos y datos de contacto',
            },
          ].map((a) => {
            const Icono = a.icono;
            return (
              <Link key={a.href} href={a.href} className="group">
                <Tarjeta className="h-full p-5 transition-all group-hover:border-brand/40 group-hover:shadow-lift-lg">
                  <span className="flex h-9 w-9 items-center justify-center rounded-control bg-brand-tint text-brand">
                    <Icono className="h-[18px] w-[18px]" />
                  </span>
                  <p className="mt-4 text-body font-semibold text-ink">
                    {a.titulo}
                  </p>
                  <p className="mt-1 text-meta text-ink-muted">{a.texto}</p>
                </Tarjeta>
              </Link>
            );
          })}
        </div>
      </Seccion>

      {/* ── Inventario ────────────────────────────────────────────────────── */}
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

      <Seccion id="inventario" titulo="Estado del" cursiva="inventario">
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
                      {/* El "desde" también en bolívares: es la cifra que la
                          dueña necesita decir por teléfono. */}
                      {z.minPrice !== null ? (
                        <>
                          US${z.minPrice}
                          {tasas.mercado && (
                            <span className="ml-2 text-ink-faint">
                              ≈{' '}
                              {(z.minPrice * tasas.mercado).toLocaleString(
                                'es-VE',
                                { maximumFractionDigits: 0 },
                              )}{' '}
                              Bs
                            </span>
                          )}
                        </>
                      ) : (
                        '—'
                      )}
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
    </div>
  );
}
