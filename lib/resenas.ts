// Reseñas reales de huéspedes. SOLO SERVIDOR. Ver migración 022.
import { query, rows } from './db';
export interface Resena { id: string; propertyId: string; autor: string; fecha: string; texto: string; puntuacion: number | null; fuente: string; url: string; publicada: boolean }
const desde = (r: Record<string, unknown>): Resena => ({ id: String(r.id), propertyId: String(r.property_id), autor: String(r.autor), fecha: String(r.fecha instanceof Date ? r.fecha.toISOString().slice(0, 10) : r.fecha).slice(0, 10), texto: String(r.texto), puntuacion: r.puntuacion == null ? null : Number(r.puntuacion), fuente: String(r.fuente), url: String(r.url ?? ''), publicada: Boolean(r.publicada) });
export async function resenasDe(propertyId: string, soloPublicadas = true): Promise<Resena[]> {
  return (await rows<Record<string, unknown>>(`SELECT * FROM resenas WHERE property_id = $1 ${soloPublicadas ? 'AND publicada' : ''} ORDER BY fecha DESC, created_at DESC`, [propertyId])).map(desde);
}
export async function crearResena(v: { propertyId: string; autor: string; fecha: string; texto: string; puntuacion: number | null; fuente: string; url: string }) {
  await query(`INSERT INTO resenas (property_id, autor, fecha, texto, puntuacion, fuente, url) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [v.propertyId, v.autor, v.fecha, v.texto, v.puntuacion, v.fuente, v.url]);
}
export async function borrarResena(id: string, propertyId: string) { await query(`DELETE FROM resenas WHERE id = $1 AND property_id = $2`, [id, propertyId]); }
