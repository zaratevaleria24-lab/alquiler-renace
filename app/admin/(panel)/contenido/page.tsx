import { CAMPOS_UI, getAjustes } from '@/lib/settings';
import {
  guardarContenidoAction,
  restaurarImagenAction,
  subirImagenSitioAction,
} from './actions';

// Contenido del sitio: la foto de portada, los textos del encabezado y los
// datos de contacto. Todo lo que antes obligaba a editar TypeScript.
//
// El WhatsApp va PRIMERO en su propio bloque destacado porque es el dato que
// enciende todos los botones de reservar del sitio: mientras esté vacío, la web
// no tiene ninguna forma de que un interesado escriba.

export const dynamic = 'force-dynamic';

const MENSAJES: Record<string, string> = {
  whatsapp:
    'El WhatsApp debe tener entre 10 y 15 dígitos con el código de país. Ejemplo: 584121234567.',
  email: 'El correo no parece válido.',
  instagram: 'El enlace de Instagram debe empezar por https://',
  'sin-imagen': 'No llegó ningún archivo: elige una imagen antes de subir.',
  'imagen-invalida': 'El archivo no es una imagen válida o pesa más de 12MB.',
  'no-guardado': 'No se pudo guardar. Intenta otra vez.',
};

const inputCls =
  'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-body text-ink focus:outline-none focus:border-ink';
const labelCls = 'block text-micro uppercase font-semibold text-ink-subtle mb-1.5';

export default async function ContenidoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; guardado?: string }>;
}) {
  const [{ error, guardado }, ajustes] = await Promise.all([
    searchParams,
    getAjustes(),
  ]);

  const imagenes = CAMPOS_UI.filter((c) => c.tipo === 'imagen');
  const contacto = CAMPOS_UI.filter((c) =>
    ['whatsapp', 'email', 'telefono', 'direccion', 'instagram'].includes(c.key),
  );
  const textos = CAMPOS_UI.filter(
    (c) =>
      c.tipo === 'texto' &&
      !contacto.some((k) => k.key === c.key),
  );

  const sinWhatsApp = ajustes.whatsapp.trim() === '';

  return (
    <div className="max-w-3xl">
      <header>
        <p className="label-eyebrow text-ink-subtle">Panel</p>
        <h1 className="mt-3 font-serif text-headline font-normal track-headline text-ink">
          Contenido <em className="headline-italic">de la página</em>
        </h1>
        <p className="mt-5 text-body text-ink-soft">
          Lo que cambies acá se publica en la web al guardar: no hace falta tocar
          código ni esperar a nadie.
        </p>
      </header>

      {guardado && (
        <p className="mt-8 rounded-card border border-brand/30 bg-brand-tint px-5 py-4 text-body text-brand-deep">
          Guardado. El sitio público se regenera solo: recarga margaritarenace.com.ve
          para verlo.
        </p>
      )}
      {error && (
        <p className="mt-8 rounded-card border border-coral/35 bg-coral/5 px-5 py-4 text-body text-ink">
          {MENSAJES[error] ?? MENSAJES['no-guardado']}
        </p>
      )}

      {sinWhatsApp && (
        <section className="mt-10 rounded-card border border-coral/35 bg-coral/5 p-6 md:p-7">
          <h2 className="font-serif text-title font-normal track-title text-ink">
            Todavía no hay WhatsApp configurado
          </h2>
          <p className="mt-4 text-body text-ink-soft">
            Los botones de «Reservar» del sitio están desactivados porque no hay
            a dónde escribir. En cuanto pongas el número aquí abajo se encienden
            todos, con el mensaje de la propiedad ya escrito para el interesado.
          </p>
        </section>
      )}

      {/* ── Imágenes ─────────────────────────────────────────────────────── */}
      <section aria-labelledby="imagenes" className="mt-12">
        <h2 id="imagenes" className="label-eyebrow text-ink-subtle">
          Imágenes
        </h2>
        {imagenes.map((campo) => (
          <div
            key={campo.key}
            className="mt-5 overflow-hidden rounded-card border border-line bg-white"
          >
            <img
              src={ajustes[campo.key]}
              alt=""
              width={800}
              height={400}
              className="aspect-[2/1] w-full object-cover"
            />
            <div className="p-5">
              <p className="text-body font-semibold text-ink">{campo.label}</p>
              {campo.ayuda && (
                <p className="mt-1 text-meta text-ink-muted">{campo.ayuda}</p>
              )}
              <p className="mono-data mt-3 truncate text-ink-subtle">
                {ajustes[campo.key]}
              </p>

              <form
                action={subirImagenSitioAction}
                className="mt-4 flex flex-wrap items-center gap-4"
              >
                <input type="hidden" name="clave" value={campo.key} />
                <input
                  type="file"
                  name="imagen"
                  required
                  accept="image/*"
                  className="text-body text-ink-soft file:mr-4 file:rounded-chip file:border file:border-line file:bg-paper file:px-4 file:py-2 file:text-meta file:font-semibold file:text-brand-deep"
                />
                <button type="submit" className="btn-solid">
                  Cambiar imagen
                </button>
              </form>

              {ajustes[campo.key] !== campo.porDefecto && (
                <form action={restaurarImagenAction} className="mt-3">
                  <input type="hidden" name="clave" value={campo.key} />
                  <button
                    type="submit"
                    className="text-meta text-ink-muted underline-offset-4 hover:text-brand hover:underline"
                  >
                    volver a la imagen original
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* ── Textos y contacto: un solo formulario ────────────────────────── */}
      <form action={guardarContenidoAction} className="mt-14 space-y-12">
        <fieldset>
          <legend className="label-eyebrow text-ink-subtle">
            Cómo te contactan
          </legend>
          <p className="mt-2 text-meta text-ink-muted">
            Deja vacío lo que no tengas: el sitio esconde solo lo que falta, en
            vez de mostrar un dato inventado.
          </p>
          <div className="mt-5 space-y-5">
            {contacto.map((campo) => (
              <div key={campo.key}>
                <label htmlFor={campo.key} className={labelCls}>
                  {campo.label}
                </label>
                <input
                  id={campo.key}
                  name={campo.key}
                  defaultValue={ajustes[campo.key]}
                  className={inputCls}
                />
                {campo.ayuda && (
                  <p className="mt-1.5 text-meta text-ink-muted">{campo.ayuda}</p>
                )}
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="label-eyebrow text-ink-subtle">
            Textos de la portada
          </legend>
          <div className="mt-5 space-y-5">
            {textos.map((campo) => (
              <div key={campo.key}>
                <label htmlFor={campo.key} className={labelCls}>
                  {campo.label}
                </label>
                <input
                  id={campo.key}
                  name={campo.key}
                  defaultValue={ajustes[campo.key]}
                  className={inputCls}
                />
                {campo.ayuda && (
                  <p className="mt-1.5 text-meta text-ink-muted">{campo.ayuda}</p>
                )}
              </div>
            ))}
          </div>
        </fieldset>

        <div className="border-t border-line pt-8">
          <button type="submit" className="btn-solid">
            Guardar y publicar
          </button>
        </div>
      </form>
    </div>
  );
}
