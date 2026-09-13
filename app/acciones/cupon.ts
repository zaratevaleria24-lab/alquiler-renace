'use server';

import { headers } from 'next/headers';
import { createHash } from 'node:crypto';
import { registrarContacto, marcarCorreoEnviado, descuentoDe, type EstadoCupon } from '@/lib/contactos';
import { correoConfigurado, enviarCorreo } from '@/lib/correo';
import { correoCupon } from '@/lib/correo-plantillas';

// Alta del cupón de bienvenida. Seguridad:
//  · un cupón por correo (índice único; repetir devuelve el mismo código);
//  · honeypot para bots;
//  · límite en memoria por IP (5 altas/hora, con hash de la IP, no la IP) y
//    global (60/hora) para que nadie llene el CRM con correos basura;
//  · el cupón vale UNA vez: al confirmar la reserva se marca usado en el panel.
const intentos = new Map<string, number[]>();
function permitido(clave: string, max: number): boolean {
  const ahora = Date.now(); const lista = (intentos.get(clave) ?? []).filter((t) => ahora - t < 3600_000);
  if (lista.length >= max) { intentos.set(clave, lista); return false; }
  lista.push(ahora); intentos.set(clave, lista); return true;
}
export async function pedirCuponAction(fd: FormData): Promise<{ ok: boolean; cupon?: string; pct?: number; error?: string; nuevo?: boolean }> {
  const nombre = String(fd.get('nombre') ?? '').trim().slice(0, 80);
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  const telefono = String(fd.get('telefono') ?? '').trim().slice(0, 40);
  const pagina = String(fd.get('pagina') ?? '').slice(0, 200);
  const utm: Record<string, string> = {};
  try { const u = new URL(pagina, 'https://margaritarenace.com.ve'); for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']) { const v = u.searchParams.get(k); if (v) utm[k] = v.slice(0, 80); } } catch {}
  if (nombre.length < 2) return { ok: false, error: 'Dinos tu nombre.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: 'Revisa el correo: parece incompleto.' };
  if (fd.get('sitio')) return { ok: true, cupon: 'RENACE10-XXXX', pct: 10 }; // honeypot para bots
  const h = await headers(); const ua = h.get('user-agent') ?? '';
  if (!ua) return { ok: false, error: 'No se pudo registrar.' };
  const ip = (h.get('cf-connecting-ip') || h.get('x-forwarded-for') || '').split(',')[0].trim();
  const ipHash = createHash('sha256').update('cupon:' + ip).digest('hex').slice(0, 16);
  if (!permitido('ip:' + ipHash, 5) || !permitido('global', 60)) return { ok: false, error: 'Demasiados intentos por ahora. Escríbenos por WhatsApp y te damos el código.' };
  const { contacto, nuevo } = await registrarContacto({ nombre, email, telefono, origen: 'popup', pagina: pagina.split('?')[0], utm });
  if (nuevo && correoConfigurado()) {
    try { await enviarCorreo({ para: contacto.email, ...correoCupon(contacto.nombre, contacto.cupon, contacto.descuentoPct) }); await marcarCorreoEnviado(contacto.id); }
    catch (e) { console.error('[cupon] correo falló:', (e as Error).message); }
  }
  return { ok: true, cupon: contacto.cupon, pct: contacto.descuentoPct, nuevo };
}

export async function validarCuponAction(codigo: string): Promise<EstadoCupon> {
  return descuentoDe(codigo);
}
