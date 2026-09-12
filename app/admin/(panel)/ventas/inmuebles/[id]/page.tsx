import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight, ChevronLeft, Star, Trash2 } from 'lucide-react';
import { getCatalogosAdmin } from '@/lib/admin';
import { getInmuebleAdmin } from '@/lib/ventas';
import { Aviso, Insignia, Seccion, ZonaSubida } from '../../../_ui';
import InmuebleForm from '../../InmuebleForm';
import { borrarFotoInmuebleAction, guardarInmuebleAction, marcarPortadaInmuebleAction, subirFotosInmuebleAction } from '../../actions';

export const dynamic = 'force-dynamic';

const MENSAJES: Record<string, string> = {
  'faltan-datos': 'Faltan datos obligatorios: título y zona.',
  'sin-fotos': 'No llegó ningún archivo: elegí al menos una foto.',
  'foto-invalida': 'Alguno de los archivos no es una imagen válida o pesa más de 12MB.',
  'no-guardado': 'No se pudo guardar. Revisá los datos e intentá otra vez.',
};

export default async function EditarInmueblePage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; creada?: string; guardado?: string }> }) {
  const [{ id }, { error, creada, guardado }] = await Promise.all([params, searchParams]);
  const [inmueble, { zonas }] = await Promise.all([getInmuebleAdmin(id), getCatalogosAdmin()]);
  if (!inmueble) notFound();

  return (
    <div>
      <nav aria-label="Ruta" className="text-ui">
        <Link href="/admin/ventas/inmuebles" className="inline-flex items-center gap-1.5 text-ink-muted hover:text-brand"><ChevronLeft className="h-4 w-4" /> Inmuebles</Link>
      </nav>
      <header className="mt-5 flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <p className="text-meta font-semibold text-ink-subtle">Editar inmueble</p>
          <h1 className="mt-2 font-serif text-headline font-normal track-headline text-ink">{inmueble.titulo}</h1>
          <a href={`https://margaritarenace.com.ve/en-venta/${inmueble.slug}`} target="_blank" rel="noopener" className="mono-data mt-2.5 inline-flex items-center gap-1.5 text-ink-subtle hover:text-brand">
            /en-venta/{inmueble.slug} <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
        <Insignia tono={inmueble.isPublished ? 'ok' : 'neutro'}>{inmueble.isPublished ? 'publicado' : 'borrador'}</Insignia>
      </header>

      {creada && (
        <Aviso tono="ok">
          Inmueble creado como borrador{inmueble.prospectoFbId ? ' a partir del anuncio de Marketplace' : ''}. Falta lo tuyo:
          fotos propias y una descripción con tus palabras. Publicalo cuando el dueño te haya dado el OK.
        </Aviso>
      )}
      {guardado && <Aviso tono="ok">Cambios guardados. La web se regenera sola.</Aviso>}
      {error && <Aviso tono="error">{MENSAJES[error] ?? MENSAJES['no-guardado']}</Aviso>}

      <Seccion id="fotos" titulo="Fotos" descripcion={inmueble.images.length ? `${inmueble.images.length} imágenes. La portada es la del listado y la que se ve al compartir.` : undefined}>
        {inmueble.images.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-3">
            {inmueble.images.map((foto) => (
              <li key={foto.id} className="group relative">
                <div className="overflow-hidden rounded-card border border-line bg-white shadow-lift">
                  <img src={foto.path} alt={foto.alt} width={400} height={250} loading="lazy" className="aspect-video w-full object-cover" />
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                    {foto.isCover ? (
                      <span className="inline-flex items-center gap-1.5 rounded-chip bg-brand-tint px-2.5 py-1 text-ui font-medium text-brand-deep"><Star className="h-3 w-3 fill-current" /> portada</span>
                    ) : (
                      <form action={marcarPortadaInmuebleAction}>
                        <input type="hidden" name="id" value={inmueble.id} /><input type="hidden" name="foto_id" value={foto.id} />
                        <button type="submit" className="inline-flex items-center gap-1.5 rounded-chip px-2 py-1 text-ui text-ink-muted hover:bg-paper hover:text-brand"><Star className="h-3 w-3" /> hacer portada</button>
                      </form>
                    )}
                    <form action={borrarFotoInmuebleAction}>
                      <input type="hidden" name="id" value={inmueble.id} /><input type="hidden" name="foto_id" value={foto.id} />
                      <button type="submit" title="Borrar foto" className="flex h-8 w-8 items-center justify-center rounded-control text-ink-faint hover:bg-coral/10 hover:text-coral"><Trash2 className="h-4 w-4" /></button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Aviso tono="error">Sin fotos. No publiques sin al menos la principal: un inmueble sin foto se ve roto y nadie escribe.</Aviso>
        )}
        <form action={subirFotosInmuebleAction} className="mt-6">
          <input type="hidden" name="id" value={inmueble.id} />
          <ZonaSubida name="fotos" multiple titulo="Añadir fotos" ayuda="Tus fotos, no las del anuncio de Facebook (caducan y Venezuela las bloquea). Se optimizan solas a WebP." etiquetaBoton="Subir y optimizar" />
        </form>
      </Seccion>

      <div className="mt-4"><InmuebleForm action={guardarInmuebleAction} zonas={zonas} inmueble={inmueble} /></div>
    </div>
  );
}
