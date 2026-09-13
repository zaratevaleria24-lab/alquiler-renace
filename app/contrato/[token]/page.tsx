import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { datosDe, getContratoPorToken, registrarApertura } from '@/lib/contratos';
import { getContacto } from '@/lib/settings';
import ContratoDocumento from '@/components/ContratoDocumento';
import FirmaContrato from './FirmaContrato';

// Enlace privado del huésped: lee, firma e imprime. Sin índice, sin barra.
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Contrato de hospedaje', robots: { index: false, follow: false } };

export default async function ContratoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const c = await getContratoPorToken(token);
  if (!c) notFound();
  const h = await headers();
  await registrarApertura(c, { ip: (h.get('cf-connecting-ip') || h.get('x-forwarded-for') || '').split(',')[0].trim(), agente: h.get('user-agent') ?? '' });
  const [d, contacto] = await Promise.all([datosDe(c), getContacto()]);
  const wa = contacto.whatsapp ? `https://wa.me/${contacto.whatsapp}?text=${encodeURIComponent(`Hola, tengo una duda sobre el contrato de ${c.inmueble} (${c.checkIn}).`)}` : null;
  const firma = c.estado === 'firmado' ? { nombre: c.firmaNombre, documento: c.firmaDocumento, imagen: c.firmaImagen, fecha: c.firmadoAt!, hash: c.firmaHash, sello: c.sello, docHash: c.docHash, evidencia: c.evidencia, tsaAutoridad: c.tsaAutoridad, tsaHora: c.tsaHora, otsEstado: c.otsEstado } : null;
  return (
    <div className="min-h-screen bg-paper print:bg-white">
      <style>{`@media print { .no-print { display: none !important } .documento { box-shadow: none !important; border: none !important; padding: 0 !important } @page { size: A4; margin: 16mm } }`}</style>
      <div className="mx-auto max-w-3xl px-5 py-8 md:py-12">
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-2 font-serif text-[19px] font-semibold text-ink"><img src="/logo-mark-teal.svg" alt="" width={32} height={32} className="h-8 w-8" />Margarita <span className="text-accent">Renace</span></a>
          <div className="flex gap-2">
            {wa && <a href={wa} rel="noopener" className="inline-flex min-h-[40px] items-center rounded-control border border-line bg-white px-3.5 text-ui font-medium text-brand-deep">WhatsApp</a>}
            {c.estado === 'firmado' && <a href={`/contrato/${token}/verificar`} className="inline-flex min-h-[40px] items-center rounded-control border border-line bg-white px-3.5 text-ui font-medium text-brand-deep">Verificar</a>}
            <a href="javascript:window.print()" className="inline-flex min-h-[40px] items-center rounded-control border border-line bg-white px-3.5 text-ui font-medium text-brand-deep">Imprimir</a>
          </div>
        </div>
        {c.estado === 'firmado' && <p className="no-print mb-5 rounded-card border border-brand/30 bg-brand-tint px-4 py-3 text-meta text-brand-deep">Contrato firmado. Guarda esta página o imprímela en PDF: es tu copia. También te la enviamos por correo.</p>}
        {c.estado === 'anulado' && <p className="no-print mb-5 rounded-card border border-accent/40 bg-accent/5 px-4 py-3 text-meta text-accent">Este contrato fue anulado por el arrendador.</p>}
        {/* La hoja: blanco puro, borde fino, márgenes de documento. Nada de
            tarjeta con sombra: tiene que parecer un contrato, no una pantalla. */}
        <div className="documento border border-line bg-white px-6 py-8 sm:px-10 sm:py-12 md:px-14 md:py-16" style={{ boxShadow: '0 1px 0 #e6d9cc, 0 12px 30px -18px rgba(43,38,34,.25)' }}>
          <ContratoDocumento d={d} version={c.versionClausulas} firma={firma} token={token} />
        </div>
        {(c.estado === 'borrador' || c.estado === 'enviado') && (
          <>
            <div id="firma"><FirmaContrato token={c.token} nombre={c.huesped} documento={c.documento} email={c.email} codigoVerificado={c.codigoVerificado} /></div>
            {/* Botón fijo abajo: baja directo a la firma sin leer con el pulgar 14 cláusulas. Desaparece al llegar (CSS: se oculta cuando #firma está en pantalla no es posible sin JS, así que queda; es pequeño). */}
            <a href="#firma" className="no-print fixed bottom-4 left-1/2 z-40 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-brand-deep px-5 py-3 text-meta font-semibold text-white shadow-lift-lg">Ir a la firma <span aria-hidden="true">↓</span></a>
          </>
        )}
      </div>
    </div>
  );
}
