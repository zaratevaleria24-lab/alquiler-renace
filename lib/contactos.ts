// CRM propio. SOLO SERVIDOR.
import { randomInt } from 'node:crypto';
import { query, rows } from './db';

export type TipoContacto = 'huesped' | 'aliado' | 'prospecto';
export interface Contacto { id: string; nombre: string; email: string; telefono: string; cupon: string; descuentoPct: number; origen: string; pagina: string; utm: Record<string, string>; consentimiento: boolean; correoEnviadoAt: string | null; cuponUsadoAt: string | null; createdAt: string; tipo: TipoContacto; comercio: string; notas: string }

const desde = (r: Record<string, unknown>): Contacto => ({
  id: String(r.id), nombre: String(r.nombre ?? ''), email: String(r.email), telefono: String(r.telefono ?? ''), cupon: String(r.cupon), descuentoPct: Number(r.descuento_pct ?? 5),
  origen: String(r.origen ?? ''), pagina: String(r.pagina ?? ''), utm: (r.utm as Record<string, string>) ?? {}, consentimiento: Boolean(r.consentimiento),
  correoEnviadoAt: r.correo_enviado_at ? new Date(r.correo_enviado_at as string).toISOString() : null, cuponUsadoAt: r.cupon_usado_at ? new Date(r.cupon_usado_at as string).toISOString() : null,
  createdAt: new Date(r.created_at as string).toISOString(),
  tipo: (String(r.tipo ?? 'huesped') as TipoContacto), comercio: String(r.comercio ?? ''), notas: String(r.notas ?? ''),
});

/** Código legible para dictar por WhatsApp: RENACE-5-7K3M. */
function nuevoCupon(): string {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let x = '';
  for (let i = 0; i < 4; i++) x += abc[randomInt(abc.length)];
  return `RENACE10-${x}`;
}

/** Alta (o reencuentro) por correo: si ya existía, devuelve su cupón. */
export async function registrarContacto(v: { nombre: string; email: string; telefono?: string; origen: string; pagina: string; utm?: Record<string, string> }): Promise<{ contacto: Contacto; nuevo: boolean }> {
  const email = v.email.trim().toLowerCase();
  const [prev] = await rows<Record<string, unknown>>(`SELECT * FROM contactos WHERE lower(email) = $1`, [email]);
  if (prev) {
    if (v.nombre && !prev.nombre) await query(`UPDATE contactos SET nombre = $2 WHERE id = $1`, [prev.id, v.nombre]);
    return { contacto: desde({ ...prev, nombre: prev.nombre || v.nombre }), nuevo: false };
  }
  for (let intento = 0; intento < 5; intento++) {
    try {
      const [r] = await rows<Record<string, unknown>>(
        `INSERT INTO contactos (nombre, email, telefono, cupon, origen, pagina, utm) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [v.nombre.trim().slice(0, 80), email, (v.telefono ?? '').trim().slice(0, 40), nuevoCupon(), v.origen, v.pagina.slice(0, 200), JSON.stringify(v.utm ?? {})]);
      return { contacto: desde(r), nuevo: true };
    } catch (e) { if (!/contactos_cupon_key/.test((e as Error).message)) throw e; }
  }
  throw new Error('no se pudo generar el cupón');
}
export async function marcarCorreoEnviado(id: string) { await query(`UPDATE contactos SET correo_enviado_at = now() WHERE id = $1`, [id]); }
export async function listarContactos(): Promise<Contacto[]> { return (await rows<Record<string, unknown>>(`SELECT * FROM contactos ORDER BY created_at DESC`)).map(desde); }
/** Normaliza lo que la persona escribe: mayúsculas, sin espacios, y los
 *  códigos viejos «RENACE5-XXXX» (primer día, 5 %) valen como «RENACE10-XXXX»:
 *  el sufijo es la identidad, el prefijo solo dice el porcentaje de la época. */
export function normalizarCupon(v: string): string | null {
  const c = v.trim().toUpperCase().replace(/\s+/g, '').replace(/^RENACE(5|10)[-–]?/, 'RENACE10-');
  return /^RENACE10-[A-Z0-9]{4}$/.test(c) ? c : null;
}
export type EstadoCupon = { estado: 'ok'; pct: number; nombre: string; cupon: string } | { estado: 'usado'; cupon: string } | { estado: 'invalido' };
/** Valida un cupón (para /reservas) distinguiendo «no existe» de «ya se usó». */
export async function descuentoDe(cupon: string): Promise<EstadoCupon> {
  const c = normalizarCupon(cupon); if (!c) return { estado: 'invalido' };
  const [r] = await rows<{ descuento_pct: number; nombre: string; cupon_usado_at: Date | null }>(`SELECT descuento_pct, nombre, cupon_usado_at FROM contactos WHERE cupon = $1`, [c]);
  if (!r) return { estado: 'invalido' };
  if (r.cupon_usado_at) return { estado: 'usado', cupon: c };
  return { estado: 'ok', pct: Number(r.descuento_pct), nombre: r.nombre, cupon: c };
}
export async function borrarContacto(id: string) { await query(`DELETE FROM contactos WHERE id = $1`, [id]); }
export async function marcarCuponUsado(id: string, usado: boolean) { await query(`UPDATE contactos SET cupon_usado_at = ${usado ? 'now()' : 'NULL'} WHERE id = $1`, [id]); }

/** Alta manual desde el panel (aliados, prospectos, huéspedes de WhatsApp). Sin correo se genera uno interno. */
export async function crearContactoManual(v: { nombre: string; email: string; telefono: string; tipo: TipoContacto; comercio: string; notas: string }): Promise<void> {
  const email = v.email.trim().toLowerCase() || `sin-correo+${Date.now()}@margaritarenace.local`;
  const [prev] = await rows<{ id: string }>(`SELECT id FROM contactos WHERE lower(email) = $1`, [email]);
  if (prev) { await query(`UPDATE contactos SET nombre = COALESCE(NULLIF($2,''), nombre), telefono = COALESCE(NULLIF($3,''), telefono), tipo = $4, comercio = $5, notas = $6 WHERE id = $1`, [prev.id, v.nombre, v.telefono, v.tipo, v.comercio, v.notas]); return; }
  for (let i = 0; i < 5; i++) {
    try { await query(`INSERT INTO contactos (nombre, email, telefono, cupon, origen, tipo, comercio, notas, consentimiento) VALUES ($1,$2,$3,$4,'panel',$5,$6,$7,false)`, [v.nombre.trim().slice(0, 80), email, v.telefono.trim().slice(0, 40), nuevoCupon(), v.tipo, v.comercio.trim().slice(0, 120), v.notas.trim().slice(0, 1000)]); return; }
    catch (e) { if (!/contactos_cupon_key/.test((e as Error).message)) throw e; }
  }
}
export async function actualizarTipo(id: string, tipo: TipoContacto, comercio: string) { await query(`UPDATE contactos SET tipo = $2, comercio = $3 WHERE id = $1`, [id, tipo, comercio]); }
