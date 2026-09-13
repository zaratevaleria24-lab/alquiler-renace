'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, Copy, X } from 'lucide-react';
import { pedirCuponAction } from '@/app/acciones/cupon';

// El cupón de bienvenida: 5 % en la primera reserva directa + la guía de la
// isla, a cambio de nombre y correo. Poca fricción: dos campos, un botón. Se
// muestra en cada carga (a los 6 s o al bajar un 35 %) hasta que la persona
// completa el formulario; desde entonces no vuelve (localStorage). Nunca en
// las páginas de trabajo (/contrato, /enlaces, panel). El WhatsApp se pide
// DESPUÉS de dar el código, opcional: no frena la conversión y suma al CRM.
const CLAVE = 'mr:cupon';

export interface AptoCupon { slug: string; nombre: string; sector: string }

export default function CuponBienvenida({ aptos = [] }: { aptos?: AptoCupon[] }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => { try { await navigator.clipboard.writeText(cupon); setCopiado(true); setTimeout(() => setCopiado(false), 1600); } catch {} };
  const [abierto, setAbierto] = useState(false);
  const [estado, setEstado] = useState<'form' | 'ok'>('form');
  const [cupon, setCupon] = useState(''); const [pct, setPct] = useState(10);
  const [error, setError] = useState<string | null>(null); const [enviando, setEnviando] = useState(false);
  const reducido = useReducedMotion();

  useEffect(() => {
    // Solo «ok» (ya tiene su código) lo apaga; un «cerrado» viejo no cuenta.
    try { if (localStorage.getItem(CLAVE) === 'ok') return; } catch {}
    let mostrado = false;
    const mostrar = () => { if (mostrado) return; mostrado = true; setAbierto(true); window.removeEventListener('scroll', porScroll); };
    const porScroll = () => { if (window.scrollY > document.documentElement.scrollHeight * 0.35) mostrar(); };
    const t = setTimeout(mostrar, 6000);
    window.addEventListener('scroll', porScroll, { passive: true });
    return () => { clearTimeout(t); window.removeEventListener('scroll', porScroll); };
  }, []);

  // Cerrar sin completar NO lo apaga: vuelve a aparecer en la próxima carga.
  // Solo desaparece para siempre cuando la persona ya tiene su código.
  const cerrar = () => { setAbierto(false); if (estado === 'ok') { try { localStorage.setItem(CLAVE, 'ok'); } catch {} } };
  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(null); setEnviando(true);
    const fd = new FormData(e.currentTarget); fd.set('pagina', location.pathname + location.search);
    const r = await pedirCuponAction(fd); setEnviando(false);
    if (!r.ok) { setError(r.error ?? 'No se pudo registrar.'); return; }
    setCupon(r.cupon ?? ''); setPct(r.pct ?? 5); setEstado('ok');
    try { localStorage.setItem(CLAVE, 'ok'); } catch {}
  };

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div key="cupon" role="dialog" aria-modal="true" aria-label="Cupón de bienvenida" className="fixed inset-0 z-[95] flex items-end justify-center bg-ink/40 p-3 backdrop-blur-md md:items-center md:p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={cerrar}>
          <motion.div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-lg overflow-hidden rounded-[22px] border border-white/60 bg-white/95 shadow-[0_40px_80px_-30px_rgba(11,74,92,.45)] ring-1 ring-brand/10 backdrop-blur-xl"
            initial={reducido ? false : { y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}>
            <button type="button" onClick={cerrar} aria-label="Cerrar" className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink-muted hover:text-ink"><X className="h-4 w-4" /></button>
            <div className="relative bg-luz px-6 pb-6 pt-9 text-center md:px-10">
              <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/60 blur-3xl" />
              <span aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-sea/30 blur-3xl" />
              <img src="/logo-mark-teal.svg" alt="" width={72} height={72} className="relative mx-auto h-[72px] w-[72px]" />
              {estado === 'form' ? (
                <>
                  <p className="label-eyebrow mt-3 text-brand-deep">Bienvenido a la isla</p>
                  <h2 className="mt-1 font-serif text-[30px] font-semibold leading-tight text-ink md:text-[34px]">{pct} % de descuento <em className="headline-italic font-normal">en tu primera reserva</em></h2>
                  <p className="mx-auto mt-3 max-w-sm text-body text-ink-soft">Y de regalo, la guía de la isla: playas, dónde comer, servicios a domicilio y aventura, con horarios y cómo llegar.</p>
                </>
              ) : (
                <>
                  <p className="label-eyebrow mt-3 text-brand-deep">Tu código</p>
                  <button type="button" onClick={copiar} className="mono-data mt-2 inline-flex items-center gap-3 rounded-card border border-dashed border-brand-deep bg-white px-5 py-3 text-[24px] font-semibold tracking-[.12em] text-brand-deep" title="Copiar código">
                    {cupon}{copiado ? <Check className="h-5 w-5 text-brand" /> : <Copy className="h-5 w-5 text-ink-muted" />}
                  </button>
                  <p className="mt-2 text-ui text-ink-muted">{copiado ? 'Copiado. Pégalo en la reserva o en el WhatsApp.' : 'Toca el código para copiarlo.'}</p>
                  <p className="mt-2 text-meta text-ink-soft">Te lo enviamos también por correo. Vale una vez, en tu primera reserva directa de cualquier apartamento, traslado o carro. Sin vencimiento.</p>
                </>
              )}
            </div>
            {estado === 'form' ? (
              <form onSubmit={enviar} className="space-y-3 px-6 pb-7 pt-6 md:px-10">
                <input type="text" name="sitio" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                <input name="nombre" required placeholder="Tu nombre" autoComplete="given-name" className="w-full rounded-control border border-line bg-paper px-4 py-3.5 text-body text-ink outline-none transition-colors focus:border-brand" />
                <input name="email" type="email" required placeholder="Tu correo" autoComplete="email" inputMode="email" className="w-full rounded-control border border-line bg-paper px-4 py-3.5 text-body text-ink outline-none transition-colors focus:border-brand" />
                {error && <p className="text-meta text-accent">{error}</p>}
                <button type="submit" disabled={enviando} className="btn-solid min-h-[52px] w-full justify-center text-body disabled:opacity-60">{enviando ? 'Un momento…' : `Quiero mi ${pct} % y la guía`}</button>
                <p className="text-center text-ui text-ink-faint">Sin spam: el código, la guía y, a lo sumo, un correo cuando abra la temporada. <Link href="/politicas#cookies" className="underline underline-offset-4">Datos</Link></p>
              </form>
            ) : (
              <div className="space-y-3 px-6 pb-7 pt-6 md:px-10">
                {aptos.length > 0 && (
                  <div>
                    <p className="text-ui font-semibold uppercase tracking-[0.12em] text-ink-subtle">Aplícalo en tu apartamento</p>
                    <ul className="mt-2 grid grid-cols-2 gap-2">
                      {aptos.map((a) => <li key={a.slug}><Link href={`/reservas?cupon=${encodeURIComponent(cupon)}&apto=${a.slug}`} onClick={cerrar} className="block rounded-card border border-line bg-paper px-3 py-2 text-left transition-colors hover:border-brand/40"><span className="block text-meta font-semibold leading-tight text-ink">{a.nombre}</span><span className="block text-[11px] text-ink-muted">{a.sector}</span></Link></li>)}
                    </ul>
                  </div>
                )}
                <Link href={`/reservas?cupon=${encodeURIComponent(cupon)}`} onClick={cerrar} className="btn-solid w-full justify-center">Calcular mi estadía con el descuento</Link>
                <Link href="/guia" onClick={cerrar} className="flex min-h-[46px] w-full items-center justify-center rounded-control border border-line bg-white text-meta font-medium text-brand-deep hover:border-brand/40">Abrir la guía de la isla</Link>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
