import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { datosDe, getContratoPorToken } from '@/lib/contratos';
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
  const [d, contacto] = await Promise.all([datosDe(c), getContacto()]);
  const wa = contacto.whatsapp ? `https://wa.me/${contacto.whatsapp}?text=${encodeURIComponent(`Hola, tengo una duda sobre el contrato de ${c.inmueble} (${c.checkIn}).`)}` : null;
  return (
    <div className="min-h-screen bg-paper print:bg-white">
      <style>{`@media print { .no-print { display: none !important } .documento { box-shadow: none !important; border: none !important; padding: 0 !important } @page { size: A4; margin: 16mm } }`}</style>
      <div className="mx-auto max-w-3xl px-5 py-8 md:py-12">
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-2 font-serif text-[19px] font-semibold text-ink"><img src="/logo-mark-teal.svg" alt="" width={32} height={32} className="h-8 w-8" />Margarita <span className="text-accent">Renace</span></a>
          <div className="flex gap-2">
            {wa && <a href={wa} rel="noopener" className="inline-flex min-h-[40px] items-center rounded-control border border-line bg-white px-3.5 text-ui font-medium text-brand-deep">WhatsApp</a>}
            <a href="javascript:window.print()" className="inline-flex min-h-[40px] items-center rounded-control border border-line bg-white px-3.5 text-ui font-medium text-brand-deep">Imprimir</a>
          </div>
        </div>
        {c.estado === 'firmado' && <p className="no-print mb-5 rounded-card border border-brand/30 bg-brand-tint px-4 py-3 text-meta text-brand-deep">Contrato firmado. Guarda esta página o imprímela en PDF: es tu copia.</p>}
        {c.estado === 'anulado' && <p className="no-print mb-5 rounded-card border border-accent/40 bg-accent/5 px-4 py-3 text-meta text-accent">Este contrato fue anulado por el arrendador.</p>}
        <div className="documento rounded-panel border border-line p-6 shadow-lift md:p-10">
          <ContratoDocumento d={d} version={c.versionClausulas} firma={c.estado === 'firmado' ? { nombre: c.firmaNombre, documento: c.firmaDocumento, imagen: c.firmaImagen, fecha: c.firmadoAt!, hash: c.firmaHash } : null} />
        </div>
        {(c.estado === 'borrador' || c.estado === 'enviado') && <FirmaContrato token={c.token} nombre={c.huesped} documento={c.documento} />}
      </div>
    </div>
  );
}
