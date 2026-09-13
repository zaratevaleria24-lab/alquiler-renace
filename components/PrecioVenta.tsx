import { getTasas, type TasasDerivadas } from '@/lib/tasas';
import { fmtBs, fmtEUR, fmtUSD, precioEnMonedas } from '@/lib/ventas';

// El precio de un inmueble en las monedas que la gente de verdad usa. El dato
// guardado es UNO (US$); lo demás se calcula con la tasa del día, así nunca
// hay un número vencido en la página.
//
// LA DISTINCIÓN QUE IMPORTA: en alquiler el sitio convierte al BCV, porque el
// huésped paga en bolívares al oficial. Una casa NO: nadie vende un inmueble de
// US$45.000 a Bs 37 millones cuando el mercado dice 43 (sería regalar la
// brecha). Por eso la cifra de mercado (Binance P2P) se muestra como "lo que se
// paga en bolívares" y la del BCV como referencia oficial, con la brecha entre
// ambas a la vista. Es exactamente el dato que un comprador venezolano quiere
// y que ningún portal le da.

export default async function PrecioVenta({
  usd, aConsultar, compacto = false, tasas,
}: { usd: number; aConsultar: boolean; compacto?: boolean;
  /** En un listado de 20 tarjetas se pasa UNA consulta de tasas para todas;
   *  sin esto cada tarjeta consultaba por su cuenta (0,7 s de página). */
  tasas?: TasasDerivadas | null }) {
  if (aConsultar || usd <= 0) {
    if (compacto) return <p className="mono-data text-title-sm text-brand-deep">Consultar precio</p>;
    return (
      <div className="rounded-card border border-line bg-white p-6">
        <p className="label-eyebrow text-ink-subtle">Precio</p>
        <p className="mono-data mt-2 text-title-sm text-brand-deep">A consultar</p>
        <p className="mt-3 text-meta text-ink-muted">
          El propietario no publicó el precio. Escríbenos y te lo confirmamos en el día, en dólares y
          en bolívares a la tasa del momento.
        </p>
      </div>
    );
  }
  const t = tasas !== undefined ? tasas : await getTasas().catch(() => null);
  const p = precioEnMonedas(usd, t ?? { bcvUsd: null, bcvEur: null, mercado: null, brecha: null });

  if (compacto) {
    return (
      <div>
        <p className="mono-data text-title-sm text-brand-deep">{fmtUSD(p.usd)}</p>
        {p.bsMercado != null && (
          <p className="text-ui text-ink-muted">≈ {fmtBs(p.bsMercado)} · {p.usd.toLocaleString('es-VE')} USDT</p>
        )}
      </div>
    );
  }
  return (
    <div className="rounded-card border border-line bg-white p-6">
      <p className="label-eyebrow text-ink-subtle">Precio</p>
      <p className="mono-data mt-2 text-display leading-none text-brand-deep">{fmtUSD(p.usd)}</p>
      <dl className="mt-5 space-y-2.5 text-body">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-muted">En USDT</dt>
          <dd className="mono-data text-ink">{p.usd.toLocaleString('es-VE')} USDT</dd>
        </div>
        {p.bsMercado != null && (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-ink-muted">En bolívares, tasa de mercado</dt>
            <dd className="mono-data text-ink">{fmtBs(p.bsMercado)}</dd>
          </div>
        )}
        {p.bsBcv != null && (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-ink-muted">Referencia al dólar BCV</dt>
            <dd className="mono-data text-ink-muted">{fmtBs(p.bsBcv)}</dd>
          </div>
        )}
        {p.eur != null && (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-ink-muted">En euros</dt>
            <dd className="mono-data text-ink">{fmtEUR(p.eur)}</dd>
          </div>
        )}
      </dl>
      <p className="mt-4 text-meta text-ink-muted">
        {t?.mercado
          ? `Tasas de hoy: mercado (Binance P2P) Bs ${t.mercado.toFixed(2)} y BCV Bs ${t.bcvUsd?.toFixed(2)} por dólar${p.brecha != null ? ` — brecha ${p.brecha.toFixed(1)} %` : ''}. El precio pactado es en dólares; las conversiones son orientativas.`
          : 'El precio se pacta en dólares. Las conversiones a bolívares se muestran cuando hay tasa del día.'}
      </p>
    </div>
  );
}
