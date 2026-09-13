import { Download, Mail, Trash2 } from 'lucide-react';
import { listarContactos } from '@/lib/contactos';
import { Aviso, Cifra, Tarjeta } from '../_ui';
import { alternarUsadoAction, borrarContactoAction, cambiarTipoAction, crearContactoAction } from './actions';
import Link from 'next/link';
import { Campo, Selector } from '../_ui';

// CRM: quién dejó su correo, con qué cupón, de dónde vino y si ya lo usó.
// Exporta CSV para Mailchimp/Brevo o para una campaña desde Resend.
export const dynamic = 'force-dynamic';
export default async function ContactosPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; tipo?: string }> }) {
  const [{ ok, error, tipo }, todos] = await Promise.all([searchParams, listarContactos()]);
  const contactos = tipo && ['huesped', 'aliado', 'prospecto'].includes(tipo) ? todos.filter((c) => c.tipo === tipo) : todos;
  const n = (t: string) => todos.filter((c) => c.tipo === t).length;
  const semana = contactos.filter((c) => Date.now() - Date.parse(c.createdAt) < 7 * 86400_000).length;
  const usados = contactos.filter((c) => c.cuponUsadoAt).length;
  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div><p className="text-meta font-semibold text-ink-subtle">Contactos</p><h1 className="mt-2 font-serif text-headline font-normal track-headline text-ink">CRM</h1>
          <p className="mt-2 max-w-2xl text-meta text-ink-muted">Quien deja su correo en el cupón de bienvenida (5 % + la guía). Consintieron recibir nuestros correos: úsalo con medida — el código, la guía y un aviso cuando abra la temporada.</p></div>
        <a href="/admin/contactos/csv" className="inline-flex min-h-[46px] items-center gap-2 rounded-control border border-line bg-white px-4 text-meta font-medium text-brand-deep hover:border-brand/40"><Download className="h-4 w-4" />Exportar CSV</a>
      </header>
      {ok && <Aviso tono="ok">Listo.</Aviso>}
      {error === 'nombre' && <Aviso tono="error">Pon un nombre.</Aviso>}
      <nav aria-label="Tipo de contacto" className="mt-6 flex flex-wrap gap-2">
        {[['', `Todos · ${todos.length}`], ['huesped', `Huéspedes · ${n('huesped')}`], ['aliado', `Aliados · ${n('aliado')}`], ['prospecto', `Prospectos · ${n('prospecto')}`]].map(([k, l]) => (
          <Link key={k} href={k ? `/admin/contactos?tipo=${k}` : '/admin/contactos'} className={`rounded-chip border px-3.5 py-1.5 text-ui font-medium ${(tipo ?? '') === k ? 'border-brand-deep bg-brand-deep text-white' : 'border-line bg-white text-ink-soft hover:border-brand/40'}`}>{l}</Link>
        ))}
      </nav>
      <Tarjeta className="mt-6 p-5">
        <form action={crearContactoAction} className="grid gap-3 md:grid-cols-6">
          <Campo name="nombre" label="Nombre" required placeholder="Persona de contacto" />
          <Selector name="tipo" label="Tipo" defaultValue="aliado" opciones={[{ value: 'aliado', label: 'Aliado' }, { value: 'huesped', label: 'Huésped' }, { value: 'prospecto', label: 'Prospecto' }]} />
          <Campo name="comercio" label="Comercio" placeholder="Ej. Caribest Water" />
          <Campo name="telefono" label="WhatsApp" placeholder="+58 412 0000000" />
          <Campo name="email" label="Correo" type="email" ayuda="Opcional para aliados." />
          <div className="flex items-end"><button type="submit" className="btn-solid w-full">Agregar</button></div>
          <div className="md:col-span-6"><Campo name="notas" label="Notas" placeholder="Tarifa acordada, horario, condiciones…" /></div>
        </form>
      </Tarjeta>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Cifra etiqueta="Contactos" valor={String(contactos.length)} />
        <Cifra etiqueta="Últimos 7 días" valor={String(semana)} />
        <Cifra etiqueta="Cupones usados" valor={String(usados)} />
      </div>
      <Tarjeta className="mt-6 overflow-hidden">
        {contactos.length === 0 ? <p className="p-6 text-meta text-ink-muted">Todavía nadie dejó su correo. El cupón aparece a los 6 segundos o al bajar un tercio de cualquier página pública.</p> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[52rem] text-left">
            <thead><tr className="border-b border-line bg-paper/40">{['Nombre', 'Tipo · comercio', 'Correo', 'Teléfono', 'Cupón', 'Origen', 'Fecha', ''].map((h) => <th key={h} className="px-4 py-3 text-meta font-semibold text-ink-muted">{h}</th>)}</tr></thead>
            <tbody>{contactos.map((c) => (
              <tr key={c.id} className="border-b border-line/70 last:border-0 hover:bg-paper/40">
                <td className="px-4 py-3 text-body font-semibold text-ink">{c.nombre || '—'}{c.notas && <span className="block text-ui font-normal text-ink-muted">{c.notas}</span>}</td>
                <td className="px-4 py-3">
                  <form action={cambiarTipoAction} className="flex flex-col gap-1">
                    <input type="hidden" name="id" value={c.id} />
                    <select name="tipo" defaultValue={c.tipo} className={`rounded-chip border px-2 py-1 text-ui ${c.tipo === 'aliado' ? 'border-brand-deep/40 bg-brand-tint text-brand-deep' : 'border-line bg-white text-ink-soft'}`}><option value="huesped">Huésped</option><option value="aliado">Aliado</option><option value="prospecto">Prospecto</option></select>
                    <input name="comercio" defaultValue={c.comercio} placeholder="Comercio" className="w-32 rounded-control border border-line bg-paper px-2 py-1 text-ui" />
                    <button type="submit" className="self-start text-[11px] text-brand-deep underline underline-offset-4">guardar</button>
                  </form>
                </td>
                <td className="px-4 py-3 text-meta">{c.email.endsWith('.local') ? <span className="text-ink-faint">—</span> : <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 text-brand-deep hover:underline underline-offset-4"><Mail className="h-3.5 w-3.5" />{c.email}</a>}{!c.correoEnviadoAt && !c.email.endsWith('.local') && c.tipo === 'huesped' ? <span className="ml-2 text-ui text-ink-faint">sin correo enviado</span> : null}</td>
                <td className="px-4 py-3 text-meta text-ink-muted">{c.telefono || '—'}</td>
                <td className="px-4 py-3 font-mono text-ui">{c.cupon}
                  <form action={alternarUsadoAction} className="mt-1"><input type="hidden" name="id" value={c.id} /><input type="hidden" name="usado" value={c.cuponUsadoAt ? '0' : '1'} /><button type="submit" className={`rounded-chip border px-2 py-0.5 font-sans text-[11px] ${c.cuponUsadoAt ? 'border-line text-ink-muted' : 'border-brand-deep/40 text-brand-deep'}`}>{c.cuponUsadoAt ? 'usado · reactivar' : 'marcar usado'}</button></form></td>
                <td className="px-4 py-3 text-ui text-ink-muted">{c.origen}{c.pagina ? ` · ${c.pagina}` : ''}{c.utm.utm_source ? ` · ${c.utm.utm_source}` : ''}</td>
                <td className="px-4 py-3 font-mono text-ui text-ink-muted">{new Date(c.createdAt).toLocaleDateString('es-VE')}</td>
                <td className="px-4 py-3 text-right"><form action={borrarContactoAction}><input type="hidden" name="id" value={c.id} /><button type="submit" title="Borrar" className="flex h-9 w-9 items-center justify-center rounded-control text-ink-faint hover:text-accent"><Trash2 className="h-4 w-4" /></button></form></td>
              </tr>))}</tbody>
          </table></div>
        )}
      </Tarjeta>
    </div>
  );
}
