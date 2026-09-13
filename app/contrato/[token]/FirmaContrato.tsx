'use client';

import { useEffect, useRef, useState } from 'react';
import { firmarContratoAction } from './actions';

// Firma a mano en el teléfono: un lienzo donde el huésped traza con el dedo,
// se exporta a PNG y viaja con el formulario. Botón «Borrar» para repetirla.
export default function FirmaContrato({ token, nombre, documento }: { token: string; nombre: string; documento: string }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [trazado, setTrazado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const c = lienzo.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const escala = window.devicePixelRatio || 1;
    const r = c.getBoundingClientRect(); c.width = r.width * escala; c.height = 180 * escala; ctx.scale(escala, escala);
    ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0b4a5c';
    let dibujando = false;
    const pos = (e: PointerEvent) => { const b = c.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top] as const; };
    const abajo = (e: PointerEvent) => { dibujando = true; c.setPointerCapture(e.pointerId); const [x, y] = pos(e); ctx.beginPath(); ctx.moveTo(x, y); };
    const mover = (e: PointerEvent) => { if (!dibujando) return; const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke(); setTrazado(true); };
    const arriba = () => { dibujando = false; };
    c.addEventListener('pointerdown', abajo); c.addEventListener('pointermove', mover); c.addEventListener('pointerup', arriba); c.addEventListener('pointercancel', arriba);
    return () => { c.removeEventListener('pointerdown', abajo); c.removeEventListener('pointermove', mover); c.removeEventListener('pointerup', arriba); c.removeEventListener('pointercancel', arriba); };
  }, []);

  const borrar = () => { const c = lienzo.current; if (!c) return; c.getContext('2d')!.clearRect(0, 0, c.width, c.height); setTrazado(false); };

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(null);
    if (!trazado) { setError('Dibuja tu firma en el recuadro.'); return; }
    const fd = new FormData(e.currentTarget);
    fd.set('firma', lienzo.current!.toDataURL('image/png'));
    setEnviando(true);
    const r = await firmarContratoAction(fd);
    setEnviando(false);
    if (!r.ok) setError(r.error ?? 'No se pudo firmar.'); else window.location.reload();
  };

  return (
    <form onSubmit={enviar} className="no-print mt-8 rounded-panel border border-line bg-white p-5 shadow-lift md:p-7">
      <input type="hidden" name="token" value={token} />
      <h2 className="font-serif text-title-sm font-semibold text-ink">Firmar el contrato</h2>
      <p className="mt-1 text-meta text-ink-muted">Revisa las cláusulas, completa tus datos y firma con el dedo. Recibes copia y nosotros también.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="text-meta font-semibold text-ink">Nombre completo</span><input name="nombre" required defaultValue={nombre} className="mt-1.5 block w-full rounded-control border border-line bg-white px-3 py-2.5 text-body" /></label>
        <label className="block"><span className="text-meta font-semibold text-ink">Cédula o pasaporte</span><input name="documento" required defaultValue={documento} placeholder="V-12345678" className="mt-1.5 block w-full rounded-control border border-line bg-white px-3 py-2.5 text-body" /></label>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between"><span className="text-meta font-semibold text-ink">Tu firma</span><button type="button" onClick={borrar} className="text-ui text-brand-deep underline underline-offset-4">Borrar</button></div>
        <canvas ref={lienzo} className="mt-1.5 h-[180px] w-full touch-none rounded-card border border-dashed border-line-strong bg-paper" aria-label="Recuadro para firmar" />
      </div>
      <label className="mt-4 flex items-start gap-3 text-meta text-ink-soft"><input type="checkbox" name="acepto" required className="mt-1 h-4 w-4" />Leí el contrato completo y acepto sus cláusulas. Entiendo que esta firma electrónica tiene la misma validez que una manuscrita.</label>
      {error && <p className="mt-3 rounded-card border border-accent/40 bg-accent/5 px-3 py-2 text-meta text-accent">{error}</p>}
      <button type="submit" disabled={enviando} className="btn-solid mt-5 w-full sm:w-auto">{enviando ? 'Firmando…' : 'Firmar y aceptar'}</button>
    </form>
  );
}
