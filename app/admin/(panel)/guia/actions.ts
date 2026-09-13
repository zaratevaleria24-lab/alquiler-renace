'use server';

// Server Actions de la guía turística. Cada una verifica sesión por su cuenta.
import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { usuarioActual } from '@/lib/auth';
import { query, rows } from '@/lib/db';
import { FotoInvalidaError, borrarArchivoFoto, guardarFoto } from '@/lib/uploads';
import { slugify } from '@/lib/listings';
import { aplicarPlaces, buscarEnPlaces, CATEGORIAS, TAG_GUIA, type FotoGuia } from '@/lib/guia';

async function exigirSesion() { if (!(await usuarioActual())) redirect('/admin/login'); }
function regenerar() { revalidateTag(TAG_GUIA); revalidatePath('/guia', 'layout'); revalidatePath('/sitemap.xml'); }
const asBool = (v: FormDataEntryValue | null) => v === 'on' || v === 'true';

export async function alternarPublicadoLugarAction(fd: FormData) {
  await exigirSesion();
  const id = String(fd.get('id') ?? ''); if (!id) redirect('/admin/guia');
  await query(`UPDATE guia_lugares SET publicado = $2, updated_at = now() WHERE id = $1`, [id, asBool(fd.get('publicar'))]);
  regenerar(); redirect('/admin/guia?guardado=1');
}
export async function alternarDestacadoLugarAction(fd: FormData) {
  await exigirSesion();
  const id = String(fd.get('id') ?? ''); if (!id) redirect('/admin/guia');
  await query(`UPDATE guia_lugares SET destacado = NOT destacado, updated_at = now() WHERE id = $1`, [id]);
  regenerar(); redirect('/admin/guia?guardado=1');
}

export async function guardarLugarAction(fd: FormData) {
  await exigirSesion();
  const id = String(fd.get('id') ?? ''); if (!id) redirect('/admin/guia');
  const cat = String(fd.get('categoria') ?? '');
  if (!CATEGORIAS.some((c) => c.key === cat) || !String(fd.get('nombre') ?? '').trim()) redirect(`/admin/guia/${id}?error=faltan-datos`);
  await query(
    `UPDATE guia_lugares SET nombre=$2, categoria=$3, municipio=$4, descripcion=$5, consejo=$6, mejor_momento=$7, duracion=$8, costo=$9,
       instagram=$10, web=$11, destacado=$12, publicado=$13, orden=$14, aliado=$15, updated_at=now() WHERE id=$1`,
    [id, String(fd.get('nombre')).trim().slice(0, 120), cat, String(fd.get('municipio') ?? '').trim().slice(0, 80),
     String(fd.get('descripcion') ?? '').trim().slice(0, 3000), String(fd.get('consejo') ?? '').trim().slice(0, 1500),
     String(fd.get('mejor_momento') ?? '').trim().slice(0, 80), String(fd.get('duracion') ?? '').trim().slice(0, 80), String(fd.get('costo') ?? '').trim().slice(0, 120),
     String(fd.get('instagram') ?? '').trim().replace(/^@/, '').slice(0, 60) || null, String(fd.get('web') ?? '').trim().slice(0, 300) || null,
     asBool(fd.get('destacado')), asBool(fd.get('publicado')), Math.trunc(Number(fd.get('orden')) || 0), asBool(fd.get('aliado'))],
  );
  regenerar(); redirect(`/admin/guia/${id}?guardado=1`);
}

export async function crearLugarAction(fd: FormData) {
  await exigirSesion();
  const nombre = String(fd.get('nombre') ?? '').trim().slice(0, 120);
  const cat = String(fd.get('categoria') ?? 'playa');
  if (!nombre) redirect('/admin/guia?error=nombre');
  const base = slugify(nombre).slice(0, 70) || 'lugar'; let slug = base;
  for (let i = 2; ; i++) { const [d] = await rows(`SELECT 1 FROM guia_lugares WHERE slug=$1`, [slug]); if (!d) break; slug = `${base}-${i}`; }
  const [r] = await rows<{ id: string }>(`INSERT INTO guia_lugares (slug, nombre, categoria, publicado) VALUES ($1,$2,$3,false) RETURNING id`, [slug, nombre, CATEGORIAS.some((c) => c.key === cat) ? cat : 'playa']);
  const p = await buscarEnPlaces(`${nombre} Isla de Margarita`).catch(() => null);
  if (p) await aplicarPlaces(r.id, p);
  regenerar(); redirect(`/admin/guia/${r.id}?creada=1`);
}

export async function refrescarGoogleAction(fd: FormData) {
  await exigirSesion();
  const id = String(fd.get('id') ?? ''); if (!id) redirect('/admin/guia');
  const [l] = await rows<{ nombre: string; municipio: string }>(`SELECT nombre, municipio FROM guia_lugares WHERE id=$1`, [id]);
  const p = l ? await buscarEnPlaces(`${l.nombre} ${l.municipio || 'Isla de Margarita'}`).catch(() => null) : null;
  if (p) await aplicarPlaces(id, p);
  regenerar(); redirect(`/admin/guia/${id}?${p ? 'guardado=1' : 'error=sin-google'}`);
}

export async function subirFotosLugarAction(fd: FormData) {
  await exigirSesion();
  const id = String(fd.get('id') ?? '');
  const archivos = fd.getAll('fotos').filter((f): f is File => f instanceof File && f.size > 0);
  if (!id) redirect('/admin/guia');
  if (!archivos.length) redirect(`/admin/guia/${id}?error=sin-fotos`);
  const [l] = await rows<{ slug: string; nombre: string; fotos: FotoGuia[] }>(`SELECT slug, nombre, fotos FROM guia_lugares WHERE id=$1`, [id]);
  if (!l) redirect('/admin/guia');
  try {
    const nuevas: FotoGuia[] = [];
    for (const [i, a] of archivos.entries()) {
      const path = await guardarFoto(a, l.slug, Date.now() % 1000 + i, 'guia');
      nuevas.push({ path, alt: `${l.nombre}, Isla de Margarita`, credito: 'Foto: Margarita Renace', licencia: 'propia', fuente: 'duena' });
    }
    // Las fotos propias van PRIMERO: son la portada.
    await query(`UPDATE guia_lugares SET fotos = $2, updated_at = now() WHERE id = $1`, [id, JSON.stringify([...nuevas, ...(l.fotos ?? [])])]);
  } catch (e) {
    if (e instanceof FotoInvalidaError) redirect(`/admin/guia/${id}?error=foto-invalida`);
    redirect(`/admin/guia/${id}?error=no-guardado`);
  }
  regenerar(); redirect(`/admin/guia/${id}?guardado=1`);
}

export async function borrarFotoLugarAction(fd: FormData) {
  await exigirSesion();
  const id = String(fd.get('id') ?? ''); const path = String(fd.get('path') ?? '');
  if (!id || !path) redirect('/admin/guia');
  const [l] = await rows<{ fotos: FotoGuia[] }>(`SELECT fotos FROM guia_lugares WHERE id=$1`, [id]);
  const restantes = (l?.fotos ?? []).filter((f) => f.path !== path);
  await query(`UPDATE guia_lugares SET fotos = $2, updated_at = now() WHERE id = $1`, [id, JSON.stringify(restantes)]);
  await borrarArchivoFoto(path).catch(() => {});
  regenerar(); redirect(`/admin/guia/${id}?guardado=1`);
}
