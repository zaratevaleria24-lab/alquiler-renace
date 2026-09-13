import Link from 'next/link';
import { FileSignature, Plus } from 'lucide-react';
import { listarContratos, noches } from '@/lib/contratos';
import { correoConfigurado } from '@/lib/correo';
import { camposDe, getAjustes } from '@/lib/settings';
import { listarPropiedadesAdmin } from '@/lib/admin';
import { Aviso, Campo, Insignia, Seccion, Selector, Tarjeta } from '../_ui';
import { crearContratoAction, guardarDatosLegalesAction } from './actions';

export const dynamic = 'force-dynamic';
const TONO: Record<string, 'ok' | 'neutro' | 'aviso'> = { firmado: 'ok', enviado: 'aviso', borrador: 'neutro', anulado: 'neutro' };

export default async function ContratosPage({ searchParams }: { searchParams: Promise<{ guardado?: string; error?: string }> }) {
  const [{ guardado, error }, contratos, props, ajustes] = await Promise.all([searchParams, listarContratos(), listarPropiedadesAdmin(), getAjustes()]);
  const a = ajustes as unknown as Record<string, string>;
  const hoy = new Date().toISOString().slice(0, 10);
  return (
    <div>
      <header>
        <p className="text-meta font-semibold text-ink-subtle">Contratos</p>
        <h1 className="mt-2 font-serif text-headline font-normal track-headline text-ink">Contratos de hospedaje</h1>
        <p className="mt-2 max-w-2xl text-meta text-ink-muted">Creas el contrato con los datos de la reserva, lo mandas por correo o WhatsApp y el huésped lo firma desde el teléfono. Queda guardado con fecha, firma y código de verificación.</p>
      </header>
      {guardado && <Aviso tono="ok">Guardado.</Aviso>}
      {error === 'datos' && <Aviso tono="error">Faltan datos: huésped, inmueble y fechas (la salida debe ser después de la entrada).</Aviso>}
      {!correoConfigurado() && <Aviso tono="atencion">El correo saliente no está configurado en el servidor (/etc/margarita-renace/correo.env). Mientras, los contratos se mandan por WhatsApp o copiando el enlace.</Aviso>}
      {!a.rif && <Aviso tono="atencion">Completa los datos legales del arrendador (abajo): salen en la cabecera de cada contrato.</Aviso>}

      <Seccion id="nuevo" titulo="Nuevo contrato">
        <Tarjeta className="p-6">
          <form action={crearContratoAction} className="grid gap-4 md:grid-cols-2">
            <Selector name="property_id" label="Inmueble" opciones={props.filter((p) => p.isPublished).map((p) => ({ value: p.id, label: p.name }))} />
            <Campo name="huesped" label="Nombre del huésped" required placeholder="Nombre y apellido" />
            <Campo name="documento" label="Cédula o pasaporte" ayuda="Si no lo tienes, lo completa el huésped al firmar." />
            <Campo name="email" label="Correo del huésped" type="email" ayuda="Para mandarle el contrato. Si solo tienes WhatsApp, déjalo vacío." />
            <Campo name="telefono" label="Teléfono / WhatsApp" placeholder="+58 412 0000000" />
            <Campo name="huespedes" label="Personas" type="number" min={1} max={20} defaultValue={2} />
            <Campo name="check_in" label="Entrada" type="date" required defaultValue={hoy} />
            <Campo name="check_out" label="Salida" type="date" required />
            <Campo name="total_usd" label="Total (US$)" type="number" min={0} required placeholder="Ej. 300" />
            <Campo name="anticipo_usd" label="Anticipo ya pagado (US$)" type="number" min={0} defaultValue={0} />
            <Campo name="deposito_usd" label="Depósito de garantía (US$)" type="number" min={0} defaultValue={a.contrato_deposito || '50'} />
            <div className="md:col-span-2"><Campo name="notas" label="Condiciones particulares (opcional)" filas={3} ayuda="Van como cláusula final. Ej.: «Se autoriza un perro pequeño», «Llegada a las 21:00 acordada»." /></div>
            <div className="md:col-span-2"><button type="submit" className="btn-solid"><Plus className="h-4 w-4" />Crear contrato</button></div>
          </form>
        </Tarjeta>
      </Seccion>

      <Seccion id="lista" titulo={`Contratos (${contratos.length})`}>
        <Tarjeta className="overflow-hidden">
          {contratos.length === 0 ? <p className="p-6 text-meta text-ink-muted">Todavía no hay contratos. El primero se crea arriba.</p> : (
            <div className="overflow-x-auto"><table className="w-full min-w-[46rem] text-left">
              <thead><tr className="border-b border-line bg-paper/40">{['Huésped', 'Inmueble', 'Fechas', 'Total', 'Estado', ''].map((h) => <th key={h} className="px-4 py-3 text-meta font-semibold text-ink-muted">{h}</th>)}</tr></thead>
              <tbody>{contratos.map((c) => (
                <tr key={c.id} className="border-b border-line/70 last:border-0 hover:bg-paper/40">
                  <td className="px-4 py-3"><Link href={`/admin/contratos/${c.id}`} className="text-body font-semibold text-ink hover:text-brand hover:underline underline-offset-4">{c.huesped}</Link><br /><span className="text-ui text-ink-muted">{c.email || c.telefono || '—'}</span></td>
                  <td className="px-4 py-3 text-meta text-ink-muted">{c.inmueble}</td>
                  <td className="px-4 py-3 font-mono text-ui tabular-nums text-ink-muted">{c.checkIn} → {c.checkOut} · {noches(c.checkIn, c.checkOut)} n</td>
                  <td className="px-4 py-3 font-mono text-ui tabular-nums">US$ {c.totalUsd.toFixed(0)}</td>
                  <td className="px-4 py-3"><Insignia tono={TONO[c.estado]}>{c.estado}</Insignia></td>
                  <td className="px-4 py-3 text-right"><Link href={`/admin/contratos/${c.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-control px-3 text-ui font-medium text-brand-deep hover:bg-brand-tint"><FileSignature className="h-4 w-4" />Abrir</Link></td>
                </tr>))}</tbody>
            </table></div>
          )}
        </Tarjeta>
      </Seccion>

      <Seccion id="legal" titulo="Datos del arrendador y condiciones">
        <Tarjeta className="p-6">
          <form action={guardarDatosLegalesAction} className="grid gap-4 md:grid-cols-2">
            {camposDe('contratos').map((c) => <Campo key={c.key} name={c.key} label={c.label} ayuda={c.ayuda} defaultValue={a[c.key] ?? ''} />)}
            <div className="md:col-span-2"><button type="submit" className="btn-solid">Guardar datos legales</button></div>
          </form>
          <p className="mt-4 text-ui text-ink-muted">Las cláusulas están escritas en el código (lib/contratos-clausulas.ts, versión con fecha). Cada contrato guarda con qué versión se firmó. Recomendación: que un abogado las revise antes del primer contrato real.</p>
        </Tarjeta>
      </Seccion>
    </div>
  );
}
