import { RefreshCw } from 'lucide-react';
import { getInventoryHealth } from '@/lib/queries';
import { MONEDAS, type Moneda, getTasas, tasaDe } from '@/lib/tasas';
import { Aviso, Cifra, Seccion, Tarjeta, Tasa } from './_ui';
import Conversor from './Conversor';
import { refrescarTasasAction } from './actions';

// Inicio del panel: HERRAMIENTAS, no informe.
//
// ── QUÉ SE QUITÓ DE ACÁ Y POR QUÉ (2026-08-03) ────────────────────────────
// Era un resumen que contaba cosas y no dejaba hacer nada. Se recortó a lo que
// se usa a diario:
//
//   · El aviso de «falta tu WhatsApp» se fue a /admin/contenido, que es donde se
//     arregla. Acá ocupaba media pantalla todos los días para decir algo que no
//     se podía atender desde donde estaba. En la lateral quedó un punto en el
//     icono de Contenido, que basta.
//   · El aviso de los listados de relleno se fue a /admin/propiedades, que es
//     donde se actúa sobre ellos.
//   · Los accesos directos se fueron: la lateral ya es la navegación y tenerlos
//     dos veces solo alargaba la página.
//   · La tabla de zonas se fue: es un informe, no una herramienta.
//
// Queda la TASA y el CONVERSOR arriba —se cobra en dólares y el cliente paga en
// bolívares, así que es lo que se necesita en cada conversación— y las cuatro
// cifras del inventario abajo, de un vistazo.
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

const bs = (n: number, dec = 2) =>
  n.toLocaleString('es-VE', { maximumFractionDigits: dec });

export default async function AdminHome() {
  const [health, tasas] = await Promise.all([getInventoryHealth(), getTasas()]);

  // Se serializan las tasas para el conversor, que es componente cliente y no
  // puede abrir la base.
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

      <Seccion
        id="tasas"
        titulo="Tasa"
        cursiva="de hoy"
        descripcion={`Actualizada ${haceCuanto(tasas.obtenidoAt)}. Se refresca sola cada 15 minutos.`}
        acciones={
          <form action={refrescarTasasAction}>
            <button
              type="submit"
              title="Traer la tasa de ahora mismo"
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
              La del BCV es la referencia legal, no el precio de la calle. */}
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
                : `${tasas.brecha > 0 ? '+' : ''}${bs(tasas.brecha, 1)}%`}
            </p>
            <p className="mt-2.5 text-ui text-ink-subtle">
              el mercado sobre el BCV
            </p>
          </Tarjeta>
        </div>

        <p className="mt-4 text-meta text-ink-muted">
          Pago Móvil cotiza más bajo que el resto de los métodos:{' '}
          <span className="font-mono tabular-nums">
            {tasas.binancePm ? bs(tasas.binancePm) : '—'}
          </span>{' '}
          frente a{' '}
          <span className="font-mono tabular-nums">
            {tasas.binance ? bs(tasas.binance) : '—'}
          </span>
          . La tasa de arriba es el promedio de las dos.
        </p>
      </Seccion>

      <Seccion
        id="conversor"
        titulo="Conversor"
        descripcion="Para decirle a un cliente cuántos bolívares son, sin salir del panel."
      >
        <Tarjeta className="p-6">
          <Conversor tasas={tasasCliente} monedas={MONEDAS} />
        </Tarjeta>
      </Seccion>

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
            nota={
              health.relleno > 0
                ? `${health.relleno} de relleno publicados`
                : 'todo verdadero'
            }
            tono={health.relleno > 0 ? 'aviso' : 'normal'}
          />
          <Cifra
            valor={health.sinFotoPropia}
            etiqueta="Sin foto propia"
            tono={health.sinFotoPropia > 0 ? 'aviso' : 'normal'}
            nota="usan imágenes de stock"
          />
          <Cifra
            valor={health.vehiculos}
            etiqueta="Vehículos"
            nota={
              health.vehiculos === 0 ? 'faltan los datos' : 'publicados'
            }
          />
        </div>
      </Seccion>
    </div>
  );
}
