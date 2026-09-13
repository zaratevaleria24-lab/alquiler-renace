'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { usuarioActual } from '@/lib/auth';
import { anular, crearContrato, datosDe, getContrato, marcarEnviado, urlContrato } from '@/lib/contratos';
import { correoInvitacion } from '@/lib/correo-plantillas';
import { correoConfigurado, enviarCorreo } from '@/lib/correo';
import { camposDe, getAjustes, guardarAjustes, type ClaveAjuste } from '@/lib/settings';
import { getTasas } from '@/lib/tasas';
import { SITE } from '@/lib/site';

async function exigirSesion() { if (!(await usuarioActual())) redirect('/admin/login'); }
const num = (v: FormDataEntryValue | null, d = 0) => { const n = Number(String(v ?? '').replace(',', '.')); return Number.isFinite(n) && n >= 0 ? n : d; };
const txt = (v: FormDataEntryValue | null, max: number) => String(v ?? '').trim().slice(0, max);

export async function crearContratoAction(fd: FormData) {
  await exigirSesion();
  const huesped = txt(fd.get('huesped'), 120), propertyId = txt(fd.get('property_id'), 40);
  const checkIn = txt(fd.get('check_in'), 10), checkOut = txt(fd.get('check_out'), 10);
  if (!huesped || !propertyId || !checkIn || !checkOut || checkOut <= checkIn) redirect('/admin/contratos?error=datos');
  const noches = Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / 86400000);
  const tarifaNoche = num(fd.get('tarifa_noche')), limpiezaUsd = num(fd.get('limpieza_usd'));
  const totalUsd = num(fd.get('total_usd')) || tarifaNoche * noches + limpiezaUsd;
  // Integrantes: una línea por persona, «Nombre - documento».
  const integrantes = txt(fd.get('integrantes'), 3000).split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const m = l.match(/^(.*?)\s*[-–—,;|]\s*([A-Za-z]?-?\s?[\d.\-A-Za-z]+)\s*$/); return m ? { nombre: m[1].trim(), documento: m[2].trim() } : { nombre: l, documento: '—' };
  });
  // Tasa de referencia del día (USDT), congelada en el contrato.
  let tasaBs: number | null = null, tasaFuente = '';
  try { const t = await getTasas(); if (t.mercado) { tasaBs = Math.round(t.mercado * 100) / 100; tasaFuente = 'Binance P2P (USDT)'; } } catch {}
  const id = await crearContrato({
    propertyId, huesped, documento: txt(fd.get('documento'), 40), email: txt(fd.get('email'), 120).toLowerCase(), telefono: txt(fd.get('telefono'), 40),
    huespedes: Math.max(1, Math.trunc(num(fd.get('huespedes'), integrantes.length || 2))), integrantes, checkIn, checkOut,
    tarifaNoche, limpiezaUsd, totalUsd, anticipoUsd: num(fd.get('anticipo_usd')), depositoUsd: num(fd.get('deposito_usd')),
    tasaBs, tasaFuente, metodoPago: txt(fd.get('metodo_pago'), 160) || 'Zelle / Binance (USDT) / Pago Móvil / Efectivo', notas: txt(fd.get('notas'), 2000),
  });
  revalidatePath('/admin/contratos'); redirect(`/admin/contratos/${id}?creado=1`);
}

export async function enviarContratoAction(fd: FormData) {
  await exigirSesion();
  const id = txt(fd.get('id'), 40); const c = await getContrato(id); if (!c) redirect('/admin/contratos');
  if (!c.email) redirect(`/admin/contratos/${id}?error=sin-correo`);
  if (!correoConfigurado()) redirect(`/admin/contratos/${id}?error=sin-smtp`);
  const a = await getAjustes() as unknown as Record<string, string>;
  const m = correoInvitacion(await datosDe(c), urlContrato(c.token), a.representante || SITE.name);
  try { await enviarCorreo({ para: c.email, copia: a.correo_corporativo || undefined, ...m }); }
  catch (e) { console.error('[contrato] envío falló:', (e as Error).message); redirect(`/admin/contratos/${id}?error=envio`); }
  await marcarEnviado(id, 'correo', { para: c.email }); revalidatePath('/admin/contratos'); redirect(`/admin/contratos/${id}?enviado=1`);
}
export async function marcarEnviadoAction(fd: FormData) {
  await exigirSesion(); const id = txt(fd.get('id'), 40); const via = fd.get('via') === 'whatsapp' ? 'whatsapp' : 'enlace';
  await marcarEnviado(id, via); revalidatePath('/admin/contratos'); redirect(`/admin/contratos/${id}?enviado=1`);
}
export async function anularContratoAction(fd: FormData) {
  await exigirSesion(); const id = txt(fd.get('id'), 40); await anular(id); revalidatePath('/admin/contratos'); redirect(`/admin/contratos/${id}?anulado=1`);
}
export async function guardarDatosLegalesAction(fd: FormData) {
  await exigirSesion();
  const entradas = camposDe('contratos').map((c) => ({ key: c.key as ClaveAjuste, value: String(fd.get(c.key) ?? '').trim() }));
  await guardarAjustes(entradas); revalidatePath('/admin/contratos'); redirect('/admin/contratos?guardado=1');
}
