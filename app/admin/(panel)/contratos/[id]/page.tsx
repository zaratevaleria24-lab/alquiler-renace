import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Mail, MessageCircle, Printer } from 'lucide-react';
import { datosDe, getContrato, listarEventos, urlContrato } from '@/lib/contratos';
import { correoConfigurado } from '@/lib/correo';
import ContratoDocumento from '@/components/ContratoDocumento';
import { Aviso, Insignia, Tarjeta } from '../../_ui';
import { anularContratoAction, enviarContratoAction, marcarEnviadoAction } from '../actions';
import CopiarEnlace from './CopiarEnlace';

export const dynamic = 'force-dynamic';
const TONO: Record<string, 'ok' | 'neutro' | 'aviso'> = { firmado: 'ok', enviado: 'aviso', borrador: 'neutro', anulado: 'neutro' };

export default async function ContratoAdminPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const c = await getContrato(id); if (!c) notFound();
  const [d, eventos] = await Promise.all([datosDe(c), listarEventos(c.id)]); const url = urlContrato(c.token);
  const NOMBRES: Record<string, string> = { creado: 'Creado', enviado_correo: 'Enviado por correo', enviado_whatsapp: 'Enviado por WhatsApp', enviado_enlace: 'Enlace copiado', abierto: 'Abierto por el huésped', codigo_enviado: 'Código enviado', codigo_verificado: 'Código verificado', codigo_fallido: 'Código incorrecto', firmado: 'Firmado', copia_enviada: 'Copia enviada', anulado: 'Anulado' };
  const tel = c.telefono.replace(/\D/g, '');
  const wa = tel ? `https://wa.me/${tel.startsWith('58') ? tel : '58' + tel.replace(/^0/, '')}?text=${encodeURIComponent(`Hola ${c.huesped}, te mando el contrato de hospedaje de ${c.inmueble} (${c.checkIn} → ${c.checkOut}) para que lo leas y lo firmes desde el teléfono: ${url}`)}` : null;
  const abierto = c.estado === 'borrador' || c.estado === 'enviado';
  return (
    <div>
      <Link href="/admin/contratos" className="inline-flex items-center gap-1.5 text-meta text-ink-muted hover:text-brand"><ArrowLeft className="h-4 w-4" />Contratos</Link>
      <header className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="font-serif text-headline font-normal track-headline text-ink">{c.huesped}</h1><p className="mt-1 text-meta text-ink-muted">{c.inmueble} · {c.checkIn} → {c.checkOut}</p></div>
        <Insignia tono={TONO[c.estado]}>{c.estado}</Insignia>
      </header>
      {sp.creado && <Aviso tono="ok">Contrato creado. Ahora mándaselo al huésped.</Aviso>}
      {sp.enviado && <Aviso tono="ok">Marcado como enviado.</Aviso>}
      {sp.anulado && <Aviso tono="atencion">Contrato anulado.</Aviso>}
      {sp.error === 'sin-correo' && <Aviso tono="error">Este contrato no tiene correo del huésped. Mándalo por WhatsApp o copia el enlace.</Aviso>}
      {sp.error === 'sin-smtp' && <Aviso tono="error">El correo saliente no está configurado en el servidor. Usa WhatsApp o el enlace.</Aviso>}
      {sp.error === 'envio' && <Aviso tono="error">El correo no salió (revisa la cuenta SMTP). El enlace sigue funcionando.</Aviso>}

      <Tarjeta className="mt-6 p-5">
        <p className="text-meta font-semibold text-ink">Enlace privado del huésped</p>
        <CopiarEnlace url={url} />
        <div className="mt-4 flex flex-wrap gap-2">
          {abierto && c.email && <form action={enviarContratoAction}><input type="hidden" name="id" value={c.id} /><button type="submit" className="btn-solid" disabled={!correoConfigurado()} title={correoConfigurado() ? '' : 'Correo no configurado'}><Mail className="h-4 w-4" />Enviar por correo a {c.email}</button></form>}
          {abierto && wa && <form action={marcarEnviadoAction} className="contents"><input type="hidden" name="id" value={c.id} /><input type="hidden" name="via" value="whatsapp" /><a href={wa} target="_blank" rel="noopener" className="inline-flex min-h-[46px] items-center gap-2 rounded-control border border-line bg-white px-4 text-meta font-medium text-brand-deep hover:border-brand/40"><MessageCircle className="h-4 w-4" />Mandar por WhatsApp</a><button type="submit" className="inline-flex min-h-[46px] items-center rounded-control border border-line bg-white px-3 text-ui text-ink-muted hover:border-brand/40" title="Cuando ya lo mandaste por WhatsApp">✓ ya lo mandé</button></form>}
          <a href={url} target="_blank" rel="noopener" className="inline-flex min-h-[46px] items-center gap-2 rounded-control border border-line bg-white px-4 text-meta font-medium text-brand-deep hover:border-brand/40"><ArrowUpRight className="h-4 w-4" />Abrir como lo ve el huésped</a>
          <a href={url} target="_blank" rel="noopener" className="inline-flex min-h-[46px] items-center gap-2 rounded-control border border-line bg-white px-4 text-meta font-medium text-brand-deep hover:border-brand/40"><Printer className="h-4 w-4" />Imprimir / PDF</a>
          {abierto && <form action={anularContratoAction}><input type="hidden" name="id" value={c.id} /><button type="submit" className="inline-flex min-h-[46px] items-center rounded-control border border-line bg-white px-4 text-meta font-medium text-accent hover:border-accent/40">Anular</button></form>}
        </div>
        {c.estado === 'firmado' && <p className="mt-4 text-ui text-ink-muted">Firmado el {new Date(c.firmadoAt!).toLocaleString('es-VE', { timeZone: 'America/Caracas' })} por {c.firmaNombre} ({c.firmaDocumento}) · IP {String(c.evidencia.ip ?? '—')} · <a href={`${url}/verificar`} target="_blank" rel="noopener" className="text-brand-deep underline underline-offset-4">verificar integridad</a></p>}
        <details className="mt-4"><summary className="cursor-pointer text-ui font-medium text-brand-deep">Bitácora ({eventos.length})</summary>
          <ol className="mt-2 space-y-1 text-ui text-ink-muted">{eventos.map((e, k) => <li key={k}><span className="mono-data">{new Date(e.at).toLocaleString('es-VE', { timeZone: 'America/Caracas' })}</span> · {NOMBRES[e.tipo] ?? e.tipo}{e.datos.ip ? ` · ${String(e.datos.ip)}` : ''}{e.datos.para ? ` · ${String(e.datos.para)}` : ''}</li>)}</ol></details>
      </Tarjeta>

      <div className="mt-6 rounded-panel border border-line bg-white p-6 md:p-10">
        <ContratoDocumento d={d} version={c.versionClausulas} token={c.token} firma={c.estado === 'firmado' ? { nombre: c.firmaNombre, documento: c.firmaDocumento, imagen: c.firmaImagen, fecha: c.firmadoAt!, hash: c.firmaHash, sello: c.sello, docHash: c.docHash, evidencia: c.evidencia } : null} />
      </div>
    </div>
  );
}
