'use server';

// Server Actions del panel.
//
// Se usan Server Actions y no rutas de API porque el formulario funciona sin
// JavaScript: si la hidratación falla o tarda —cosa probable con las conexiones
// de Venezuela— el login sigue enviándose como un POST de HTML normal.

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import {
  autenticar,
  cerrarSesion,
  crearSesion,
  estaBloqueado,
  hashIp,
  registrarIntento,
} from '@/lib/auth';

/**
 * IP real del visitante.
 *
 * Se lee CF-Connecting-IP porque el sitio está detrás del proxy de Cloudflare y
 * `x-forwarded-for` puede traer una cadena de saltos. Sin esto, el límite de
 * intentos contaría todo el tráfico como una sola IP —la de Cloudflare— y
 * bloquearía a la dueña por culpa de los bots de otro.
 *
 * ⚠️ ESTA CABECERA SOLO ES DE FIAR PORQUE EL VHOST LA SOBREESCRIBE.
 * `sites-available/margarita-admin` hace `proxy_set_header CF-Connecting-IP
 * $remote_addr`, y $remote_addr ya viene resuelto por el módulo realip de nginx.
 * Hasta el 2026-07-29 el vhost reenviaba `$http_cf_connecting_ip` —la cabecera
 * TAL CUAL la mandaba el cliente—, así que bastaba cambiarla en cada petición
 * para que cada intento contara como una IP nueva y el límite no existiera. Si
 * algún día esta app se sirve detrás de otro proxy, ese proxy tiene que
 * sobreescribir la cabecera igual, o hay que dejar de leerla acá.
 */
async function ipDelVisitante(): Promise<string> {
  const h = await headers();
  return (
    h.get('cf-connecting-ip') ??
    h.get('x-real-ip') ??
    h.get('x-forwarded-for')?.split(',')[0].trim() ??
    'desconocida'
  );
}

export type EstadoLogin = { error?: string } | undefined;

export async function iniciarSesionAction(
  _prev: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  // El campo se llama `usuario`: puede ser un nombre o un correo.
  const email = String(formData.get('usuario') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Escribe el usuario y la contraseña.' };
  }

  const ipHash = hashIp(await ipDelVisitante());

  // Se pasa el usuario además del hash de IP: el límite tiene dos techos, uno
  // por origen y otro por cuenta. Ver estaBloqueado() en lib/auth.ts.
  if (await estaBloqueado(ipHash, email)) {
    return {
      error:
        'Demasiados intentos fallidos. Espera 15 minutos antes de volver a probar.',
    };
  }

  const user = await autenticar(email, password);
  await registrarIntento(ipHash, email, Boolean(user));

  if (!user) {
    // Mensaje deliberadamente genérico: decir "ese correo no existe" le confirma
    // a quien prueba cuáles son válidos.
    return { error: 'Usuario o contraseña incorrectos.' };
  }

  await crearSesion(user.id);
  redirect('/');
}

export async function cerrarSesionAction(): Promise<void> {
  await cerrarSesion();
  redirect('/login');
}
