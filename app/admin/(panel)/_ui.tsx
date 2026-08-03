import type { ReactNode } from 'react';

// Piezas de interfaz del panel.
//
// POR QUÉ EXISTEN: la primera versión usaba controles NATIVOS del navegador
// —checkboxes cuadrados azules, `Choose Files / No file chosen` en inglés— y eso
// es lo que hacía que el panel se viera viejo aunque funcionara bien. Un
// formulario con treinta casillas nativas apiladas se lee como una planilla de
// 2005, no como una herramienta.
//
// REGLA QUE NO SE ROMPE: nada de esto usa JavaScript. Son `input` reales con la
// caja escondida (`sr-only`) y el aspecto dibujado por el hermano con la
// variante `peer-checked` de Tailwind. Así el panel sigue funcionando sin
// hidratación —requisito por las conexiones de Venezuela— y el teclado y los
// lectores de pantalla siguen viendo un checkbox de verdad.
//
// Se usan los tokens del sitio (arena, teal profundo, romana/cursiva): el panel
// es la otra cara del mismo producto, no una herramienta ajena.

/** Título de sección: cursiva del sello + línea fina, para dar jerarquía real
 *  en vez de repetir etiquetas en mayúsculas por toda la página. */
export function Seccion({
  titulo,
  cursiva,
  descripcion,
  acciones,
  children,
  id,
}: {
  titulo: string;
  cursiva?: string;
  descripcion?: string;
  acciones?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section aria-labelledby={id} className="mt-12 first:mt-0">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-3">
        <div>
          <h2
            id={id}
            className="font-serif text-title font-normal track-title text-ink"
          >
            {titulo}
            {cursiva && <> <em className="headline-italic">{cursiva}</em></>}
          </h2>
          {descripcion && (
            <p className="mt-1.5 text-meta text-ink-muted">{descripcion}</p>
          )}
        </div>
        {acciones}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** Tarjeta contenedora con sombra suave. La sombra dura del sitio público
 *  (shadow-hard) es un acento de marca: repetida en cada caja del panel
 *  cansaría, así que acá se usa la elevación sutil. */
export function Tarjeta({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-card border border-line bg-white shadow-lift ${className}`}
    >
      {children}
    </div>
  );
}

const CAMPO_INPUT =
  'w-full rounded-control border border-line bg-paper/40 px-3.5 py-2.5 text-body text-ink transition-colors placeholder:text-ink-faint hover:border-line-strong focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10';

/** Campo de texto con etiqueta y ayuda. La etiqueta va en el mismo tamaño que
 *  el contenido y no en mayúsculas diminutas: era otra cosa que se leía a
 *  planilla. */
export function Campo({
  name,
  label,
  ayuda,
  defaultValue,
  type = 'text',
  required,
  placeholder,
  min,
  max,
  filas,
}: {
  name: string;
  label: string;
  ayuda?: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  /** Si viene, se dibuja un textarea de ese alto. */
  filas?: number;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-meta font-semibold text-ink"
      >
        {label}
      </label>
      {filas ? (
        <textarea
          id={name}
          name={name}
          rows={filas}
          required={required}
          placeholder={placeholder}
          defaultValue={defaultValue}
          className={`${CAMPO_INPUT} resize-y leading-relaxed`}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          defaultValue={defaultValue}
          min={min}
          max={max}
          className={CAMPO_INPUT}
        />
      )}
      {ayuda && <p className="mt-1.5 text-meta text-ink-muted">{ayuda}</p>}
    </div>
  );
}

/** Select con la misma caja que los campos de texto. */
export function Selector({
  name,
  label,
  ayuda,
  defaultValue,
  opciones,
}: {
  name: string;
  label: string;
  ayuda?: string;
  defaultValue?: string;
  opciones: { value: string; label: string }[];
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-meta font-semibold text-ink"
      >
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className={CAMPO_INPUT}
      >
        {opciones.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {ayuda && <p className="mt-1.5 text-meta text-ink-muted">{ayuda}</p>}
    </div>
  );
}

/**
 * Interruptor para los sí/no importantes (publicada, inventario real…).
 *
 * Un interruptor comunica "esto cambia el estado de algo" mucho mejor que una
 * casilla, y en teléfono es un objetivo táctil de verdad.
 */
export function Interruptor({
  name,
  label,
  ayuda,
  defaultChecked,
}: {
  name: string;
  label: string;
  ayuda?: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3.5">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-line-strong transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:content-[''] peer-checked:bg-brand peer-checked:after:translate-x-5 peer-focus-visible:ring-4 peer-focus-visible:ring-brand/20"
      />
      <span>
        <span className="block text-body text-ink">{label}</span>
        {ayuda && (
          <span className="mt-0.5 block text-meta text-ink-muted">{ayuda}</span>
        )}
      </span>
    </label>
  );
}

/**
 * Casilla con forma de chip, para listas largas de opciones.
 *
 * Las categorías y amenidades eran 30 casillas nativas en tres columnas: la
 * parte más anticuada del panel y la más difícil de tocar con el dedo. Como
 * chips se ven de un vistazo cuáles están puestas y son objetivos de 40px.
 */
export function Chip({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span className="inline-flex min-h-[40px] items-center gap-2 rounded-chip border border-line bg-white px-3.5 text-meta text-ink-soft transition-all hover:border-line-strong peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-brand/20">
        {label}
      </span>
    </label>
  );
}

/**
 * Zona de subida de archivos.
 *
 * El input nativo mostraba «Choose Files / No file chosen»: en inglés, sin
 * estilo, y era lo que más delataba que nadie había diseñado esta pantalla. La
 * caja del archivo se esconde y el `label` entero se vuelve la zona pulsable.
 */
export function ZonaSubida({
  name,
  titulo,
  ayuda,
  multiple,
  etiquetaBoton = 'Subir',
}: {
  name: string;
  titulo: string;
  ayuda?: string;
  multiple?: boolean;
  etiquetaBoton?: string;
}) {
  const id = `subir-${name}`;
  return (
    <div className="rounded-card border border-dashed border-line-strong bg-paper/50 p-5">
      <label htmlFor={id} className="block cursor-pointer">
        <span className="block text-body font-semibold text-ink">{titulo}</span>
        {ayuda && (
          <span className="mt-1 block text-meta text-ink-muted">{ayuda}</span>
        )}
        <input
          id={id}
          type="file"
          name={name}
          required
          multiple={multiple}
          accept="image/*"
          // La caja no se esconde con sr-only: el usuario necesita ver el nombre
          // del archivo elegido antes de enviar. Se estiliza el botón interno.
          className="mt-4 block w-full text-meta text-ink-soft file:mr-4 file:cursor-pointer file:rounded-chip file:border-0 file:bg-brand-tint file:px-4 file:py-2.5 file:text-meta file:font-semibold file:text-brand-deep file:transition-colors hover:file:bg-brand-soft"
        />
      </label>
      <button type="submit" className="btn-solid mt-4">
        {etiquetaBoton}
      </button>
    </div>
  );
}

/** Insignia de estado con punto de color. El punto es lo que permite escanear
 *  una tabla larga sin leer palabra por palabra. */
export function Insignia({
  children,
  tono = 'neutro',
}: {
  children: ReactNode;
  tono?: 'ok' | 'neutro' | 'aviso';
}) {
  const estilos = {
    ok: 'bg-brand-tint text-brand-deep',
    neutro: 'bg-paper-warm/70 text-ink-muted',
    aviso: 'bg-coral/10 text-coral',
  }[tono];
  const punto = {
    ok: 'bg-brand',
    neutro: 'bg-ink-faint',
    aviso: 'bg-coral',
  }[tono];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-chip px-2.5 py-1 text-ui font-medium ${estilos}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${punto}`} />
      {children}
    </span>
  );
}

/** Cifra del resumen. El número manda: grande, en monoespaciada tabular. */
export function Cifra({
  valor,
  etiqueta,
  nota,
  tono = 'normal',
}: {
  valor: number | string;
  etiqueta: string;
  nota?: string;
  tono?: 'normal' | 'aviso';
}) {
  return (
    <Tarjeta className="p-5">
      <p className="text-meta font-semibold text-ink-muted">{etiqueta}</p>
      <p
        className={`mt-3 font-mono text-[2.25rem] leading-none tabular-nums ${
          tono === 'aviso' ? 'text-coral' : 'text-brand-deep'
        }`}
      >
        {valor}
      </p>
      {nota && <p className="mt-3 text-meta text-ink-muted">{nota}</p>}
    </Tarjeta>
  );
}

/**
 * Tasa de cambio: la cifra grande con su unidad y su procedencia.
 *
 * La FUENTE va siempre visible, no en una nota al pie. Una tasa sin decir de
 * dónde salió no sirve para cobrarle a nadie: la diferencia entre el dólar del
 * BCV y el de mercado es justamente el dato del que vive esta pantalla.
 */
export function Tasa({
  etiqueta,
  valor,
  fuente,
  destacada,
}: {
  etiqueta: string;
  valor: number | null;
  fuente: string;
  destacada?: boolean;
}) {
  return (
    <div
      className={`rounded-card border p-5 ${
        destacada
          ? 'border-brand/30 bg-brand-tint'
          : 'border-line bg-white shadow-lift'
      }`}
    >
      <p className="text-meta font-semibold text-ink-muted">{etiqueta}</p>
      <p
        className={`mt-2.5 font-mono text-[1.75rem] leading-none tabular-nums ${
          destacada ? 'text-brand-deep' : 'text-ink'
        }`}
      >
        {valor === null
          ? '—'
          : valor.toLocaleString('es-VE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
        <span className="ml-1.5 font-sans text-meta font-normal text-ink-muted">
          Bs
        </span>
      </p>
      <p className="mt-2.5 text-ui text-ink-subtle">{fuente}</p>
    </div>
  );
}

/** Aviso destacado. `tono` decide el color, no una clase suelta en cada uso. */
export function Aviso({
  tono,
  titulo,
  children,
}: {
  tono: 'ok' | 'error' | 'atencion';
  titulo?: string;
  children: ReactNode;
}) {
  const estilos = {
    ok: 'border-brand/25 bg-brand-tint',
    error: 'border-coral/35 bg-coral/5',
    atencion: 'border-accent/40 bg-accent/5',
  }[tono];

  return (
    <div className={`mt-8 rounded-card border px-5 py-4 ${estilos}`}>
      {titulo && (
        <p className="font-serif text-title-sm font-normal track-title text-ink">
          {titulo}
        </p>
      )}
      <div className={`text-body text-ink-soft ${titulo ? 'mt-2' : ''}`}>
        {children}
      </div>
    </div>
  );
}
