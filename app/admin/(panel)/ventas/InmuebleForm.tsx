import Link from 'next/link';
import type { InmuebleVenta } from '@/lib/ventas';
import { TIPOS } from '@/lib/ventas';
import { Campo, Interruptor, Seccion, Selector, Tarjeta } from '../_ui';

// Formulario compartido por crear y editar un inmueble en venta. Mismo patrón
// que PropiedadForm: Server Component + Server Action, funciona sin JavaScript.
// El precio va SOLO en dólares: bolívares, USDT y euros se calculan en la web
// con la tasa del día (lib/tasas.ts). Guardar bolívares sería guardar un
// número vencido a la semana.

export default function InmuebleForm({
  action, zonas, inmueble,
}: {
  action: (formData: FormData) => Promise<void>;
  zonas: { slug: string; name: string }[];
  inmueble?: InmuebleVenta;
}) {
  return (
    <form action={action}>
      {inmueble && <input type="hidden" name="id" value={inmueble.id} />}

      <Seccion id="identidad" titulo="Identidad">
        <Tarjeta className="space-y-5 p-6">
          <Campo name="titulo" label="Título" required defaultValue={inmueble?.titulo} placeholder="Ej. Apartamento con vista al mar en Costa Azul" />
          <div className="grid gap-5 sm:grid-cols-3">
            <Selector name="tipo" label="Tipo" defaultValue={inmueble?.tipo ?? 'apartamento'} opciones={TIPOS.map((t) => ({ value: t.key, label: t.label }))} />
            <Selector name="zone_slug" label="Zona" defaultValue={inmueble?.zoneSlug} opciones={zonas.map((z) => ({ value: z.slug, label: z.name }))} />
            <Campo name="ubicacion" label="Ubicación visible" defaultValue={inmueble?.ubicacion} placeholder="Ej. Urb. Paraíso II, Porlamar" />
          </div>
          <Campo
            name="descripcion" label="Descripción" filas={7} defaultValue={inmueble?.descripcion}
            ayuda="Qué tiene, en qué estado está, qué hay a 5 minutos y para quién encaja. Si vino de un anuncio, reescribila con tus palabras: el texto copiado no posiciona."
          />
        </Tarjeta>
      </Seccion>

      <Seccion id="precio" titulo="Precio y" cursiva="medidas">
        <Tarjeta className="space-y-6 p-6">
          <div className="grid gap-5 sm:grid-cols-3">
            <Campo name="precio_usd" label="Precio en US$" type="number" min={0} defaultValue={inmueble?.precioUsd ?? 0} ayuda="La web lo muestra también en Bs (mercado y BCV), USDT y euros, con la tasa del día." />
            <Campo name="m2_construccion" label="m² de construcción" type="number" min={0} defaultValue={inmueble?.m2Construccion ?? ''} />
            <Campo name="m2_terreno" label="m² de terreno" type="number" min={0} defaultValue={inmueble?.m2Terreno ?? ''} />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <Campo name="habitaciones" label="Habitaciones" type="number" min={0} max={30} defaultValue={inmueble?.habitaciones ?? ''} />
            <Campo name="banos" label="Baños" type="number" min={0} max={30} defaultValue={inmueble?.banos ?? ''} />
            <Campo name="estacionamientos" label="Puestos de estacionamiento" type="number" min={0} max={30} defaultValue={inmueble?.estacionamientos ?? ''} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo name="latitud" label="Latitud" defaultValue={inmueble?.latitud ?? ''} placeholder="10.97260" ayuda="Del punto en Google Maps (clic derecho → copiar coordenadas). Cinco decimales." />
            <Campo name="longitud" label="Longitud" defaultValue={inmueble?.longitud ?? ''} placeholder="-63.84705" />
          </div>
          <div className="border-t border-line pt-5">
            <Interruptor name="precio_a_consultar" label="Precio a consultar" ayuda="La web mostrará «Consultar precio» y no hará las conversiones." defaultChecked={inmueble?.precioAConsultar ?? false} />
          </div>
        </Tarjeta>
      </Seccion>

      <Seccion id="estado" titulo="Estado">
        <Tarjeta className="p-6">
          <Interruptor name="is_published" label="Publicado en /en-venta" ayuda="Apagado, no aparece en la web pero no se borra. Publicá solo con fotos propias y permiso del dueño." defaultChecked={inmueble?.isPublished ?? false} />
        </Tarjeta>
      </Seccion>

      <div className="sticky bottom-0 mt-10 -mx-5 flex items-center gap-5 border-t border-line bg-paper/95 px-5 py-4 backdrop-blur-sm md:-mx-10 md:px-10">
        <button type="submit" className="btn-solid">{inmueble ? 'Guardar cambios' : 'Crear inmueble'}</button>
        <Link href="/admin/ventas/inmuebles" className="text-body text-ink-muted underline-offset-4 hover:text-ink hover:underline">Cancelar</Link>
      </div>
    </form>
  );
}
