import Link from 'next/link';
import { ArrowUpRight, Building2, Phone, Search } from 'lucide-react';
import {
  COSTO_ESTIMADO_POR_ANUNCIO, ESTADOS, hayToken, listarCorridas, listarProspectos,
  resumenProspectos, saldoApify, type EstadoProspecto,
} from '@/lib/ventas';
import { Aviso, Cifra, Insignia, Seccion, Tarjeta } from '../_ui';
import { buscarProspectosAction, estadoProspectoAction, publicadoProspectoAction } from './actions';

// PROSPECTOS EN VENTA — material privado.
//
// Lo que hay acá son anuncios ajenos de Facebook Marketplace. Sirven para UNA
// cosa: llamar al vendedor y ofrecerle representar la propiedad. Nada de esto
// se publica en la web (ver lib/ventas.ts). La búsqueda la dispara la dueña a
// mano, con el costo estimado a la vista y el saldo de Apify al lado: el
// crédito es suyo y no se gasta sin que lo vea.

export const dynamic = 'force-dynamic';

const fmt = (n: number) => 'US$ ' + n.toLocaleString('es-VE');
const hace = (d: Date) => {
  const h = Math.round((Date.now() - d.getTime()) / 36e5);
  return h < 1 ? 'hace minutos' : h < 48 ? `hace ${h} h` : `hace ${Math.round(h / 24)} días`;
};

export default async function VentasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; corrida?: string; error?: string; guardado?: string }>;
}) {
  const sp = await searchParams;
  const filtro = (ESTADOS.some((e) => e.key === sp.estado) ? sp.estado : 'todos') as EstadoProspecto | 'todos';
  const [prospectos, resumen, corridas, saldo] = await Promise.all([
    listarProspectos(filtro), resumenProspectos(), listarCorridas(5), saldoApify(),
  ]);
  const restante = saldo ? Math.max(0, saldo.limite - saldo.usado) : null;
  const [traidos, nuevos, costo] = (sp.corrida ?? '').split(':');

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-meta font-semibold text-ink-subtle">En venta</p>
          <h1 className="mt-2 font-serif text-headline font-normal track-headline text-ink">Prospectos</h1>
          <p className="mt-2 max-w-2xl text-meta text-ink-muted">
            Anuncios de Facebook Marketplace en la isla. Se publican en /en-venta con
            precio y fotos; <b>el teléfono del vendedor solo se ve acá</b>: el público
            te escribe a tú. Puedes ocultar cualquiera con un clic.
          </p>
        </div>
        <Link href="/admin/ventas/inmuebles" className="btn-solid">
          <Building2 className="h-4 w-4" />
          Inmuebles propios
        </Link>
      </header>

      {sp.corrida && (
        <Aviso tono="ok">
          Búsqueda terminada: {traidos} anuncios leídos, <b>{nuevos} nuevos</b>
          {costo ? ` · costó US$ ${Number(costo).toFixed(3)}` : ''}.
        </Aviso>
      )}
      {sp.guardado && <Aviso tono="ok">Guardado.</Aviso>}
      {sp.error && <Aviso tono="error">No se pudo buscar: {sp.error}</Aviso>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra valor={resumen.total} etiqueta="Prospectos" nota={`${resumen.nuevos} sin revisar`} />
        <Cifra valor={resumen.conTelefono} etiqueta="Con teléfono" nota="leído del texto del anuncio" tono={resumen.conTelefono === 0 && resumen.total > 0 ? 'aviso' : 'normal'} />
        <Cifra valor={resumen.captados} etiqueta="Captados" nota="ya son inmuebles propios" />
        <Cifra
          valor={restante == null ? '—' : `US$ ${restante.toFixed(2)}`}
          etiqueta="Crédito Apify"
          nota={saldo ? `usado US$ ${saldo.usado.toFixed(2)} de ${saldo.limite}` : 'no se pudo consultar'}
          tono={restante != null && restante < 1 ? 'aviso' : 'normal'}
        />
      </div>

      <Seccion
        id="buscar"
        titulo="Buscar en"
        cursiva="Marketplace"
        descripcion="Toda la isla (40 km alrededor del centro), solo inmuebles en venta, con descripción completa. Tarda entre 20 y 60 segundos."
      >
        <Tarjeta className="p-6">
          {!hayToken() ? (
            <Aviso tono="error">Falta el token de Apify en /etc/margarita-renace/apify.env.</Aviso>
          ) : (
            <form action={buscarProspectosAction} className="flex flex-wrap items-end gap-4">
              <label className="block">
                <span className="text-meta font-semibold text-ink-muted">Cuántos anuncios</span>
                <select name="limite" defaultValue="20" className="mt-1.5 block rounded-control border border-line bg-white px-3 py-2 text-body">
                  {[10, 20, 40, 60].map((n) => (
                    <option key={n} value={n}>
                      {n} — aprox. US$ {(n * COSTO_ESTIMADO_POR_ANUNCIO).toFixed(2)}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="btn-solid" disabled={restante != null && restante < 0.2}>
                <Search className="h-4 w-4" />
                Buscar ahora
              </button>
              <span className="text-meta text-ink-muted">
                Los que ya estaban se actualizan; los nuevos aparecen arriba como «Nuevo».
              </span>
            </form>
          )}
          {corridas.length > 0 && (
            <ul className="mt-5 divide-y divide-line/70 border-t border-line pt-3 text-meta text-ink-muted">
              {corridas.map((c) => (
                <li key={c.id} className="flex flex-wrap gap-x-4 py-1.5">
                  <span>{hace(c.createdAt)}</span>
                  <span>{c.error ? <span className="text-coral">falló: {c.error.slice(0, 80)}</span> : `${c.traidos} leídos · ${c.nuevos} nuevos`}</span>
                  {c.costoUsd != null && <span className="ml-auto font-mono tabular-nums">US$ {c.costoUsd.toFixed(3)}</span>}
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </Seccion>

      <Seccion
        id="lista"
        titulo="Lista"
        acciones={
          <nav className="flex flex-wrap gap-2">
            {[{ key: 'todos', label: 'Todos' }, ...ESTADOS].map((e) => (
              <Link
                key={e.key}
                href={`/admin/ventas?estado=${e.key}`}
                className={`rounded-chip border px-3 py-1.5 text-ui font-medium transition-colors ${
                  filtro === e.key ? 'border-brand bg-brand-tint text-brand-deep' : 'border-line bg-white text-ink-muted hover:border-ink'
                }`}
              >
                {e.label}
              </Link>
            ))}
          </nav>
        }
      >
        {prospectos.length === 0 ? (
          <Aviso tono="atencion">
            {resumen.total === 0 ? 'Todavía no hay prospectos: corré la primera búsqueda arriba.' : 'Nada con ese filtro.'}
          </Aviso>
        ) : (
          <ul className="space-y-4">
            {prospectos.map((p) => {
              const ficha = [
                p.habitaciones && `${p.habitaciones} hab`, p.banos && `${p.banos} baños`, p.m2 && `${p.m2} m²`,
              ].filter(Boolean).join(' · ');
              const wa = p.telefono
                ? `https://wa.me/${p.telefono}?text=${encodeURIComponent(`Hola, vi su anuncio «${p.tituloLimpio}» en Marketplace. Soy de Margarita Renace (margaritarenace.com.ve), publicamos y mostramos inmuebles en la isla. ¿Le interesaría que lo ayudemos a venderlo?`)}`
                : null;
              return (
                <li key={p.fbId} id={`p-${p.fbId}`}>
                  <Tarjeta className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Insignia tono={p.estado === 'nuevo' ? 'ok' : p.estado === 'descartado' ? 'neutro' : 'aviso'}>
                            {ESTADOS.find((e) => e.key === p.estado)?.label}
                          </Insignia>
                          {p.vendido && <Insignia tono="neutro">vendido</Insignia>}
                          {p.publicado && p.vivo && !p.vendido && (p.estado === 'nuevo' || p.estado === 'contactado') && p.slug
                            ? <Insignia tono="ok">en la web</Insignia>
                            : <Insignia tono="neutro">oculto</Insignia>}
                          {p.fotosLocales.length > 0 && <span className="text-ui text-ink-faint">{p.fotosLocales.length} foto{p.fotosLocales.length === 1 ? '' : 's'} guardada{p.fotosLocales.length === 1 ? '' : 's'}</span>}
                          {!p.vivo && <Insignia tono="neutro">retirado</Insignia>}
                          <span className="text-ui text-ink-faint">visto {hace(p.vistoUltimo)}</span>
                        </div>
                        <h3 className="mt-2 text-body font-semibold text-ink">{p.tituloLimpio}</h3>
                        <p className="mt-1 text-meta text-ink-muted">
                          {[p.zoneName, p.municipio && `mun. ${p.municipio}`, p.ciudad].filter(Boolean).join(' · ') || 'ubicación sin datos'}
                          {ficha && ` · ${ficha}`}
                        </p>
                        {p.descripcion && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-ui text-brand-deep">Ver descripción del anuncio</summary>
                            <p className="mt-2 whitespace-pre-line text-meta text-ink-soft">{p.descripcion.slice(0, 1500)}</p>
                          </details>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="mono-data text-title-sm text-brand-deep">
                          {p.precioUsd ? fmt(p.precioUsd) : <span className="text-ink-faint">sin precio</span>}
                        </p>
                        {p.precioFb != null && p.precioUsd !== p.precioFb && (
                          <p className="text-ui text-ink-faint">Facebook dice {p.monedaFb} {p.precioFb.toLocaleString('es-VE')}</p>
                        )}
                        {p.fotos > 0 && <p className="text-ui text-ink-faint">{p.fotos} foto{p.fotos === 1 ? '' : 's'} en el anuncio</p>}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                      {wa ? (
                        <a href={wa} target="_blank" rel="noopener" className="btn-solid">
                          <Phone className="h-4 w-4" />
                          WhatsApp {p.telefono}
                        </a>
                      ) : (
                        <span className="rounded-chip bg-paper-warm/70 px-3 py-1.5 text-ui text-ink-muted">sin teléfono en el texto</span>
                      )}
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-chip border border-line bg-white px-3 py-1.5 text-ui font-medium text-ink-muted hover:border-ink">
                        Ver en Facebook <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                      {p.slug && (
                        <a href={`https://margaritarenace.com.ve/en-venta/${p.slug}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-chip border border-line bg-white px-3 py-1.5 text-ui font-medium text-ink-muted hover:border-ink">
                          Ver en la web <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <form action={publicadoProspectoAction}>
                        <input type="hidden" name="fb_id" value={p.fbId} />
                        <input type="hidden" name="filtro" value={filtro} />
                        <input type="hidden" name="publicar" value={p.publicado ? '' : 'true'} />
                        <button type="submit" className="rounded-chip border border-line bg-white px-3 py-1.5 text-ui font-medium text-ink-muted hover:border-ink">
                          {p.publicado ? 'Ocultar de la web' : 'Publicar en la web'}
                        </button>
                      </form>
                      <form action={estadoProspectoAction} className="ml-auto flex flex-wrap items-center gap-2">
                        <input type="hidden" name="fb_id" value={p.fbId} />
                        <input type="hidden" name="filtro" value={filtro} />
                        <input
                          name="notas"
                          defaultValue={p.notas}
                          placeholder="Notas (qué dijo, cuándo volver a llamar)"
                          className="w-64 rounded-control border border-line bg-white px-3 py-1.5 text-ui"
                        />
                        <select name="estado" defaultValue={p.estado} className="rounded-control border border-line bg-white px-2 py-1.5 text-ui">
                          {ESTADOS.map((e) => <option key={e.key} value={e.key}>{e.label}</option>)}
                        </select>
                        <button type="submit" className="rounded-control border border-line bg-white px-3 py-1.5 text-ui font-medium hover:border-ink">
                          Guardar
                        </button>
                      </form>
                    </div>
                    <p className="mt-2 text-ui text-ink-faint">
                      «Captado» crea tu ficha propia (con tus fotos, indexable en Google) y quita esta del listado automático. «Descartado» la oculta.
                    </p>
                  </Tarjeta>
                </li>
              );
            })}
          </ul>
        )}
      </Seccion>
    </div>
  );
}
