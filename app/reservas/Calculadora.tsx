'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, MessageCircle, Ticket, Users } from 'lucide-react';
import { validarCuponAction } from '@/app/acciones/cupon';
import SinFoto from '@/components/SinFoto';

interface Apto { slug: string; nombre: string; zona: string; precio: number; personas: number; portada: string }
interface Ocupado { desde: string; hasta: string }
const bs = (n: number) => `Bs ${n.toLocaleString('es-VE', { maximumFractionDigits: 0 })}`;
const usd = (n: number) => `US$ ${n.toLocaleString('es-VE')}`;
const hoy = () => new Date().toISOString().slice(0, 10);
const mas = (iso: string, d: number) => { const x = new Date(iso + 'T12:00:00'); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };

// La calculadora: todo en el navegador con dos llamadas livianas al sitio
// (/api/tasa y /api/disponibilidad/<slug>). Sin JS igual se ven los precios.
export default function Calculadora({ aptos, whatsapp }: { aptos: Apto[]; whatsapp: string | null }) {
  const [slug, setSlug] = useState(aptos[0]?.slug ?? '');
  const [entrada, setEntrada] = useState(mas(hoy(), 7));
  const [salida, setSalida] = useState(mas(hoy(), 10));
  const [personas, setPersonas] = useState(2);
  const [tasa, setTasa] = useState<number | null>(null); // Bs por US$ al BCV
  const [usdt, setUsdt] = useState<number | null>(null); // Bs por USDT (Binance)
  const [ocupado, setOcupado] = useState<Ocupado[] | null>(null);
  const apto = aptos.find((a) => a.slug === slug) ?? aptos[0];
  const [cupon, setCupon] = useState('');
  const [descuento, setDescuento] = useState<{ pct: number; nombre: string } | null>(null);
  const [cuponError, setCuponError] = useState<string | null>(null);
  const PAGOS = [
    { k: 'pago-movil', t: 'Pago móvil', d: 'en bolívares al BCV' },
    { k: 'zelle', t: 'Zelle', d: 'en dólares' },
    { k: 'efectivo', t: 'Efectivo', d: 'dólares al llegar' },
    { k: 'usdt', t: 'USDT', d: 'por Binance, al equivalente' },
  ] as const;
  const [pago, setPago] = useState<(typeof PAGOS)[number]['k']>('pago-movil');
  const aplicarCupon = async (c: string) => {
    if (!c.trim()) { setDescuento(null); setCuponError(null); return; }
    const v = await validarCuponAction(c);
    if (v.estado === 'ok') { setDescuento({ pct: v.pct, nombre: v.nombre }); setCupon(v.cupon); setCuponError(null); }
    else { setDescuento(null); setCuponError(v.estado === 'usado' ? 'Ese código ya se usó en una reserva. Si crees que es un error, escríbenos por WhatsApp.' : 'Ese código no existe. Revisa las letras (por ejemplo RENACE10-7K3M) o pide el tuyo en el inicio.'); }
  };
  useEffect(() => { const q = new URLSearchParams(location.search); const c = q.get('cupon'); if (c) { setCupon(c.toUpperCase()); aplicarCupon(c); } const a = q.get('apto'); if (a && aptos.some((x) => x.slug === a)) setSlug(a); }, []);

  useEffect(() => { fetch('/api/tasa').then((r) => r.json()).then((d) => { setTasa(d.bcv ?? null); setUsdt(d.usdt ?? null); }).catch(() => {}); }, []);
  useEffect(() => { if (!slug) return; setOcupado(null); fetch(`/api/disponibilidad/${slug}`).then((r) => r.json()).then((d) => setOcupado(d.ocupado ?? [])).catch(() => setOcupado([])); }, [slug]);

  const noches = Math.max(0, Math.round((Date.parse(salida) - Date.parse(entrada)) / 86400000));
  const bruto = noches * (apto?.precio ?? 0);
  const rebaja = descuento ? Math.round(bruto * descuento.pct) / 100 : 0;
  const total = bruto - rebaja;
  const choque = useMemo(() => (ocupado ?? []).some((o) => entrada < o.hasta && salida > o.desde), [ocupado, entrada, salida]);
  // El «objeto de la compra» completo va al WhatsApp: el anfitrión no tiene
  // que preguntar nada y el huésped ve el precio en las tres formas de pago.
  const enUsdt = tasa && usdt ? total * tasa / usdt : null;
  const pagoElegido = PAGOS.find((x) => x.k === pago)!;
  const mensaje = [
    `Hola, quiero reservar *${apto?.nombre}* (${apto?.zona}).`,
    `Entrada: ${entrada} · Salida: ${salida}`,
    `Estadía: ${noches} ${noches === 1 ? 'noche' : 'noches'}, ${personas} ${personas === 1 ? 'persona' : 'personas'}`,
    `Precio: ${usd(apto?.precio ?? 0)} por noche (dólar BCV) × ${noches} = ${usd(bruto)}`,
    descuento ? `Cupón ${cupon}: −${descuento.pct} % (−${usd(rebaja)})` : '',
    `*Total: ${usd(total)}*`,
    tasa ? `En bolívares: ${bs(total * tasa)} (tasa BCV de hoy: ${bs(tasa)} por dólar)` : '',
    enUsdt ? `Si pagas en USDT: ${enUsdt.toFixed(1)} USDT (referencia, Binance de hoy)` : '',
    `Forma de pago: ${pagoElegido.t} (${pagoElegido.d}).`,
    '¿Está disponible?',
    `https://margaritarenace.com.ve/propiedad/${apto?.slug}`,
  ].filter(Boolean).join('\n');
  const wa = whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje)}` : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <section aria-label="Apartamentos">
        <ul className="grid gap-3 sm:grid-cols-2">
          {aptos.map((a) => (
            <li key={a.slug}>
              <button type="button" onClick={() => setSlug(a.slug)} aria-pressed={a.slug === slug} className={`flex w-full gap-3 rounded-card border bg-white p-3 text-left transition-colors ${a.slug === slug ? 'border-brand-deep shadow-lift' : 'border-line hover:border-brand/40'}`}>
                {a.portada ? (
                  <img src={a.portada} alt={`${a.nombre}, ${a.zona}`} width={96} height={96} loading="lazy" className="h-24 w-24 shrink-0 rounded-card object-cover" />
                ) : (
                  <SinFoto compacta className="h-24 w-24 shrink-0 rounded-card" />
                )}
                <span className="min-w-0"><span className="block font-serif text-[17px] font-semibold leading-tight text-ink">{a.nombre}</span><span className="mt-0.5 block text-ui text-ink-muted">{a.zona} · hasta {a.personas} personas</span><span className="mono-data mt-2 block text-ink">{usd(a.precio)} <span className="text-ink-muted">/ noche</span></span></span>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <label className="block rounded-card border border-line bg-white p-3"><span className="label-eyebrow flex items-center gap-1.5 text-ink-subtle"><CalendarDays className="h-3.5 w-3.5" />Entrada</span><input type="date" value={entrada} min={hoy()} onChange={(e) => { setEntrada(e.target.value); if (salida <= e.target.value) setSalida(mas(e.target.value, 1)); }} className="mt-1.5 w-full bg-transparent text-body text-ink" /></label>
          <label className="block rounded-card border border-line bg-white p-3"><span className="label-eyebrow flex items-center gap-1.5 text-ink-subtle"><CalendarDays className="h-3.5 w-3.5" />Salida</span><input type="date" value={salida} min={mas(entrada, 1)} onChange={(e) => setSalida(e.target.value)} className="mt-1.5 w-full bg-transparent text-body text-ink" /></label>
          <label className="block rounded-card border border-line bg-white p-3"><span className="label-eyebrow flex items-center gap-1.5 text-ink-subtle"><Users className="h-3.5 w-3.5" />Personas</span><input type="number" min={1} max={apto?.personas ?? 6} value={personas} onChange={(e) => setPersonas(Math.max(1, Math.min(apto?.personas ?? 6, Number(e.target.value) || 1)))} className="mt-1.5 w-full bg-transparent text-body text-ink" /></label>
        </div>
      </section>

      <aside className="h-fit rounded-panel border border-line bg-white p-5 shadow-lift lg:sticky lg:top-28">
        <p className="label-eyebrow text-brand-deep">Tu estadía</p>
        <p className="mt-1 font-serif text-title-sm font-semibold text-ink">{apto?.nombre}</p>
        <dl className="mt-4 divide-y divide-line text-meta">
          <div className="flex justify-between py-2"><dt className="text-ink-muted">{noches} {noches === 1 ? 'noche' : 'noches'} × {usd(apto?.precio ?? 0)}</dt><dd className="mono-data">{usd(bruto)}</dd></div>
          {descuento && <div className="flex justify-between py-2 text-brand-deep"><dt>Cupón {cupon} · {descuento.pct} %</dt><dd className="mono-data">− {usd(rebaja)}</dd></div>}
          <div className="flex justify-between py-2"><dt className="text-ink-muted">Personas</dt><dd>{personas}</dd></div>
          <div className="flex items-baseline justify-between py-3"><dt className="text-body font-semibold">Total <span className="text-ui font-normal text-ink-muted">· dólar BCV</span></dt><dd className="mono-data text-[30px] font-semibold leading-none text-brand-deep">{usd(total)}</dd></div>
          {tasa && <div className="flex justify-between py-2"><dt className="text-ink-muted">En bolívares (tasa BCV de hoy {bs(tasa)})</dt><dd className="mono-data">{bs(total * tasa)}</dd></div>}
          {enUsdt != null && <div className="flex justify-between py-2"><dt className="text-ink-muted">USDT · referencia alternativa</dt><dd className="mono-data">≈ {enUsdt.toFixed(1)} USDT</dd></div>}
        </dl>
        {ocupado === null ? <p className="mt-3 text-ui text-ink-faint">Consultando el calendario…</p>
          : choque ? <p className="mt-3 rounded-card border border-accent/40 bg-accent/5 px-3 py-2 text-meta text-accent">Esas fechas ya están ocupadas en {apto?.nombre}. Prueba otras o pregúntanos por otro apartamento.</p>
          : noches > 0 && <p className="mt-3 rounded-card border border-brand/30 bg-brand-tint px-3 py-2 text-meta text-brand-deep">Fechas libres según nuestro calendario (incluye Airbnb).</p>}
        <fieldset className="mt-3">
          <legend className="text-ui font-semibold uppercase tracking-[0.12em] text-ink-subtle">¿Cómo prefieres pagar?</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {PAGOS.map((x) => (
              <label key={x.k} className={`cursor-pointer rounded-card border px-3 py-2 text-left transition-colors ${pago === x.k ? 'border-brand-deep bg-brand-tint' : 'border-line bg-white hover:border-brand/40'}`}>
                <input type="radio" name="pago" value={x.k} checked={pago === x.k} onChange={() => setPago(x.k)} className="sr-only" />
                <span className="block text-meta font-semibold text-ink">{x.t}</span><span className="block text-[11px] text-ink-muted">{x.d}</span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-ui text-ink-muted">¿Prefieres tarjeta internacional? Reserva por <a href="/enlaces#airbnb" className="text-brand-deep underline underline-offset-4">Airbnb</a> (con su comisión).</p>
        </fieldset>
        <form onSubmit={(e) => { e.preventDefault(); aplicarCupon(cupon); }} className="mt-3 flex gap-2">
          <label className="relative flex-1"><Ticket className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden="true" /><input value={cupon} onChange={(e) => setCupon(e.target.value.toUpperCase())} placeholder="Código de descuento" aria-label="Código de descuento" className="mono-data w-full rounded-control border border-line bg-paper py-2 pl-9 pr-3 text-meta" /></label>
          <button type="submit" className="rounded-control border border-line bg-white px-3 text-ui font-medium text-brand-deep hover:border-brand/40">Aplicar</button>
        </form>
        {cuponError && <p className="mt-1 text-ui text-accent">{cuponError}</p>}
        {wa && noches > 0 && <a href={wa} rel="noopener" className="btn-solid mt-4 w-full justify-center"><MessageCircle className="h-4 w-4" />Reservar por WhatsApp</a>}
        <p className="mt-3 text-ui text-ink-muted">Confirmas con el 50 % y firmas el contrato desde tu teléfono. <Link href="/politicas" className="text-brand-deep underline underline-offset-4">Políticas</Link> · <Link href={`/propiedad/${apto?.slug}`} className="text-brand-deep underline underline-offset-4">Ver el apartamento</Link></p>
        <p className="mt-2 text-ui text-ink-faint">Precio en dólares a tasa BCV. Pagas en dólares (efectivo, Zelle), en bolívares al BCV del día (pago móvil) o en USDT al equivalente del día. Bs y USDT se ajustan el día del pago.</p>
      </aside>
    </div>
  );
}
