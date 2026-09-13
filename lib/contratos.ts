// Contratos de hospedaje: consultas y reglas. SOLO SERVIDOR.
import { createHash, randomBytes } from 'node:crypto';
import { query, rows } from './db';
import { getAjustes } from './settings';
import { SITE } from './site';
import { VERSION, textoPlano, type DatosContrato } from './contratos-clausulas';

export type EstadoContrato = 'borrador' | 'enviado' | 'firmado' | 'anulado';
export interface Contrato {
  id: string; token: string; propertyId: string; reservaId: string | null;
  huesped: string; documento: string; email: string; telefono: string; huespedes: number;
  checkIn: string; checkOut: string; totalUsd: number; anticipoUsd: number; depositoUsd: number; notas: string;
  versionClausulas: string; estado: EstadoContrato; enviadoAt: string | null; firmadoAt: string | null;
  firmaNombre: string; firmaDocumento: string; firmaImagen: string; firmaHash: string; firmaAgente: string;
  createdAt: string;
  // de la propiedad
  inmueble: string; inmuebleSlug: string; direccionInmueble: string;
}

const SELECT = `SELECT c.*, p.name AS inmueble, p.slug AS inmueble_slug, p.location AS direccion_inmueble
  FROM contratos c JOIN properties p ON p.id = c.property_id`;
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v == null ? null : String(v));
const dia = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10));
function desde(r: Record<string, unknown>): Contrato {
  return {
    id: String(r.id), token: String(r.token), propertyId: String(r.property_id), reservaId: r.reserva_id ? String(r.reserva_id) : null,
    huesped: String(r.huesped), documento: String(r.documento ?? ''), email: String(r.email ?? ''), telefono: String(r.telefono ?? ''), huespedes: Number(r.huespedes),
    checkIn: dia(r.check_in), checkOut: dia(r.check_out), totalUsd: Number(r.total_usd), anticipoUsd: Number(r.anticipo_usd), depositoUsd: Number(r.deposito_usd), notas: String(r.notas ?? ''),
    versionClausulas: String(r.version_clausulas), estado: r.estado as EstadoContrato, enviadoAt: iso(r.enviado_at), firmadoAt: iso(r.firmado_at),
    firmaNombre: String(r.firma_nombre ?? ''), firmaDocumento: String(r.firma_documento ?? ''), firmaImagen: String(r.firma_imagen ?? ''), firmaHash: String(r.firma_hash ?? ''), firmaAgente: String(r.firma_agente ?? ''),
    createdAt: iso(r.created_at) ?? '',
    inmueble: String(r.inmueble), inmuebleSlug: String(r.inmueble_slug), direccionInmueble: String(r.direccion_inmueble ?? ''),
  };
}

export async function listarContratos(): Promise<Contrato[]> {
  return (await rows<Record<string, unknown>>(`${SELECT} ORDER BY c.created_at DESC`)).map(desde);
}
export async function getContrato(id: string): Promise<Contrato | null> {
  const [r] = await rows<Record<string, unknown>>(`${SELECT} WHERE c.id = $1`, [id]); return r ? desde(r) : null;
}
export async function getContratoPorToken(token: string): Promise<Contrato | null> {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  const [r] = await rows<Record<string, unknown>>(`${SELECT} WHERE c.token = $1`, [token]); return r ? desde(r) : null;
}

export const noches = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
export const urlContrato = (token: string) => `${SITE.url}/contrato/${token}`;

/** Los datos que llenan las cláusulas: contrato + ajustes legales del panel. */
export async function datosDe(c: Contrato): Promise<DatosContrato> {
  const a = await getAjustes() as unknown as Record<string, string>;
  return {
    arrendador: a.razon_social || SITE.name, rif: a.rif || '—', representante: a.representante || '—', representanteCedula: a.representante_cedula || '—', domicilio: a.domicilio_fiscal || '',
    huesped: c.firmaNombre || c.huesped, documento: c.firmaDocumento || c.documento || '—',
    inmueble: c.inmueble, direccionInmueble: c.direccionInmueble,
    checkIn: c.checkIn, checkOut: c.checkOut, horaEntrada: a.contrato_checkin || '15:00', horaSalida: a.contrato_checkout || '11:00', noches: noches(c.checkIn, c.checkOut),
    huespedes: c.huespedes, totalUsd: c.totalUsd, anticipoUsd: c.anticipoUsd, depositoUsd: c.depositoUsd, notas: c.notas,
  };
}

export async function crearContrato(v: { propertyId: string; huesped: string; documento: string; email: string; telefono: string; huespedes: number; checkIn: string; checkOut: string; totalUsd: number; anticipoUsd: number; depositoUsd: number; notas: string }): Promise<string> {
  const token = randomBytes(16).toString('hex');
  const [r] = await rows<{ id: string }>(
    `INSERT INTO contratos (token, property_id, huesped, documento, email, telefono, huespedes, check_in, check_out, total_usd, anticipo_usd, deposito_usd, notas, version_clausulas)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
    [token, v.propertyId, v.huesped, v.documento, v.email, v.telefono, v.huespedes, v.checkIn, v.checkOut, v.totalUsd, v.anticipoUsd, v.depositoUsd, v.notas, VERSION]);
  return r.id;
}

export async function marcarEnviado(id: string) {
  await query(`UPDATE contratos SET estado = CASE WHEN estado='borrador' THEN 'enviado' ELSE estado END, enviado_at = COALESCE(enviado_at, now()), updated_at = now() WHERE id = $1`, [id]);
}
export async function anular(id: string) {
  await query(`UPDATE contratos SET estado='anulado', updated_at=now() WHERE id = $1 AND estado <> 'firmado'`, [id]);
}

/** Firma del huésped. Guarda nombre, documento, trazo, hash del texto y hora. */
export async function firmar(c: Contrato, f: { nombre: string; documento: string; imagen: string; agente: string }): Promise<boolean> {
  if (c.estado === 'firmado' || c.estado === 'anulado') return false;
  const d = await datosDe({ ...c, firmaNombre: f.nombre, firmaDocumento: f.documento });
  const ahora = new Date().toISOString();
  const hash = createHash('sha256').update(textoPlano(d) + '\n' + ahora + '\n' + c.token).digest('hex');
  await query(
    `UPDATE contratos SET estado='firmado', firmado_at=$2, firma_nombre=$3, firma_documento=$4, firma_imagen=$5, firma_hash=$6, firma_agente=$7,
       documento = CASE WHEN documento='' THEN $4 ELSE documento END, updated_at=now() WHERE id=$1 AND estado IN ('borrador','enviado')`,
    [c.id, ahora, f.nombre, f.documento, f.imagen, hash, f.agente.slice(0, 200)]);
  return true;
}
