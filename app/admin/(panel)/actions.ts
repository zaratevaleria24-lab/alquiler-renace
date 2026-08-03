'use server';

// Server Actions del panel de inicio.
//
// ⚠️ Verifica sesión por su cuenta, como todas: una Server Action es un endpoint
// HTTP propio y el guardia del layout solo protege las páginas.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { usuarioActual } from '@/lib/auth';
import { refrescarTasas } from '@/lib/tasas';

/**
 * Fuerza el refresco de las tasas.
 *
 * Existe porque el caché de 15 minutos es lo correcto el 99% del tiempo y
 * estorba justo cuando importa: al cerrar un cobro en un día de movimiento
 * fuerte, la dueña quiere ver el número de AHORA y no aceptar el de hace rato.
 */
export async function refrescarTasasAction(): Promise<void> {
  if (!(await usuarioActual())) redirect('/admin/login');

  await refrescarTasas();
  // Solo el panel: las tasas no salen (todavía) en el sitio público, así que no
  // hace falta regenerar las 32 páginas estáticas.
  revalidatePath('/admin');
  redirect('/admin');
}
