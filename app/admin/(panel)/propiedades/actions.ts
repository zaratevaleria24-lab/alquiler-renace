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
import { query, withTransaction } from '@/lib/db';

async function exigirSesion(): Promise<void> {
  if (!(await usuarioActual())) redirect('/login');
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
  redirect('/propiedades?guardado=1');
}

export async function alternarPublicacionAction(formData: FormData): Promise<void> {
  await exigirSesion();

  const id = String(formData.get('id') ?? '');
  const publicar = asBool(formData.get('publicar'));
  if (!id) redirect('/propiedades');

  await query(
    `UPDATE properties SET is_published = $2, updated_at = now() WHERE id = $1`,
    [id, publicar],
  );

  regenerarSitio();
  redirect('/propiedades');
}
