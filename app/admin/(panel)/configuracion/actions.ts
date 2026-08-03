'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cambiarPassword, usuarioActual } from '@/lib/auth';
import { marcarPendiente } from '@/lib/pendientes';

/** Sesión propia en cada action: son endpoints HTTP y el guardia del layout
 *  solo cubre las páginas. */
async function exigirSesion() {
  const u = await usuarioActual();
  if (!u) redirect('/admin/login');
  return u;
}

export async function marcarPendienteAction(formData: FormData): Promise<void> {
  await exigirSesion();

  const clave = String(formData.get('clave') ?? '');
  const hecho = formData.get('hecho') === 'true';
  if (clave) await marcarPendiente(clave, hecho);

  // El layout también, que muestra el contador en la tira lateral.
  revalidatePath('/admin', 'layout');
  redirect('/admin/configuracion');
}

/** Mínimo de caracteres. 10 y no 8: es la única credencial del panel y no hay
 *  segundo factor, así que conviene pedir un poco más de lo mínimo aceptable. */
const MINIMO = 10;

export async function cambiarPasswordAction(formData: FormData): Promise<void> {
  const user = await exigirSesion();

  const actual = String(formData.get('actual') ?? '');
  const nueva = String(formData.get('nueva') ?? '');
  const repetir = String(formData.get('repetir') ?? '');

  if (!actual || !nueva) redirect('/admin/configuracion?error=faltan');
  if (nueva.length < MINIMO) redirect('/admin/configuracion?error=corta');
  if (nueva !== repetir) redirect('/admin/configuracion?error=no-coincide');
  if (nueva === actual) redirect('/admin/configuracion?error=igual');

  const r = await cambiarPassword(user.id, actual, nueva);
  if (r !== 'ok') redirect('/admin/configuracion?error=actual');

  redirect('/admin/configuracion?password=1');
}
