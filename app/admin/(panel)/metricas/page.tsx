import { BarChart3, Globe2, Smartphone } from 'lucide-react';
import { getResumenMetricas } from '@/lib/metricas';
import { Cifra, Seccion, Tarjeta } from '../_ui';

// Métricas del sitio, del recolector propio.
//
// NADA DE GOOGLE ANALYTICS: en Venezuela sus recursos se bloquean, así que las
// cifras vendrían sesgadas justo contra el público que interesa. Ver
// lib/metricas.ts para qué se guarda y qué no (spoiler: ninguna IP).
//
// Mientras no haya datos NO se muestran tarjetas en cero ni gráficas de ejemplo:
// un panel que enseña datos falsos enseña a desconfiar de todo lo que hay en él.

export const dynamic = 'force-dynamic';

/** Barra proporcional. Sin librería de gráficos: son listas ordenadas, y una
 *  barra de fondo dice lo mismo que un gráfico sin sumar JavaScript. */
function Barra({
  etiqueta,
  valor,
  maximo,
  nota,
}: {
  etiqueta: string;
  valor: number;
  maximo: number;
  nota?: string;
}) {
  const pct = maximo > 0 ? Math.max(2, (valor / maximo) * 100) : 0;
  return (
    <li className="relative overflow-hidden rounded-control">
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 bg-brand-tint"
        style={{ width: `${pct}%` }}
      />
      <span className="relative flex items-baseline justify-between gap-4 px-3.5 py-2.5">
        <span className="min-w-0 truncate text-body text-ink">{etiqueta}</span>
        <span className="shrink-0 font-mono text-ui tabular-nums text-ink-muted">
          {valor.toLocaleString('es-VE')}
          {nota && <span className="ml-2 font-sans text-meta">{nota}</span>}
        </span>
      </span>
    </li>
  );
}

export default async function MetricasPage() {
  const m = await getResumenMetricas();

  if (!m.hayDatos) {
    return (
      <div>
        <header>
          <p className="text-meta font-semibold text-ink-subtle">Panel</p>
          <h1 className="mt-2 font-serif text-headline font-normal track-headline text-ink">
            Métricas <em className="headline-italic">del sitio</em>
          </h1>
        </header>
        <Tarjeta className="mt-10 p-8 text-center md:p-12">
          <span
            aria-hidden="true"
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-tint text-brand"
          >
            <BarChart3 className="h-6 w-6" />
          </span>
          <h2 className="mt-6 font-serif text-title font-normal track-title text-ink">
            Midiendo, todavía sin visitas
          </h2>
          <p className="mx-auto mt-3 max-w-md text-body text-ink-soft">
            El recolector ya está funcionando. En cuanto alguien entre al sitio
            aparecerán las cifras acá — no mostramos tarjetas en cero ni datos de
            ejemplo.
          </p>
        </Tarjeta>
      </div>
    );
  }

  const totalDiaspora =
    m.diaspora.dentro + m.diaspora.afuera + m.diaspora.sinDato || 1;
  const pctAfuera = Math.round((m.diaspora.afuera / totalDiaspora) * 100);
  const max = (ns: number[]) => Math.max(...ns, 1);

  return (
    <div>
      <header>
        <p className="text-meta font-semibold text-ink-subtle">Panel</p>
        <h1 className="mt-2 font-serif text-headline font-normal track-headline text-ink">
          Métricas <em className="headline-italic">del sitio</em>
        </h1>
        <p className="mt-4 max-w-2xl text-body text-ink-soft">
          Recolector propio, sin Google Analytics y sin cookies. No se guarda
          ninguna dirección IP: los visitantes se distinguen con una huella diaria
          que no permite seguir a nadie entre días.
        </p>
      </header>

      <Seccion id="ahora" titulo="Ahora">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Cifra
            valor={m.visitasHoy}
            etiqueta="Visitas hoy"
            nota={`${m.visitantesHoy} personas distintas`}
          />
          <Cifra
            valor={m.visitas7d}
            etiqueta="Visitas · 7 días"
            nota={`${m.visitantes7d} personas distintas`}
          />
          <Cifra
            valor={m.clicsWhatsApp7d}
            etiqueta="Clics de WhatsApp · 7 días"
            nota="lo más cerca de una reserva que se puede medir"
          />
          <Cifra
            valor={`${pctAfuera}%`}
            etiqueta="Desde el exterior"
            nota="a quién conviene pautarle"
          />
        </div>
      </Seccion>

      <Seccion
        id="diaspora"
        titulo="Dentro o"
        cursiva="fuera del país"
        descripcion="Visitantes distintos de los últimos 7 días. La diáspora reserva con 4 a 8 semanas de antelación: si pesa, la campaña se lanza antes."
      >
        <Tarjeta className="divide-y divide-line/70">
          {[
            { et: 'Venezuela', v: m.diaspora.dentro },
            { et: 'Desde el exterior', v: m.diaspora.afuera },
            { et: 'Sin identificar', v: m.diaspora.sinDato },
          ].map((f) => (
            <div
              key={f.et}
              className="flex items-baseline justify-between gap-4 px-5 py-4"
            >
              <span className="text-body text-ink">{f.et}</span>
              <span className="font-mono text-body tabular-nums text-ink-muted">
                {f.v}
                <span className="ml-2 font-sans text-meta">
                  {Math.round((f.v / totalDiaspora) * 100)}%
                </span>
              </span>
            </div>
          ))}
        </Tarjeta>
      </Seccion>

      {m.porPais.length > 0 && (
        <Seccion
          id="paises"
          titulo="Países"
          descripcion="Visitantes distintos en 30 días. El país lo da Cloudflare en cada petición, sin consultar ningún servicio externo."
        >
          <Tarjeta className="p-3">
            <ul className="space-y-1">
              {m.porPais.map((p) => (
                <Barra
                  key={p.pais}
                  etiqueta={p.nombre}
                  valor={p.visitantes}
                  maximo={max(m.porPais.map((x) => x.visitantes))}
                />
              ))}
            </ul>
          </Tarjeta>
        </Seccion>
      )}

      <Seccion
        id="paginas"
        titulo="Páginas más"
        cursiva="visitadas"
        descripcion="Con las zonas separadas: dice qué zona interesa de verdad, que es información de negocio y no de vanidad."
      >
        <Tarjeta className="p-3">
          <ul className="space-y-1">
            {m.porPagina.map((p) => (
              <Barra
                key={p.path}
                etiqueta={p.path}
                valor={p.visitas}
                maximo={max(m.porPagina.map((x) => x.visitas))}
                nota={`· ${p.visitantes} pers.`}
              />
            ))}
          </ul>
        </Tarjeta>
      </Seccion>

      {m.propiedades.length > 0 && (
        <Seccion
          id="propiedades"
          titulo="Propiedades:"
          cursiva="visitas y contactos"
          descripcion="Una ficha con muchas visitas y cero clics de WhatsApp está diciendo que algo falla en su precio o en sus fotos."
        >
          <Tarjeta className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[30rem] text-left">
                <thead>
                  <tr className="border-b border-line bg-paper/40">
                    <th className="px-5 py-3.5 text-meta font-semibold text-ink-muted">
                      Ficha
                    </th>
                    <th className="px-5 py-3.5 text-meta font-semibold text-ink-muted">
                      Visitas
                    </th>
                    <th className="px-5 py-3.5 text-meta font-semibold text-ink-muted">
                      Clics de WhatsApp
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {m.propiedades.map((p) => (
                    <tr
                      key={p.path}
                      className="border-b border-line/70 last:border-0"
                    >
                      <td className="px-5 py-3.5 text-body text-ink">
                        {p.path.replace('/propiedad/', '')}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-ui tabular-nums text-ink-muted">
                        {p.visitas}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-ui tabular-nums">
                        {/* En coral cuando hay visitas y ningún contacto: es la
                            señal de que esa ficha no está convirtiendo. */}
                        <span
                          className={
                            p.clics === 0 && p.visitas >= 10
                              ? 'text-coral'
                              : 'text-ink-muted'
                          }
                        >
                          {p.clics}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Tarjeta>
        </Seccion>
      )}

      {m.busquedas.length > 0 && (
        <Seccion
          id="busquedas"
          titulo="Qué"
          cursiva="buscan"
          descripcion="Lo que la gente escribe en el buscador. Es el dato más valioso de todos: revela demanda que el inventario no cubre."
        >
          <Tarjeta className="p-3">
            <ul className="space-y-1">
              {m.busquedas.map((b) => (
                <Barra
                  key={b.texto}
                  etiqueta={b.texto}
                  valor={b.veces}
                  maximo={max(m.busquedas.map((x) => x.veces))}
                />
              ))}
            </ul>
          </Tarjeta>
        </Seccion>
      )}

      <Seccion id="dias" titulo="Últimos" cursiva="14 días">
        <Tarjeta className="p-3">
          <ul className="space-y-1">
            {m.porDia.map((d) => (
              <Barra
                key={d.dia}
                etiqueta={d.dia}
                valor={d.visitas}
                maximo={max(m.porDia.map((x) => x.visitas))}
                nota={`· ${d.visitantes} pers.`}
              />
            ))}
          </ul>
        </Tarjeta>
      </Seccion>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {m.porProcedencia.length > 0 && (
          <div>
            <h2 className="flex items-center gap-2 text-meta font-semibold text-ink-muted">
              <Globe2 className="h-4 w-4" /> De dónde llegan
            </h2>
            <Tarjeta className="mt-4 p-3">
              <ul className="space-y-1">
                {m.porProcedencia.map((r) => (
                  <Barra
                    key={r.host}
                    etiqueta={r.host}
                    valor={r.visitas}
                    maximo={max(m.porProcedencia.map((x) => x.visitas))}
                  />
                ))}
              </ul>
            </Tarjeta>
          </div>
        )}
        <div>
          <h2 className="flex items-center gap-2 text-meta font-semibold text-ink-muted">
            <Smartphone className="h-4 w-4" /> Móvil o escritorio
          </h2>
          <Tarjeta className="mt-4 p-3">
            <ul className="space-y-1">
              {m.dispositivos.map((d) => (
                <Barra
                  key={d.device}
                  etiqueta={d.device === 'movil' ? 'Teléfono' : 'Escritorio'}
                  valor={d.visitas}
                  maximo={max(m.dispositivos.map((x) => x.visitas))}
                />
              ))}
            </ul>
          </Tarjeta>
        </div>
      </div>
    </div>
  );
}
