'use server';

import { headers } from 'next/headers';
import { registrarContacto, marcarCorreoEnviado, descuentoDe } from '@/lib/contactos';
import { correoConfigurado, enviarCorreo } from '@/lib/correo';
import { correoCupon } from '@/lib/correo-plantillas';

// Alta del cupón de bienvenida. Freno simple: 20 altas por hora por IP (via
// tabla contactos + IP en utm? no guardamos IP: se limita por correo único y
// por el patrón del correo). El correo se manda con Resend si está configurado.
export async function pedirCuponAction(fd: FormData): Promise<{ ok: boolean; cupon?: string; pct?: number; error?: string; nuevo?: boolean }> {
  const nombre = String(fd.get('nombre') ?? '').trim().slice(0, 80);
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  const telefono = String(fd.get('telefono') ?? '').trim().slice(0, 40);
  const pagina = String(fd.get('pagina') ?? '').slice(0, 200);
  const utm: Record<string, string> = {};
  try { const u = new URL(pagina, 'https://margaritarenace.com.ve'); for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']) { const v = u.searchParams.get(k); if (v) utm[k] = v.slice(0, 80); } } catch {}
  if (nombre.length < 2) return { ok: false, error: 'Dinos tu nombre.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: 'Revisa el correo: parece incompleto.' };
  if (fd.get('sitio')) return { ok: true, cupon: 'RENACE5-XXXX', pct: 5 }; // honeypot para bots
  const ua = (await headers()).get('user-agent') ?? '';
  if (!ua) return { ok: false, error: 'No se pudo registrar.' };
  const { contacto, nuevo } = await registrarContacto({ nombre, email, telefono, origen: 'popup', pagina: pagina.split('?')[0], utm });
  if (nuevo && correoConfigurado()) {
    try { await enviarCorreo({ para: contacto.email, ...correoCupon(contacto.nombre, contacto.cupon, contacto.descuentoPct) }); await marcarCorreoEnviado(contacto.id); }
    catch (e) { console.error('[cupon] correo falló:', (e as Error).message); }
  }
  return { ok: true, cupon: contacto.cupon, pct: contacto.descuentoPct, nuevo };
}

export async function validarCuponAction(codigo: string): Promise<{ pct: number; nombre: string } | null> {
  return descuentoDe(codigo);
}
