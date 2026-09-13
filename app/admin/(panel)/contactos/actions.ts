'use server';
import { redirect } from 'next/navigation';
import { usuarioActual } from '@/lib/auth';
import { borrarContacto } from '@/lib/contactos';
export async function borrarContactoAction(fd: FormData) {
  if (!(await usuarioActual())) redirect('/admin/login');
  const id = String(fd.get('id') ?? ''); if (/^[0-9a-f-]{36}$/.test(id)) await borrarContacto(id);
  redirect('/admin/contactos?ok=1');
}
