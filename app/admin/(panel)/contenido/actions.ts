'use server';

// Server Actions del contenido del sitio.
//
// ⚠️ Igual que en propiedades: cada action comprueba la sesión por su cuenta.
// El guardia del layout protege las PÁGINAS, pero una Server Action es un
// endpoint HTTP propio y se puede invocar sin pasar por la página.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { usuarioActual } from '@/lib/auth';
import { CAMPOS, type ClaveAjuste, guardarAjustes } from '@/lib/settings';
import { FotoInvalidaError, guardarImagenSitio } from '@/lib/uploads';

async function exigirSesion(): Promise<void> {
  if (!(await usuarioActual())) redirect('/admin/login');
}

/** Regenera todo el sitio: el contacto y la portada salen en todas las páginas
 *  (el footer y el JSON-LD van en el layout raíz), así que no sirve invalidar
 *  una sola ruta. */
function regenerarSitio(): void {
  revalidatePath('/', 'layout');
}

/** Claves de texto: las de tipo imagen se cambian con su propio formulario. */
const CLAVES_TEXTO = CAMPOS.filter((c) => c.tipo === 'texto').map((c) => c.key);

export async function guardarContenidoAction(formData: FormData): Promise<void> {
  await exigirSesion();

  const entradas = CLAVES_TEXTO.map((key) => ({
    key: key as ClaveAjuste,
    value: String(formData.get(key) ?? ''),
  }));

  // El WhatsApp se valida porque de él dependen TODOS los botones de reservar:
  // un número mal escrito los deja apuntando a un enlace muerto, que es peor
  // que tenerlos desactivados.
  const wa = entradas.find((e) => e.key === 'whatsapp');
  if (wa) {
    const digitos = wa.value.replace(/\D/g, '');
    if (digitos !== '' && (digitos.length < 10 || digitos.length > 15)) {
      redirect('/admin/contenido?error=whatsapp');
    }
    wa.value = digitos;
  }

  const email = entradas.find((e) => e.key === 'email');
  if (email && email.value.trim() !== '' && !email.value.includes('@')) {
    redirect('/admin/contenido?error=email');
  }

  const insta = entradas.find((e) => e.key === 'instagram');
  if (insta && insta.value.trim() !== '' && !/^https?:\/\//.test(insta.value.trim())) {
    redirect('/admin/contenido?error=instagram');
  }

  await guardarAjustes(entradas);
  regenerarSitio();
  redirect('/admin/contenido?guardado=1');
}

export async function subirImagenSitioAction(formData: FormData): Promise<void> {
  await exigirSesion();

  const clave = String(formData.get('clave') ?? '');
  const campo = CAMPOS.find((c) => c.key === clave && c.tipo === 'imagen');
  if (!campo) redirect('/admin/contenido');

  const archivo = formData.get('imagen');
  if (!(archivo instanceof File) || archivo.size === 0) {
    redirect('/admin/contenido?error=sin-imagen');
  }

  try {
    const ruta = await guardarImagenSitio(archivo, clave);
    await guardarAjustes([{ key: clave as ClaveAjuste, value: ruta }]);
  } catch (err) {
    if (err instanceof FotoInvalidaError) {
      redirect('/admin/contenido?error=imagen-invalida');
    }
    redirect('/admin/contenido?error=no-guardado');
  }

  regenerarSitio();
  redirect('/admin/contenido?guardado=1');
}

/** Vuelve al valor original del código borrando la fila. */
export async function restaurarImagenAction(formData: FormData): Promise<void> {
  await exigirSesion();

  const clave = String(formData.get('clave') ?? '');
  if (!CAMPOS.some((c) => c.key === clave && c.tipo === 'imagen')) {
    redirect('/admin/contenido');
  }
  // Cadena vacía = borrar la fila, ver guardarAjustes().
  await guardarAjustes([{ key: clave as ClaveAjuste, value: '' }]);
  regenerarSitio();
  redirect('/admin/contenido?guardado=1');
}
