import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, Eye, EyeOff, ImageOff, Pencil, Plus } from 'lucide-react';
import { listarInmueblesAdmin, TIPOS } from '@/lib/ventas';
import { Aviso, Insignia, Tarjeta } from '../../_ui';
import { alternarPublicacionInmuebleAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function InmueblesPage({ searchParams }: { searchParams: Promise<{ guardado?: string }> }) {
  const [{ guardado }, inmuebles] = await Promise.all([searchParams, listarInmueblesAdmin()]);
  return (
    <div>
      <nav aria-label="Ruta" className="text-ui">
        <Link href="/admin/ventas" className="inline-flex items-center gap-1.5 text-ink-muted transition-colors hover:text-brand">
          <ChevronLeft className="h-4 w-4" /> Prospectos
        </Link>
      </nav>
      <header className="mt-5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-meta font-semibold text-ink-subtle">En venta</p>
          <h1 className="mt-2 font-serif text-headline font-normal track-headline text-ink">Inmuebles propios</h1>
          <p className="mt-2 text-meta text-ink-muted">
            {inmuebles.length} en total · {inmuebles.filter((i) => i.isPublished).length} publicados en /en-venta
          </p>
        </div>
        <Link href="/admin/ventas/inmuebles/nuevo" className="btn-solid"><Plus className="h-4 w-4" /> Nuevo inmueble</Link>
      </header>
      {guardado && <Aviso tono="ok">Cambios guardados. La web se regenera sola.</Aviso>}

      <Tarjeta className="mt-10 overflow-hidden">
        {inmuebles.length === 0 ? (
          <p className="p-6 text-body text-ink-muted">Todavía no hay inmuebles. Los creás acá o marcando un prospecto como «Captado».</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left">
              <thead>
                <tr className="border-b border-line bg-paper/40">
                  {['Inmueble', 'Zona', 'Precio', 'Estado', ''].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-meta font-semibold text-ink-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inmuebles.map((i) => (
                  <tr key={i.id} className="border-b border-line/70 last:border-0 hover:bg-paper/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3.5">
                        {i.image ? (
                          <img src={i.image} alt="" width={64} height={48} loading="lazy" className="h-12 w-16 shrink-0 rounded-control border border-line object-cover" />
                        ) : (
                          <span title="Sin foto" className="flex h-12 w-16 shrink-0 items-center justify-center rounded-control border border-dashed border-line-strong bg-paper text-ink-faint"><ImageOff className="h-4 w-4" /></span>
                        )}
                        <div className="min-w-0">
                          <Link href={`/admin/ventas/inmuebles/${i.id}`} className="block truncate text-body font-semibold text-ink underline-offset-4 hover:text-brand hover:underline">{i.titulo}</Link>
                          <span className="text-ui text-ink-muted">{TIPOS.find((t) => t.key === i.tipo)?.label}{i.prospectoFbId ? ' · de Marketplace' : ''}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-body text-ink-muted">{i.zone}</td>
                    <td className="px-5 py-4 font-mono text-ui tabular-nums text-ink-muted">{i.precioAConsultar ? 'consultar' : `US$ ${i.precioUsd.toLocaleString('es-VE')}`}</td>
                    <td className="px-5 py-4"><Insignia tono={i.isPublished ? 'ok' : 'neutro'}>{i.isPublished ? 'publicado' : 'borrador'}</Insignia></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/ventas/inmuebles/${i.id}`} title="Editar" className="flex h-9 w-9 items-center justify-center rounded-control text-ink-muted hover:bg-brand-tint hover:text-brand-deep"><Pencil className="h-4 w-4" /></Link>
                        {i.isPublished && (
                          <a href={`https://margaritarenace.com.ve/en-venta/${i.slug}`} target="_blank" rel="noopener" title="Ver en la web" className="flex h-9 w-9 items-center justify-center rounded-control text-ink-muted hover:bg-brand-tint hover:text-brand-deep"><ArrowUpRight className="h-4 w-4" /></a>
                        )}
                        <form action={alternarPublicacionInmuebleAction}>
                          <input type="hidden" name="id" value={i.id} />
                          <input type="hidden" name="publicar" value={i.isPublished ? '' : 'true'} />
                          <button type="submit" title={i.isPublished ? 'Despublicar' : 'Publicar'} className="flex h-9 w-9 items-center justify-center rounded-control text-ink-muted hover:bg-paper-warm hover:text-ink">
                            {i.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
    </div>
  );
}
