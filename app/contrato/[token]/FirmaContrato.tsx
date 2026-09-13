'use client';

import { useEffect, useRef, useState } from 'react';
import { firmarContratoAction, pedirCodigoAction } from './actions';

// Firma desde el teléfono o la computadora: (1) si hay correo, se pide un
// código de 6 dígitos que llega al correo del huésped; (2) nombre, documento,
// trazo de la firma con dedo o ratón, aceptación. El navegador manda además
// idioma, zona horaria y pantalla como evidencia; la IP y el navegador los
// toma el servidor.
export default function FirmaContrato({ token, nombre, documento, email, codigoVerificado }: { token: string; nombre: string; documento: string; email: string; codigoVerificado: boolean }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [trazado, setTrazado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [codigoPedido, setCodigoPedido] = useState(codigoVerificado);
  const [pidiendo, setPidiendo] = useState(false);
  const necesitaCodigo = Boolean(email) && !codigoVerificado;

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
  const pedir = async () => {
    setPidiendo(true); setError(null);
    const fd = new FormData(); fd.set('token', token);
    const r = await pedirCodigoAction(fd); setPidiendo(false);
    if (!r.ok) setError(r.error ?? 'No se pudo enviar el código.'); else setCodigoPedido(true);
  };
  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(null);
    if (!trazado) { setError('Dibuja tu firma en el recuadro.'); return; }
    const fd = new FormData(e.currentTarget);
    fd.set('firma', lienzo.current!.toDataURL('image/png'));
    fd.set('idioma', navigator.language); fd.set('zona', Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''); fd.set('pantalla', `${screen.width}×${screen.height}`);
    setEnviando(true);
    const r = await firmarContratoAction(fd); setEnviando(false);
    if (!r.ok) setError(r.error ?? 'No se pudo firmar.'); else window.location.reload();
  };
  const oculto = (m: string) => m.replace(/^(.{2}).*(@.*)$/, '$1•••$2');

  return (
    <form onSubmit={enviar} className="no-print mt-8 rounded-panel border border-line bg-white p-5 shadow-lift md:p-7">
      <input type="hidden" name="token" value={token} />
      <h2 className="font-serif text-title-sm font-semibold text-ink">Firmar el contrato</h2>
      <p className="mt-1 text-meta text-ink-muted">Revisa las cláusulas, confirma tu identidad y firma con el dedo o el ratón. Recibes tu copia firmada por correo.</p>

      {necesitaCodigo && (
        <div className="mt-5 rounded-card border border-line bg-paper p-4">
          <p className="text-meta font-semibold text-ink">1 · Código de verificación</p>
          <p className="mt-1 text-meta text-ink-muted">Te enviamos un código de 6 dígitos a <b>{oculto(email)}</b>. Así queda constancia de que firmas tú.</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" onClick={pedir} disabled={pidiendo} className="inline-flex min-h-[42px] items-center rounded-control border border-brand-deep bg-white px-4 text-meta font-medium text-brand-deep disabled:opacity-60">{pidiendo ? 'Enviando…' : codigoPedido ? 'Reenviar código' : 'Enviarme el código'}</button>
            <input name="codigo" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="000000" required disabled={!codigoPedido} className="mono-data w-40 rounded-control border border-line bg-white px-3 py-2.5 text-center text-[20px] tracking-[.3em] disabled:opacity-50" aria-label="Código de 6 dígitos" />
          </div>
        </div>
      )}

      <p className="mt-5 text-meta font-semibold text-ink">{necesitaCodigo ? '2 · ' : ''}Tus datos</p>
      <div className="mt-2 grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="text-ui font-medium text-ink-muted">Nombre completo</span><input name="nombre" required defaultValue={nombre} className="mt-1.5 block w-full rounded-control border border-line bg-white px-3 py-2.5 text-body" /></label>
        <label className="block"><span className="text-ui font-medium text-ink-muted">Cédula o pasaporte</span><input name="documento" required defaultValue={documento} placeholder="V-12345678" className="mt-1.5 block w-full rounded-control border border-line bg-white px-3 py-2.5 text-body" /></label>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between"><span className="text-meta font-semibold text-ink">{necesitaCodigo ? '3 · ' : ''}Tu firma</span><button type="button" onClick={borrar} className="text-ui text-brand-deep underline underline-offset-4">Borrar</button></div>
        <canvas ref={lienzo} className="mt-1.5 h-[180px] w-full touch-none rounded-card border border-dashed border-line-strong bg-paper" aria-label="Recuadro para firmar" />
        <p className="mt-1 text-ui text-ink-faint">Firma con el dedo en el teléfono o con el ratón en la computadora.</p>
      </div>
      <label className="mt-4 flex items-start gap-3 text-meta text-ink-soft"><input type="checkbox" name="acepto" required className="mt-1 h-4 w-4" />Leí el contrato completo y acepto sus cláusulas. Entiendo que esta firma electrónica, junto con el código de verificación, la fecha, mi dispositivo y mi dirección IP, tiene la misma validez que una firma manuscrita.</label>
      {error && <p className="mt-3 rounded-card border border-accent/40 bg-accent/5 px-3 py-2 text-meta text-accent">{error}</p>}
      <button type="submit" disabled={enviando || (necesitaCodigo && !codigoPedido)} className="btn-solid mt-5 w-full disabled:opacity-60 sm:w-auto">{enviando ? 'Firmando…' : 'Firmar y aceptar'}</button>
    </form>
  );
}
