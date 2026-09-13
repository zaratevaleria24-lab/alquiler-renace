import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCatalogosAdmin, getFotosAdmin, getPropiedadAdmin } from '@/lib/admin';
import { resenasDe } from '@/lib/resenas';
import { ArrowDown, ArrowUp, ArrowUpRight, Check, ChevronLeft, Star, Trash2 } from 'lucide-react';
import { Aviso, Campo, Insignia, Seccion, Selector, ZonaSubida } from '../../_ui';
import PropiedadForm from '../PropiedadForm';
import {
  borrarFotoAction,
  borrarResenaAction,
  crearResenaAction,
  editarAltFotoAction,
  moverFotoAction,
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
  resena: 'La reseña necesita nombre, fecha y al menos una frase.',
  airbnb: 'El enlace de Airbnb debe empezar por https://www.airbnb.com/ (o airbnb.com.ve, .es…).',
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
  const [propiedad, catalogos, fotos, resenas] = await Promise.all([
    getPropiedadAdmin(id),
    getCatalogosAdmin(),
    getFotosAdmin(id),
    resenasDe(id, false),
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

      <Seccion id="resenas" titulo="Reseñas de huéspedes" descripcion={`${resenas.length} ${resenas.length === 1 ? 'reseña' : 'reseñas'}. Solo reales: copiadas de Airbnb (nombre de pila, fecha y texto tal cual) o recibidas por WhatsApp. Nunca inventadas.`}>
          {resenas.length > 0 && (
            <ul className="mb-6 space-y-3">
              {resenas.map((r) => (
                <li key={r.id} className="rounded-card border border-line bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-meta"><b className="text-ink">{r.autor}</b> <span className="text-ink-muted">· {r.fecha} · {r.fuente}{r.puntuacion ? ` · ${'★'.repeat(r.puntuacion)}` : ''}</span></p>
                    <form action={borrarResenaAction}><input type="hidden" name="id" value={propiedad.id} /><input type="hidden" name="resena_id" value={r.id} /><button type="submit" title="Borrar reseña" className="flex h-8 w-8 items-center justify-center rounded-control text-ink-faint hover:text-coral"><Trash2 className="h-4 w-4" /></button></form>
                  </div>
                  <p className="mt-2 text-body leading-relaxed text-ink-soft">{r.texto}</p>
                </li>
              ))}
            </ul>
          )}
          <form action={crearResenaAction} className="grid gap-4 rounded-card border border-line bg-white p-5 md:grid-cols-2">
            <input type="hidden" name="id" value={propiedad.id} />
            <Campo name="autor" label="Nombre del huésped (de pila)" required placeholder="Ej. Joselibeth" />
            <Campo name="fecha" label="Fecha de la reseña" type="date" required />
            <div className="md:col-span-2"><Campo name="texto" label="Texto, tal cual lo escribió" required filas={3} placeholder="Copia y pega la reseña de Airbnb sin cambiar una palabra." /></div>
            <Selector name="puntuacion" label="Estrellas" defaultValue="5" opciones={['5', '4', '3', '2', '1'].map((v) => ({ value: v, label: `${v} ★` }))} />
            <Selector name="fuente" label="Fuente" defaultValue="airbnb" opciones={[{ value: 'airbnb', label: 'Airbnb' }, { value: 'whatsapp', label: 'WhatsApp' }, { value: 'google', label: 'Google' }, { value: 'directo', label: 'Directo' }]} />
            <div className="md:col-span-2"><Campo name="url" label="Enlace a la reseña (opcional)" placeholder="https://www.airbnb.com/rooms/…/reviews" ayuda="Si viene de Airbnb, el enlace al anuncio basta: es la prueba de que existe." /></div>
            <div className="md:col-span-2"><button type="submit" className="btn-solid">Guardar reseña</button></div>
          </form>
        </Seccion>

        <Seccion
        id="fotos"
        titulo="Fotos"
        descripcion={
          fotos.length > 0
            ? `${fotos.length} ${fotos.length === 1 ? 'imagen' : 'imágenes'}. La portada es la que se ve en el listado y al compartir el enlace; las flechas cambian el orden de la galería y el texto de cada foto lo lee Google Imágenes.`
            : undefined
        }
      >
        {fotos.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-3">
            {fotos.map((foto, k) => (
              <li key={foto.id} className="group relative">
                <div className="overflow-hidden rounded-card border border-line bg-white shadow-lift">
                  <div className="relative">
                    <img
                      src={foto.path}
                      alt={foto.alt}
                      width={400}
                      height={250}
                      loading="lazy"
                      className="aspect-video w-full object-cover"
                    />
                    <span className="mono-data absolute left-2 top-2 rounded-chip bg-white/90 px-2 py-0.5 text-ui text-ink">{k + 1}</span>
                    <div className="absolute right-2 top-2 flex gap-1">
                      {k > 0 && <form action={moverFotoAction}><input type="hidden" name="id" value={propiedad.id} /><input type="hidden" name="foto_id" value={foto.id} /><input type="hidden" name="dir" value="arriba" /><button type="submit" title="Mover antes" className="flex h-8 w-8 items-center justify-center rounded-control bg-white/90 text-ink-muted hover:text-brand"><ArrowUp className="h-4 w-4" /><span className="sr-only">Mover antes</span></button></form>}
                      {k < fotos.length - 1 && <form action={moverFotoAction}><input type="hidden" name="id" value={propiedad.id} /><input type="hidden" name="foto_id" value={foto.id} /><input type="hidden" name="dir" value="abajo" /><button type="submit" title="Mover después" className="flex h-8 w-8 items-center justify-center rounded-control bg-white/90 text-ink-muted hover:text-brand"><ArrowDown className="h-4 w-4" /><span className="sr-only">Mover después</span></button></form>}
                    </div>
                  </div>
                  <form action={editarAltFotoAction} className="flex items-center gap-1.5 border-b border-line px-3 py-2">
                    <input type="hidden" name="id" value={propiedad.id} /><input type="hidden" name="foto_id" value={foto.id} />
                    <input name="alt" defaultValue={foto.alt} maxLength={200} placeholder="Qué se ve en la foto (zona, isla)" aria-label="Texto de la foto" className="min-w-0 flex-1 rounded-control border border-line bg-paper px-2 py-1 text-ui" />
                    <button type="submit" title="Guardar texto" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-ink-muted hover:bg-brand-tint hover:text-brand-deep"><Check className="h-4 w-4" /><span className="sr-only">Guardar texto</span></button>
                  </form>
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
