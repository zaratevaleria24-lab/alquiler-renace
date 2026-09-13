// CRM propio. SOLO SERVIDOR.
import { randomInt } from 'node:crypto';
import { query, rows } from './db';

export interface Contacto { id: string; nombre: string; email: string; telefono: string; cupon: string; descuentoPct: number; origen: string; pagina: string; utm: Record<string, string>; consentimiento: boolean; correoEnviadoAt: string | null; cuponUsadoAt: string | null; createdAt: string }

const desde = (r: Record<string, unknown>): Contacto => ({
  id: String(r.id), nombre: String(r.nombre ?? ''), email: String(r.email), telefono: String(r.telefono ?? ''), cupon: String(r.cupon), descuentoPct: Number(r.descuento_pct ?? 5),
  origen: String(r.origen ?? ''), pagina: String(r.pagina ?? ''), utm: (r.utm as Record<string, string>) ?? {}, consentimiento: Boolean(r.consentimiento),
  correoEnviadoAt: r.correo_enviado_at ? new Date(r.correo_enviado_at as string).toISOString() : null, cuponUsadoAt: r.cupon_usado_at ? new Date(r.cupon_usado_at as string).toISOString() : null,
  createdAt: new Date(r.created_at as string).toISOString(),
});

/** Código legible para dictar por WhatsApp: RENACE-5-7K3M. */
function nuevoCupon(): string {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let x = '';
  for (let i = 0; i < 4; i++) x += abc[randomInt(abc.length)];
  return `RENACE5-${x}`;
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
/** Valida un cupón (para /reservas): devuelve el % o null. */
export async function descuentoDe(cupon: string): Promise<{ pct: number; nombre: string } | null> {
  const c = cupon.trim().toUpperCase(); if (!/^RENACE5-[A-Z0-9]{4}$/.test(c)) return null;
  const [r] = await rows<{ descuento_pct: number; nombre: string }>(`SELECT descuento_pct, nombre FROM contactos WHERE cupon = $1 AND cupon_usado_at IS NULL`, [c]);
  return r ? { pct: Number(r.descuento_pct), nombre: r.nombre } : null;
}
export async function borrarContacto(id: string) { await query(`DELETE FROM contactos WHERE id = $1`, [id]); }
