import Link from 'next/link';
import { ArrowUpRight, Eye, EyeOff, ImageOff, Pencil, Plus } from 'lucide-react';
import { listarPropiedadesAdmin } from '@/lib/admin';
import { Aviso, Insignia, Tarjeta } from '../_ui';
import { alternarPublicacionAction } from './actions';

// Lista de propiedades del panel: TODO el inventario, borradores incluidos.
// Publicar/despublicar es un formulario por fila (funciona sin JavaScript,
// igual que el login); la edición completa vive en /admin/propiedades/<id>.

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
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-meta font-semibold text-ink-subtle">Inventario</p>
          <h1 className="mt-2 font-serif text-headline font-normal track-headline text-ink">
            Propiedades
          </h1>
          <p className="mt-2 text-meta text-ink-muted">
            {propiedades.length}{' '}
            {propiedades.length === 1 ? 'alojamiento' : 'alojamientos'} ·{' '}
            {propiedades.filter((p) => p.isPublished).length} publicados
          </p>
        </div>
        <Link href="/admin/propiedades/nueva" className="btn-solid">
          <Plus className="h-4 w-4" />
          Nueva propiedad
        </Link>
      </header>

      {guardado && (
        <Aviso tono="ok">
          Cambios guardados. El sitio público se regenera solo: la página editada
          mostrará lo nuevo en la próxima visita.
        </Aviso>
      )}

      <Tarjeta className="mt-10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-left">
            <thead>
              <tr className="border-b border-line bg-paper/40">
                <th className="px-5 py-3.5 text-meta font-semibold text-ink-muted">
                  Propiedad
                </th>
                <th className="px-5 py-3.5 text-meta font-semibold text-ink-muted">
                  Zona
                </th>
                <th className="px-5 py-3.5 text-meta font-semibold text-ink-muted">
                  Tarifa
                </th>
                <th className="px-5 py-3.5 text-meta font-semibold text-ink-muted">
                  Estado
                </th>
                <th className="px-5 py-3.5 text-right text-meta font-semibold text-ink-muted">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {propiedades.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-line/70 transition-colors last:border-0 hover:bg-paper/40"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3.5">
                      {p.cover ? (
                        <img
                          src={p.cover}
                          alt=""
                          width={64}
                          height={48}
                          loading="lazy"
                          className="h-12 w-16 shrink-0 rounded-control border border-line object-cover"
                        />
                      ) : (
                        // Hueco explícito en vez de nada: una propiedad sin foto
                        // se ve rota en la web y hay que poder detectarlo acá.
                        <span
                          title="Sin foto"
                          className="flex h-12 w-16 shrink-0 items-center justify-center rounded-control border border-dashed border-line-strong bg-paper text-ink-faint"
                        >
                          <ImageOff className="h-4 w-4" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <Link
                          href={`/admin/propiedades/${p.id}`}
                          className="block truncate text-body font-semibold text-ink underline-offset-4 hover:text-brand hover:underline"
                        >
                          {p.name}
                        </Link>
                        {!p.isReal && (
                          <span className="mt-1 inline-block text-ui font-medium text-coral">
                            listado de relleno
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-body text-ink-muted">
                    {p.zoneName}
                  </td>
                  <td className="px-5 py-4 font-mono text-ui tabular-nums text-ink-muted">
                    {p.priceText}
                  </td>
                  <td className="px-5 py-4">
                    <Insignia tono={p.isPublished ? 'ok' : 'neutro'}>
                      {p.isPublished ? 'publicada' : 'borrador'}
                    </Insignia>
                  </td>
                  <td className="px-5 py-4">
                    {/* Acciones con icono: en una tabla de doce filas, tres
                        enlaces de texto por fila se convierten en ruido. */}
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/propiedades/${p.id}`}
                        title="Editar"
                        className="flex h-9 w-9 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-brand-tint hover:text-brand-deep"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar {p.name}</span>
                      </Link>

                      {p.isPublished && (
                        <a
                          href={`https://margaritarenace.com.ve/propiedad/${p.slug}`}
                          target="_blank"
                          rel="noopener"
                          title="Ver en la web"
                          className="flex h-9 w-9 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-brand-tint hover:text-brand-deep"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                          <span className="sr-only">Ver {p.name} en la web</span>
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
                          title={p.isPublished ? 'Despublicar' : 'Publicar'}
                          className="flex h-9 w-9 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-paper-warm hover:text-ink"
                        >
                          {p.isPublished ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {p.isPublished ? 'Despublicar' : 'Publicar'} {p.name}
                          </span>
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Tarjeta>

      <p className="mt-5 text-meta text-ink-muted">
        Despublicar esconde la propiedad de la web sin borrar nada: deja de
        aparecer en el home, en su zona y en el sitemap al regenerarse.
      </p>
    </div>
  );
}
