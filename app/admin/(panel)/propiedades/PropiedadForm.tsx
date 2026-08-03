import Link from 'next/link';
import type { PropiedadEdicion } from '@/lib/admin';

// Formulario compartido por CREAR y EDITAR: un solo lugar donde viven los
// campos, así los dos flujos no se desincronizan. Server Component + Server
// Action: funciona sin JavaScript, como todo el panel.

type Catalogos = {
  zonas: { slug: string; name: string }[];
  categorias: { key: string; label: string }[];
  amenidades: { key: string; name: string }[];
};

const inputCls =
  'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-body text-ink focus:outline-none focus:border-ink';
const labelCls = 'block text-micro uppercase font-semibold text-ink-subtle mb-1.5';

export default function PropiedadForm({
  action,
  catalogos,
  propiedad,
}: {
  action: (formData: FormData) => Promise<void>;
  catalogos: Catalogos;
  /** Sin propiedad = formulario de alta con valores por defecto. */
  propiedad?: PropiedadEdicion;
}) {
  return (
    <form action={action} className="mt-10 space-y-10">
      {propiedad && <input type="hidden" name="id" value={propiedad.id} />}

      <fieldset className="space-y-5">
        <legend className="label-eyebrow text-ink-subtle">Identidad</legend>
        <div>
          <label htmlFor="name" className={labelCls}>Nombre</label>
          <input
            id="name"
            name="name"
            required
            defaultValue={propiedad?.name}
            placeholder="Ej. Los Geranios B"
            className={inputCls}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="zone_slug" className={labelCls}>Zona</label>
            <select
              id="zone_slug"
              name="zone_slug"
              defaultValue={propiedad?.zoneSlug}
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
              defaultValue={propiedad?.location}
              placeholder="Ej. Urb. Maneiro, Pampatar, Margarita"
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
            defaultValue={propiedad?.description}
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
              defaultValue={propiedad?.pricePerNight ?? 0}
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
              defaultValue={propiedad?.guestsAdults ?? 2}
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
              defaultValue={propiedad?.guestsChildren ?? 0}
              className={inputCls}
            />
          </div>
        </div>
        <label className="flex items-start gap-3 text-body text-ink-soft">
          <input
            type="checkbox"
            name="price_on_request"
            defaultChecked={propiedad?.priceOnRequest ?? false}
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
                  defaultChecked={propiedad?.categoryKeys.includes(c.key) ?? false}
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
                  defaultChecked={propiedad?.amenityKeys.includes(a.key) ?? false}
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
            defaultChecked={propiedad?.isPublished ?? false}
            className="mt-1 h-4 w-4 accent-[#0E7490]"
          />
          <span>
            Publicada
            <span className="block text-meta text-ink-muted">
              Sin marcar, la propiedad no aparece en la web (queda en borrador).
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3 text-body text-ink-soft">
          <input
            type="checkbox"
            name="is_real"
            defaultChecked={propiedad?.isReal ?? true}
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
          {propiedad ? 'Guardar y regenerar el sitio' : 'Crear propiedad'}
        </button>
        <Link
          href="/propiedades"
          className="text-body text-ink-muted underline-offset-4 hover:underline"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
