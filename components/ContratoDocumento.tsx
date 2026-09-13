import { clausulas, type DatosContrato } from '@/lib/contratos-clausulas';

// El contrato como documento: cabecera con las partes, cláusulas numeradas y el
// bloque de firmas. Lo usan la página pública (/contrato/<token>), la vista del
// panel y el correo en PDF-por-impresión (Ctrl+P). Sin JavaScript, solo texto.
export default function ContratoDocumento({ d, version, firma }: {
  d: DatosContrato; version: string;
  firma?: { nombre: string; documento: string; imagen: string; fecha: string; hash: string } | null;
}) {
  const fechaLarga = (iso: string) => new Date(iso).toLocaleString('es-VE', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Caracas' });
  return (
    <article className="documento bg-white text-ink">
      <header className="border-b border-line pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="label-eyebrow text-brand-deep">Contrato de hospedaje temporal</p>
            <h1 className="mt-1 font-serif text-[26px] font-semibold leading-tight">{d.inmueble}</h1>
            <p className="mt-1 text-meta text-ink-muted">{d.direccionInmueble} · Isla de Margarita</p>
          </div>
          <img src="/logo-mark-teal.svg" alt="" width={56} height={56} className="h-14 w-14 shrink-0" />
        </div>
        <dl className="mt-5 grid gap-4 text-meta sm:grid-cols-2">
          <div><dt className="label-eyebrow text-ink-subtle">El arrendador</dt><dd className="mt-1 text-body">{d.arrendador}{d.rif !== '—' ? `, ${d.rif}` : ''}<br />representado por {d.representante}{d.representanteCedula !== '—' ? `, C.I. ${d.representanteCedula}` : ''}{d.domicilio ? <><br />{d.domicilio}</> : null}</dd></div>
          <div><dt className="label-eyebrow text-ink-subtle">El huésped</dt><dd className="mt-1 text-body">{d.huesped}<br />Documento: {d.documento}</dd></div>
        </dl>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 text-meta sm:grid-cols-4">
        {[['Entrada', `${d.checkIn} · ${d.horaEntrada}`], ['Salida', `${d.checkOut} · ${d.horaSalida}`], ['Noches', String(d.noches)], ['Personas', String(d.huespedes)],
          ['Total', `US$ ${d.totalUsd.toFixed(2)}`], ['Anticipo', `US$ ${d.anticipoUsd.toFixed(2)}`], ['Saldo al ingresar', `US$ ${Math.max(0, d.totalUsd - d.anticipoUsd).toFixed(2)}`], ['Depósito', `US$ ${d.depositoUsd.toFixed(2)}`]].map(([k, v]) => (
          <div key={k} className="rounded-card border border-line bg-paper px-3 py-2"><p className="text-ui text-ink-muted">{k}</p><p className="mono-data mt-0.5 text-ink">{v}</p></div>
        ))}
      </section>

      <ol className="mt-8 space-y-5">
        {clausulas(d).map((c) => (
          <li key={c.titulo}><h2 className="font-serif text-title-sm font-semibold text-brand-deep">{c.titulo}</h2><p className="mt-1.5 text-body leading-relaxed text-ink-soft">{c.texto}</p></li>
        ))}
      </ol>

      <footer className="mt-10 border-t border-line pt-6">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="label-eyebrow text-ink-subtle">Por el arrendador</p>
            <p className="mt-8 border-t border-ink pt-2 text-meta">{d.representante}<br /><span className="text-ink-muted">{d.arrendador}</span></p>
          </div>
          <div>
            <p className="label-eyebrow text-ink-subtle">El huésped</p>
            {firma ? (
              <>
                {firma.imagen && <img src={firma.imagen} alt="Firma del huésped" className="mt-2 h-20 w-auto max-w-full" />}
                <p className="border-t border-ink pt-2 text-meta">{firma.nombre} · {firma.documento}</p>
                <p className="mt-1 text-ui text-ink-muted">Firmado el {fechaLarga(firma.fecha)} (hora de Venezuela)</p>
                <p className="mono-data mt-1 break-all text-[11px] text-ink-faint">Verificación {firma.hash.slice(0, 32)}</p>
              </>
            ) : <p className="mt-8 border-t border-dashed border-line-strong pt-2 text-meta text-ink-muted">Pendiente de firma</p>}
          </div>
        </div>
        <p className="mt-6 text-ui text-ink-faint">Cláusulas versión {version}. Documento generado por margaritarenace.com.ve.</p>
      </footer>
    </article>
  );
}
