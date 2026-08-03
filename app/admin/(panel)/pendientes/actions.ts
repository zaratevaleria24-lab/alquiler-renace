'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { usuarioActual } from '@/lib/auth';
import { marcarPendiente } from '@/lib/pendientes';

/** Tacha o destacha una tarea manual. Verifica sesión por su cuenta, como
 *  todas: una Server Action es un endpoint HTTP propio. */
export async function marcarPendienteAction(formData: FormData): Promise<void> {
  if (!(await usuarioActual())) redirect('/admin/login');

  const clave = String(formData.get('clave') ?? '');
  const hecho = formData.get('hecho') === 'true';
  if (clave) await marcarPendiente(clave, hecho);

  // También el layout, que muestra el contador en la lateral.
  revalidatePath('/admin', 'layout');
  redirect('/admin/pendientes');
}
