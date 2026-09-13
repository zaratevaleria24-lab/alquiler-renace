'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getContratoPorToken, firmar, datosDe, urlContrato } from '@/lib/contratos';
import { textoPlano, VERSION } from '@/lib/contratos-clausulas';
import { correoConfigurado, enviarCorreo } from '@/lib/correo';
import { getAjustes } from '@/lib/settings';

// Firma del huésped. El token de la URL es la única llave: quien lo tiene es
// quien recibió el correo o el WhatsApp. Se guarda nombre, documento, trazo y
// navegador; nunca la IP.
export async function firmarContratoAction(fd: FormData): Promise<{ ok: boolean; error?: string }> {
  const token = String(fd.get('token') ?? '');
  const c = await getContratoPorToken(token);
  if (!c) return { ok: false, error: 'Este enlace no es válido.' };
  if (c.estado === 'firmado') return { ok: true };
  if (c.estado === 'anulado') return { ok: false, error: 'Este contrato fue anulado. Escríbenos por WhatsApp.' };
  const nombre = String(fd.get('nombre') ?? '').trim().slice(0, 120);
  const documento = String(fd.get('documento') ?? '').trim().slice(0, 40);
  const imagen = String(fd.get('firma') ?? '');
  if (nombre.length < 5 || documento.length < 5) return { ok: false, error: 'Escribe tu nombre completo y tu cédula o pasaporte.' };
  if (!imagen.startsWith('data:image/png;base64,') || imagen.length > 300_000) return { ok: false, error: 'Dibuja tu firma en el recuadro.' };
  if (fd.get('acepto') !== 'on') return { ok: false, error: 'Marca que leíste y aceptas las cláusulas.' };
  const agente = (await headers()).get('user-agent') ?? '';
  const ok = await firmar(c, { nombre, documento, imagen, agente });
  if (!ok) return { ok: false, error: 'No se pudo firmar. Escríbenos por WhatsApp.' };
  revalidatePath(`/contrato/${token}`);
  // Copia para el dueño (y para el huésped si dejó correo). Si falla, la firma
  // ya quedó guardada: el correo es cortesía, no la prueba.
  try {
    if (correoConfigurado()) {
      const a = await getAjustes() as unknown as Record<string, string>;
      const firmado = await getContratoPorToken(token);
      if (firmado) {
        const d = await datosDe(firmado);
        const texto = textoPlano(d) + `\n\nFirmado por ${nombre} (${documento}) el ${firmado.firmadoAt}. Verificación ${firmado.firmaHash}.\nVer: ${urlContrato(token)}`;
        const para = [a.correo_corporativo, firmado.email].filter(Boolean).join(', ');
        if (para) await enviarCorreo({ para, asunto: `Contrato firmado · ${d.inmueble} · ${d.checkIn} → ${d.checkOut}`, texto, html: `<p>Contrato firmado por <b>${nombre}</b> (${documento}).</p><p><a href="${urlContrato(token)}">Ver e imprimir el contrato</a> · cláusulas v${VERSION}</p><pre style="white-space:pre-wrap;font-family:inherit">${texto.replace(/</g, '&lt;')}</pre>` });
      }
    }
  } catch (e) { console.error('[contrato] aviso de firma falló:', (e as Error).message); }
  return { ok: true };
}
