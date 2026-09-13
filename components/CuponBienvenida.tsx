'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { pedirCuponAction } from '@/app/acciones/cupon';

// El cupón de bienvenida: 5 % en la primera reserva directa + la guía de la
// isla, a cambio de nombre y correo. Poca fricción: dos campos, un botón, y
// aparece una sola vez (localStorage), a los 6 s o al bajar un 35 %, nunca en
// las páginas de trabajo (/contrato, /enlaces, panel). El WhatsApp se pide
// DESPUÉS de dar el código, opcional: no frena la conversión y suma al CRM.
const CLAVE = 'mr:cupon';

export default function CuponBienvenida() {
  const [abierto, setAbierto] = useState(false);
  const [estado, setEstado] = useState<'form' | 'ok'>('form');
  const [cupon, setCupon] = useState(''); const [pct, setPct] = useState(5);
  const [error, setError] = useState<string | null>(null); const [enviando, setEnviando] = useState(false);
  const reducido = useReducedMotion();

  useEffect(() => {
    try { if (localStorage.getItem(CLAVE)) return; } catch {}
    let mostrado = false;
    const mostrar = () => { if (mostrado) return; mostrado = true; setAbierto(true); window.removeEventListener('scroll', porScroll); };
    const porScroll = () => { if (window.scrollY > document.documentElement.scrollHeight * 0.35) mostrar(); };
    const t = setTimeout(mostrar, 6000);
    window.addEventListener('scroll', porScroll, { passive: true });
    return () => { clearTimeout(t); window.removeEventListener('scroll', porScroll); };
  }, []);

  const cerrar = () => { setAbierto(false); try { localStorage.setItem(CLAVE, estado === 'ok' ? 'ok' : 'cerrado'); } catch {} };
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
        <motion.div key="cupon" role="dialog" aria-modal="true" aria-label="Cupón de bienvenida" className="fixed inset-0 z-[95] flex items-end justify-center bg-ink/30 p-3 backdrop-blur-[2px] md:items-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={cerrar}>
          <motion.div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md overflow-hidden rounded-panel border border-line bg-white shadow-lift-lg"
            initial={reducido ? false : { y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}>
            <button type="button" onClick={cerrar} aria-label="Cerrar" className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink-muted hover:text-ink"><X className="h-4 w-4" /></button>
            <div className="bg-luz px-6 pb-5 pt-7 text-center">
              <img src="/logo-mark-teal.svg" alt="" width={56} height={56} className="mx-auto h-14 w-14" />
              {estado === 'form' ? (
                <>
                  <p className="label-eyebrow mt-3 text-brand-deep">Bienvenido a la isla</p>
                  <h2 className="mt-1 font-serif text-[26px] font-semibold leading-tight text-ink">{pct} % de descuento <em className="headline-italic font-normal">en tu primera reserva</em></h2>
                  <p className="mt-2 text-meta text-ink-soft">Y de regalo, la guía de la isla: playas, dónde comer, servicios a domicilio y aventura, con horarios y cómo llegar.</p>
                </>
              ) : (
                <>
                  <p className="label-eyebrow mt-3 text-brand-deep">Tu código</p>
                  <p className="mono-data mt-2 inline-block rounded-card border border-dashed border-brand-deep bg-white px-5 py-3 text-[26px] font-semibold tracking-[.12em] text-brand-deep">{cupon}</p>
                  <p className="mt-3 text-meta text-ink-soft">Te lo enviamos también por correo. Vale una vez en tu primera reserva directa, sin vencimiento.</p>
                </>
              )}
            </div>
            {estado === 'form' ? (
              <form onSubmit={enviar} className="space-y-3 px-6 pb-6 pt-5">
                <input type="text" name="sitio" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                <input name="nombre" required placeholder="Tu nombre" autoComplete="given-name" className="w-full rounded-control border border-line bg-paper px-4 py-3 text-body text-ink" />
                <input name="email" type="email" required placeholder="Tu correo" autoComplete="email" inputMode="email" className="w-full rounded-control border border-line bg-paper px-4 py-3 text-body text-ink" />
                {error && <p className="text-meta text-accent">{error}</p>}
                <button type="submit" disabled={enviando} className="btn-solid w-full justify-center disabled:opacity-60">{enviando ? 'Un momento…' : `Quiero mi ${pct} % y la guía`}</button>
                <p className="text-center text-ui text-ink-faint">Sin spam: el código, la guía y, a lo sumo, un correo cuando abra la temporada. <Link href="/politicas#cookies" className="underline underline-offset-4">Datos</Link></p>
              </form>
            ) : (
              <div className="space-y-3 px-6 pb-6 pt-5">
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
