import { RotateCcw } from 'lucide-react';
import { CAMPOS_UI, getAjustes } from '@/lib/settings';
import { Aviso, Campo, Seccion, Tarjeta, ZonaSubida } from '../_ui';
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

const CLAVES_CONTACTO = ['whatsapp', 'email', 'telefono', 'direccion', 'instagram'];

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
  const contacto = CAMPOS_UI.filter((c) => CLAVES_CONTACTO.includes(c.key));
  const textos = CAMPOS_UI.filter(
    (c) => c.tipo === 'texto' && !CLAVES_CONTACTO.includes(c.key),
  );

  const sinWhatsApp = ajustes.whatsapp.trim() === '';

  return (
    <div>
      <header>
        <p className="text-meta font-semibold text-ink-subtle">Sitio público</p>
        <h1 className="mt-2 font-serif text-headline font-normal track-headline text-ink">
          Contenido <em className="headline-italic">de la página</em>
        </h1>
        <p className="mt-4 max-w-2xl text-body text-ink-soft">
          Lo que cambies acá se publica en la web al guardar. No hace falta tocar
          código ni esperar a nadie.
        </p>
      </header>

      {guardado && (
        <Aviso tono="ok">
          Guardado. El sitio público se regenera solo: recarga
          margaritarenace.com.ve para verlo.
        </Aviso>
      )}
      {error && (
        <Aviso tono="error">{MENSAJES[error] ?? MENSAJES['no-guardado']}</Aviso>
      )}

      {sinWhatsApp && (
        <Aviso tono="atencion" titulo="Todavía no hay WhatsApp configurado">
          Los botones de «Reservar» del sitio están apagados porque no hay a
          dónde escribir. En cuanto pongas el número aquí abajo se encienden
          todos, con el mensaje de la propiedad ya escrito para el interesado.
        </Aviso>
      )}

      <Seccion id="imagenes" titulo="Imágenes">
        {imagenes.map((campo) => (
          <Tarjeta key={campo.key} className="overflow-hidden">
            <img
              src={ajustes[campo.key]}
              alt=""
              width={960}
              height={420}
              className="aspect-[21/9] w-full object-cover"
            />
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-body font-semibold text-ink">
                    {campo.label}
                  </p>
                  {campo.ayuda && (
                    <p className="mt-1.5 max-w-xl text-meta text-ink-muted">
                      {campo.ayuda}
                    </p>
                  )}
                </div>
                {/* Solo aparece si hay algo a lo que volver. */}
                {ajustes[campo.key] !== campo.porDefecto && (
                  <form action={restaurarImagenAction}>
                    <input type="hidden" name="clave" value={campo.key} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-control px-3 py-2 text-meta text-ink-muted transition-colors hover:bg-paper hover:text-ink"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Volver a la original
                    </button>
                  </form>
                )}
              </div>

              <p className="mono-data mt-4 truncate text-ink-subtle">
                {ajustes[campo.key]}
              </p>

              <form action={subirImagenSitioAction} className="mt-5">
                <input type="hidden" name="clave" value={campo.key} />
                <ZonaSubida
                  name="imagen"
                  titulo="Cambiar esta imagen"
                  ayuda="Se optimiza sola a WebP. Horizontal y luminosa funciona mejor."
                  etiquetaBoton="Subir imagen"
                />
              </form>
            </div>
          </Tarjeta>
        ))}
      </Seccion>

      {/* Textos y contacto: un solo formulario, un solo botón de guardar. */}
      <form action={guardarContenidoAction}>
        <Seccion
          id="contacto"
          titulo="Cómo te"
          cursiva="contactan"
          descripcion="Deja vacío lo que no tengas: el sitio esconde solo lo que falta, en vez de mostrar un dato inventado."
        >
          <Tarjeta className="space-y-5 p-6">
            {contacto.map((campo) => (
              <Campo
                key={campo.key}
                name={campo.key}
                label={campo.label}
                ayuda={campo.ayuda}
                defaultValue={ajustes[campo.key]}
              />
            ))}
          </Tarjeta>
        </Seccion>

        <Seccion id="textos" titulo="Textos de" cursiva="la portada">
          <Tarjeta className="space-y-5 p-6">
            {textos.map((campo) => (
              <Campo
                key={campo.key}
                name={campo.key}
                label={campo.label}
                ayuda={campo.ayuda}
                defaultValue={ajustes[campo.key]}
              />
            ))}
          </Tarjeta>
        </Seccion>

        <div className="sticky bottom-0 mt-10 -mx-5 flex items-center gap-5 border-t border-line bg-paper/95 px-5 py-4 backdrop-blur-sm md:-mx-10 md:px-10">
          <button type="submit" className="btn-solid">
            Guardar y publicar
          </button>
          <span className="hidden text-meta text-ink-muted sm:block">
            Los cambios salen en la web al instante
          </span>
        </div>
      </form>
    </div>
  );
}
