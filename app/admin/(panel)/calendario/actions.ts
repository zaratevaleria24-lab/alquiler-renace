'use server';

// Server Actions del calendario: reservas manuales y feeds iCal.
//
// ⚠️ CADA ACTION VERIFICA SESIÓN POR SU CUENTA, igual que en propiedades: una
// Server Action es un endpoint HTTP propio y el guardia del layout no la cubre.

import { redirect } from 'next/navigation';
import { usuarioActual } from '@/lib/auth';
import { query, rows } from '@/lib/db';
import { sincronizarFeeds } from '@/lib/calendario';

async function exigirSesion(): Promise<void> {
  if (!(await usuarioActual())) redirect('/admin/login');
}

/** Vuelve al calendario conservando el mes que se estaba mirando. */
function volver(mes: string, aviso: string): never {
  const qs = new URLSearchParams();
  if (/^\d{4}-\d{2}$/.test(mes)) qs.set('mes', mes);
  const [k, v] = aviso.split('=');
  qs.set(k, v);
  redirect(`/admin/calendario?${qs}`);
}

const comoFecha = (v: FormDataEntryValue | null): string | null => {
  const s = String(v ?? '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
};

/**
 * Choque de fechas contra lo ya existente. Es un ERROR y no un aviso: si las
 * noches están tomadas en Airbnb o por otra reserva manual, registrar encima
 * es exactamente el doble alquiler que este calendario existe para impedir.
 */
async function chocaCon(
  propertyId: string,
  checkIn: string,
  checkOut: string,
  ignorarId: string | null,
): Promise<boolean> {
  const [fila] = await rows(
    `SELECT 1 FROM reservas
     WHERE property_id = $1 AND check_in < $3 AND check_out > $2
       AND ($4::uuid IS NULL OR id <> $4)
     LIMIT 1`,
    [propertyId, checkIn, checkOut, ignorarId],
  );
  return Boolean(fila);
}

export async function crearReservaAction(formData: FormData): Promise<void> {
  await exigirSesion();
  const mes = String(formData.get('mes') ?? '');

  const propertyId = String(formData.get('property_id') ?? '');
  const checkIn = comoFecha(formData.get('check_in'));
  const checkOut = comoFecha(formData.get('check_out'));
  const tipo = formData.get('tipo') === 'bloqueo' ? 'bloqueo' : 'reserva';
  const estado = formData.get('estado') === 'tentativa' ? 'tentativa' : 'confirmada';
  const huesped = String(formData.get('huesped') ?? '').trim();
  const telefono = String(formData.get('telefono') ?? '').trim();
  const notas = String(formData.get('notas') ?? '').trim();
  const totalCrudo = String(formData.get('total_usd') ?? '').trim();
  const totalUsd = totalCrudo === '' ? null : Number(totalCrudo);

  if (!propertyId || !checkIn || !checkOut || checkOut <= checkIn) {
    volver(mes, 'error=fechas');
  }
  if (totalUsd !== null && (!Number.isFinite(totalUsd) || totalUsd < 0)) {
    volver(mes, 'error=monto');
  }
  if (await chocaCon(propertyId, checkIn, checkOut, null)) {
    volver(mes, 'error=choca');
  }

  try {
    await query(
      `INSERT INTO reservas
         (property_id, origen, tipo, estado, huesped, telefono, notas,
          total_usd, check_in, check_out)
       VALUES ($1, 'manual', $2, $3, $4, $5, $6, $7, $8, $9)`,
      [propertyId, tipo, estado, huesped, telefono, notas, totalUsd, checkIn, checkOut],
    );
  } catch {
    volver(mes, 'error=no-guardado');
  }
  volver(mes, 'guardado=1');
}

export async function actualizarReservaAction(formData: FormData): Promise<void> {
  await exigirSesion();
  const mes = String(formData.get('mes') ?? '');

  const id = String(formData.get('id') ?? '');
  const checkIn = comoFecha(formData.get('check_in'));
  const checkOut = comoFecha(formData.get('check_out'));
  const tipo = formData.get('tipo') === 'bloqueo' ? 'bloqueo' : 'reserva';
  const estado = formData.get('estado') === 'tentativa' ? 'tentativa' : 'confirmada';
  const huesped = String(formData.get('huesped') ?? '').trim();
  const telefono = String(formData.get('telefono') ?? '').trim();
  const notas = String(formData.get('notas') ?? '').trim();
  const totalCrudo = String(formData.get('total_usd') ?? '').trim();
  const totalUsd = totalCrudo === '' ? null : Number(totalCrudo);

  if (!id || !checkIn || !checkOut || checkOut <= checkIn) {
    volver(mes, 'error=fechas');
  }
  if (totalUsd !== null && (!Number.isFinite(totalUsd) || totalUsd < 0)) {
    volver(mes, 'error=monto');
  }

  // Solo lo manual se edita: una reserva importada la manda Airbnb, y el
  // próximo sync pisaría cualquier cambio hecho acá.
  const [reserva] = await rows<{ property_id: string }>(
    `SELECT property_id FROM reservas WHERE id = $1 AND origen = 'manual'`,
    [id],
  );
  if (!reserva) volver(mes, 'error=no-editable');
  if (await chocaCon(reserva.property_id, checkIn, checkOut, id)) {
    volver(mes, 'error=choca');
  }

  try {
    await query(
      `UPDATE reservas
       SET tipo = $2, estado = $3, huesped = $4, telefono = $5, notas = $6,
           total_usd = $7, check_in = $8, check_out = $9
       WHERE id = $1 AND origen = 'manual'`,
      [id, tipo, estado, huesped, telefono, notas, totalUsd, checkIn, checkOut],
    );
  } catch {
    volver(mes, 'error=no-guardado');
  }
  volver(mes, 'guardado=1');
}

export async function eliminarReservaAction(formData: FormData): Promise<void> {
  await exigirSesion();
  const mes = String(formData.get('mes') ?? '');
  const id = String(formData.get('id') ?? '');
  if (!id) volver(mes, 'error=no-guardado');

  await query(`DELETE FROM reservas WHERE id = $1 AND origen = 'manual'`, [id]);
  volver(mes, 'guardado=1');
}

export async function agregarFeedAction(formData: FormData): Promise<void> {
  await exigirSesion();
  const mes = String(formData.get('mes') ?? '');
  const propertyId = String(formData.get('property_id') ?? '');
  const nombre = String(formData.get('nombre') ?? '').trim() || 'Airbnb';
  const url = String(formData.get('url') ?? '').trim();

  // https obligatorio: el feed se va a pedir desde el servidor en cada sync, y
  // un esquema raro acá sería una puerta a pedir cualquier cosa en nuestro
  // nombre (file://, http a servicios internos…).
  if (!propertyId || !/^https:\/\/.+/i.test(url)) volver(mes, 'error=feed-url');

  try {
    await query(
      `INSERT INTO ical_feeds (property_id, nombre, url) VALUES ($1, $2, $3)
       ON CONFLICT (property_id, url) DO NOTHING`,
      [propertyId, nombre, url],
    );
  } catch {
    volver(mes, 'error=no-guardado');
  }

  // Primer sync inmediato: pegar la URL y ver aparecer las reservas de Airbnb
  // en la misma pantalla es la confirmación de que quedó bien conectado.
  await sincronizarFeeds(false);
  volver(mes, 'guardado=1');
}

export async function eliminarFeedAction(formData: FormData): Promise<void> {
  await exigirSesion();
  const mes = String(formData.get('mes') ?? '');
  const id = String(formData.get('id') ?? '');
  if (!id) volver(mes, 'error=no-guardado');

  // El CASCADE de la base borra también sus reservas importadas.
  await query(`DELETE FROM ical_feeds WHERE id = $1`, [id]);
  volver(mes, 'guardado=1');
}

export async function sincronizarAction(formData: FormData): Promise<void> {
  await exigirSesion();
  const mes = String(formData.get('mes') ?? '');
  await sincronizarFeeds(false);
  volver(mes, 'sincronizado=1');
}
