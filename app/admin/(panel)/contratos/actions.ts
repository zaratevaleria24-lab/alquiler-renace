'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { usuarioActual } from '@/lib/auth';
import { anular, crearContrato, datosDe, getContrato, marcarEnviado, urlContrato } from '@/lib/contratos';
import { textoPlano } from '@/lib/contratos-clausulas';
import { correoConfigurado, enviarCorreo } from '@/lib/correo';
import { camposDe, getAjustes, guardarAjustes, type ClaveAjuste } from '@/lib/settings';
import { SITE } from '@/lib/site';

async function exigirSesion() { if (!(await usuarioActual())) redirect('/admin/login'); }
const num = (v: FormDataEntryValue | null, d = 0) => { const n = Number(String(v ?? '').replace(',', '.')); return Number.isFinite(n) && n >= 0 ? n : d; };

export async function crearContratoAction(fd: FormData) {
  await exigirSesion();
  const huesped = String(fd.get('huesped') ?? '').trim().slice(0, 120);
  const propertyId = String(fd.get('property_id') ?? '');
  const checkIn = String(fd.get('check_in') ?? ''), checkOut = String(fd.get('check_out') ?? '');
  if (!huesped || !propertyId || !checkIn || !checkOut || checkOut <= checkIn) redirect('/admin/contratos?error=datos');
  const id = await crearContrato({
    propertyId, huesped, documento: String(fd.get('documento') ?? '').trim().slice(0, 40), email: String(fd.get('email') ?? '').trim().slice(0, 120), telefono: String(fd.get('telefono') ?? '').trim().slice(0, 40),
    huespedes: Math.max(1, Math.trunc(num(fd.get('huespedes'), 2))), checkIn, checkOut, totalUsd: num(fd.get('total_usd')), anticipoUsd: num(fd.get('anticipo_usd')), depositoUsd: num(fd.get('deposito_usd')), notas: String(fd.get('notas') ?? '').trim().slice(0, 2000),
  });
  revalidatePath('/admin/contratos'); redirect(`/admin/contratos/${id}?creado=1`);
}

export async function enviarContratoAction(fd: FormData) {
  await exigirSesion();
  const id = String(fd.get('id') ?? ''); const c = await getContrato(id); if (!c) redirect('/admin/contratos');
  if (!c.email) redirect(`/admin/contratos/${id}?error=sin-correo`);
  if (!correoConfigurado()) redirect(`/admin/contratos/${id}?error=sin-smtp`);
  const a = await getAjustes() as unknown as Record<string, string>;
  const d = await datosDe(c); const url = urlContrato(c.token);
  const texto = `Hola ${c.huesped},\n\nGracias por reservar con ${SITE.name}. Aquí está tu contrato de hospedaje para ${d.inmueble}, del ${d.checkIn} al ${d.checkOut}.\n\nLéelo y fírmalo desde tu teléfono en este enlace privado:\n${url}\n\nSi algo no te cuadra, respóndenos este correo o escríbenos por WhatsApp. Te respondemos nosotros, no un robot.\n\n${a.representante || SITE.name}\n${SITE.url}\n\n— Texto del contrato —\n${textoPlano(d)}`;
  const html = `<p>Hola ${c.huesped},</p><p>Gracias por reservar con ${SITE.name}. Aquí está tu contrato de hospedaje para <b>${d.inmueble}</b>, del ${d.checkIn} al ${d.checkOut}.</p><p><a href="${url}" style="display:inline-block;background:#0b4a5c;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Leer y firmar el contrato</a></p><p style="color:#6b6b6b">Si el botón no abre, copia este enlace: ${url}</p><p>Si algo no te cuadra, respóndenos este correo o escríbenos por WhatsApp. Te respondemos nosotros, no un robot.</p><p>${a.representante || SITE.name}<br>${SITE.url}</p>`;
  try {
    await enviarCorreo({ para: c.email, copia: a.correo_corporativo || undefined, asunto: `Tu contrato de hospedaje · ${d.inmueble} · ${d.checkIn}`, texto, html });
  } catch (e) { console.error('[contrato] envío falló:', (e as Error).message); redirect(`/admin/contratos/${id}?error=envio`); }
  await marcarEnviado(id); revalidatePath('/admin/contratos'); redirect(`/admin/contratos/${id}?enviado=1`);
}

/** Se copió el enlace o se mandó por WhatsApp: cuenta como enviado. */
export async function marcarEnviadoAction(fd: FormData) {
  await exigirSesion(); const id = String(fd.get('id') ?? ''); await marcarEnviado(id); revalidatePath('/admin/contratos'); redirect(`/admin/contratos/${id}?enviado=1`);
}
export async function anularContratoAction(fd: FormData) {
  await exigirSesion(); const id = String(fd.get('id') ?? ''); await anular(id); revalidatePath('/admin/contratos'); redirect(`/admin/contratos/${id}?anulado=1`);
}
export async function guardarDatosLegalesAction(fd: FormData) {
  await exigirSesion();
  const entradas = camposDe('contratos').map((c) => ({ key: c.key as ClaveAjuste, value: String(fd.get(c.key) ?? '').trim() }));
  await guardarAjustes(entradas); revalidatePath('/admin/contratos'); redirect('/admin/contratos?guardado=1');
}
