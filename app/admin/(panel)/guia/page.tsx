import Link from 'next/link';
import { ArrowUpRight, Pencil, Plus, QrCode, Star } from 'lucide-react';
import { CATEGORIAS, categoriaLabel, listarLugaresAdmin, portadaDe } from '@/lib/guia';
import { Aviso, Insignia, Tarjeta } from '../_ui';
import { alternarDestacadoLugarAction, alternarPublicadoLugarAction, crearLugarAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function GuiaAdminPage({ searchParams }: { searchParams: Promise<{ guardado?: string; error?: string }> }) {
  const [{ guardado, error }, lugares] = await Promise.all([searchParams, listarLugaresAdmin()]);
  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-meta font-semibold text-ink-subtle">Guía turística</p>
          <h1 className="mt-2 font-serif text-headline font-normal track-headline text-ink">Lugares</h1>
          <p className="mt-2 max-w-2xl text-meta text-ink-muted">
            {lugares.length} lugares · {lugares.filter((l) => l.publicado).length} publicados · {lugares.filter((l) => l.destacado).length} imperdibles.
            El texto y el consejo son nuestros; valoración, horario y teléfono vienen de Google y se pueden refrescar en cada ficha.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="https://margaritarenace.com.ve/guia/qr" target="_blank" rel="noopener" className="inline-flex min-h-[46px] items-center gap-2 rounded-control border border-line bg-white px-4 text-meta font-medium text-brand-deep hover:border-brand/40"><QrCode className="h-4 w-4" />Cartel QR</a>
          <a href="https://margaritarenace.com.ve/guia" target="_blank" rel="noopener" className="inline-flex min-h-[46px] items-center gap-2 rounded-control border border-line bg-white px-4 text-meta font-medium text-brand-deep hover:border-brand/40">Ver la guía <ArrowUpRight className="h-4 w-4" /></a>
        </div>
      </header>
      {guardado && <Aviso tono="ok">Guardado. La guía pública se regenera sola.</Aviso>}
      {error === 'nombre' && <Aviso tono="error">Poné un nombre para crear el lugar.</Aviso>}

      <Tarjeta className="mt-8 p-5">
        <form action={crearLugarAction} className="flex flex-wrap items-end gap-3">
          <label className="block flex-1 min-w-[220px]"><span className="text-meta font-semibold text-ink-muted">Nuevo lugar</span>
            <input name="nombre" required placeholder="Ej. Playa El Tirano" className="mt-1.5 block w-full rounded-control border border-line bg-white px-3 py-2 text-body" /></label>
          <label className="block"><span className="text-meta font-semibold text-ink-muted">Categoría</span>
            <select name="categoria" className="mt-1.5 block rounded-control border border-line bg-white px-3 py-2 text-body">{CATEGORIAS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select></label>
          <button type="submit" className="btn-solid"><Plus className="h-4 w-4" />Crear y buscar en Google</button>
        </form>
        <p className="mt-2 text-ui text-ink-muted">Se crea como borrador con los datos de Google; después escribís el texto, subís fotos y lo publicás.</p>
      </Tarjeta>

      <Tarjeta className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left">
            <thead><tr className="border-b border-line bg-paper/40">{['Lugar', 'Categoría', 'Google', 'Fotos', 'Estado', ''].map((h) => <th key={h} className="px-4 py-3 text-meta font-semibold text-ink-muted">{h}</th>)}</tr></thead>
            <tbody>
              {lugares.map((l) => { const f = portadaDe(l); return (
                <tr key={l.id} className="border-b border-line/70 last:border-0 hover:bg-paper/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {f ? <img src={f.src} alt="" width={64} height={44} loading="lazy" className="h-11 w-16 shrink-0 rounded-control border border-line object-cover" /> : <span className="h-11 w-16 shrink-0 rounded-control border border-dashed border-line-strong bg-paper" />}
                      <div className="min-w-0"><Link href={`/admin/guia/${l.id}`} className="block truncate text-body font-semibold text-ink hover:text-brand hover:underline underline-offset-4">{l.nombre}</Link><span className="text-ui text-ink-muted">{l.municipio || l.zone || '—'}</span></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-meta text-ink-muted">{categoriaLabel(l.categoria)}</td>
                  <td className="px-4 py-3 font-mono text-ui tabular-nums text-ink-muted">{l.rating != null ? `★ ${l.rating} (${l.resenas})` : '—'}</td>
                  <td className="px-4 py-3 text-ui text-ink-muted">{l.fotos.length} propias/libres{l.fotosGoogle.length ? ` · ${l.fotosGoogle.length} Google` : ''}</td>
                  <td className="px-4 py-3"><Insignia tono={l.publicado ? 'ok' : 'neutro'}>{l.publicado ? 'publicado' : 'borrador'}</Insignia>{l.destacado && <span className="ml-1.5 text-ui text-accent">imperdible</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/guia/${l.id}`} title="Editar" className="flex h-9 w-9 items-center justify-center rounded-control text-ink-muted hover:bg-brand-tint hover:text-brand-deep"><Pencil className="h-4 w-4" /></Link>
                      <form action={alternarDestacadoLugarAction}><input type="hidden" name="id" value={l.id} /><button type="submit" title={l.destacado ? 'Quitar imperdible' : 'Marcar imperdible'} className="flex h-9 w-9 items-center justify-center rounded-control text-ink-muted hover:bg-brand-tint hover:text-brand-deep"><Star className={`h-4 w-4 ${l.destacado ? 'fill-accent text-accent' : ''}`} /></button></form>
                      <form action={alternarPublicadoLugarAction}><input type="hidden" name="id" value={l.id} /><input type="hidden" name="publicar" value={l.publicado ? '' : 'true'} /><button type="submit" className="rounded-chip border border-line bg-white px-2.5 py-1.5 text-ui font-medium text-ink-muted hover:border-ink">{l.publicado ? 'Ocultar' : 'Publicar'}</button></form>
                    </div>
                  </td>
                </tr>); })}
            </tbody>
          </table>
        </div>
      </Tarjeta>
    </div>
  );
}
