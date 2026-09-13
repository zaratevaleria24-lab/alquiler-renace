// Correo saliente. SOLO SERVIDOR.
//
// La cuenta vive en /etc/margarita-renace/correo.env (fuera del repo, como las
// otras claves): SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CORREO_DESDE
// («Margarita Renace <hola@margaritarenace.com.ve>»). Si el archivo no existe,
// `correoConfigurado()` es false y el panel ofrece el enlace para mandarlo por
// WhatsApp: nunca se queda sin salida.

import { readFileSync } from 'node:fs';
import nodemailer from 'nodemailer';

interface ConfigCorreo { host: string; port: number; user: string; pass: string; desde: string }

let cache: ConfigCorreo | null | undefined;
export function configCorreo(): ConfigCorreo | null {
  if (cache !== undefined) return cache;
  try {
    const env: Record<string, string> = {};
    for (const l of readFileSync('/etc/margarita-renace/correo.env', 'utf8').split('\n')) {
      const m = l.match(/^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/); if (m) env[m[1]] = m[2];
    }
    cache = env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS
      ? { host: env.SMTP_HOST, port: Number(env.SMTP_PORT || 587), user: env.SMTP_USER, pass: env.SMTP_PASS, desde: env.CORREO_DESDE || env.SMTP_USER }
      : null;
  } catch { cache = null; }
  return cache;
}
export const correoConfigurado = () => configCorreo() !== null;

export async function enviarCorreo(o: { para: string; asunto: string; texto: string; html: string; copia?: string; adjuntos?: { filename: string; content: string | Buffer; contentType?: string }[] }): Promise<void> {
  const c = configCorreo();
  if (!c) throw new Error('correo no configurado');
  const t = nodemailer.createTransport({ host: c.host, port: c.port, secure: c.port === 465, auth: { user: c.user, pass: c.pass } });
  await t.sendMail({ from: c.desde, to: o.para, bcc: o.copia, subject: o.asunto, text: o.texto, html: o.html, attachments: o.adjuntos });
}
