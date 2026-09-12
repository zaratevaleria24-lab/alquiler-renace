import { ArrowDown, ArrowUp, ExternalLink, Plus } from 'lucide-react';
import { getEnlacesAdmin, type EnlaceAdmin } from '@/lib/enlaces';
import { camposDe, getAjustes } from '@/lib/settings';
import { SITE } from '@/lib/site';
import { TIPOS_UI, tipoDe } from '@/lib/tipos-enlace';
import { Aviso, Campo, Insignia, Seccion, Selector, Interruptor, Tarjeta } from '../_ui';
import {
  bajarEnlaceAction,
  borrarEnlaceAction,
  crearEnlaceAction,
  guardarEnlaceAction,
  guardarFraseAction,
  subirEnlaceAction,
} from './actions';

// Los botones de la página de la bio de Instagram y TikTok.
//
// SIN JAVASCRIPT, como el resto del panel: cada enlace es un formulario suelto
// y los botones de subir, bajar y eliminar usan `formaction` para mandar el
// mismo formulario a otra acción. Es el patrón que ya usa el calendario.
//
// EL ORDEN SE CAMBIA CON FLECHAS y no arrastrando. Arrastrar exige JavaScript,
// biblioteca de drag & drop, y en un teléfono —que es desde donde se va a
// tocar esto— es donde peor funciona. Con cinco o seis enlaces, dos flechas
// resuelven lo mismo y funcionan siempre.

export const dynamic = 'force-dynamic';

const MENSAJES: Record<string, string> = {
  url: 'Ese enlace no se entiende. Pega la dirección completa (https://…), o déjalo vacío si aún no la tienes.',
  etiqueta: 'Ponle un nombre al botón: es lo que se lee en la página.',
};

const OPCIONES_TIPO = Object.entries(TIPOS_UI).map(([value, t]) => ({
  value,
  label: t.nombre,
}));

const OPCIONES_FORMA = [
  { value: 'boton', label: 'Botón ancho, con nombre y descripción' },
  { value: 'circulo', label: 'Icono redondo, en la tira de redes' },
];

/** Estado de un enlace de un vistazo. El orden de las comprobaciones importa:
 *  «sin destino» pesa más que «oculto», porque es lo que hay que arreglar. */
function estado(e: EnlaceAdmin) {
  if (!e.href) return { tono: 'aviso' as const, texto: 'Falta el enlace' };
  if (!e.activo) return { tono: 'neutro' as const, texto: 'Oculto' };
  if (e.destacado) return { tono: 'ok' as const, texto: 'Destacado' };
  return { tono: 'ok' as const, texto: 'Visible' };
}

export default async function EnlacesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; guardado?: string; borrado?: string }>;
}) {
  const [{ error, guardado, borrado }, enlaces, ajustes] = await Promise.all([
    searchParams,
    getEnlacesAdmin(),
    getAjustes(),
  ]);

  const [frase] = camposDe('enlaces');
  const urlPublica = `${SITE.url}/enlaces`;
  const sinDestino = enlaces.filter((e) => e.activo && !e.href).length;

  return (
    <div>
      <header>
        <p className="text-meta font-semibold text-ink-subtle">Sitio público</p>
        <h1 className="mt-2 font-serif text-headline font-normal track-headline text-ink">
          Enlaces <em className="headline-italic">de la bio</em>
        </h1>
        <p className="mt-4 max-w-2xl text-body text-ink-soft">
          La página que se pega en Instagram y TikTok, donde solo cabe una
          dirección. Esta es la tuya:
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Seleccionable a mano: copiar al portapapeles necesitaría
              JavaScript, y este panel no lo usa. */}
          <code className="mono-data rounded-control border border-line bg-white px-3.5 py-2.5 text-ink">
            {urlPublica.replace('https://', '')}
          </code>
          {/* URL absoluta, no '/enlaces': el panel vive en admin.* y el
              middleware manda todo lo que no sea /admin… de vuelta al panel.
              Un enlace relativo acá terminaría en /admin/enlaces. */}
          <a
            href={urlPublica}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
          >
            <ExternalLink className="h-4 w-4" />
            Ver cómo quedó
          </a>
        </div>
      </header>

      {guardado && (
        <Aviso tono="ok">Guardado. La página de enlaces ya muestra el cambio.</Aviso>
      )}
      {borrado && <Aviso tono="ok">Enlace eliminado.</Aviso>}
      {error && <Aviso tono="error">{MENSAJES[error] ?? 'No se pudo guardar.'}</Aviso>}
      {!error && sinDestino > 0 && (
        <Aviso tono="atencion" titulo="Falta pegar direcciones">
          {sinDestino === 1
            ? 'Hay un botón sin dirección. Se ve en la página, con su color y su icono, pero al tocarlo no pasa nada.'
            : `Hay ${sinDestino} botones sin dirección. Se ven en la página, con su color y su icono, pero al tocarlos no pasa nada.`}{' '}
          Si prefieres que no se enseñen hasta tenerlas, apágalos con «Visible
          en la página».
        </Aviso>
      )}

      <Seccion
        id="frase"
        titulo="Lo que se lee"
        cursiva="bajo el nombre"
        descripcion="El retrato y el nombre salen del logotipo y de la marca; esta frase es lo único que cambia."
      >
        <form action={guardarFraseAction}>
          <Tarjeta className="space-y-5 p-6">
            <Campo
              name="enlaces_frase"
              label={frase.label}
              ayuda={frase.ayuda}
              defaultValue={ajustes.enlaces_frase}
            />
            <button type="submit" className="btn-solid">
              Guardar frase
            </button>
          </Tarjeta>
        </form>
      </Seccion>

      <Seccion
        id="lista"
        titulo="Los botones"
        cursiva="y su orden"
        descripcion="De arriba abajo, tal como se ven. Los de icono redondo se agrupan solos en la tira de redes, arriba de los botones anchos."
      >
        <div className="space-y-5">
          {enlaces.map((e, i) => {
            const t = tipoDe(e.tipo);
            const Icono = t.icono;
            const est = estado(e);

            return (
              <Tarjeta key={e.id} className="p-6">
                <form action={guardarEnlaceAction} className="space-y-5">
                  <input type="hidden" name="id" value={e.id} />

                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <span
                        aria-hidden="true"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: t.color }}
                      >
                        <Icono className="h-[18px] w-[18px]" strokeWidth={1.75} />
                      </span>
                      <div>
                        <p className="text-body font-semibold text-ink">
                          {e.etiqueta}
                        </p>
                        <p className="mt-0.5 text-meta text-ink-muted">
                          {/* Los toques son de los últimos 30 días y por SLUG:
                              renombrar el botón no parte la cuenta en dos. */}
                          {e.clics === 0
                            ? 'Sin toques en 30 días'
                            : `${e.clics} ${e.clics === 1 ? 'toque' : 'toques'} en 30 días`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Insignia tono={est.tono}>{est.texto}</Insignia>
                      {/* Deshabilitadas en las puntas: un botón que no hace
                          nada es peor que uno que no está. */}
                      <button
                        type="submit"
                        formAction={subirEnlaceAction}
                        disabled={i === 0}
                        aria-label={`Subir ${e.etiqueta}`}
                        className="flex h-9 w-9 items-center justify-center rounded-control border border-line text-ink-muted transition-colors hover:bg-paper hover:text-ink disabled:opacity-30"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="submit"
                        formAction={bajarEnlaceAction}
                        disabled={i === enlaces.length - 1}
                        aria-label={`Bajar ${e.etiqueta}`}
                        className="flex h-9 w-9 items-center justify-center rounded-control border border-line text-ink-muted transition-colors hover:bg-paper hover:text-ink disabled:opacity-30"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Selector
                      name="tipo"
                      label="Tipo"
                      ayuda="Decide el icono y el color."
                      defaultValue={e.tipo}
                      opciones={OPCIONES_TIPO}
                    />
                    <Campo
                      name="etiqueta"
                      label="Nombre del botón"
                      defaultValue={e.etiqueta}
                      required
                    />
                  </div>

                  <Campo
                    name="url"
                    label="A dónde lleva"
                    ayuda={t.ayuda}
                    defaultValue={e.url}
                    placeholder={t.desde ? 'vacío = usar el de Contenido' : 'https://…'}
                  />

                  <Campo
                    name="descripcion"
                    label="Línea de apoyo"
                    ayuda="Opcional, y solo se ve en los botones anchos. Di qué gana quien lo toca, no lo que es."
                    defaultValue={e.descripcion}
                  />

                  <Selector
                    name="forma"
                    label="Cómo se ve"
                    defaultValue={e.forma}
                    opciones={OPCIONES_FORMA}
                  />

                  <div className="space-y-4 border-t border-line pt-5">
                    <Interruptor
                      name="activo"
                      label="Visible en la página"
                      defaultChecked={e.activo}
                    />
                    <Interruptor
                      name="destacado"
                      label="Destacado"
                      ayuda="El de borde marcado, el que más se ve. Solo puede haber uno: al marcar este se desmarca el anterior."
                      defaultChecked={e.destacado}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <button
                      type="submit"
                      formAction={borrarEnlaceAction}
                      className="rounded-chip px-3 py-2 text-meta font-semibold text-coral transition-colors hover:bg-coral/10"
                    >
                      Eliminar
                    </button>
                    <button type="submit" className="btn-solid">
                      Guardar
                    </button>
                  </div>
                </form>
              </Tarjeta>
            );
          })}
        </div>
      </Seccion>

      <Seccion id="nuevo" titulo="Añadir" cursiva="un enlace">
        <form action={crearEnlaceAction}>
          <Tarjeta className="space-y-5 p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Selector
                name="tipo"
                label="Tipo"
                defaultValue="sitio"
                opciones={OPCIONES_TIPO}
              />
              <Campo
                name="etiqueta"
                label="Nombre del botón"
                placeholder="Catálogo de temporada"
                required
              />
            </div>
            <Campo name="url" label="A dónde lleva" placeholder="https://…" />
            <Campo
              name="descripcion"
              label="Línea de apoyo"
              placeholder="Opcional"
            />
            <Selector
              name="forma"
              label="Cómo se ve"
              defaultValue="boton"
              opciones={OPCIONES_FORMA}
            />
            {/* Nace visible: lo normal es que quien lo crea quiera publicarlo, y
                si le falta la dirección la página lo esconde sola. */}
            <input type="hidden" name="activo" value="true" />
            <button type="submit" className="btn-solid">
              <Plus className="h-4 w-4" />
              Añadir enlace
            </button>
          </Tarjeta>
        </form>
      </Seccion>
    </div>
  );
}
