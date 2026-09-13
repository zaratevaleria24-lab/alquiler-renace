'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getContratoPorToken, firmar, datosDe, urlContrato, generarCodigo, verificarCodigo, registrarEvento, listarEventos } from '@/lib/contratos';
import { correoConfigurado, enviarCorreo } from '@/lib/correo';
import { correoCodigo, correoFirmado } from '@/lib/correo-plantillas';
import { getAjustes } from '@/lib/settings';

type R = { ok: boolean; error?: string };
async function evidenciaDe(fd: FormData): Promise<Record<string, unknown>> {
  const h = await headers();
  const ip = (h.get('cf-connecting-ip') || h.get('x-forwarded-for') || '').split(',')[0].trim();
  return { ip, agente: h.get('user-agent') ?? '', idioma: String(fd.get('idioma') ?? ''), zonaHoraria: String(fd.get('zona') ?? ''), pantalla: String(fd.get('pantalla') ?? '') };
}

/** Paso 1: mandar el código de 6 dígitos al correo del huésped. */
export async function pedirCodigoAction(fd: FormData): Promise<R> {
  const c = await getContratoPorToken(String(fd.get('token') ?? ''));
  if (!c || !c.email) return { ok: false, error: 'Este contrato no tiene correo asociado.' };
  if (!correoConfigurado()) return { ok: false, error: 'El envío de códigos no está disponible ahora. Escríbenos por WhatsApp.' };
  // Freno: alguien con el enlace no puede usar nuestro correo para bombardear
  // al huésped. Máximo 5 códigos por hora y 60 s entre uno y otro.
  const ahora = Date.now();
  const enviados = (await listarEventos(c.id)).filter((e) => e.tipo === 'codigo_enviado' && ahora - Date.parse(e.at) < 3600_000);
  if (enviados.length >= 5) return { ok: false, error: 'Ya se enviaron varios códigos. Espera una hora o escríbenos por WhatsApp.' };
  if (enviados.some((e) => ahora - Date.parse(e.at) < 60_000)) return { ok: false, error: 'Acabamos de enviarte un código. Revisa tu correo (y la carpeta de spam) antes de pedir otro.' };
  const codigo = await generarCodigo(c);
  const m = correoCodigo(await datosDe(c), codigo);
  try { await enviarCorreo({ para: c.email, ...m }); } catch (e) { console.error('[contrato] código falló:', (e as Error).message); return { ok: false, error: 'No pudimos enviar el código. Intenta de nuevo en un minuto.' }; }
  return { ok: true };
}

/** Paso 2: firmar (con el código si hay correo). */
export async function firmarContratoAction(fd: FormData): Promise<R> {
  const token = String(fd.get('token') ?? '');
  const c = await getContratoPorToken(token);
  if (!c) return { ok: false, error: 'Este enlace no es válido.' };
  if (c.estado === 'firmado') return { ok: true };
  // Freno a la fuerza bruta del código: 10 intentos fallidos por hora y se bloquea.
  if ((await listarEventos(c.id)).filter((e) => e.tipo === 'codigo_fallido' && Date.now() - Date.parse(e.at) < 3600_000).length >= 10) return { ok: false, error: 'Demasiados intentos. Espera una hora o escríbenos por WhatsApp.' };
  if (c.estado === 'anulado') return { ok: false, error: 'Este contrato fue anulado. Escríbenos por WhatsApp.' };
  const nombre = String(fd.get('nombre') ?? '').trim().slice(0, 120);
  const documento = String(fd.get('documento') ?? '').trim().slice(0, 40);
  const imagen = String(fd.get('firma') ?? '');
  if (nombre.length < 5 || documento.length < 5) return { ok: false, error: 'Escribe tu nombre completo y tu cédula o pasaporte.' };
  if (!imagen.startsWith('data:image/png;base64,') || imagen.length > 300_000) return { ok: false, error: 'Dibuja tu firma en el recuadro.' };
  if (fd.get('acepto') !== 'on') return { ok: false, error: 'Marca que leíste y aceptas las cláusulas.' };
  const evidencia = await evidenciaDe(fd);
  if (c.email && !c.codigoVerificado) {
    const ok = await verificarCodigo(c, String(fd.get('codigo') ?? ''), evidencia);
    if (!ok) return { ok: false, error: 'El código no coincide o venció. Pide uno nuevo.' };
    c.codigoVerificado = true;
  }
  if (!(await firmar(c, { nombre, documento, imagen, evidencia }))) return { ok: false, error: 'No se pudo firmar. Escríbenos por WhatsApp.' };
  revalidatePath(`/contrato/${token}`);
  // Copias: al dueño y al huésped. La firma ya quedó guardada; el correo es cortesía.
  try {
    if (correoConfigurado()) {
      const a = await getAjustes() as unknown as Record<string, string>;
      const f = await getContratoPorToken(token);
      if (f) {
        const m = correoFirmado(await datosDe(f), urlContrato(token), { nombre, documento, fecha: f.firmadoAt!, hash: f.firmaHash });
        const para = [a.correo_corporativo, f.email].filter(Boolean).join(', ');
        if (para) { await enviarCorreo({ para, ...m }); await registrarEvento(f.id, 'copia_enviada', { para }); }
      }
    }
  } catch (e) { console.error('[contrato] copia falló:', (e as Error).message); }
  return { ok: true };
}
