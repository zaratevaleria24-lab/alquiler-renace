import type { Metadata } from 'next';
import { SITE } from '@/lib/site';

// Cartel para imprimir y pegar en cada apartamento (A5 o media carta). Se abre
// desde el panel o en /guia/qr y se imprime con Ctrl+P: el CSS de impresión
// quita la barra y deja solo la tarjeta.
export const metadata: Metadata = { title: 'Cartel QR de la guía', robots: { index: false, follow: false } };

export default function QrPage() {
  return (
    <div className="min-h-screen bg-paper pb-16 pt-24 print:bg-white print:p-0">
      <style>{`@media print { nav, footer, .no-print { display: none !important } .cartel { box-shadow: none !important; border: none !important } @page { size: A5 portrait; margin: 10mm } }`}</style>
      <div className="mx-auto max-w-[420px] px-5">
        <div className="cartel rounded-panel border border-line bg-white p-8 text-center shadow-lift-lg">
          <img src="/logo-mark-teal.svg" alt="" width={72} height={72} className="mx-auto h-[72px] w-[72px]" />
          <p className="mt-4 font-serif text-[26px] font-semibold leading-tight text-ink">Margarita <span className="font-serif italic font-light text-accent">Renace</span></p>
          <p className="label-eyebrow mt-1 text-brand-deep">Guía turística de la isla</p>
          <img src="/qr-guia.png" alt="Código QR de la guía turística" width={820} height={820} className="mx-auto mt-6 w-[240px] rounded-card" />
          <p className="mt-6 font-serif text-title-sm text-ink">Escaneá y descubrí la isla</p>
          <p className="mt-2 text-meta text-ink-soft leading-relaxed">Playas, castillos, dónde comer, qué hacer y los consejos que te daría un amigo margariteño. Con horarios, cómo llegar y fotos.</p>
          <p className="mono-data mt-5 text-ink-muted">margaritarenace.com.ve/guia</p>
        </div>
        <p className="no-print mt-6 text-center text-meta text-ink-muted">Para imprimir: Ctrl+P (o Compartir → Imprimir en el teléfono). Tamaño A5. También podés descargar el <a href="/qr-guia.png" className="text-brand-deep underline underline-offset-4">QR en PNG</a> o <a href="/qr-guia.svg" className="text-brand-deep underline underline-offset-4">SVG</a> para ponerlo donde quieras.</p>
      </div>
    </div>
  );
}
