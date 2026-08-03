import Link from 'next/link';
import { listarPropiedadesAdmin } from '@/lib/admin';
import { alternarPublicacionAction } from './actions';

// Lista de propiedades del panel: TODO el inventario, borradores incluidos.
// Publicar/despublicar es un formulario por fila (funciona sin JavaScript,
// igual que el login); la edición completa vive en /propiedades/<id>.

export const dynamic = 'force-dynamic';

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams: Promise<{ guardado?: string }>;
}) {
  const [{ guardado }, propiedades] = await Promise.all([
    searchParams,
    listarPropiedadesAdmin(),
  ]);

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="label-eyebrow text-ink-subtle">Panel</p>
          <h1 className="mt-3 font-serif text-headline font-normal track-headline text-ink">
            Propiedades <em className="headline-italic">del inventario</em>
          </h1>
        </div>
        <Link href="/admin/propiedades/nueva" className="btn-solid">
          Nueva propiedad
        </Link>
      </header>

      {guardado && (
        <p className="mt-8 rounded-card border border-brand/30 bg-brand-tint px-5 py-4 text-body text-brand-deep">
          Cambios guardados. El sitio público se regenera solo: la página
          editada mostrará lo nuevo en la próxima visita.
        </p>
      )}

      <div className="mt-10 overflow-x-auto rounded-card border border-line bg-white">
        <table className="w-full min-w-[44rem] text-left">
          <thead>
            <tr className="border-b border-line">
              <th className="label-eyebrow px-5 py-4 text-ink-subtle">Propiedad</th>
              <th className="label-eyebrow px-5 py-4 text-ink-subtle">Zona</th>
              <th className="label-eyebrow px-5 py-4 text-ink-subtle">Tarifa</th>
              <th className="label-eyebrow px-5 py-4 text-ink-subtle">Estado</th>
              <th className="label-eyebrow px-5 py-4 text-ink-subtle">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {propiedades.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {p.cover && (
                      <img
                        src={p.cover}
                        alt=""
                        width={56}
                        height={42}
                        loading="lazy"
                        className="h-10 w-14 rounded-lg border border-line object-cover"
                      />
                    )}
                    <div>
                      <Link
                        href={`/admin/propiedades/${p.id}`}
                        className="text-body font-semibold text-ink underline-offset-4 hover:underline"
                      >
                        {p.name}
                      </Link>
                      {!p.isReal && (
                        <p className="mt-0.5 text-micro font-medium text-coral">
                          relleno
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-body text-ink-muted">{p.zoneName}</td>
                <td className="mono-data px-5 py-4 text-ink-muted">{p.priceText}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center rounded-chip px-2.5 py-1 text-ui font-medium ${
                      p.isPublished
                        ? 'bg-brand-tint text-brand-deep'
                        : 'bg-paper text-ink-muted'
                    }`}
                  >
                    {p.isPublished ? 'publicada' : 'borrador'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-4">
                    {p.isPublished && (
                      <a
                        href={`https://margaritarenace.com.ve/propiedad/${p.slug}`}
                        target="_blank"
                        rel="noopener"
                        className="text-meta text-brand underline-offset-4 hover:underline"
                      >
                        ver
                      </a>
                    )}
                    <form action={alternarPublicacionAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        type="hidden"
                        name="publicar"
                        value={p.isPublished ? '' : 'true'}
                      />
                      <button
                        type="submit"
                        className="text-meta font-medium text-ink-muted underline-offset-4 hover:text-brand hover:underline"
                      >
                        {p.isPublished ? 'despublicar' : 'publicar'}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-meta text-ink-muted">
        Despublicar esconde la propiedad de la web sin borrar nada: deja de
        aparecer en el home, en su zona y en el sitemap al regenerarse. Crear
        propiedades nuevas y subir fotos llega con el siguiente paso del plan.
      </p>
    </div>
  );
}
