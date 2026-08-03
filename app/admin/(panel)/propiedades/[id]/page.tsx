import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCatalogosAdmin, getPropiedadAdmin } from '@/lib/admin';
import { guardarPropiedadAction } from '../actions';

// Edición de una propiedad. Formulario HTML puro con Server Action, como el
// login: si la hidratación falla o tarda —conexiones de Venezuela—, el guardado
// sigue funcionando como un POST normal.
//
// Lo que NO se edita acá, a propósito:
//   · slug — la URL pública es estable; renombrar la propiedad no la rompe.
//   · rating — solo debe existir con reseñas reales (regla de SEO.md). Un campo
//     editable invita a inventarlo.
//   · price_text — se deriva del precio en la action, para que el texto visible
//     y el número de filtrado no se contradigan nunca.
//   · fotos — llegan con la subida de imágenes (siguiente paso del plan).

export const dynamic = 'force-dynamic';

const inputCls =
  'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-body text-ink focus:outline-none focus:border-ink';
const labelCls = 'block text-micro uppercase font-semibold text-ink-subtle mb-1.5';

export default async function EditarPropiedadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const [propiedad, catalogos] = await Promise.all([
    getPropiedadAdmin(id),
    getCatalogosAdmin(),
  ]);
  if (!propiedad) notFound();

  return (
    <div className="max-w-3xl">
      <nav aria-label="Ruta" className="text-ui text-ink-muted">
        <Link href="/propiedades" className="underline-offset-4 hover:underline">
          ← Propiedades
        </Link>
      </nav>

      <header className="mt-6">
        <p className="label-eyebrow text-ink-subtle">Editar propiedad</p>
        <h1 className="mt-3 font-serif text-headline font-normal track-headline text-ink">
          {propiedad.name}
        </h1>
        <p className="mono-data mt-3 text-ink-subtle">
          margaritarenace.com.ve/propiedad/{propiedad.slug}
        </p>
      </header>

      {error && (
        <p className="mt-8 rounded-card border border-coral/35 bg-coral/5 px-5 py-4 text-body text-ink">
          {error === 'faltan-datos'
            ? 'Faltan datos obligatorios: nombre, zona y dirección no pueden quedar vacíos.'
            : 'No se pudo guardar. Revisa los datos e intenta otra vez.'}
        </p>
      )}

      <form action={guardarPropiedadAction} className="mt-10 space-y-10">
        <input type="hidden" name="id" value={propiedad.id} />

        <fieldset className="space-y-5">
          <legend className="label-eyebrow text-ink-subtle">Identidad</legend>
          <div>
            <label htmlFor="name" className={labelCls}>Nombre</label>
            <input
              id="name"
              name="name"
              required
              defaultValue={propiedad.name}
              className={inputCls}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="zone_slug" className={labelCls}>Zona</label>
              <select
                id="zone_slug"
                name="zone_slug"
                defaultValue={propiedad.zoneSlug}
                className={inputCls}
              >
                {catalogos.zonas.map((z) => (
                  <option key={z.slug} value={z.slug}>{z.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="location" className={labelCls}>Dirección visible</label>
              <input
                id="location"
                name="location"
                required
                defaultValue={propiedad.location}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label htmlFor="description" className={labelCls}>Descripción</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={propiedad.description}
              className={inputCls}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="label-eyebrow text-ink-subtle">Precio y capacidad</legend>
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="price_per_night" className={labelCls}>US$ por noche</label>
              <input
                id="price_per_night"
                name="price_per_night"
                type="number"
                min={0}
                step={1}
                defaultValue={propiedad.pricePerNight}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="guests_adults" className={labelCls}>Adultos</label>
              <input
                id="guests_adults"
                name="guests_adults"
                type="number"
                min={1}
                max={50}
                defaultValue={propiedad.guestsAdults}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="guests_children" className={labelCls}>Niños</label>
              <input
                id="guests_children"
                name="guests_children"
                type="number"
                min={0}
                max={50}
                defaultValue={propiedad.guestsChildren}
                className={inputCls}
              />
            </div>
          </div>
          <label className="flex items-start gap-3 text-body text-ink-soft">
            <input
              type="checkbox"
              name="price_on_request"
              defaultChecked={propiedad.priceOnRequest}
              className="mt-1 h-4 w-4 accent-[#0E7490]"
            />
            <span>
              Precio a consultar
              <span className="block text-meta text-ink-muted">
                La web mostrará «Consultar precio» y se ignora el monto de arriba.
              </span>
            </span>
          </label>
        </fieldset>

        <fieldset>
          <legend className="label-eyebrow text-ink-subtle">Categorías</legend>
          <p className="mt-2 text-meta text-ink-muted">
            Son las claves de los filtros del home: selección cerrada a propósito.
          </p>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-3">
            {catalogos.categorias.map((c) => (
              <li key={c.key}>
                <label className="flex items-center gap-2.5 text-body text-ink-soft">
                  <input
                    type="checkbox"
                    name="categorias"
                    value={c.key}
                    defaultChecked={propiedad.categoryKeys.includes(c.key)}
                    className="h-4 w-4 accent-[#0E7490]"
                  />
                  {c.label}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        <fieldset>
          <legend className="label-eyebrow text-ink-subtle">Amenidades</legend>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-3">
            {catalogos.amenidades.map((a) => (
              <li key={a.key}>
                <label className="flex items-center gap-2.5 text-body text-ink-soft">
                  <input
                    type="checkbox"
                    name="amenidades"
                    value={a.key}
                    defaultChecked={propiedad.amenityKeys.includes(a.key)}
                    className="h-4 w-4 accent-[#0E7490]"
                  />
                  {a.name}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="label-eyebrow text-ink-subtle">Estado</legend>
          <label className="flex items-start gap-3 text-body text-ink-soft">
            <input
              type="checkbox"
              name="is_published"
              defaultChecked={propiedad.isPublished}
              className="mt-1 h-4 w-4 accent-[#0E7490]"
            />
            <span>
              Publicada
              <span className="block text-meta text-ink-muted">
                Sin marcar, la propiedad desaparece de la web pero no se borra.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 text-body text-ink-soft">
            <input
              type="checkbox"
              name="is_real"
              defaultChecked={propiedad.isReal}
              className="mt-1 h-4 w-4 accent-[#0E7490]"
            />
            <span>
              Inventario real
              <span className="block text-meta text-ink-muted">
                Sin marcar cuenta como listado de relleno y el resumen lo avisa.
              </span>
            </span>
          </label>
        </fieldset>

        <div className="flex items-center gap-5 border-t border-line pt-8">
          <button type="submit" className="btn-solid">
            Guardar y regenerar el sitio
          </button>
          <Link
            href="/propiedades"
            className="text-body text-ink-muted underline-offset-4 hover:underline"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
