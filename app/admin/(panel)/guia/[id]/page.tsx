import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight, ChevronLeft, RefreshCw, Trash2 } from 'lucide-react';
import { CATEGORIAS, getLugarAdmin } from '@/lib/guia';
import { Aviso, Campo, Insignia, Interruptor, Seccion, Selector, Tarjeta, ZonaSubida } from '../../_ui';
import { borrarFotoLugarAction, guardarLugarAction, refrescarGoogleAction, subirFotosLugarAction } from '../actions';

export const dynamic = 'force-dynamic';
const MENSAJES: Record<string, string> = {
  'faltan-datos': 'Nombre y categoría son obligatorios.', 'sin-fotos': 'Elige al menos una foto.', 'foto-invalida': 'Alguna foto no es válida o pesa más de 12MB.',
  'no-guardado': 'No se pudo guardar.', 'sin-google': 'Google no encontró ese lugar. Prueba ajustar el nombre o el municipio.',
};

export default async function EditarLugarPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; creada?: string; guardado?: string }> }) {
  const [{ id }, { error, creada, guardado }] = await Promise.all([params, searchParams]);
  const l = await getLugarAdmin(id);
  if (!l) notFound();
  return (
    <div>
      <nav aria-label="Ruta" className="text-ui"><Link href="/admin/guia" className="inline-flex items-center gap-1.5 text-ink-muted hover:text-brand"><ChevronLeft className="h-4 w-4" /> Guía</Link></nav>
      <header className="mt-5 flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <p className="text-meta font-semibold text-ink-subtle">Editar lugar</p>
          <h1 className="mt-2 font-serif text-headline font-normal track-headline text-ink">{l.nombre}</h1>
          <a href={`https://margaritarenace.com.ve/guia/${l.slug}`} target="_blank" rel="noopener" className="mono-data mt-2.5 inline-flex items-center gap-1.5 text-ink-subtle hover:text-brand">/guia/{l.slug} <ArrowUpRight className="h-3.5 w-3.5" /></a>
        </div>
        <Insignia tono={l.publicado ? 'ok' : 'neutro'}>{l.publicado ? 'publicado' : 'borrador'}</Insignia>
      </header>
      {creada && <Aviso tono="ok">Lugar creado como borrador{l.googlePlaceId ? ' con los datos de Google' : ''}. Escribí la descripción y el consejo, sube fotos y publicalo.</Aviso>}
      {guardado && <Aviso tono="ok">Guardado. La guía pública se regenera sola.</Aviso>}
      {error && <Aviso tono="error">{MENSAJES[error] ?? MENSAJES['no-guardado']}</Aviso>}

      <Seccion id="google" titulo="Datos de" cursiva="Google" descripcion={l.datosActualizados ? `Actualizados el ${new Date(l.datosActualizados).toLocaleDateString('es-VE')}. Google pide refrescarlos al menos cada 30 días.` : 'Sin datos de Google todavía.'}>
        <Tarjeta className="flex flex-wrap items-center gap-5 p-5 text-meta text-ink-soft">
          <span>★ {l.rating ?? '—'} ({l.resenas ?? 0} reseñas)</span><span>{l.direccion || 'sin dirección'}</span><span>{l.telefono ?? 'sin teléfono'}</span><span>{l.horario?.length ? `${l.horario.length} días de horario` : 'sin horario'}</span><span>{l.fotosGoogle.length} fotos de Google</span>
          <form action={refrescarGoogleAction} className="ml-auto"><input type="hidden" name="id" value={l.id} /><button type="submit" className="inline-flex items-center gap-2 rounded-control border border-line bg-white px-3.5 py-2 text-ui font-medium text-brand-deep hover:border-ink"><RefreshCw className="h-4 w-4" />Refrescar</button></form>
        </Tarjeta>
      </Seccion>

      <Seccion id="fotos" titulo="Fotos" descripcion="Las tuyas van primero y son la portada. Las de Wikimedia llevan su crédito; las de Google se muestran al vuelo y no se guardan.">
        {l.fotos.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-3">
            {l.fotos.map((f) => (
              <li key={f.path} className="overflow-hidden rounded-card border border-line bg-white shadow-lift">
                <img src={f.path} alt={f.alt} width={400} height={250} loading="lazy" className="aspect-video w-full object-cover" />
                <div className="flex items-center justify-between gap-2 px-3 py-2.5 text-ui text-ink-muted"><span className="truncate">{f.credito}</span>
                  <form action={borrarFotoLugarAction}><input type="hidden" name="id" value={l.id} /><input type="hidden" name="path" value={f.path} /><button type="submit" title="Quitar" className="flex h-8 w-8 items-center justify-center rounded-control text-ink-faint hover:bg-coral/10 hover:text-coral"><Trash2 className="h-4 w-4" /></button></form>
                </div>
              </li>
            ))}
          </ul>
        )}
        <form action={subirFotosLugarAction} className="mt-6"><input type="hidden" name="id" value={l.id} />
          <ZonaSubida name="fotos" multiple titulo="Subir fotos propias" ayuda="Horizontales, con luz de día. Se optimizan solas a WebP." etiquetaBoton="Subir y optimizar" /></form>
      </Seccion>

      <form action={guardarLugarAction} className="mt-4">
        <input type="hidden" name="id" value={l.id} />
        <Seccion id="texto" titulo="Texto" cursiva="nuestro" descripcion="Datos y no adjetivos, de tú a tú. Es lo que la gente lee en el teléfono.">
          <Tarjeta className="space-y-5 p-6">
            <div className="grid gap-5 sm:grid-cols-3">
              <Campo name="nombre" label="Nombre" required defaultValue={l.nombre} />
              <Selector name="categoria" label="Categoría" defaultValue={l.categoria} opciones={CATEGORIAS.map((c) => ({ value: c.key, label: c.label }))} />
              <Campo name="municipio" label="Municipio o zona" defaultValue={l.municipio} placeholder="Ej. Maneiro" />
            </div>
            <Campo name="descripcion" label="Descripción" filas={5} defaultValue={l.descripcion} ayuda="Qué es, dónde está, qué tiene. Dos o tres frases." />
            <Campo name="consejo" label="El consejo de Margarita Renace" filas={3} defaultValue={l.consejo} ayuda="Lo que le dirías a un amigo: cuándo ir, qué llevar, qué evitar." />
            <div className="grid gap-5 sm:grid-cols-3">
              <Campo name="mejor_momento" label="Mejor momento" defaultValue={l.mejorMomento} placeholder="Ej. Atardecer" />
              <Campo name="duracion" label="Cuánto dura" defaultValue={l.duracion} placeholder="Ej. Medio día" />
              <Campo name="costo" label="Cuánto cuesta" defaultValue={l.costo} placeholder="Ej. Gratis" />
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <Campo name="instagram" label="Instagram (sin @)" defaultValue={l.instagram ?? ''} placeholder="margaritakite" />
              <Campo name="web" label="Web" defaultValue={l.web ?? ''} placeholder="https://" />
              <Campo name="orden" label="Orden (menor = primero)" type="number" defaultValue={l.orden} />
            </div>
          </Tarjeta>
        </Seccion>
        <Seccion id="estado" titulo="Estado">
          <Tarjeta className="space-y-5 p-6">
            <Interruptor name="destacado" label="Imperdible" ayuda="Sale primero en la guía con la etiqueta «Imperdible»." defaultChecked={l.destacado} />
            <div className="border-t border-line pt-5"><Interruptor name="aliado" label="Aliado de Margarita Renace" ayuda="Negocio con el que tenemos trato directo: va primero en su categoría con el sello «Recomendado»." defaultChecked={l.aliado} /></div>
            <div className="border-t border-line pt-5"><Interruptor name="publicado" label="Publicado en la guía" defaultChecked={l.publicado} /></div>
          </Tarjeta>
        </Seccion>
        <div className="sticky bottom-0 mt-10 -mx-5 flex items-center gap-5 border-t border-line bg-paper/95 px-5 py-4 backdrop-blur-sm md:-mx-10 md:px-10">
          <button type="submit" className="btn-solid">Guardar cambios</button>
          <Link href="/admin/guia" className="text-body text-ink-muted underline-offset-4 hover:text-ink hover:underline">Volver</Link>
        </div>
      </form>
    </div>
  );
}
