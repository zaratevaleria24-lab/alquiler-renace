'use server';

// Server Actions de «En venta»: prospectos de Marketplace e inmuebles propios.
// Igual que en propiedades/actions.ts: CADA action verifica sesión por su
// cuenta, porque una Server Action es un endpoint HTTP que se puede invocar
// sin pasar por la página.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { usuarioActual } from '@/lib/auth';
import { query, rows } from '@/lib/db';
import { FotoInvalidaError, borrarArchivoFoto, guardarFoto } from '@/lib/uploads';
import { slugify } from '@/lib/listings';
import {
  alternarPublicadoProspecto, buscarEnMarketplace, cambiarEstadoProspecto, captarProspecto,
  type EstadoProspecto, type TipoInmueble,
} from '@/lib/ventas';

async function exigirSesion(): Promise<void> {
  if (!(await usuarioActual())) redirect('/admin/login');
}
function regenerar(): void {
  revalidatePath('/en-venta', 'layout');
  revalidatePath('/', 'layout');
  revalidatePath('/sitemap.xml');
}
const asBool = (v: FormDataEntryValue | null) => v === 'on' || v === 'true';
const asIntONull = (v: FormDataEntryValue | null): number | null => {
  const s = String(v ?? '').trim();
  if (!s) return null;
  const n = Math.trunc(Number(s));
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const asFloatONull = (v: FormDataEntryValue | null): number | null => {
  const s = String(v ?? '').trim().replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

// ── Prospectos ──────────────────────────────────────────────────────────────

export async function buscarProspectosAction(formData: FormData): Promise<void> {
  await exigirSesion();
  const limite = Math.min(60, Math.max(5, Number(formData.get('limite')) || 20));
  try {
    const c = await buscarEnMarketplace(limite, true);
    redirect(`/admin/ventas?corrida=${c.traidos}:${c.nuevos}:${c.costoUsd ?? ''}`);
  } catch (e) {
    // redirect() lanza internamente: hay que dejarlo pasar.
    if ((e as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw e;
    redirect(`/admin/ventas?error=${encodeURIComponent((e as Error).message.slice(0, 160))}`);
  }
}

export async function estadoProspectoAction(formData: FormData): Promise<void> {
  await exigirSesion();
  const fbId = String(formData.get('fb_id') ?? '');
  const estado = String(formData.get('estado') ?? '') as EstadoProspecto;
  const notas = formData.has('notas') ? String(formData.get('notas') ?? '').slice(0, 2000) : undefined;
  const filtro = String(formData.get('filtro') ?? 'todos');
  if (!fbId || !['nuevo', 'contactado', 'descartado', 'captado'].includes(estado)) redirect('/admin/ventas');
  if (estado === 'captado') {
    const id = await captarProspecto(fbId);
    redirect(`/admin/ventas/inmuebles/${id}?creada=1`);
  }
  await cambiarEstadoProspecto(fbId, estado, notas);
  redirect(`/admin/ventas?estado=${filtro}&guardado=1#p-${fbId}`);
}

export async function publicadoProspectoAction(formData: FormData): Promise<void> {
  await exigirSesion();
  const fbId = String(formData.get('fb_id') ?? '');
  const filtro = String(formData.get('filtro') ?? 'todos');
  if (!fbId) redirect('/admin/ventas');
  await alternarPublicadoProspecto(fbId, asBool(formData.get('publicar')));
  regenerar();
  redirect(`/admin/ventas?estado=${filtro}&guardado=1#p-${fbId}`);
}

// ── Inmuebles ───────────────────────────────────────────────────────────────

function leerInmueble(formData: FormData) {
  const tipo = String(formData.get('tipo') ?? 'apartamento') as TipoInmueble;
  return {
    titulo: String(formData.get('titulo') ?? '').trim().slice(0, 120),
    tipo: (['apartamento', 'casa', 'terreno', 'local'] as const).includes(tipo) ? tipo : 'apartamento',
    zoneSlug: String(formData.get('zone_slug') ?? '').trim(),
    ubicacion: String(formData.get('ubicacion') ?? '').trim().slice(0, 200),
    descripcion: String(formData.get('descripcion') ?? '').trim().slice(0, 6000),
    precioUsd: asIntONull(formData.get('precio_usd')) ?? 0,
    precioAConsultar: asBool(formData.get('precio_a_consultar')),
    m2Construccion: asIntONull(formData.get('m2_construccion')),
    m2Terreno: asIntONull(formData.get('m2_terreno')),
    habitaciones: asIntONull(formData.get('habitaciones')),
    banos: asIntONull(formData.get('banos')),
    estacionamientos: asIntONull(formData.get('estacionamientos')),
    latitud: asFloatONull(formData.get('latitud')),
    longitud: asFloatONull(formData.get('longitud')),
    isPublished: asBool(formData.get('is_published')),
  };
}

export async function crearInmuebleAction(formData: FormData): Promise<void> {
  await exigirSesion();
  const d = leerInmueble(formData);
  if (!d.titulo || !d.zoneSlug) redirect('/admin/ventas/inmuebles/nuevo?error=faltan-datos');
  const base = slugify(d.titulo).slice(0, 60) || 'inmueble';
  let slug = base;
  for (let i = 2; ; i++) {
    const [dup] = await rows(`SELECT 1 FROM inmuebles_venta WHERE slug = $1`, [slug]);
    if (!dup) break;
    slug = `${base}-${i}`;
  }
  const [r] = await rows<{ id: string }>(
    `INSERT INTO inmuebles_venta (slug, titulo, tipo, zone_slug, ubicacion, descripcion, precio_usd, precio_a_consultar,
       m2_construccion, m2_terreno, habitaciones, banos, estacionamientos, latitud, longitud, is_published)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
    [slug, d.titulo, d.tipo, d.zoneSlug, d.ubicacion, d.descripcion, d.precioUsd, d.precioAConsultar,
     d.m2Construccion, d.m2Terreno, d.habitaciones, d.banos, d.estacionamientos, d.latitud, d.longitud, d.isPublished],
  );
  regenerar();
  redirect(`/admin/ventas/inmuebles/${r.id}?creada=1`);
}

export async function guardarInmuebleAction(formData: FormData): Promise<void> {
  await exigirSesion();
  const id = String(formData.get('id') ?? '');
  const d = leerInmueble(formData);
  if (!id) redirect('/admin/ventas/inmuebles');
  if (!d.titulo || !d.zoneSlug) redirect(`/admin/ventas/inmuebles/${id}?error=faltan-datos`);
  await query(
    `UPDATE inmuebles_venta SET titulo=$2, tipo=$3, zone_slug=$4, ubicacion=$5, descripcion=$6, precio_usd=$7,
       precio_a_consultar=$8, m2_construccion=$9, m2_terreno=$10, habitaciones=$11, banos=$12, estacionamientos=$13,
       latitud=$14, longitud=$15, is_published=$16, updated_at=now() WHERE id=$1`,
    [id, d.titulo, d.tipo, d.zoneSlug, d.ubicacion, d.descripcion, d.precioUsd, d.precioAConsultar,
     d.m2Construccion, d.m2Terreno, d.habitaciones, d.banos, d.estacionamientos, d.latitud, d.longitud, d.isPublished],
  );
  regenerar();
  redirect(`/admin/ventas/inmuebles/${id}?guardado=1`);
}

export async function alternarPublicacionInmuebleAction(formData: FormData): Promise<void> {
  await exigirSesion();
  const id = String(formData.get('id') ?? '');
  if (!id) redirect('/admin/ventas/inmuebles');
  await query(`UPDATE inmuebles_venta SET is_published = $2, updated_at = now() WHERE id = $1`, [id, asBool(formData.get('publicar'))]);
  regenerar();
  redirect('/admin/ventas/inmuebles');
}

export async function subirFotosInmuebleAction(formData: FormData): Promise<void> {
  await exigirSesion();
  const id = String(formData.get('id') ?? '');
  const archivos = formData.getAll('fotos').filter((f): f is File => f instanceof File && f.size > 0);
  if (!id) redirect('/admin/ventas/inmuebles');
  if (archivos.length === 0) redirect(`/admin/ventas/inmuebles/${id}?error=sin-fotos`);
  const [inm] = await rows<{ slug: string; titulo: string; zone_name: string }>(
    `SELECT i.slug, i.titulo, z.name AS zone_name FROM inmuebles_venta i JOIN zones z ON z.slug = i.zone_slug WHERE i.id = $1`, [id]);
  if (!inm) redirect('/admin/ventas/inmuebles');
  try {
    for (const [i, archivo] of archivos.entries()) {
      // Carpeta propia por inmueble, separada de los alojamientos.
      const path = await guardarFoto(archivo, `venta-${inm.slug}`, i);
      await query(
        `INSERT INTO inmuebles_venta_images (inmueble_id, path, alt, is_cover, sort_order)
         VALUES ($1, $2, $3,
           NOT EXISTS (SELECT 1 FROM inmuebles_venta_images WHERE inmueble_id = $1 AND is_cover),
           COALESCE((SELECT max(sort_order) + 1 FROM inmuebles_venta_images WHERE inmueble_id = $1), 0))`,
        [id, path, `${inm.titulo} — en venta en ${inm.zone_name}, Isla de Margarita`],
      );
    }
  } catch (e) {
    if (e instanceof FotoInvalidaError) redirect(`/admin/ventas/inmuebles/${id}?error=foto-invalida`);
    redirect(`/admin/ventas/inmuebles/${id}?error=no-guardado`);
  }
  regenerar();
  redirect(`/admin/ventas/inmuebles/${id}?guardado=1`);
}

export async function borrarFotoInmuebleAction(formData: FormData): Promise<void> {
  await exigirSesion();
  const id = String(formData.get('id') ?? ''); const fotoId = String(formData.get('foto_id') ?? '');
  if (!id || !fotoId) redirect('/admin/ventas/inmuebles');
  const [f] = await rows<{ path: string; is_cover: boolean }>(
    `DELETE FROM inmuebles_venta_images WHERE id = $1 AND inmueble_id = $2 RETURNING path, is_cover`, [fotoId, id]);
  if (f) {
    await borrarArchivoFoto(f.path);
    if (f.is_cover) {
      await query(`UPDATE inmuebles_venta_images SET is_cover = true WHERE id =
        (SELECT id FROM inmuebles_venta_images WHERE inmueble_id = $1 ORDER BY sort_order LIMIT 1)`, [id]);
    }
  }
  regenerar();
  redirect(`/admin/ventas/inmuebles/${id}?guardado=1`);
}

export async function marcarPortadaInmuebleAction(formData: FormData): Promise<void> {
  await exigirSesion();
  const id = String(formData.get('id') ?? ''); const fotoId = String(formData.get('foto_id') ?? '');
  if (!id || !fotoId) redirect('/admin/ventas/inmuebles');
  await query(`UPDATE inmuebles_venta_images SET is_cover = false WHERE inmueble_id = $1`, [id]);
  await query(`UPDATE inmuebles_venta_images SET is_cover = true WHERE id = $1 AND inmueble_id = $2`, [fotoId, id]);
  regenerar();
  redirect(`/admin/ventas/inmuebles/${id}?guardado=1`);
}
