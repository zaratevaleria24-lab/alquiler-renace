'use server';
import { redirect } from 'next/navigation';
import { usuarioActual } from '@/lib/auth';
import { actualizarTipo, borrarContacto, crearContactoManual, marcarCuponUsado, type TipoContacto } from '@/lib/contactos';
export async function borrarContactoAction(fd: FormData) {
  if (!(await usuarioActual())) redirect('/admin/login');
  const id = String(fd.get('id') ?? ''); if (/^[0-9a-f-]{36}$/.test(id)) await borrarContacto(id);
  redirect('/admin/contactos?ok=1');
}
export async function alternarUsadoAction(fd: FormData) {
  if (!(await usuarioActual())) redirect('/admin/login');
  const id = String(fd.get('id') ?? ''); if (/^[0-9a-f-]{36}$/.test(id)) await marcarCuponUsado(id, fd.get('usado') === '1');
  redirect('/admin/contactos?ok=1');
}
const tipoOk = (v: unknown): TipoContacto => (['huesped', 'aliado', 'prospecto'].includes(String(v)) ? (String(v) as TipoContacto) : 'huesped');
export async function crearContactoAction(fd: FormData) {
  if (!(await usuarioActual())) redirect('/admin/login');
  const nombre = String(fd.get('nombre') ?? '').trim(); if (nombre.length < 2) redirect('/admin/contactos?error=nombre');
  await crearContactoManual({ nombre, email: String(fd.get('email') ?? ''), telefono: String(fd.get('telefono') ?? ''), tipo: tipoOk(fd.get('tipo')), comercio: String(fd.get('comercio') ?? ''), notas: String(fd.get('notas') ?? '') });
  redirect('/admin/contactos?ok=1');
}
export async function cambiarTipoAction(fd: FormData) {
  if (!(await usuarioActual())) redirect('/admin/login');
  const id = String(fd.get('id') ?? ''); if (/^[0-9a-f-]{36}$/.test(id)) await actualizarTipo(id, tipoOk(fd.get('tipo')), String(fd.get('comercio') ?? '').trim().slice(0, 120));
  redirect('/admin/contactos?ok=1');
}
