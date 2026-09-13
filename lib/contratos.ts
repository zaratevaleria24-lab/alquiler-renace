// Contratos de hospedaje: consultas y reglas. SOLO SERVIDOR.
//
// La prueba de la firma (para un peritaje) se compone de:
//   · doc_hash: SHA-256 del texto íntegro del contrato tal como se envió.
//   · código de verificación de 6 dígitos mandado al correo del huésped (OTP).
//   · evidencia: IP, User-Agent, idioma, zona horaria, pantalla, hash SHA-256
//     del PNG de la firma, y la hora del servidor.
//   · firma_hash: SHA-256 de (texto + hora + token + hash de la imagen).
//   · sello: firma Ed25519 del servidor sobre firma_hash, con la clave de
//     /etc/margarita-renace/firma.key; la pública se guarda con el contrato y
//     cualquiera puede verificarla en /contrato/<token>/verificar.
//   · bitácora contratos_eventos: creado, enviado, abierto, código, firmado…
import { createHash, createPrivateKey, createPublicKey, randomBytes, randomInt, sign, verify } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { query, rows } from './db';
import { getAjustes } from './settings';
import { SITE } from './site';
import { VERSION, textoPlano, type DatosContrato } from './contratos-clausulas';

export type EstadoContrato = 'borrador' | 'enviado' | 'firmado' | 'anulado';
export interface Integrante { nombre: string; documento: string }
export interface Contrato {
  id: string; token: string; propertyId: string; reservaId: string | null;
  huesped: string; documento: string; email: string; telefono: string; huespedes: number; integrantes: Integrante[];
  checkIn: string; checkOut: string; tarifaNoche: number; limpiezaUsd: number; totalUsd: number; anticipoUsd: number; depositoUsd: number;
  tasaBs: number | null; tasaFuente: string; metodoPago: string; notas: string;
  versionClausulas: string; estado: EstadoContrato; enviadoAt: string | null; abiertoAt: string | null; firmadoAt: string | null;
  docHash: string; codigoVerificado: boolean;
  firmaNombre: string; firmaDocumento: string; firmaImagen: string; firmaHash: string; firmaAgente: string;
  evidencia: Record<string, unknown>; sello: string; selloClave: string;
  createdAt: string;
  inmueble: string; inmuebleSlug: string; direccionInmueble: string;
}
export interface Evento { tipo: string; at: string; datos: Record<string, unknown> }

const SELECT = `SELECT c.*, p.name AS inmueble, p.slug AS inmueble_slug, p.location AS direccion_inmueble
  FROM contratos c JOIN properties p ON p.id = c.property_id`;
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v == null ? null : String(v));
const dia = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10));
function desde(r: Record<string, unknown>): Contrato {
  return {
    id: String(r.id), token: String(r.token), propertyId: String(r.property_id), reservaId: r.reserva_id ? String(r.reserva_id) : null,
    huesped: String(r.huesped), documento: String(r.documento ?? ''), email: String(r.email ?? ''), telefono: String(r.telefono ?? ''), huespedes: Number(r.huespedes),
    integrantes: (r.integrantes as Integrante[]) ?? [],
    checkIn: dia(r.check_in), checkOut: dia(r.check_out), tarifaNoche: Number(r.tarifa_noche ?? 0), limpiezaUsd: Number(r.limpieza_usd ?? 0), totalUsd: Number(r.total_usd), anticipoUsd: Number(r.anticipo_usd), depositoUsd: Number(r.deposito_usd),
    tasaBs: r.tasa_bs == null ? null : Number(r.tasa_bs), tasaFuente: String(r.tasa_fuente ?? ''), metodoPago: String(r.metodo_pago ?? ''), notas: String(r.notas ?? ''),
    versionClausulas: String(r.version_clausulas), estado: r.estado as EstadoContrato, enviadoAt: iso(r.enviado_at), abiertoAt: iso(r.abierto_at), firmadoAt: iso(r.firmado_at),
    docHash: String(r.doc_hash ?? ''), codigoVerificado: Boolean(r.codigo_verificado),
    firmaNombre: String(r.firma_nombre ?? ''), firmaDocumento: String(r.firma_documento ?? ''), firmaImagen: String(r.firma_imagen ?? ''), firmaHash: String(r.firma_hash ?? ''), firmaAgente: String(r.firma_agente ?? ''),
    evidencia: (r.evidencia as Record<string, unknown>) ?? {}, sello: String(r.sello ?? ''), selloClave: String(r.sello_clave ?? ''),
    createdAt: iso(r.created_at) ?? '',
    inmueble: String(r.inmueble), inmuebleSlug: String(r.inmueble_slug), direccionInmueble: String(r.direccion_inmueble ?? ''),
  };
}

export async function listarContratos(): Promise<Contrato[]> { return (await rows<Record<string, unknown>>(`${SELECT} ORDER BY c.created_at DESC`)).map(desde); }
export async function getContrato(id: string): Promise<Contrato | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [r] = await rows<Record<string, unknown>>(`${SELECT} WHERE c.id = $1`, [id]); return r ? desde(r) : null;
}
export async function getContratoPorToken(token: string): Promise<Contrato | null> {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  const [r] = await rows<Record<string, unknown>>(`${SELECT} WHERE c.token = $1`, [token]); return r ? desde(r) : null;
}
export async function listarEventos(contratoId: string): Promise<Evento[]> {
  return (await rows<{ tipo: string; at: Date; datos: Record<string, unknown> }>(`SELECT tipo, at, datos FROM contratos_eventos WHERE contrato_id = $1 ORDER BY at, id`, [contratoId]))
    .map((e) => ({ tipo: e.tipo, at: e.at.toISOString(), datos: e.datos ?? {} }));
}
export async function registrarEvento(contratoId: string, tipo: string, datos: Record<string, unknown> = {}) {
  await query(`INSERT INTO contratos_eventos (contrato_id, tipo, datos) VALUES ($1, $2, $3)`, [contratoId, tipo, JSON.stringify(datos)]);
}

export const noches = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
export const urlContrato = (token: string) => `${SITE.url}/contrato/${token}`;
export const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

export async function datosDe(c: Contrato): Promise<DatosContrato> {
  const a = await getAjustes() as unknown as Record<string, string>;
  return {
    arrendador: a.razon_social || SITE.name, rif: a.rif || '—', representante: a.representante || '—', representanteCedula: a.representante_cedula || '—', domicilio: a.domicilio_fiscal || '', telefonoArrendador: a.telefono || '',
    huesped: c.firmaNombre || c.huesped, documento: c.firmaDocumento || c.documento || '—', telefonoHuesped: c.telefono || '—', email: c.email || '—',
    integrantes: c.integrantes,
    inmueble: c.inmueble, direccionInmueble: c.direccionInmueble,
    checkIn: c.checkIn, checkOut: c.checkOut, horaEntrada: a.contrato_checkin || '14:00', horaSalida: a.contrato_checkout || '12:00', noches: noches(c.checkIn, c.checkOut),
    huespedes: c.huespedes, tarifaNoche: c.tarifaNoche, limpiezaUsd: c.limpiezaUsd, totalUsd: c.totalUsd, anticipoUsd: c.anticipoUsd, depositoUsd: c.depositoUsd,
    tasaBs: c.tasaBs, tasaFuente: c.tasaFuente, metodoPago: c.metodoPago, notas: c.notas,
  };
}

export async function crearContrato(v: Omit<Contrato, 'id' | 'token' | 'reservaId' | 'versionClausulas' | 'estado' | 'enviadoAt' | 'abiertoAt' | 'firmadoAt' | 'docHash' | 'codigoVerificado' | 'firmaNombre' | 'firmaDocumento' | 'firmaImagen' | 'firmaHash' | 'firmaAgente' | 'evidencia' | 'sello' | 'selloClave' | 'createdAt' | 'inmueble' | 'inmuebleSlug' | 'direccionInmueble'>): Promise<string> {
  const token = randomBytes(16).toString('hex');
  const [r] = await rows<{ id: string }>(
    `INSERT INTO contratos (token, property_id, huesped, documento, email, telefono, huespedes, integrantes, check_in, check_out, tarifa_noche, limpieza_usd, total_usd, anticipo_usd, deposito_usd, tasa_bs, tasa_fuente, metodo_pago, notas, version_clausulas)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING id`,
    [token, v.propertyId, v.huesped, v.documento, v.email, v.telefono, v.huespedes, JSON.stringify(v.integrantes), v.checkIn, v.checkOut, v.tarifaNoche, v.limpiezaUsd, v.totalUsd, v.anticipoUsd, v.depositoUsd, v.tasaBs, v.tasaFuente, v.metodoPago, v.notas, VERSION]);
  // Huella del documento tal como nace: cualquier cambio posterior se nota.
  const c = (await getContrato(r.id))!;
  await query(`UPDATE contratos SET doc_hash = $2 WHERE id = $1`, [r.id, sha256(textoPlano(await datosDe(c)))]);
  await registrarEvento(r.id, 'creado', { version: VERSION });
  return r.id;
}

export async function marcarEnviado(id: string, via: 'correo' | 'whatsapp' | 'enlace', datos: Record<string, unknown> = {}) {
  await query(`UPDATE contratos SET estado = CASE WHEN estado='borrador' THEN 'enviado' ELSE estado END, enviado_at = COALESCE(enviado_at, now()), updated_at = now() WHERE id = $1`, [id]);
  await registrarEvento(id, `enviado_${via}`, datos);
}
export async function anular(id: string) {
  await query(`UPDATE contratos SET estado='anulado', updated_at=now() WHERE id = $1 AND estado <> 'firmado'`, [id]);
  await registrarEvento(id, 'anulado');
}
/** Primera vez que el huésped abre el enlace. */
export async function registrarApertura(c: Contrato, ev: Record<string, unknown>) {
  if (c.abiertoAt) return;
  await query(`UPDATE contratos SET abierto_at = now() WHERE id = $1 AND abierto_at IS NULL`, [c.id]);
  await registrarEvento(c.id, 'abierto', ev);
}

// ── Código de verificación (OTP) ────────────────────────────────────────────
export async function generarCodigo(c: Contrato): Promise<string> {
  const codigo = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await query(`UPDATE contratos SET codigo = $2, codigo_expira = now() + interval '15 minutes', codigo_verificado = false WHERE id = $1`, [c.id, sha256(codigo + c.token)]);
  await registrarEvento(c.id, 'codigo_enviado', { correo: c.email });
  return codigo;
}
export async function verificarCodigo(c: Contrato, codigo: string, ev: Record<string, unknown>): Promise<boolean> {
  const [r] = await rows<{ ok: boolean }>(`SELECT (codigo <> '' AND codigo = $2 AND codigo_expira > now()) AS ok FROM contratos WHERE id = $1`, [c.id, sha256(codigo.trim() + c.token)]);
  if (!r?.ok) { await registrarEvento(c.id, 'codigo_fallido', ev); return false; }
  await query(`UPDATE contratos SET codigo_verificado = true WHERE id = $1`, [c.id]);
  await registrarEvento(c.id, 'codigo_verificado', ev);
  return true;
}

// ── Sello del servidor ──────────────────────────────────────────────────────
function clavePrivada() { try { return createPrivateKey(readFileSync('/etc/margarita-renace/firma.key')); } catch { return null; } }
export function clavePublicaPem(): string { try { return readFileSync('/etc/margarita-renace/firma.pub', 'utf8').trim(); } catch { const k = clavePrivada(); return k ? createPublicKey(k).export({ type: 'spki', format: 'pem' }).toString().trim() : ''; } }
export function sellar(mensaje: string): string { const k = clavePrivada(); return k ? sign(null, Buffer.from(mensaje), k).toString('base64') : ''; }
export function verificarSello(mensaje: string, selloB64: string, pubPem: string): boolean {
  try { return verify(null, Buffer.from(mensaje), createPublicKey(pubPem), Buffer.from(selloB64, 'base64')); } catch { return false; }
}

/** Firma del huésped: guarda todo lo que un perito necesita. */
export async function firmar(c: Contrato, f: { nombre: string; documento: string; imagen: string; evidencia: Record<string, unknown> }): Promise<boolean> {
  if (c.estado === 'firmado' || c.estado === 'anulado') return false;
  if (c.email && !c.codigoVerificado) return false;
  const d = await datosDe({ ...c, firmaNombre: f.nombre, firmaDocumento: f.documento });
  const ahora = new Date().toISOString();
  const texto = textoPlano(d);
  const imagenHash = sha256(f.imagen);
  const hash = sha256(`${texto}\n${ahora}\n${c.token}\n${imagenHash}`);
  const sello = sellar(hash), pub = clavePublicaPem();
  const evidencia = { ...f.evidencia, imagenSha256: imagenHash, textoSha256: sha256(texto), docHashOriginal: c.docHash, horaServidor: ahora, version: c.versionClausulas, codigoVerificado: c.codigoVerificado };
  const r = await query(
    `UPDATE contratos SET estado='firmado', firmado_at=$2, firma_nombre=$3, firma_documento=$4, firma_imagen=$5, firma_hash=$6, firma_agente=$7, evidencia=$8, sello=$9, sello_clave=$10,
       documento = CASE WHEN documento='' THEN $4 ELSE documento END, updated_at=now() WHERE id=$1 AND estado IN ('borrador','enviado')`,
    [c.id, ahora, f.nombre, f.documento, f.imagen, hash, String(f.evidencia.agente ?? '').slice(0, 300), JSON.stringify(evidencia), sello, pub]);
  if (!r.rowCount) return false;
  await registrarEvento(c.id, 'firmado', { hash, sello: sello.slice(0, 24) + '…', ip: f.evidencia.ip ?? null });
  return true;
}

/** Recalcula las huellas de un contrato firmado y comprueba el sello. */
export async function comprobar(c: Contrato): Promise<{ textoIntacto: boolean; selloValido: boolean; imagenIntacta: boolean; hashRecalculado: string }> {
  const d = await datosDe(c);
  const texto = textoPlano(d);
  const imagenHash = sha256(c.firmaImagen);
  const rec = sha256(`${texto}\n${c.firmadoAt ?? ''}\n${c.token}\n${imagenHash}`);
  return { textoIntacto: rec === c.firmaHash, selloValido: !!c.sello && verificarSello(c.firmaHash, c.sello, c.selloClave), imagenIntacta: imagenHash === c.evidencia.imagenSha256, hashRecalculado: rec };
}
