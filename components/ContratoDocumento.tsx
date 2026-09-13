import { bs, clausulas, fecha, usd, type DatosContrato } from '@/lib/contratos-clausulas';

// El contrato como documento: partes, integrantes, estadía, detalle de pago,
// cláusulas y firmas con su certificado. Lo usan la página pública, el panel y
// la impresión a PDF. Sin JavaScript.
export interface FirmaDoc { nombre: string; documento: string; imagen: string; fecha: string; hash: string; sello: string; docHash: string; evidencia: Record<string, unknown> }

export default function ContratoDocumento({ d, version, firma, token }: { d: DatosContrato; version: string; firma?: FirmaDoc | null; token?: string }) {
  const fechaLarga = (iso: string) => new Date(iso).toLocaleString('es-VE', { dateStyle: 'long', timeStyle: 'medium', timeZone: 'America/Caracas' });
  const saldo = Math.max(0, d.totalUsd - d.anticipoUsd);
  const enBs = (n: number) => (d.tasaBs ? ` · ${bs(n * d.tasaBs)}` : '');
  return (
    <article className="documento bg-white text-ink">
      <header className="border-b border-line pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="label-eyebrow text-brand-deep">Contrato de hospedaje temporal · alquiler vacacional</p>
            <h1 className="mt-1 font-serif text-[26px] font-semibold leading-tight">{d.inmueble}</h1>
            <p className="mt-1 text-meta text-ink-muted">{d.direccionInmueble} · Isla de Margarita, Venezuela</p>
          </div>
          <img src="/logo-mark-teal.svg" alt="" width={56} height={56} className="h-14 w-14 shrink-0" />
        </div>
        <dl className="mt-5 grid gap-4 text-meta sm:grid-cols-2">
          <div className="rounded-card border border-line bg-paper p-4"><dt className="label-eyebrow text-ink-subtle">El arrendador</dt>
            <dd className="mt-1.5 text-body leading-snug"><b>{d.arrendador}</b>{d.rif !== '—' && <> · {d.rif}</>}<br />Representante: {d.representante}{d.representanteCedula !== '—' && <>, C.I. {d.representanteCedula}</>}{d.domicilio && <><br />{d.domicilio}</>}{d.telefonoArrendador && <><br />Tel. {d.telefonoArrendador}</>}</dd></div>
          <div className="rounded-card border border-line bg-paper p-4"><dt className="label-eyebrow text-ink-subtle">El huésped titular</dt>
            <dd className="mt-1.5 text-body leading-snug"><b>{d.huesped}</b><br />Documento: {d.documento}<br />Tel. {d.telefonoHuesped}{d.email !== '—' && <><br />{d.email}</>}</dd></div>
        </dl>
        {d.integrantes.length > 0 && (
          <div className="mt-4"><p className="label-eyebrow text-ink-subtle">Integrantes del grupo ({d.huespedes} {d.huespedes === 1 ? 'persona' : 'personas'})</p>
            <ol className="mt-1.5 grid gap-x-6 gap-y-1 text-meta sm:grid-cols-2">{d.integrantes.map((i, k) => <li key={k} className="flex gap-2"><span className="mono-data text-ink-faint">{k + 1}.</span><span>{i.nombre} <span className="text-ink-muted">· {i.documento}</span></span></li>)}</ol></div>
        )}
      </header>

      <section className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <p className="label-eyebrow text-ink-subtle">Datos de la estadía</p>
          <dl className="mt-2 divide-y divide-line rounded-card border border-line text-meta">
            {[['Entrada', `${fecha(d.checkIn)} · ${d.horaEntrada}`], ['Salida', `${fecha(d.checkOut)} · ${d.horaSalida}`], ['Noches', String(d.noches)], ['Personas', String(d.huespedes)]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 px-3 py-2"><dt className="text-ink-muted">{k}</dt><dd className="text-right text-ink">{v}</dd></div>))}
          </dl>
        </div>
        <div>
          <p className="label-eyebrow text-ink-subtle">Detalle de pago</p>
          <dl className="mt-2 divide-y divide-line rounded-card border border-line text-meta">
            {[['Tarifa por noche', usd(d.tarifaNoche)], [`${d.noches} ${d.noches === 1 ? 'noche' : 'noches'}`, usd(d.tarifaNoche * d.noches)],
              ...(d.limpiezaUsd > 0 ? [['Limpieza (pago único)', usd(d.limpiezaUsd)]] : []),
              ['Total', `${usd(d.totalUsd)}${enBs(d.totalUsd)}`],
              ...(d.anticipoUsd > 0 ? [['Anticipo', `${usd(d.anticipoUsd)}${enBs(d.anticipoUsd)}`], ['Saldo al ingresar', `${usd(saldo)}${enBs(saldo)}`]] : []),
              ...(d.depositoUsd > 0 ? [['Depósito de garantía', usd(d.depositoUsd)]] : []),
              ...(d.tasaBs ? [['Tasa de referencia', `${bs(d.tasaBs)} / US$ · ${d.tasaFuente || 'Binance'}`]] : []),
              ['Método de pago', d.metodoPago]].map(([k, v]) => (
              <div key={k} className={`flex justify-between gap-3 px-3 py-2 ${k === 'Total' ? 'bg-paper font-semibold' : ''}`}><dt className="text-ink-muted">{k}</dt><dd className="mono-data text-right text-ink">{v}</dd></div>))}
          </dl>
        </div>
      </section>

      <ol className="mt-8 space-y-5">
        {clausulas(d).map((c) => (
          <li key={c.titulo}><h2 className="font-serif text-title-sm font-semibold text-brand-deep">{c.titulo}</h2><p className="mt-1.5 text-body leading-relaxed text-ink-soft">{c.texto}</p></li>
        ))}
      </ol>
      <p className="mt-8 text-body text-ink-soft">Ambas partes declaran haber leído y aceptado los términos de este contrato de hospedaje temporal.</p>

      <footer className="mt-8 border-t border-line pt-6">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="label-eyebrow text-ink-subtle">Por el arrendador</p>
            <p className="mt-10 border-t border-ink pt-2 text-meta">{d.representante}<br /><span className="text-ink-muted">{d.arrendador}{d.rif !== '—' ? ` · ${d.rif}` : ''}</span></p>
          </div>
          <div>
            <p className="label-eyebrow text-ink-subtle">El huésped titular</p>
            {firma ? (
              <>
                {firma.imagen && <img src={firma.imagen} alt="Firma del huésped" className="mt-2 h-20 w-auto max-w-full" />}
                <p className="border-t border-ink pt-2 text-meta">{firma.nombre}<br /><span className="text-ink-muted">{firma.documento}</span></p>
              </>
            ) : <p className="mt-10 border-t border-dashed border-line-strong pt-2 text-meta text-ink-muted">Pendiente de firma electrónica</p>}
          </div>
        </div>

        {firma && (
          <section className="mt-8 rounded-card border border-brand/30 bg-brand-tint/40 p-4 text-[12px] leading-relaxed text-ink-soft">
            <p className="label-eyebrow text-brand-deep">Certificado de firma electrónica</p>
            <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-[auto_1fr]">
              <dt className="text-ink-muted">Firmado</dt><dd>{fechaLarga(firma.fecha)} (hora de Venezuela)</dd>
              <dt className="text-ink-muted">Firmante</dt><dd>{firma.nombre} · {firma.documento}{firma.evidencia.codigoVerificado ? ' · identidad verificada por código enviado al correo' : ''}</dd>
              <dt className="text-ink-muted">Dispositivo</dt><dd className="break-words">{String(firma.evidencia.agente ?? '—')}{firma.evidencia.pantalla ? ` · ${firma.evidencia.pantalla}` : ''}{firma.evidencia.zonaHoraria ? ` · ${firma.evidencia.zonaHoraria}` : ''}{firma.evidencia.idioma ? ` · ${firma.evidencia.idioma}` : ''}</dd>
              <dt className="text-ink-muted">Dirección IP</dt><dd className="mono-data">{String(firma.evidencia.ip ?? '—')}</dd>
              <dt className="text-ink-muted">Huella del documento</dt><dd className="mono-data break-all">{firma.docHash || '—'}</dd>
              <dt className="text-ink-muted">Huella de la firma</dt><dd className="mono-data break-all">{firma.hash}</dd>
              <dt className="text-ink-muted">Sello del servidor</dt><dd className="mono-data break-all">{firma.sello ? `Ed25519 · ${firma.sello.slice(0, 44)}…` : '—'}</dd>
              {token && <><dt className="text-ink-muted">Verificar</dt><dd className="break-all">margaritarenace.com.ve/contrato/{token}/verificar</dd></>}
            </dl>
          </section>
        )}
        <p className="mt-5 text-ui text-ink-faint">Cláusulas versión {version}. Documento generado por margaritarenace.com.ve.</p>
      </footer>
    </article>
  );
}
