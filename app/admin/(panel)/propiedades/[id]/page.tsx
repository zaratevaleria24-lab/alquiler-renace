import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCatalogosAdmin, getFotosAdmin, getPropiedadAdmin } from '@/lib/admin';
import { ArrowUpRight, ChevronLeft, Star, Trash2 } from 'lucide-react';
import { Aviso, Insignia, Seccion, ZonaSubida } from '../../_ui';
import PropiedadForm from '../PropiedadForm';
import {
  borrarFotoAction,
  guardarPropiedadAction,
  marcarPortadaAction,
  subirFotosAction,
} from '../actions';

// Edición de una propiedad: el formulario compartido (PropiedadForm) más la
// gestión de fotos, que solo existe acá — una propiedad recién creada llega a
// esta página justamente para recibir sus fotos.
//
// Lo que NO se edita, a propósito:
//   · slug — la URL pública es estable; renombrar la propiedad no la rompe.
//   · rating — solo debe existir con reseñas reales (regla de SEO.md). Un campo
//     editable invita a inventarlo.
//   · price_text — se deriva del precio en la action, para que el texto visible
//     y el número de filtrado no se contradigan nunca.

export const dynamic = 'force-dynamic';

const MENSAJES: Record<string, string> = {
  'faltan-datos':
    'Faltan datos obligatorios: nombre, zona y dirección no pueden quedar vacíos.',
  'sin-fotos': 'No llegó ningún archivo: elige al menos una foto antes de subir.',
  'foto-invalida':
    'Alguno de los archivos no es una imagen válida o pesa más de 12MB.',
  'no-guardado': 'No se pudo guardar. Revisa los datos e intenta otra vez.',
};

export default async function EditarPropiedadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; creada?: string; guardado?: string }>;
}) {
  const [{ id }, { error, creada, guardado }] = await Promise.all([
    params,
    searchParams,
  ]);
  const [propiedad, catalogos, fotos] = await Promise.all([
    getPropiedadAdmin(id),
    getCatalogosAdmin(),
    getFotosAdmin(id),
  ]);
  if (!propiedad) notFound();

  return (
    <div>
      <nav aria-label="Ruta" className="text-ui">
        <Link
          href="/admin/propiedades"
          className="inline-flex items-center gap-1.5 text-ink-muted transition-colors hover:text-brand"
        >
          <ChevronLeft className="h-4 w-4" />
          Propiedades
        </Link>
      </nav>

      <header className="mt-5 flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <p className="text-meta font-semibold text-ink-subtle">
            Editar propiedad
          </p>
          <h1 className="mt-2 font-serif text-headline font-normal track-headline text-ink">
            {propiedad.name}
          </h1>
          {/* La dirección pública, pulsable: es la comprobación más rápida de
              que un cambio salió bien. */}
          <a
            href={`https://margaritarenace.com.ve/propiedad/${propiedad.slug}`}
            target="_blank"
            rel="noopener"
            className="mono-data mt-2.5 inline-flex items-center gap-1.5 text-ink-subtle transition-colors hover:text-brand"
          >
            /propiedad/{propiedad.slug}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
        <Insignia tono={propiedad.isPublished ? 'ok' : 'neutro'}>
          {propiedad.isPublished ? 'publicada' : 'borrador'}
        </Insignia>
      </header>

      {creada && (
        <Aviso tono="ok">
          Propiedad creada{propiedad.isPublished ? ' y publicada' : ' como borrador'}.
          El siguiente paso son las fotos, aquí abajo.
        </Aviso>
      )}
      {guardado && (
        <Aviso tono="ok">Cambios guardados. El sitio público se regenera solo.</Aviso>
      )}
      {error && (
        <Aviso tono="error">{MENSAJES[error] ?? MENSAJES['no-guardado']}</Aviso>
      )}

      <Seccion
        id="fotos"
        titulo="Fotos"
        descripcion={
          fotos.length > 0
            ? `${fotos.length} ${fotos.length === 1 ? 'imagen' : 'imágenes'}. La portada es la que se ve en el listado y al compartir el enlace.`
            : undefined
        }
      >
        {fotos.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-3">
            {fotos.map((foto) => (
              <li key={foto.id} className="group relative">
                <div className="overflow-hidden rounded-card border border-line bg-white shadow-lift">
                  <img
                    src={foto.path}
                    alt={foto.alt}
                    width={400}
                    height={250}
                    loading="lazy"
                    className="aspect-video w-full object-cover"
                  />
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                    {foto.isCover ? (
                      <span className="inline-flex items-center gap-1.5 rounded-chip bg-brand-tint px-2.5 py-1 text-ui font-medium text-brand-deep">
                        <Star className="h-3 w-3 fill-current" />
                        portada
                      </span>
                    ) : (
                      <form action={marcarPortadaAction}>
                        <input type="hidden" name="id" value={propiedad.id} />
                        <input type="hidden" name="foto_id" value={foto.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-chip px-2 py-1 text-ui text-ink-muted transition-colors hover:bg-paper hover:text-brand"
                        >
                          <Star className="h-3 w-3" />
                          hacer portada
                        </button>
                      </form>
                    )}
                    <form action={borrarFotoAction}>
                      <input type="hidden" name="id" value={propiedad.id} />
                      <input type="hidden" name="foto_id" value={foto.id} />
                      <button
                        type="submit"
                        title="Borrar foto"
                        className="flex h-8 w-8 items-center justify-center rounded-control text-ink-faint transition-colors hover:bg-coral/10 hover:text-coral"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Borrar esta foto</span>
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Aviso tono="error">
            Sin fotos todavía. Una propiedad publicada sin foto se ve rota en la
            web: sube al menos la principal antes de publicar.
          </Aviso>
        )}

        <form action={subirFotosAction} className="mt-6">
          <input type="hidden" name="id" value={propiedad.id} />
          <ZonaSubida
            name="fotos"
            multiple
            titulo="Añadir fotos"
            ayuda="Se optimizan solas a WebP, máximo 1600px de ancho. Horizontales y con luz de día funcionan mejor."
            etiquetaBoton="Subir y optimizar"
          />
        </form>
      </Seccion>

      <div className="mt-4">
        <PropiedadForm
          action={guardarPropiedadAction}
          catalogos={catalogos}
          propiedad={propiedad}
        />
      </div>
    </div>
  );
}
