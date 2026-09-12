import { TrendingUp } from 'lucide-react';
import { getCrecimiento, type MesCrecimiento } from '@/lib/crecimiento';
import { Cifra, Seccion, Tarjeta } from '../_ui';

// Crecimiento del negocio, mes a mes: la pantalla para enseñarle a un
// inversionista — ingresos, noches vendidas, estadías y ocupación.
//
// SIN LIBRERÍA DE GRÁFICOS, igual que métricas: son columnas mensuales y un
// SVG del servidor las dibuja sin sumar un byte de JavaScript. Reglas que se
// siguen a propósito (y conviene no romper al tocar esto):
//   · UNA métrica por gráfica, un solo eje. Ingresos y noches tienen escalas
//     distintas; mezclarlas con dos ejes es el clásico gráfico mentiroso.
//   · Serie única en el teal de la marca; la identidad no necesita paleta.
//   · Etiquetas directas SOLO en el pico y el último mes; el resto vive en el
//     tooltip nativo (<title>) y en la tabla de abajo, que es la vista
//     accesible e imprimible de los mismos números.
//   · Meses sin actividad salen en cero: el hueco es información.
//
// Mientras no haya reservas registradas no se inventa nada: se explica de
// dónde saldrán las cifras (mismo criterio que métricas).

export const dynamic = 'force-dynamic';

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function etiquetaMes(mes: string, conAno = false): string {
  const [y, m] = mes.split('-').map(Number);
  return conAno ? `${MESES_CORTOS[m - 1]} ${String(y).slice(2)}` : MESES_CORTOS[m - 1];
}

function nombreMes(mes: string): string {
  const [y, m] = mes.split('-').map(Number);
  return `${MESES_LARGOS[m - 1]} ${y}`;
}

/** Techo "bonito" del eje: 1-2-5 × potencia de diez, para que las líneas de
 *  la cuadrícula caigan en números que se puedan leer en voz alta. */
function techo(max: number): number {
  if (max <= 0) return 1;
  const pot = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 2, 5, 10]) if (max <= m * pot) return m * pot;
  return 10 * pot;
}

/**
 * Columnas mensuales en SVG puro, dibujadas en el servidor.
 *
 * Geometría fija en viewBox y responsive por width=100%: a este tamaño los
 * textos escalan con la gráfica y no se solapan nunca.
 */
function Columnas({
  datos,
  formato,
}: {
  datos: { mes: string; valor: number }[];
  formato: (v: number) => string;
}) {
  const W = 720;
  const H = 200;
  const M = { top: 26, right: 10, bottom: 24, left: 44 };
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;

  const maxDato = Math.max(...datos.map((d) => d.valor), 0);
  const tope = techo(maxDato);
  const n = datos.length;
  const paso = plotW / n;
  // Columna delgada con aire a los lados; nunca más ancha de 34px.
  const ancho = Math.min(34, paso * 0.62);
  const y = (v: number) => M.top + plotH * (1 - v / tope);

  // Etiquetas directas SOLO donde informan: el pico y el mes más reciente.
  const idxPico = datos.reduce((im, d, i) => (d.valor > datos[im].valor ? i : im), 0);
  const conEtiqueta = new Set(maxDato > 0 ? [idxPico, n - 1] : []);

  // En series largas no caben todos los nombres de mes: se etiqueta cada 2 o
  // 3, y enero lleva el año para no perderse.
  const cadaCuanto = n > 24 ? 3 : n > 12 ? 2 : 1;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Gráfica de columnas mensuales; los valores están en la tabla «Mes a mes»"
      className="mt-2 block"
    >
      {/* Cuadrícula recesiva: tres referencias, nada más. */}
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line
            x1={M.left}
            x2={W - M.right}
            y1={y(tope * f)}
            y2={y(tope * f)}
            className="stroke-line"
            strokeWidth={f === 0 ? 1.25 : 1}
            strokeDasharray={f === 0 ? undefined : '2 4'}
          />
          <text
            x={M.left - 8}
            y={y(tope * f) + 3.5}
            textAnchor="end"
            className="fill-ink-faint font-mono"
            fontSize={10}
          >
            {formato(tope * f)}
          </text>
        </g>
      ))}

      {datos.map((d, i) => {
        const cx = M.left + paso * i + paso / 2;
        const x = cx - ancho / 2;
        const alto = (d.valor / tope) * plotH;
        const yTop = y(d.valor);
        const r = Math.min(4, ancho / 2, alto);
        const esEnero = d.mes.endsWith('-01');
        return (
          <g key={d.mes}>
            <title>{`${nombreMes(d.mes)}: ${formato(d.valor)}`}</title>
            {/* Zona de hover más ancha que la columna. */}
            <rect x={M.left + paso * i} y={M.top} width={paso} height={plotH} fill="transparent" />
            {d.valor > 0 && (
              // Rectángulo con SOLO las esquinas de arriba redondeadas,
              // anclado al eje: un rect con rx redondearía también la base.
              <path
                d={`M ${x} ${y(0)} L ${x} ${yTop + r} Q ${x} ${yTop} ${x + r} ${yTop} L ${x + ancho - r} ${yTop} Q ${x + ancho} ${yTop} ${x + ancho} ${yTop + r} L ${x + ancho} ${y(0)} Z`}
                className="fill-brand"
              />
            )}
            {conEtiqueta.has(i) && d.valor > 0 && (
              <text
                x={cx}
                y={yTop - 7}
                textAnchor="middle"
                className="fill-ink font-mono"
                fontSize={11}
                fontWeight={600}
              >
                {formato(d.valor)}
              </text>
            )}
            {(i % cadaCuanto === 0 || esEnero) && (
              <text
                x={cx}
                y={H - 7}
                textAnchor="middle"
                className={esEnero ? 'fill-ink-subtle' : 'fill-ink-faint'}
                fontSize={10}
              >
                {etiquetaMes(d.mes, esEnero)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function GraficaCard({
  titulo,
  nota,
  datos,
  formato,
}: {
  titulo: string;
  nota: string;
  datos: { mes: string; valor: number }[];
  formato: (v: number) => string;
}) {
  return (
    <Tarjeta className="p-5 md:p-6">
      <h3 className="text-body font-semibold text-ink">{titulo}</h3>
      <p className="mt-1 text-meta text-ink-muted">{nota}</p>
      <Columnas datos={datos} formato={formato} />
    </Tarjeta>
  );
}

export default async function CrecimientoPage() {
  const c = await getCrecimiento();
  const hayDatos = c.meses.some((m) => m.noches > 0);

  if (!hayDatos) {
    return (
      <div>
        <header>
          <p className="text-meta font-semibold text-ink-subtle">Panel</p>
          <h1 className="mt-2 font-serif text-headline font-normal track-headline text-ink">
            Crecimiento <em className="headline-italic">del negocio</em>
          </h1>
        </header>
        <Tarjeta className="mt-10 p-8 text-center md:p-12">
          <span
            aria-hidden="true"
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-tint text-brand"
          >
            <TrendingUp className="h-6 w-6" />
          </span>
          <h2 className="mt-6 font-serif text-title font-normal track-title text-ink">
            Todavía no hay historia que graficar
          </h2>
          <p className="mx-auto mt-3 max-w-md text-body text-ink-soft">
            Estas gráficas se dibujan solas con las reservas del calendario. Al
            registrar las estadías (o importar el histórico que ya tienes
            anotado) aparecen acá los ingresos, las noches y la ocupación, mes a
            mes — no mostramos cifras de ejemplo.
          </p>
        </Tarjeta>
      </div>
    );
  }

  const usd = (v: number) => `US$${Math.round(v).toLocaleString('es-VE')}`;
  const num = (v: number) => Math.round(v).toLocaleString('es-VE');
  const pct = (v: number) => `${Math.round(v)}%`;

  return (
    <div>
      <header>
        <p className="text-meta font-semibold text-ink-subtle">Panel</p>
        <h1 className="mt-2 font-serif text-headline font-normal track-headline text-ink">
          Crecimiento <em className="headline-italic">del negocio</em>
        </h1>
      </header>

      {/* ── Los últimos doce meses, en cuatro cifras ────────────────────── */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra
          valor={usd(c.ingreso12m)}
          etiqueta="Ingresos, últimos 12 meses"
          nota={
            c.variacionInteranual === null
              ? undefined
              : `${c.variacionInteranual >= 0 ? '+' : ''}${c.variacionInteranual}% vs los 12 anteriores`
          }
        />
        <Cifra valor={num(c.noches12m)} etiqueta="Noches vendidas, 12 meses" />
        <Cifra valor={num(c.estadias12m)} etiqueta="Estadías, 12 meses" />
        <Cifra
          valor={pct(c.ocupacion12mPct)}
          etiqueta="Ocupación promedio"
          nota={`Sobre ${c.propiedadesReales} ${c.propiedadesReales === 1 ? 'propiedad' : 'propiedades'} del inventario real`}
        />
      </div>

      {/* ── Las tres trayectorias ───────────────────────────────────────── */}
      <Seccion
        id="graficas"
        titulo="La trayectoria,"
        cursiva="mes a mes"
        descripcion="Una métrica por gráfica y un solo eje: escalas distintas no se mezclan. Las estadías que cruzan de mes se prorratean por noches."
      >
        <div className="space-y-5">
          <GraficaCard
            titulo="Ingresos por mes"
            nota="El monto pactado de cada estadía; si no se registró, noches × tarifa."
            datos={c.meses.map((m) => ({ mes: m.mes, valor: m.ingresoUsd }))}
            formato={usd}
          />
          <GraficaCard
            titulo="Noches vendidas por mes"
            nota="Noches realmente dormidas dentro del mes; los bloqueos no cuentan."
            datos={c.meses.map((m) => ({ mes: m.mes, valor: m.noches }))}
            formato={num}
          />
          <GraficaCard
            titulo="Ocupación por mes"
            nota={`Noches vendidas sobre la capacidad del inventario real actual (${c.propiedadesReales} ${c.propiedadesReales === 1 ? 'propiedad' : 'propiedades'}).`}
            datos={c.meses.map((m) => ({ mes: m.mes, valor: m.ocupacionPct }))}
            formato={pct}
          />
        </div>
      </Seccion>

      {/* ── La tabla: los mismos números, para leer e imprimir ──────────── */}
      <Seccion
        id="tabla"
        titulo="Mes a"
        cursiva="mes"
        descripcion="Los datos de las gráficas, en números. Es la versión que se imprime o se copia a una propuesta."
      >
        <Tarjeta className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line text-micro uppercase tracking-label text-ink-subtle">
                <th className="px-5 py-3 font-semibold">Mes</th>
                <th className="px-5 py-3 text-right font-semibold">Ingresos</th>
                <th className="px-5 py-3 text-right font-semibold">Noches</th>
                <th className="px-5 py-3 text-right font-semibold">Estadías</th>
                <th className="px-5 py-3 text-right font-semibold">Ocupación</th>
              </tr>
            </thead>
            <tbody>
              {[...c.meses].reverse().map((m: MesCrecimiento) => (
                <tr key={m.mes} className="border-b border-line/60 last:border-0">
                  <td className="px-5 py-2.5 text-meta font-medium text-ink">
                    {nombreMes(m.mes)}
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono text-meta tabular-nums text-ink">
                    {usd(m.ingresoUsd)}
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono text-meta tabular-nums text-ink-soft">
                    {num(m.noches)}
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono text-meta tabular-nums text-ink-soft">
                    {num(m.estadias)}
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono text-meta tabular-nums text-ink-soft">
                    {pct(m.ocupacionPct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tarjeta>
        <p className="mt-3 text-meta text-ink-muted">
          La ocupación se calcula contra el inventario real de HOY: si mañana se
          suman propiedades, los meses viejos no cambian de capacidad. Y una
          cifra honesta convence más que una inflada — esta pantalla no maquilla
          los meses flojos.
        </p>
      </Seccion>
    </div>
  );
}
