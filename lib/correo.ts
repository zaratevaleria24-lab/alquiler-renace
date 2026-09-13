// Correo saliente. SOLO SERVIDOR.
//
// El dominio ya está verificado en RESEND (registros resend._domainkey y
// send.margaritarenace.com.ve en Cloudflare, vistos el 2026-09-13). Se envía por
// la API HTTP de Resend, no por SMTP: desde este servidor el puerto 465/587
// hacia fuera está bloqueado y la API va por 443, que sí sale.
//
// La clave vive en /etc/margarita-renace/correo.env (fuera del repo):
//   RESEND_API_KEY=re_xxxxxxxx
//   CORREO_DESDE="Margarita Renace <reservas@margaritarenace.com.ve>"
//   CORREO_RESPONDER_A=reservas@margaritarenace.com.ve   (opcional)
// El buzón de recepción es Cloudflare Email Routing → Gmail del dueño, así que
// las respuestas del huésped llegan igual aunque Resend solo envíe.
// Si el archivo no existe, `correoConfigurado()` es false y el panel ofrece
// WhatsApp o el enlace: nunca se queda sin salida.
//
// Se conserva la vía SMTP (SMTP_HOST/PORT/USER/PASS) por si algún día se
// cambia de proveedor; con RESEND_API_KEY presente gana Resend.

import { readFileSync } from 'node:fs';
import nodemailer from 'nodemailer';

interface Config { resend?: string; smtp?: { host: string; port: number; user: string; pass: string }; desde: string; responderA?: string }

let cache: Config | null | undefined;
export function configCorreo(): Config | null {
  if (cache !== undefined) return cache;
  try {
    const env: Record<string, string> = {};
    for (const l of readFileSync('/etc/margarita-renace/correo.env', 'utf8').split('\n')) {
      const m = l.match(/^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/); if (m) env[m[1]] = m[2];
    }
    const desde = env.CORREO_DESDE || env.SMTP_USER || '';
    if (env.RESEND_API_KEY && desde) cache = { resend: env.RESEND_API_KEY, desde, responderA: env.CORREO_RESPONDER_A || undefined };
    else if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) cache = { smtp: { host: env.SMTP_HOST, port: Number(env.SMTP_PORT || 587), user: env.SMTP_USER, pass: env.SMTP_PASS }, desde, responderA: env.CORREO_RESPONDER_A || undefined };
    else cache = null;
  } catch { cache = null; }
  return cache;
}
export const correoConfigurado = () => configCorreo() !== null;

export interface Mensaje { para: string; asunto: string; texto: string; html: string; copia?: string; adjuntos?: { filename: string; content: string | Buffer; contentType?: string }[] }

export async function enviarCorreo(o: Mensaje): Promise<void> {
  const c = configCorreo();
  if (!c) throw new Error('correo no configurado');
  const para = o.para.split(',').map((s) => s.trim()).filter(Boolean);
  if (c.resend) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${c.resend}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: c.desde, to: para, bcc: o.copia ? [o.copia] : undefined, reply_to: c.responderA, subject: o.asunto, text: o.texto, html: o.html,
        attachments: o.adjuntos?.map((a) => ({ filename: a.filename, content: Buffer.isBuffer(a.content) ? a.content.toString('base64') : Buffer.from(a.content).toString('base64') })),
      }),
    });
    if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text()).slice(0, 300)}`);
    return;
  }
  const t = nodemailer.createTransport({ host: c.smtp!.host, port: c.smtp!.port, secure: c.smtp!.port === 465, auth: { user: c.smtp!.user, pass: c.smtp!.pass } });
  await t.sendMail({ from: c.desde, to: para, bcc: o.copia, replyTo: c.responderA, subject: o.asunto, text: o.texto, html: o.html, attachments: o.adjuntos });
}
