import Link from 'next/link';
import { ArrowUpRight, Check, ChevronRight } from 'lucide-react';
import {
  ETIQUETA_URGENCIA,
  type Urgencia,
  getPendientes,
} from '@/lib/pendientes';
import { Seccion, Tarjeta } from '../_ui';
import { marcarPendienteAction } from './actions';

// Todo lo que falta por llenar, en un solo lugar.
//
// Antes estaba repartido como avisos grandes dentro de las pantallas de trabajo,
// y los pendientes que no son del sitio —abrir la ficha de Google, verificar el
// dominio— no aparecían en ninguna parte. Repartidos molestan a diario y a la vez
// se olvidan.
//
// Todo se calcula del estado real de la base (ver lib/pendientes.ts): lo que se
// resuelve, desaparece solo. Nada de listas escritas a mano que envejecen.

export const dynamic = 'force-dynamic';

const TONO: Record<Urgencia, string> = {
  bloquea: 'bg-coral/10 text-coral',
  importa: 'bg-accent/10 text-accent',
  'cuando-puedas': 'bg-paper-warm/70 text-ink-muted',
};

export default async function PendientesPage() {
  const pendientes = await getPendientes();
  const faltan = pendientes.filter((p) => !p.hecho);
  const hechos = pendientes.filter((p) => p.hecho);

  return (
    <div>
      <header>
        <p className="text-meta font-semibold text-ink-subtle">Panel</p>
        <h1 className="mt-2 font-serif text-headline font-normal track-headline text-ink">
          Lo que <em className="headline-italic">falta</em>
        </h1>
        <p className="mt-4 max-w-2xl text-body text-ink-soft">
          {faltan.length === 0
            ? 'No queda nada pendiente. '
            : `Quedan ${faltan.length} ${faltan.length === 1 ? 'cosa' : 'cosas'}. `}
          Las que dependen del sitio desaparecen solas al resolverlas; las de
          afuera las tachas tú.
        </p>
      </header>

      <Seccion id="faltan" titulo="Pendientes">
        {faltan.length === 0 ? (
          <Tarjeta className="p-8 text-center">
            <span
              aria-hidden="true"
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-tint text-brand"
            >
              <Check className="h-5 w-5" />
            </span>
            <p className="mt-5 text-body text-ink-soft">
              Todo al día. Cuando haya algo nuevo por llenar, aparecerá acá.
            </p>
          </Tarjeta>
        ) : (
          <ul className="space-y-3">
            {faltan.map((p) => (
              <li key={p.clave}>
                <Tarjeta className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className={`rounded-chip px-2.5 py-1 text-ui font-medium ${TONO[p.urgencia]}`}
                        >
                          {ETIQUETA_URGENCIA[p.urgencia]}
                        </span>
                        <h3 className="text-body font-semibold text-ink">
                          {p.titulo}
                        </h3>
                      </div>
                      <p className="mt-2.5 max-w-2xl text-meta text-ink-soft">
                        {p.motivo}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      {p.donde && (
                        <Link
                          href={p.donde}
                          className="inline-flex items-center gap-1.5 rounded-control bg-brand px-3.5 py-2 text-meta font-semibold text-white transition-colors hover:bg-brand-deep"
                        >
                          Arreglar
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      )}
                      {p.externo && (
                        <a
                          href={p.externo.url}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-center gap-1.5 text-meta text-brand underline-offset-4 hover:underline"
                        >
                          {p.externo.texto}
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {p.manual && (
                        <form action={marcarPendienteAction}>
                          <input type="hidden" name="clave" value={p.clave} />
                          <input type="hidden" name="hecho" value="true" />
                          <button
                            type="submit"
                            title="Marcar como hecho"
                            className="flex h-10 w-10 items-center justify-center rounded-control border border-line text-ink-faint transition-colors hover:border-brand hover:text-brand"
                          >
                            <Check className="h-4 w-4" />
                            <span className="sr-only">
                              Marcar «{p.titulo}» como hecho
                            </span>
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </Tarjeta>
              </li>
            ))}
          </ul>
        )}
      </Seccion>

      {hechos.length > 0 && (
        <Seccion id="hechos" titulo="Hechos">
          <ul className="space-y-2">
            {hechos.map((p) => (
              <li
                key={p.clave}
                className="flex items-center justify-between gap-4 rounded-control border border-line/70 bg-white/50 px-4 py-3"
              >
                <span className="flex items-center gap-2.5 text-body text-ink-muted line-through decoration-ink-faint">
                  <Check className="h-4 w-4 shrink-0 text-brand" />
                  {p.titulo}
                </span>
                <form action={marcarPendienteAction}>
                  <input type="hidden" name="clave" value={p.clave} />
                  <input type="hidden" name="hecho" value="false" />
                  <button
                    type="submit"
                    className="shrink-0 text-meta text-ink-faint underline-offset-4 hover:text-ink-muted hover:underline"
                  >
                    deshacer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </Seccion>
      )}
    </div>
  );
}
