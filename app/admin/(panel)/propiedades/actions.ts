'use server';

// Server Actions del CRUD de propiedades.
//
// ⚠️ CADA ACTION VERIFICA SESIÓN POR SU CUENTA. El guardia del layout protege
// las PÁGINAS, pero una Server Action es un endpoint HTTP propio: se puede
// invocar sin pasar por la página. Sin este chequeo, cualquiera podría mutar
// el inventario con un POST bien formado.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { usuarioActual } from '@/lib/auth';
import { query, rows, withTransaction } from '@/lib/db';
import { FotoInvalidaError, borrarArchivoFoto, guardarFoto } from '@/lib/uploads';

async function exigirSesion(): Promise<void> {
  if (!(await usuarioActual())) redirect('/admin/login');
}

/**
 * Regenera el sitio público tras una edición.
 *
 * El sledgehammer ('/', 'layout') invalida TODAS las páginas bajo el layout
 * raíz: home, landings de zona y páginas de propiedad. Es a propósito: una
 * edición puede tocar varias superficies a la vez (cambiar la zona de una
 * propiedad mueve dos landings y el home), y con 31 páginas estáticas la
 * regeneración perezosa cuesta nada frente al riesgo de dejar una desfasada.
 *
 * LÍMITE CONOCIDO: las rutas dinámicas usan dynamicParams=false, así que un
 * slug NUEVO (propiedad creada, zona que estrena inventario) necesita rebuild
 * (npm run build + pm2 restart). Editar y publicar/despublicar lo existente
 * no lo necesita.
 */
function regenerarSitio(): void {
  revalidatePath('/', 'layout');
  revalidatePath('/sitemap.xml');
}

const asBool = (v: FormDataEntryValue | null) => v === 'on' || v === 'true';

function asIntEnRango(
  v: FormDataEntryValue | null,
  min: number,
  max: number,
  porDefecto: number,
): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return porDefecto;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

export async function guardarPropiedadAction(formData: FormData): Promise<void> {
  await exigirSesion();

  const id = String(formData.get('id') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const zoneSlug = String(formData.get('zone_slug') ?? '');
  const location = String(formData.get('location') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const priceOnRequest = asBool(formData.get('price_on_request'));
  const pricePerNight = priceOnRequest
    ? 0
    : asIntEnRango(formData.get('price_per_night'), 0, 100_000, 0);
  const guestsAdults = asIntEnRango(formData.get('guests_adults'), 1, 50, 2);
  const guestsChildren = asIntEnRango(formData.get('guests_children'), 0, 50, 0);
  const isReal = asBool(formData.get('is_real'));
  const isPublished = asBool(formData.get('is_published'));
  const categorias = formData.getAll('categorias').map(String);
  const amenidades = formData.getAll('amenidades').map(String);

  if (!id || !name || !zoneSlug || !location) {
    redirect(`/propiedades/${id}?error=faltan-datos`);
  }

  // price_text se DERIVA, no se edita: es la única forma de que el texto que ve
  // el visitante y el número con el que filtra el home no se contradigan nunca.
  const priceText = priceOnRequest
    ? 'Consultar precio'
    : `US$${pricePerNight} / noche`;

  try {
    await withTransaction(async (q) => {
      const res = await q(
        `UPDATE properties SET
           name = $2, zone_slug = $3, location = $4, description = $5,
           price_per_night = $6, price_on_request = $7, price_text = $8,
           guests_adults = $9, guests_children = $10,
           is_real = $11, is_published = $12, updated_at = now()
         WHERE id = $1`,
        [
          id, name, zoneSlug, location, description,
          pricePerNight, priceOnRequest, priceText,
          guestsAdults, guestsChildren, isReal, isPublished,
        ],
      );
      if (res.rowCount !== 1) throw new Error('propiedad inexistente');

      // Las relaciones se reescriben completas: es un puñado de filas y evita
      // calcular diferencias. El sort_order preserva el orden de los checkbox.
      await q(`DELETE FROM property_categories WHERE property_id = $1`, [id]);
      for (const key of categorias) {
        await q(
          `INSERT INTO property_categories (property_id, category_key) VALUES ($1, $2)`,
          [id, key],
        );
      }
      await q(`DELETE FROM property_amenities WHERE property_id = $1`, [id]);
      for (const [i, key] of amenidades.entries()) {
        await q(
          `INSERT INTO property_amenities (property_id, amenity_key, sort_order) VALUES ($1, $2, $3)`,
          [id, key, i],
        );
      }
    });
  } catch {
    // Zona/categoría/amenidad inexistente (FK) o id inválido: se vuelve al
    // formulario con aviso, sin tumbar el panel con una pantalla de error.
    redirect(`/propiedades/${id}?error=no-guardado`);
  }

  regenerarSitio();
  redirect('/admin/propiedades?guardado=1');
}

/** Slug para URL: minúsculas sin acentos, guiones, y sufijo -2, -3… si choca
 *  con uno existente. Se genera UNA vez al crear; después no cambia (la URL
 *  pública es estable, ver el comentario del schema). */
async function slugDisponible(nombre: string): Promise<string> {
  const base =
    nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'propiedad';

  for (let n = 0; ; n++) {
    const candidato = n === 0 ? base : `${base}-${n + 1}`;
    const [existe] = await rows(
      `SELECT 1 FROM properties WHERE slug = $1`,
      [candidato],
    );
    if (!existe) return candidato;
  }
}

export async function crearPropiedadAction(formData: FormData): Promise<void> {
  await exigirSesion();

  const name = String(formData.get('name') ?? '').trim();
  const zoneSlug = String(formData.get('zone_slug') ?? '');
  const location = String(formData.get('location') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const priceOnRequest = asBool(formData.get('price_on_request'));
  const pricePerNight = priceOnRequest
    ? 0
    : asIntEnRango(formData.get('price_per_night'), 0, 100_000, 0);
  const guestsAdults = asIntEnRango(formData.get('guests_adults'), 1, 50, 2);
  const guestsChildren = asIntEnRango(formData.get('guests_children'), 0, 50, 0);
  const isReal = asBool(formData.get('is_real'));
  const isPublished = asBool(formData.get('is_published'));
  const categorias = formData.getAll('categorias').map(String);
  const amenidades = formData.getAll('amenidades').map(String);

  if (!name || !zoneSlug || !location) {
    redirect('/admin/propiedades/nueva?error=faltan-datos');
  }

  const priceText = priceOnRequest
    ? 'Consultar precio'
    : `US$${pricePerNight} / noche`;
  const slug = await slugDisponible(name);

  let id = '';
  try {
    id = await withTransaction(async (q) => {
      const res = await q(
        `INSERT INTO properties
           (slug, name, zone_slug, location, description,
            price_per_night, price_on_request, price_text,
            guests_adults, guests_children, is_real, is_published, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
                 (SELECT COALESCE(max(sort_order),0)+1 FROM properties))
         RETURNING id`,
        [
          slug, name, zoneSlug, location, description,
          pricePerNight, priceOnRequest, priceText,
          guestsAdults, guestsChildren, isReal, isPublished,
        ],
      );
      const nuevoId = (res.rows[0] as { id: string }).id;
      for (const key of categorias) {
        await q(
          `INSERT INTO property_categories (property_id, category_key) VALUES ($1, $2)`,
          [nuevoId, key],
        );
      }
      for (const [i, key] of amenidades.entries()) {
        await q(
          `INSERT INTO property_amenities (property_id, amenity_key, sort_order) VALUES ($1, $2, $3)`,
          [nuevoId, key, i],
        );
      }
      return nuevoId;
    });
  } catch {
    redirect('/admin/propiedades/nueva?error=no-guardado');
  }

  regenerarSitio();
  // Directo a la edición: lo primero que necesita una propiedad recién creada
  // son sus fotos, y se suben desde ahí.
  redirect(`/propiedades/${id}?creada=1`);
}

export async function subirFotosAction(formData: FormData): Promise<void> {
  await exigirSesion();

  const id = String(formData.get('id') ?? '');
  const archivos = formData
    .getAll('fotos')
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (!id) redirect('/admin/propiedades');
  if (archivos.length === 0) redirect(`/propiedades/${id}?error=sin-fotos`);

  const [prop] = await rows<{ slug: string; name: string; zone_name: string }>(
    `SELECT p.slug, p.name, z.name AS zone_name
     FROM properties p JOIN zones z ON z.slug = p.zone_slug
     WHERE p.id = $1`,
    [id],
  );
  if (!prop) redirect('/admin/propiedades');

  try {
    for (const [i, archivo] of archivos.entries()) {
      const path = await guardarFoto(archivo, prop.slug, i);
      // La primera foto de una propiedad sin portada queda de portada; el alt
      // sigue la convención del sitio (nombre + zona + isla, por Google Imágenes).
      await query(
        `INSERT INTO property_images (property_id, path, alt, is_cover, sort_order)
         VALUES ($1, $2, $3,
                 NOT EXISTS (SELECT 1 FROM property_images WHERE property_id = $1 AND is_cover),
                 (SELECT COALESCE(max(sort_order),0)+1 FROM property_images WHERE property_id = $1))`,
        [id, path, `${prop.name} — alquiler en ${prop.zone_name}, Isla de Margarita`],
      );
    }
  } catch (err) {
    if (err instanceof FotoInvalidaError) {
      redirect(`/propiedades/${id}?error=foto-invalida`);
    }
    redirect(`/propiedades/${id}?error=no-guardado`);
  }

  regenerarSitio();
  redirect(`/propiedades/${id}?guardado=1`);
}

export async function borrarFotoAction(formData: FormData): Promise<void> {
  await exigirSesion();

  const id = String(formData.get('id') ?? '');
  const fotoId = String(formData.get('foto_id') ?? '');
  if (!id || !fotoId) redirect('/admin/propiedades');

  const [foto] = await rows<{ path: string; is_cover: boolean }>(
    `SELECT path, is_cover FROM property_images WHERE id = $1 AND property_id = $2`,
    [fotoId, id],
  );
  if (foto) {
    await withTransaction(async (q) => {
      await q(`DELETE FROM property_images WHERE id = $1`, [fotoId]);
      if (foto.is_cover) {
        // Se borró la portada: la siguiente foto asciende, para que la
        // propiedad nunca quede publicada sin imagen de portada.
        await q(
          `UPDATE property_images SET is_cover = true
           WHERE id = (SELECT id FROM property_images
                       WHERE property_id = $1 ORDER BY sort_order LIMIT 1)`,
          [id],
        );
      }
    });
    await borrarArchivoFoto(foto.path);
  }

  regenerarSitio();
  redirect(`/propiedades/${id}?guardado=1`);
}

export async function marcarPortadaAction(formData: FormData): Promise<void> {
  await exigirSesion();

  const id = String(formData.get('id') ?? '');
  const fotoId = String(formData.get('foto_id') ?? '');
  if (!id || !fotoId) redirect('/admin/propiedades');

  await withTransaction(async (q) => {
    await q(
      `UPDATE property_images SET is_cover = false WHERE property_id = $1`,
      [id],
    );
    await q(
      `UPDATE property_images SET is_cover = true WHERE id = $1 AND property_id = $2`,
      [fotoId, id],
    );
  });

  regenerarSitio();
  redirect(`/propiedades/${id}?guardado=1`);
}

export async function alternarPublicacionAction(formData: FormData): Promise<void> {
  await exigirSesion();

  const id = String(formData.get('id') ?? '');
  const publicar = asBool(formData.get('publicar'));
  if (!id) redirect('/admin/propiedades');

  await query(
    `UPDATE properties SET is_published = $2, updated_at = now() WHERE id = $1`,
    [id, publicar],
  );

  regenerarSitio();
  redirect('/admin/propiedades');
}
