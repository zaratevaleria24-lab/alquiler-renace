import { bs, clausulas, fecha, usd, type DatosContrato } from '@/lib/contratos-clausulas';

// El contrato como documento: partes, integrantes, estadía, detalle de pago,
// cláusulas y firmas con su certificado. Lo usan la página pública, el panel y
// la impresión a PDF. Sin JavaScript.
export interface FirmaDoc { nombre: string; documento: string; imagen: string; fecha: string; hash: string; sello: string; docHash: string; evidencia: Record<string, unknown>; tsaAutoridad?: string; tsaHora?: string | null; otsEstado?: string }

export default function ContratoDocumento({ d, version, firma, token }: { d: DatosContrato; version: string; firma?: FirmaDoc | null; token?: string }) {
  const fechaLarga = (iso: string) => new Date(iso).toLocaleString('es-VE', { dateStyle: 'long', timeStyle: 'medium', timeZone: 'America/Caracas' });
  const saldo = Math.max(0, d.totalUsd - d.anticipoUsd);
  const enBs = (n: number) => (d.tasaBs ? ` · ${bs(n * d.tasaBs)}` : '');
  return (
    <article className="documento hoja bg-white text-ink">
      <header className="border-b border-line pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo-mark-teal.svg" alt="" width={44} height={44} className="h-11 w-11 shrink-0" />
            <div><p className="font-serif text-[17px] font-semibold leading-none">Margarita <span className="text-accent">Renace</span></p><p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-ink-muted">{d.arrendador}{d.rif !== '—' ? ` · ${d.rif}` : ''}</p></div>
          </div>
          <p className="mono-data text-right text-[11px] text-ink-muted">Cláusulas v{version}<br />{fecha(new Date().toISOString().slice(0, 10))}</p>
        </div>
        <h1 className="mt-8 text-center font-serif text-[22px] font-semibold uppercase tracking-[0.06em] leading-tight sm:text-[26px]">Contrato de hospedaje temporal</h1>
        <p className="mt-1 text-center text-[13px] uppercase tracking-[0.14em] text-ink-muted">Alquiler vacacional · {d.inmueble}</p>
        <p className="mt-5 font-serif sm:text-justify text-[15.5px] leading-relaxed text-ink-soft">
          Entre <b>{d.arrendador}</b>{d.rif !== '—' && <>, {d.rif}</>}, representada por <b>{d.representante}</b>{d.representanteCedula !== '—' && <>, titular de la cédula de identidad N.º {d.representanteCedula}</>}{d.domicilio && <>, con domicilio en {d.domicilio}</>}, en adelante <b>«el arrendador»</b>; y <b>{d.huesped}</b>, titular del documento de identidad N.º <b>{d.documento}</b>{d.telefonoHuesped !== '—' && <>, teléfono {d.telefonoHuesped}</>}{d.email !== '—' && <>, correo {d.email}</>}, en adelante <b>«el huésped»</b>, se celebra el presente contrato de hospedaje temporal sobre el inmueble <b>«{d.inmueble}»</b>, ubicado en {d.direccionInmueble}, Isla de Margarita, estado Nueva Esparta, Venezuela, que se regirá por las cláusulas siguientes.
        </p>
        {d.integrantes.length > 0 && (
          <div className="mt-5"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Integrantes del grupo ({d.huespedes} {d.huespedes === 1 ? 'persona' : 'personas'})</p>
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
              ...(d.tasaBs ? [['Tasa BCV de referencia', `${bs(d.tasaBs)} / US$ · ${d.tasaFuente || 'Binance'}`]] : []),
              ['Método de pago', d.metodoPago]].map(([k, v]) => (
              <div key={k} className={`flex justify-between gap-3 px-3 py-2 ${k === 'Total' ? 'bg-paper font-semibold' : ''}`}><dt className="text-ink-muted">{k}</dt><dd className="mono-data text-right text-ink">{v}</dd></div>))}
          </dl>
        </div>
      </section>

      <ol className="mt-9 space-y-5">
        {clausulas(d).map((c) => { const [num, ...resto] = c.titulo.split('. '); return (
          <li key={c.titulo} className="break-inside-avoid"><h2 className="font-serif text-[15px] font-semibold uppercase tracking-[0.04em] text-ink">Cláusula {num}<span className="text-ink-muted"> — {resto.join('. ')}</span></h2><p className="mt-1.5 font-serif sm:text-justify text-[15.5px] leading-relaxed text-ink-soft">{c.texto}</p></li>
        ); })}
      </ol>
      <p className="mt-9 font-serif sm:text-justify text-[15.5px] leading-relaxed text-ink-soft">En señal de conformidad, ambas partes declaran haber leído y aceptado íntegramente los términos de este contrato de hospedaje temporal, que se firma por medios electrónicos en la Isla de Margarita.</p>

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
              {firma.tsaAutoridad && <><dt className="text-ink-muted">Sello de tiempo</dt><dd>RFC 3161 · {firma.tsaAutoridad}{firma.tsaHora ? ` · ${fechaLarga(firma.tsaHora)}` : ''}</dd></>}
              {firma.otsEstado && <><dt className="text-ink-muted">Bitcoin</dt><dd>{firma.otsEstado === 'anclado' ? 'Huella confirmada en la cadena de bloques (OpenTimestamps)' : 'Huella enviada a la cadena de bloques, confirmación pendiente (OpenTimestamps)'}</dd></>}
              {token && <><dt className="text-ink-muted">Verificar</dt><dd className="break-all">margaritarenace.com.ve/contrato/{token}/verificar</dd></>}
            </dl>
          </section>
        )}
        <p className="mt-5 text-center text-[11px] uppercase tracking-[0.14em] text-ink-faint">Cláusulas versión {version} · Documento generado por margaritarenace.com.ve</p>
      </footer>
    </article>
  );
}
