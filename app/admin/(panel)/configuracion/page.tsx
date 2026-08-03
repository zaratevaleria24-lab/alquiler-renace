import Link from 'next/link';
import { ArrowUpRight, Check, ChevronRight, KeyRound } from 'lucide-react';
import { usuarioActual } from '@/lib/auth';
import {
  ETIQUETA_URGENCIA,
  type Urgencia,
  getPendientes,
} from '@/lib/pendientes';
import { getEstadoSistema } from '@/lib/sistema';
import { Aviso, Campo, Seccion, Tarjeta } from '../_ui';
import { cambiarPasswordAction, marcarPendienteAction } from './actions';

// Configuración y utilidades: todo lo que no es trabajo diario.
//
// Va ÚLTIMA en la tira lateral a propósito. Lo de todos los días son las
// herramientas, el inventario y el contenido; esto se abre cuando hace falta.
//
// Reúne tres cosas que antes estaban repartidas o no existían:
//   · «Lo que falta» — vivía en /admin/pendientes, que redirige acá.
//   · Cambiar la contraseña — antes SOLO se podía por SSH corriendo
//     db/create-admin.mjs, o sea que la dueña no podía cambiar su propia
//     contraseña sin mí. En un panel expuesto a internet eso no va.
//   · Estado del sistema — cuándo fue el último respaldo y cuánto pesa todo.
//     Datos que no tiene forma de comprobar sola.

export const dynamic = 'force-dynamic';

const TONO: Record<Urgencia, string> = {
  bloquea: 'bg-coral/10 text-coral',
  importa: 'bg-accent/10 text-accent',
  'cuando-puedas': 'bg-paper-warm/70 text-ink-muted',
};

const ERRORES: Record<string, string> = {
  faltan: 'Escribe tu contraseña actual y la nueva.',
  corta: 'La contraseña nueva debe tener al menos 10 caracteres.',
  'no-coincide': 'La contraseña nueva y su repetición no coinciden.',
  igual: 'La contraseña nueva es igual a la actual.',
  actual: 'La contraseña actual no es correcta.',
};

function fecha(d: Date): string {
  return d.toLocaleString('es-VE', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; password?: string }>;
}) {
  const [{ error, password }, user, pendientes, sistema] = await Promise.all([
    searchParams,
    usuarioActual(),
    getPendientes(),
    getEstadoSistema(),
  ]);

  const faltan = pendientes.filter((p) => !p.hecho);
  const hechos = pendientes.filter((p) => p.hecho);

  return (
    <div>
      <header>
        <p className="text-meta font-semibold text-ink-subtle">Panel</p>
        <h1 className="mt-2 font-serif text-headline font-normal track-headline text-ink">
          Configuración <em className="headline-italic">y utilidades</em>
        </h1>
      </header>

      {password && (
        <Aviso tono="ok" titulo="Contraseña cambiada">
          Se cerraron las demás sesiones abiertas. La de este navegador sigue
          activa.
        </Aviso>
      )}
      {error && <Aviso tono="error">{ERRORES[error] ?? ERRORES.actual}</Aviso>}

      {/* ── Lo que falta ──────────────────────────────────────────────────── */}
      <Seccion
        id="faltan"
        titulo="Lo que"
        cursiva="falta"
        descripcion={
          faltan.length === 0
            ? 'No queda nada pendiente.'
            : `Quedan ${faltan.length}. Las que dependen del sitio desaparecen solas al resolverlas; las de afuera las tachas tú.`
        }
      >
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

        {hechos.length > 0 && (
          <ul className="mt-4 space-y-2">
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
        )}
      </Seccion>

      {/* ── Contraseña ────────────────────────────────────────────────────── */}
      <Seccion
        id="acceso"
        titulo="Mi"
        cursiva="contraseña"
        descripcion={`Entras como ${user?.email ?? ''}. Al cambiarla se cierran las demás sesiones abiertas.`}
      >
        <Tarjeta className="p-6">
          <form action={cambiarPasswordAction} className="max-w-md space-y-5">
            <Campo
              name="actual"
              type="password"
              label="Contraseña actual"
              ayuda="Se pide para que nadie que encuentre tu sesión abierta pueda dejarte fuera."
            />
            <Campo
              name="nueva"
              type="password"
              label="Contraseña nueva"
              ayuda="Al menos 10 caracteres. Larga y fácil de recordar es mejor que corta y rara."
            />
            <Campo name="repetir" type="password" label="Repítela" />
            <button type="submit" className="btn-solid">
              <KeyRound className="h-4 w-4" />
              Cambiar contraseña
            </button>
          </form>
        </Tarjeta>
      </Seccion>

      {/* ── Sistema ───────────────────────────────────────────────────────── */}
      <Seccion
        id="sistema"
        titulo="Respaldo"
        cursiva="y datos"
        descripcion="Solo para mirar. El respaldo corre solo todas las noches a las 3:45."
      >
        <Tarjeta className="divide-y divide-line/70">
          <div className="flex flex-wrap items-baseline justify-between gap-3 p-5">
            <span className="text-body text-ink">Último respaldo</span>
            <span className="text-body text-ink-muted">
              {sistema.ultimoRespaldo ? (
                <>
                  {fecha(sistema.ultimoRespaldo.fecha)}{' '}
                  <span className="font-mono text-ui tabular-nums text-ink-subtle">
                    ({Math.round(sistema.ultimoRespaldo.bytes / 1024)} KB)
                  </span>
                </>
              ) : (
                // No se inventa un "todo bien": si no se pudo leer, se dice.
                <span className="text-coral">no se pudo comprobar</span>
              )}
            </span>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-3 p-5">
            <span className="text-body text-ink">Respaldos guardados</span>
            <span className="font-mono text-body tabular-nums text-ink-muted">
              {sistema.respaldosGuardados}{' '}
              <span className="font-sans text-meta">
                (se conservan los 7 más recientes)
              </span>
            </span>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-3 p-5">
            <span className="text-body text-ink">Tamaño de la base</span>
            <span className="font-mono text-body tabular-nums text-ink-muted">
              {sistema.tamanoBase ?? '—'}
            </span>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-3 p-5">
            <span className="text-body text-ink">Fotos subidas</span>
            <span className="font-mono text-body tabular-nums text-ink-muted">
              {sistema.fotosSubidas}
            </span>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-3 p-5">
            <span className="text-body text-ink">Sesiones abiertas</span>
            <span className="font-mono text-body tabular-nums text-ink-muted">
              {sistema.sesionesAbiertas}
            </span>
          </div>
        </Tarjeta>
      </Seccion>
    </div>
  );
}
