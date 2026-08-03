import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCatalogosAdmin, getFotosAdmin, getPropiedadAdmin } from '@/lib/admin';
import PropiedadForm from '../PropiedadForm';
import {
  borrarFotoAction,
  guardarPropiedadAction,
  marcarPortadaAction,
  subirFotosAction,
} from '../actions';

// Edición de una propiedad: el formulario compartido (PropiedadForm) más la
// gestión de fotos, que solo existe acá — una propiedad recién creada llega a
// esta página justamente para recibir sus fotos.
//
// Lo que NO se edita, a propósito:
//   · slug — la URL pública es estable; renombrar la propiedad no la rompe.
//   · rating — solo debe existir con reseñas reales (regla de SEO.md). Un campo
//     editable invita a inventarlo.
//   · price_text — se deriva del precio en la action, para que el texto visible
//     y el número de filtrado no se contradigan nunca.

export const dynamic = 'force-dynamic';

const MENSAJES: Record<string, string> = {
  'faltan-datos':
    'Faltan datos obligatorios: nombre, zona y dirección no pueden quedar vacíos.',
  'sin-fotos': 'No llegó ningún archivo: elige al menos una foto antes de subir.',
  'foto-invalida':
    'Alguno de los archivos no es una imagen válida o pesa más de 12MB.',
  'no-guardado': 'No se pudo guardar. Revisa los datos e intenta otra vez.',
};

export default async function EditarPropiedadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; creada?: string; guardado?: string }>;
}) {
  const [{ id }, { error, creada, guardado }] = await Promise.all([
    params,
    searchParams,
  ]);
  const [propiedad, catalogos, fotos] = await Promise.all([
    getPropiedadAdmin(id),
    getCatalogosAdmin(),
    getFotosAdmin(id),
  ]);
  if (!propiedad) notFound();

  return (
    <div className="max-w-3xl">
      <nav aria-label="Ruta" className="text-ui text-ink-muted">
        <Link href="/propiedades" className="underline-offset-4 hover:underline">
          ← Propiedades
        </Link>
      </nav>

      <header className="mt-6">
        <p className="label-eyebrow text-ink-subtle">Editar propiedad</p>
        <h1 className="mt-3 font-serif text-headline font-normal track-headline text-ink">
          {propiedad.name}
        </h1>
        <p className="mono-data mt-3 text-ink-subtle">
          margaritarenace.com.ve/propiedad/{propiedad.slug}
        </p>
      </header>

      {creada && (
        <p className="mt-8 rounded-card border border-brand/30 bg-brand-tint px-5 py-4 text-body text-brand-deep">
          Propiedad creada{propiedad.isPublished ? ' y publicada' : ' como borrador'}.
          El siguiente paso son las fotos, aquí abajo.
        </p>
      )}
      {guardado && (
        <p className="mt-8 rounded-card border border-brand/30 bg-brand-tint px-5 py-4 text-body text-brand-deep">
          Cambios guardados. El sitio público se regenera solo.
        </p>
      )}
      {error && (
        <p className="mt-8 rounded-card border border-coral/35 bg-coral/5 px-5 py-4 text-body text-ink">
          {MENSAJES[error] ?? MENSAJES['no-guardado']}
        </p>
      )}

      {/* ── Fotos ─────────────────────────────────────────────────────────── */}
      <section aria-labelledby="fotos" className="mt-12">
        <h2 id="fotos" className="label-eyebrow text-ink-subtle">
          Fotos ({fotos.length})
        </h2>

        {fotos.length > 0 ? (
          <ul className="mt-5 grid gap-4 sm:grid-cols-3">
            {fotos.map((foto) => (
              <li
                key={foto.id}
                className="overflow-hidden rounded-card border border-line bg-white"
              >
                <img
                  src={foto.path}
                  alt={foto.alt}
                  width={400}
                  height={250}
                  loading="lazy"
                  className="aspect-video w-full object-cover"
                />
                <div className="flex items-center justify-between px-3 py-2.5">
                  {foto.isCover ? (
                    <span className="rounded-chip bg-brand-tint px-2 py-0.5 text-ui font-medium text-brand-deep">
                      portada
                    </span>
                  ) : (
                    <form action={marcarPortadaAction}>
                      <input type="hidden" name="id" value={propiedad.id} />
                      <input type="hidden" name="foto_id" value={foto.id} />
                      <button
                        type="submit"
                        className="text-ui text-ink-muted underline-offset-4 hover:text-brand hover:underline"
                      >
                        hacer portada
                      </button>
                    </form>
                  )}
                  <form action={borrarFotoAction}>
                    <input type="hidden" name="id" value={propiedad.id} />
                    <input type="hidden" name="foto_id" value={foto.id} />
                    <button
                      type="submit"
                      className="text-ui text-coral underline-offset-4 hover:underline"
                    >
                      borrar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-card border border-coral/35 bg-coral/5 px-5 py-4 text-body text-ink">
            Sin fotos todavía. Una propiedad publicada sin foto se ve rota en la
            web: sube al menos la principal antes de publicar.
          </p>
        )}

        <form
          action={subirFotosAction}
          className="mt-6 rounded-card border border-line bg-white p-5"
        >
          <input type="hidden" name="id" value={propiedad.id} />
          <label htmlFor="fotos-input" className="block text-body font-semibold text-ink">
            Subir fotos
          </label>
          <p className="mt-1 text-meta text-ink-muted">
            Se optimizan solas: WebP, máximo 1600px de ancho. Horizontales y con
            luz de día funcionan mejor (ver DATOS-PENDIENTES.md).
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <input
              id="fotos-input"
              type="file"
              name="fotos"
              multiple
              required
              accept="image/*"
              className="text-body text-ink-soft file:mr-4 file:rounded-chip file:border file:border-line file:bg-paper file:px-4 file:py-2 file:text-meta file:font-semibold file:text-brand-deep"
            />
            <button type="submit" className="btn-solid">
              Subir y optimizar
            </button>
          </div>
        </form>
      </section>

      {/* ── Datos ─────────────────────────────────────────────────────────── */}
      <section aria-labelledby="datos" className="mt-14">
        <h2 id="datos" className="label-eyebrow text-ink-subtle">
          Datos
        </h2>
        <PropiedadForm
          action={guardarPropiedadAction}
          catalogos={catalogos}
          propiedad={propiedad}
        />
      </section>
    </div>
  );
}
