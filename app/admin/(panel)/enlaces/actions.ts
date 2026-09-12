'use server';

// Server Actions de la página de enlaces.
//
// ⚠️ CADA ACTION VERIFICA SESIÓN POR SU CUENTA, como en propiedades y en
// contenido. El guardia del layout protege las PÁGINAS; una Server Action es un
// endpoint HTTP propio y se puede invocar sin pasar por ninguna página.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { usuarioActual } from '@/lib/auth';
import {
  actualizarEnlace,
  borrarEnlace,
  crearEnlace,
  moverEnlace,
  normalizarUrl,
  type DatosEnlace,
} from '@/lib/enlaces';
import { guardarAjustes } from '@/lib/settings';

async function exigirSesion(): Promise<void> {
  if (!(await usuarioActual())) redirect('/admin/login');
}

/** Solo /enlaces: esta pantalla no toca ninguna otra página del sitio, así que
 *  no hay motivo para regenerar las 31 estáticas como hace propiedades. */
function regenerar(): void {
  revalidatePath('/enlaces');
}

const asBool = (v: FormDataEntryValue | null) => v === 'on' || v === 'true';

/** Lee el formulario. La URL se normaliza acá porque es lo único que puede
 *  venir mal escrito de verdad; lo demás lo acota lib/enlaces. */
function leer(formData: FormData): DatosEnlace | 'url-invalida' {
  const url = normalizarUrl(String(formData.get('url') ?? ''));
  if (url === null) return 'url-invalida';

  return {
    tipo: String(formData.get('tipo') ?? 'sitio'),
    etiqueta: String(formData.get('etiqueta') ?? ''),
    descripcion: String(formData.get('descripcion') ?? ''),
    url,
    forma: String(formData.get('forma') ?? 'boton') === 'circulo' ? 'circulo' : 'boton',
    activo: asBool(formData.get('activo')),
    destacado: asBool(formData.get('destacado')),
  };
}

export async function guardarEnlaceAction(formData: FormData): Promise<void> {
  await exigirSesion();

  const id = String(formData.get('id') ?? '');
  const datos = leer(formData);
  if (datos === 'url-invalida') redirect('/admin/enlaces?error=url');
  if (datos.etiqueta === '') redirect('/admin/enlaces?error=etiqueta');

  await actualizarEnlace(id, datos);
  regenerar();
  redirect('/admin/enlaces?guardado=1');
}

export async function crearEnlaceAction(formData: FormData): Promise<void> {
  await exigirSesion();

  const datos = leer(formData);
  if (datos === 'url-invalida') redirect('/admin/enlaces?error=url');
  if (datos.etiqueta === '') redirect('/admin/enlaces?error=etiqueta');

  await crearEnlace(datos);
  regenerar();
  redirect('/admin/enlaces?guardado=1#nuevo');
}

export async function borrarEnlaceAction(formData: FormData): Promise<void> {
  await exigirSesion();
  await borrarEnlace(String(formData.get('id') ?? ''));
  regenerar();
  redirect('/admin/enlaces?borrado=1');
}

export async function subirEnlaceAction(formData: FormData): Promise<void> {
  await exigirSesion();
  await moverEnlace(String(formData.get('id') ?? ''), 'arriba');
  regenerar();
  redirect('/admin/enlaces');
}

export async function bajarEnlaceAction(formData: FormData): Promise<void> {
  await exigirSesion();
  await moverEnlace(String(formData.get('id') ?? ''), 'abajo');
  regenerar();
  redirect('/admin/enlaces');
}

/** La frase bajo el nombre. Vive en site_settings, no en la tabla `enlaces`:
 *  es texto del sitio, no un botón. */
export async function guardarFraseAction(formData: FormData): Promise<void> {
  await exigirSesion();
  await guardarAjustes([
    { key: 'enlaces_frase', value: String(formData.get('enlaces_frase') ?? '') },
  ]);
  regenerar();
  redirect('/admin/enlaces?guardado=1');
}
