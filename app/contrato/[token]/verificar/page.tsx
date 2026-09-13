import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';
import { comprobar, getContratoPorToken, listarEventos } from '@/lib/contratos';

// Verificación pública de un contrato firmado: recalcula las huellas y
// comprueba el sello Ed25519 del servidor. Pensada para un perito o un abogado:
// muestra qué se firmó, cuándo, desde qué dispositivo y la clave pública.
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Verificación de contrato', robots: { index: false, follow: false } };
const NOMBRES: Record<string, string> = { creado: 'Contrato creado', enviado_correo: 'Enviado por correo', enviado_whatsapp: 'Enviado por WhatsApp', enviado_enlace: 'Enlace copiado', abierto: 'Enlace abierto por el huésped', codigo_enviado: 'Código de verificación enviado', codigo_verificado: 'Código verificado', codigo_fallido: 'Código incorrecto', firmado: 'Firmado', copia_enviada: 'Copia firmada enviada', anulado: 'Anulado' };

export default async function VerificarPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const c = await getContratoPorToken(token); if (!c) notFound();
  const eventos = await listarEventos(c.id);
  const v = c.estado === 'firmado' ? await comprobar(c) : null;
  const F = ({ ok, t }: { ok: boolean; t: string }) => <li className="flex items-center gap-2 text-body">{ok ? <CheckCircle2 className="h-5 w-5 text-brand" /> : <XCircle className="h-5 w-5 text-accent" />}{t}</li>;
  const hora = (iso: string) => new Date(iso).toLocaleString('es-VE', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'America/Caracas' });
  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <a href={`/contrato/${token}`} className="text-meta text-ink-muted hover:text-brand">← Ver el contrato</a>
        <p className="label-eyebrow mt-4 text-brand-deep">Verificación de integridad</p>
        <h1 className="mt-1 font-serif text-headline font-normal track-headline text-ink">{c.inmueble} · {c.checkIn}</h1>
        <p className="mt-2 text-meta text-ink-muted">Huésped: {c.firmaNombre || c.huesped}. Estado: <b>{c.estado}</b>.</p>

        {v ? (
          <ul className="mt-6 space-y-2 rounded-panel border border-line bg-white p-5">
            <F ok={v.textoIntacto} t={v.textoIntacto ? 'El texto del contrato es idéntico al firmado (huella SHA-256 coincide).' : 'El texto NO coincide con el firmado.'} />
            <F ok={v.imagenIntacta} t={v.imagenIntacta ? 'La imagen de la firma no fue alterada.' : 'La imagen de la firma NO coincide.'} />
            <F ok={v.selloValido} t={v.selloValido ? 'El sello criptográfico del servidor (Ed25519) es válido.' : 'El sello del servidor NO se pudo verificar.'} />
            <F ok={Boolean(c.evidencia.codigoVerificado)} t={c.evidencia.codigoVerificado ? 'Identidad confirmada con código enviado al correo del huésped.' : 'Sin verificación por correo (contrato enviado por WhatsApp).'} />
          </ul>
        ) : <p className="mt-6 rounded-panel border border-line bg-white p-5 text-body text-ink-muted">Este contrato todavía no está firmado; no hay nada que verificar.</p>}

        {v && (
          <section className="mt-6 rounded-panel border border-line bg-white p-5 text-[13px] leading-relaxed">
            <h2 className="font-serif text-title-sm font-semibold text-ink">Datos técnicos</h2>
            <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
              <dt className="text-ink-muted">Firmado (servidor)</dt><dd>{hora(c.firmadoAt!)} · {c.firmadoAt}</dd>
              <dt className="text-ink-muted">Huella del documento al crearse</dt><dd className="mono-data break-all">{c.docHash}</dd>
              <dt className="text-ink-muted">Huella del texto firmado</dt><dd className="mono-data break-all">{String(c.evidencia.textoSha256 ?? '')}</dd>
              <dt className="text-ink-muted">Huella de la imagen de firma</dt><dd className="mono-data break-all">{String(c.evidencia.imagenSha256 ?? '')}</dd>
              <dt className="text-ink-muted">Huella de la firma</dt><dd className="mono-data break-all">{c.firmaHash}<br /><span className="text-ink-faint">= SHA-256(texto ⏎ hora ⏎ token ⏎ huella imagen)</span></dd>
              <dt className="text-ink-muted">Sello Ed25519</dt><dd className="mono-data break-all">{c.sello}</dd>
              <dt className="text-ink-muted">Clave pública</dt><dd><pre className="mono-data whitespace-pre-wrap break-all text-[11px]">{c.selloClave}</pre></dd>
              <dt className="text-ink-muted">IP</dt><dd className="mono-data">{String(c.evidencia.ip ?? '—')}</dd>
              <dt className="text-ink-muted">Navegador</dt><dd className="break-words">{String(c.evidencia.agente ?? '—')}</dd>
              <dt className="text-ink-muted">Pantalla · idioma · zona</dt><dd>{String(c.evidencia.pantalla ?? '—')} · {String(c.evidencia.idioma ?? '—')} · {String(c.evidencia.zonaHoraria ?? '—')}</dd>
              <dt className="text-ink-muted">Cláusulas</dt><dd>versión {c.versionClausulas}</dd>
            </dl>
          </section>
        )}

        <section className="mt-6 rounded-panel border border-line bg-white p-5">
          <h2 className="font-serif text-title-sm font-semibold text-ink">Bitácora</h2>
          <ol className="mt-3 space-y-2 text-meta">
            {eventos.map((e, k) => <li key={k} className="flex flex-wrap gap-x-3"><span className="mono-data text-ink-muted">{hora(e.at)}</span><span>{NOMBRES[e.tipo] ?? e.tipo}{e.datos.ip ? <span className="text-ink-faint"> · {String(e.datos.ip)}</span> : null}</span></li>)}
          </ol>
        </section>
        <p className="mt-6 text-ui text-ink-faint">Cómo verificar de forma independiente: la huella de la firma se recalcula como SHA-256 del texto íntegro del contrato, la hora ISO del servidor, el token del enlace y la huella SHA-256 de la imagen de la firma; el sello es la firma Ed25519 de esa huella con la clave privada del servidor de margaritarenace.com.ve, comprobable con la clave pública de arriba.</p>
      </div>
    </div>
  );
}
