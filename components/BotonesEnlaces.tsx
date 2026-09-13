'use client';

import { ArrowUpRight } from 'lucide-react';
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

export function BotonesEnlaces({
  botones,
  circulos,
}: {
  botones: EnlacePublico[];
  circulos: EnlacePublico[];
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
                <BotonAncho enlace={e} />
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
