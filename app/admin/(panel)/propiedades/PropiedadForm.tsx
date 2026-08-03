import Link from 'next/link';
import type { PropiedadEdicion } from '@/lib/admin';
import {
  Campo,
  Chip,
  Interruptor,
  Seccion,
  Selector,
  Tarjeta,
} from '../_ui';

// Formulario compartido por CREAR y EDITAR: un solo lugar donde viven los
// campos, así los dos flujos no se desincronizan. Server Component + Server
// Action: funciona sin JavaScript, como todo el panel.
//
// Categorías y amenidades van como CHIPS y no como casillas: eran treinta
// checkboxes nativos en tres columnas, la parte más anticuada del panel y la más
// incómoda de tocar en un teléfono. Los chips siguen siendo `input` reales
// (ver _ui.tsx), así que el formulario sigue enviándose sin JavaScript.

type Catalogos = {
  zonas: { slug: string; name: string }[];
  categorias: { key: string; label: string }[];
  amenidades: { key: string; name: string }[];
};

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
    <form action={action}>
      {propiedad && <input type="hidden" name="id" value={propiedad.id} />}

      <Seccion id="identidad" titulo="Identidad">
        <Tarjeta className="space-y-5 p-6">
          <Campo
            name="name"
            label="Nombre"
            required
            defaultValue={propiedad?.name}
            placeholder="Ej. Los Geranios B"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Selector
              name="zone_slug"
              label="Zona"
              defaultValue={propiedad?.zoneSlug}
              opciones={catalogos.zonas.map((z) => ({
                value: z.slug,
                label: z.name,
              }))}
            />
            <Campo
              name="location"
              label="Dirección visible"
              required
              defaultValue={propiedad?.location}
              placeholder="Ej. Urb. Maneiro, Pampatar"
            />
          </div>
          <Campo
            name="description"
            label="Descripción"
            filas={5}
            defaultValue={propiedad?.description}
            ayuda="Qué tiene, qué hay cerca y para quién encaja. Tres a cinco líneas."
          />
        </Tarjeta>
      </Seccion>

      <Seccion id="precio" titulo="Precio y" cursiva="capacidad">
        <Tarjeta className="space-y-6 p-6">
          <div className="grid gap-5 sm:grid-cols-3">
            <Campo
              name="price_per_night"
              label="US$ por noche"
              type="number"
              min={0}
              defaultValue={propiedad?.pricePerNight ?? 0}
            />
            <Campo
              name="guests_adults"
              label="Adultos"
              type="number"
              min={1}
              max={50}
              defaultValue={propiedad?.guestsAdults ?? 2}
            />
            <Campo
              name="guests_children"
              label="Niños"
              type="number"
              min={0}
              max={50}
              defaultValue={propiedad?.guestsChildren ?? 0}
            />
          </div>
          <div className="border-t border-line pt-5">
            <Interruptor
              name="price_on_request"
              label="Precio a consultar"
              ayuda="La web mostrará «Consultar precio» y se ignora el monto de arriba."
              defaultChecked={propiedad?.priceOnRequest ?? false}
            />
          </div>
        </Tarjeta>
      </Seccion>

      <Seccion
        id="categorias"
        titulo="Categorías"
        descripcion="Son las claves de los filtros del home, así que la lista es cerrada a propósito."
      >
        <Tarjeta className="p-6">
          <div className="flex flex-wrap gap-2.5">
            {catalogos.categorias.map((c) => (
              <Chip
                key={c.key}
                name="categorias"
                value={c.key}
                label={c.label}
                defaultChecked={propiedad?.categoryKeys.includes(c.key) ?? false}
              />
            ))}
          </div>
        </Tarjeta>
      </Seccion>

      <Seccion
        id="amenidades"
        titulo="Amenidades"
        descripcion="Se muestran con su icono en la ficha del alojamiento."
      >
        <Tarjeta className="p-6">
          <div className="flex flex-wrap gap-2.5">
            {catalogos.amenidades.map((a) => (
              <Chip
                key={a.key}
                name="amenidades"
                value={a.key}
                label={a.name}
                defaultChecked={propiedad?.amenityKeys.includes(a.key) ?? false}
              />
            ))}
          </div>
        </Tarjeta>
      </Seccion>

      <Seccion id="estado" titulo="Estado">
        <Tarjeta className="space-y-5 p-6">
          <Interruptor
            name="is_published"
            label="Publicada en la web"
            ayuda="Apagado, la propiedad no aparece en el sitio pero no se borra."
            defaultChecked={propiedad?.isPublished ?? false}
          />
          <div className="border-t border-line pt-5">
            <Interruptor
              name="is_real"
              label="Inventario real"
              ayuda="Apagado cuenta como listado de relleno y el resumen lo avisa."
              defaultChecked={propiedad?.isReal ?? true}
            />
          </div>
        </Tarjeta>
      </Seccion>

      {/* Barra de acciones pegada abajo: en un formulario largo, tener que
          buscar el botón de guardar al final es de las cosas que más molestan. */}
      <div className="sticky bottom-0 mt-10 -mx-5 flex items-center gap-5 border-t border-line bg-paper/95 px-5 py-4 backdrop-blur-sm md:-mx-10 md:px-10">
        <button type="submit" className="btn-solid">
          {propiedad ? 'Guardar cambios' : 'Crear propiedad'}
        </button>
        <Link
          href="/admin/propiedades"
          className="text-body text-ink-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Cancelar
        </Link>
        {propiedad && (
          <span className="ml-auto hidden text-meta text-ink-muted sm:block">
            Al guardar, la web se regenera sola
          </span>
        )}
      </div>
    </form>
  );
}
