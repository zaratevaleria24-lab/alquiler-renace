'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { AnuncioAirbnb } from '@/lib/enlaces';
import { avisar } from './Medidor';
import { tipoDe } from '@/lib/tipos-enlace';
import type { EnlacePublico } from '@/lib/enlaces';

// Los botones de /enlaces. Lo único de esa página que necesita JavaScript.
//
// Y LO NECESITA SOLO PARA CONTAR. Los enlaces son <a> de verdad con su href
// puesto: si el JS no carga —conexión mala, navegador viejo, alguien con los
// scripts bloqueados— siguen funcionando y lo único que se pierde es el
// registro del clic. Al revés (un onClick que hace la navegación) esta página
// sería inservible justo para el público al que va dirigida.
//
// POR QUÉ IMPORTA CONTAR ACÁ: esta es la página de la bio de Instagram y de
// TikTok. Saber cuántos de los que llegan tocan «WhatsApp» y cuántos se van a
// Airbnb es la única forma de saber si la cuenta de Instagram trae clientes o
// solo seguidores. Se registra con el recolector propio del sitio, sin cookies
// y sin guardar IPs (ver lib/metricas.ts).

/** El clic se avisa por SLUG, no por etiqueta: el nombre del botón se cambia y
 *  el historial de clics tiene que sobrevivir a eso. */
function contar(slug: string): void {
  avisar({ kind: 'enlace', meta: { q: slug } });
}

/** target/rel solo para los externos: en los internos rompería la navegación
 *  del propio sitio abriendo una pestaña por cada toque. */
function saltoExterno(externo: boolean) {
  return externo
    ? { target: '_blank' as const, rel: 'noopener noreferrer' }
    : {};
}

/** Botón ancho: medallón circular, nombre y —si la tiene— una línea que dice
 *  qué gana el visitante tocandolo. */
function BotonAncho({ enlace }: { enlace: EnlacePublico }) {
  const { icono: Icono, color } = tipoDe(enlace.tipo);

  // El destacado se lleva el acento de la casa —borde de tinta y sombra dura
  // que se hunde al pulsar—; los demás van en vidrio sobre la arena. Si todos
  // fueran iguales, la fila entera pesaría lo mismo y el visitante tendría que
  // leerlos uno por uno para decidir.
  // El destacado va lleno del azul profundo de la casa (es el botón que no
  // paga comisión); los demás en blanco con línea fina y sombra suave, como el
  // resto del sitio desde «Amanecer». Nada de sombras duras.
  const clases = `group flex w-full items-center gap-3.5 rounded-full py-2 pl-2 pr-4 text-left transition duration-200 ${
    enlace.destacado
      ? 'border border-brand-deep bg-brand-deep text-white shadow-lift hover:-translate-y-0.5 active:translate-y-0'
      : 'border border-line bg-white/90 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lift active:translate-y-0'
  }`;

  const contenido = (
    <>
      <span
        aria-hidden="true"
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${enlace.destacado ? 'bg-white text-brand-deep' : 'border border-line bg-white'}`}
        style={enlace.destacado ? undefined : { color }}
      >
        <Icono className="h-5 w-5" strokeWidth={1.75} />
      </span>

      <span className="min-w-0 flex-1">
        <span className={`block text-[15px] font-medium leading-tight ${enlace.destacado ? 'text-white' : 'text-ink'}`}>
          {enlace.etiqueta}
        </span>
        {enlace.descripcion && (
          <span className={`mt-0.5 block text-[12.5px] leading-snug ${enlace.destacado ? 'text-white/80' : 'text-ink-muted'}`}>
            {enlace.descripcion}
          </span>
        )}
      </span>

      <ArrowUpRight
        aria-hidden="true"
        className={`h-[18px] w-[18px] shrink-0 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${enlace.destacado ? 'text-white/80' : 'text-ink-faint group-hover:text-brand'}`}
      />
    </>
  );

  // Sin dirección todavía: MISMO botón, con el mismo aspecto, pero SIN <a>.
  //
  // Un <a href=""> recarga la página al tocarlo y los lectores de pantalla lo
  // anuncian como un enlace que lleva a algún lado. Dibujarlo como bloque es lo
  // único honesto que se puede hacer sin cambiar cómo se ve, que es de lo que
  // se trata: que la página se vea entera mientras se consiguen las direcciones.
  if (enlace.pendiente) {
    return (
      <div className={clases} aria-disabled="true">
        {contenido}
      </div>
    );
  }

  return (
    <a
      href={enlace.href}
      {...saltoExterno(enlace.externo)}
      onClick={() => contar(enlace.slug)}
      className={clases}
    >
      {contenido}
    </a>
  );
}

/** Redondo, sin texto: la tira de redes. El nombre va en `title` para el ratón
 *  y en sr-only para los lectores de pantalla —un icono suelto sin nombre
 *  accesible es un enlace mudo. */
function BotonRedondo({ enlace }: { enlace: EnlacePublico }) {
  const { icono: Icono, color } = tipoDe(enlace.tipo);

  const clases =
    'flex h-12 w-12 items-center justify-center rounded-full border border-line bg-white transition duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lift';

  const contenido = (
    <>
      <Icono
        aria-hidden="true"
        className="h-5 w-5"
        strokeWidth={1.75}
        style={{ color }}
      />
      <span className="sr-only">{enlace.etiqueta}</span>
    </>
  );

  if (enlace.pendiente) {
    return (
      <div className={clases} title={enlace.etiqueta} aria-disabled="true">
        {contenido}
      </div>
    );
  }

  return (
    <a
      href={enlace.href}
      {...saltoExterno(enlace.externo)}
      onClick={() => contar(enlace.slug)}
      title={enlace.etiqueta}
      className={clases}
    >
      {contenido}
    </a>
  );
}

/** «Reservar por Airbnb» no salta a Airbnb a ciegas: se despliega y muestra los
 *  apartamentos con su portada en un carrusel horizontal; cada uno lleva a su
 *  anuncio. Así el visitante elige el que vio en la foto de Instagram. */
function BotonAirbnb({ enlace, anuncios }: { enlace: EnlacePublico; anuncios: AnuncioAirbnb[] }) {
  const [abierto, setAbierto] = useState(false);
  // /enlaces#airbnb abre el carrusel directo (para pegarlo en una historia).
  useEffect(() => { if (location.hash === '#airbnb') setAbierto(true); }, []);
  const { icono: Icono, color } = tipoDe(enlace.tipo);
  const valorados = anuncios.filter((a) => a.rating != null);
  const media = valorados.length ? valorados.reduce((t, a) => t + (a.rating ?? 0), 0) / valorados.length : 0;
  const resenas = anuncios.reduce((t, a) => t + a.resenas, 0);
  return (
    <div>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-controls="carrusel-airbnb"
        className={`group flex w-full items-center gap-3.5 rounded-full border py-2 pl-2 pr-4 text-left transition duration-200 ${abierto ? 'border-brand/40 bg-white shadow-lift' : 'border-line bg-white/90 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lift'}`}
      >
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white" style={{ color }}><Icono className="h-5 w-5" strokeWidth={1.75} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium leading-tight text-ink">{enlace.etiqueta}</span>
          {/* Lo mejor de los dos mundos: la confianza de Airbnb (valoración media
              y reseñas reales) a la vista ANTES de tocar, y al tocar, nuestras
              fotos y nuestro carrusel, sin scripts de terceros. */}
          {valorados.length > 0 ? (
            <span className="mt-0.5 flex items-center gap-1 text-[12.5px] leading-snug text-ink-muted">
              <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0" fill={color} aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z" /></svg>
              <span><b className="text-ink">{media.toFixed(1)}</b> en Airbnb{resenas > 0 ? ` · ${resenas} reseñas` : ''} · {anuncios.length} apartamentos</span>
            </span>
          ) : enlace.descripcion && <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-muted">{enlace.descripcion}</span>}
        </span>
        <ChevronDown aria-hidden="true" className={`h-[18px] w-[18px] shrink-0 text-ink-faint transition-transform duration-300 ${abierto ? 'rotate-180 text-brand' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {abierto && (
          <motion.div
            id="carrusel-airbnb"
            key="carrusel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <ul className="-mx-5 flex snap-x snap-proximity gap-3 overflow-x-auto px-5 pb-2 pt-3 [scroll-padding-left:1.25rem] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {anuncios.map((a, i) => {
                const contenido = (
                  <>
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-card bg-luz shadow-lift">
                      {a.portada && <img src={a.portada} alt={a.nombre} width={220} height={275} loading={i < 2 ? 'eager' : 'lazy'} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />}
                      <span className="absolute left-2 top-2 rounded-chip bg-white/90 px-2 py-0.5 text-[11px] font-medium text-ink">{a.zona}</span>
                      {a.rating != null && (
                        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-chip bg-white/95 px-2 py-0.5 text-[12px] font-semibold text-ink shadow-lift">
                          <svg viewBox="0 0 24 24" className="h-3 w-3" fill={color} aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z" /></svg>
                          {a.rating.toFixed(1)}{a.resenas > 0 && <span className="font-normal text-ink-muted">({a.resenas})</span>}
                        </span>
                      )}
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-2.5 pb-2 pt-8 text-white">
                        <span className="block font-serif text-[15px] font-semibold leading-tight">{a.nombre}</span>
                        {a.detalle && <span className="mt-0.5 block text-[11px] text-white/85">{a.detalle}</span>}
                      </span>
                    </div>
                    <span className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium" style={{ color }}>
                      <Icono className="h-3 w-3" strokeWidth={1.75} />{a.url ? 'Ver anuncio en Airbnb' : 'Pronto en Airbnb'}
                    </span>
                  </>
                );
                const clase = 'group block w-[46vw] max-w-[190px] shrink-0 snap-start';
                return (
                  <li key={a.slug} className="shrink-0">
                    {a.url ? <a href={a.url} target="_blank" rel="noopener noreferrer" onClick={() => contar(`airbnb:${a.slug}`)} className={clase}>{contenido}</a> : <div className={clase} aria-disabled="true">{contenido}</div>}
                  </li>
                );
              })}
            </ul>
            <p className="mt-1 text-center text-[12px] text-ink-faint">{`Los mismos ${anuncios.length} apartamentos, con la protección de Airbnb.`}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function BotonesEnlaces({
  botones,
  circulos,
  anuncios = [],
}: {
  botones: EnlacePublico[];
  circulos: EnlacePublico[];
  anuncios?: AnuncioAirbnb[];
}) {
  return (
    <>
      {circulos.length > 0 && (
        <nav aria-label="Redes sociales" className="mt-8">
          <ul className="flex flex-wrap justify-center gap-3">
            {circulos.map((e) => (
              <li key={e.slug}>
                <BotonRedondo enlace={e} />
              </li>
            ))}
          </ul>
        </nav>
      )}

      {botones.length > 0 && (
        <nav aria-label="Enlaces" className="mt-8">
          <ul className="space-y-3">
            {botones.map((e) => (
              <li key={e.slug}>
                {e.tipo === 'airbnb' && anuncios.length > 0 ? <BotonAirbnb enlace={e} anuncios={anuncios} /> : <BotonAncho enlace={e} />}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
