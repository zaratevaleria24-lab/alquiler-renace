// Página de enlaces: consultas y reglas. SOLO SERVIDOR.
//
// La tabla `enlaces` guarda QUÉ botones hay; este módulo decide CUÁLES se
// muestran y A DÓNDE apuntan de verdad. Esa segunda parte no es trivial:
//
//   · El botón de WhatsApp no guarda su URL. La arma con el número que está en
//     /admin/contenido, que es el mismo que enciende los botones de reservar de
//     todo el sitio. Si se guardara acá también, el día que cambie el número
//     habría que acordarse de dos sitios y uno quedaría viejo.
//   · Un enlace sin URL —ni escrita ni deducible— NO SALE. Sembramos «TikTok»
//     antes de que exista la cuenta: el panel lo muestra pendiente y el
//     visitante no ve un botón que no lleva a ninguna parte.
//
// Los componentes CLIENTE no pueden importar esto (abre Postgres): reciben los
// enlaces ya resueltos como props. Ver app/enlaces/page.tsx.

import { rows, query, withTransaction } from './db';
import { getAjustes } from './settings';
import { SITE } from './site';
import { esTipoValido } from './tipos-enlace';

export interface Enlace {
  id: string;
  slug: string;
  tipo: string;
  etiqueta: string;
  descripcion: string;
  /** Lo que hay guardado, tal cual. Vacío es normal. */
  url: string;
  forma: 'boton' | 'circulo';
  orden: number;
  activo: boolean;
  destacado: boolean;
}

/** Un enlace listo para dibujar. */
export interface EnlacePublico {
  slug: string;
  tipo: string;
  etiqueta: string;
  descripcion: string;
  /** Vacío cuando `pendiente` es true. */
  href: string;
  destacado: boolean;
  /** Los internos ('/autos') no llevan target ni rel de enlace externo. */
  externo: boolean;
  /**
   * Todavía no tiene dirección. Se dibuja igual que los demás pero SIN enlace,
   * para que la página se vea completa mientras se consiguen las direcciones.
   * Quien no quiera enseñarlo así, lo apaga con «Visible en la página».
   */
  pendiente?: boolean;
}

const SELECT = `
  SELECT id, slug, tipo, etiqueta, descripcion, url, forma, orden, activo, destacado
  FROM enlaces`;

// ── Resolución de la URL ─────────────────────────────────────────────────────

/**
 * Esquemas admitidos en el campo URL.
 *
 * `javascript:` en un href ejecuta código en el navegador del visitante. Hoy
 * solo la dueña puede escribir acá, así que no es un agujero abierto — pero un
 * campo de texto que termina en un atributo href se valida SIEMPRE, porque el
 * día que esto se comparta con alguien más nadie se va a acordar de volver.
 */
function urlSegura(v: string): string | null {
  const s = v.trim();
  if (s === '') return null;
  // Ruta interna del propio sitio: '/', '/autos', '/propiedad/los-geranios-a'.
  // '//otrodominio.com' NO cuenta: son dos barras y el navegador lo trata como
  // dominio externo, que es justo lo que esta comprobación evita.
  if (s.startsWith('/') && !s.startsWith('//')) return s;
  return /^(https?|mailto|tel):/i.test(s) ? s : null;
}

/**
 * Lo que se guarda a partir de lo que se escribió en el panel.
 *
 * Devuelve la URL lista, o null si no hay forma de entenderla —y entonces la
 * Server Action avisa en vez de guardar—. Vacío es válido: significa «dedúcela
 * del contacto» o «este enlace todavía no tiene destino».
 *
 * EL PEGADO SIN https:// SE ARREGLA SOLO. Instagram y TikTok muestran los
 * perfiles como `tiktok.com/@cuenta`, y así es como se copian. Sin esta
 * corrección, el botón se guardaría, no aparecería en la página y no habría
 * ninguna pista de por qué: el error más caro es el que no se ve.
 */
export function normalizarUrl(v: string): string | null {
  const s = v.trim();
  if (s === '') return '';
  if (urlSegura(s)) return s;
  // `algo.dominio/loquesea` sin esquema y sin espacios: se asume https.
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(s)) return `https://${s}`;
  return null;
}

/** Saludo ya escrito del botón de WhatsApp. Que el visitante no tenga que
 *  redactar nada es la diferencia entre que escriba y que no. */
const SALUDO = `Hola, llegué desde ${SITE.url.replace('https://', '')}. Quisiera información sobre el alquiler.`;

interface Origenes {
  whatsapp: string | null;
  instagram: string | null;
  email: string | null;
  telefono: string | null;
}

function resolver(e: Enlace, o: Origenes): string | null {
  // normalizarUrl y no urlSegura: el panel ya guarda normalizado, pero una fila
  // que entre por otra vía —una siembra, una importación futura— con
  // `tiktok.com/@cuenta` sin esquema desaparecería de la página sin dejar
  // rastro. Acá se le pone el https y se muestra.
  const propia = normalizarUrl(e.url);
  if (propia) return propia;

  // Sin URL escrita: se intenta deducir del contacto del sitio.
  switch (e.tipo) {
    case 'whatsapp':
      return o.whatsapp
        ? `https://wa.me/${o.whatsapp}?text=${encodeURIComponent(SALUDO)}`
        : null;
    case 'instagram':
      return o.instagram ? urlSegura(o.instagram) : null;
    case 'correo':
      return o.email ? `mailto:${o.email}` : null;
    case 'telefono':
      return o.telefono ? `tel:${o.telefono.replace(/\s/g, '')}` : null;
    default:
      return null;
  }
}

// ── Lectura ──────────────────────────────────────────────────────────────────

/**
 * Lo que dibuja la página pública, ya partido en las dos formas.
 *
 * Una sola consulta y una sola lectura de ajustes: esta página se sirve desde
 * la bio de Instagram, así que es la que más rápido tiene que abrir de todo el
 * sitio.
 */
export async function getEnlacesPublicos(): Promise<{
  botones: EnlacePublico[];
  circulos: EnlacePublico[];
}> {
  const [filas, ajustes] = await Promise.all([
    rows<Enlace>(`${SELECT} WHERE activo ORDER BY orden, created_at`),
    getAjustes(),
  ]);

  const origenes: Origenes = {
    whatsapp: ajustes.whatsapp.replace(/\D/g, '') || null,
    instagram: ajustes.instagram.trim() || null,
    email: ajustes.email.trim() || null,
    telefono: ajustes.telefono.trim() || null,
  };

  const botones: EnlacePublico[] = [];
  const circulos: EnlacePublico[] = [];

  for (const e of filas) {
    const href = resolver(e, origenes);
    // Los que no tienen dirección TAMBIÉN salen, dibujados sin enlace. Se probó
    // esconderlos —un botón que no lleva a ninguna parte es un botón roto— pero
    // la página queda coja mientras se consiguen las direcciones, y el
    // interruptor «Visible en la página» de cada enlace ya permite apagar el
    // que no se quiera enseñar todavía. La decisión es del panel, no del código.
    const listo: EnlacePublico = {
      slug: e.slug,
      tipo: e.tipo,
      etiqueta: e.etiqueta,
      descripcion: e.descripcion,
      href: href ?? '',
      destacado: e.destacado,
      externo: href ? !href.startsWith('/') : false,
      pendiente: !href,
    };
    (e.forma === 'circulo' ? circulos : botones).push(listo);
  }

  return { botones, circulos };
}

/** Enlace en el panel: la fila cruda más lo que hace falta para gestionarla. */
export interface EnlaceAdmin extends Enlace {
  /** Null cuando no tiene destino: es lo que el panel marca como pendiente. */
  href: string | null;
  /** Toques en los últimos 30 días. */
  clics: number;
}

export async function getEnlacesAdmin(): Promise<EnlaceAdmin[]> {
  const [filas, ajustes, clics] = await Promise.all([
    rows<Enlace>(`${SELECT} ORDER BY orden, created_at`),
    getAjustes(),
    rows<{ slug: string; n: string }>(
      `SELECT meta->>'q' slug, count(*) n FROM events
       WHERE kind = 'enlace' AND created_at > now() - interval '30 days'
       GROUP BY 1`,
    ),
  ]);

  const origenes: Origenes = {
    whatsapp: ajustes.whatsapp.replace(/\D/g, '') || null,
    instagram: ajustes.instagram.trim() || null,
    email: ajustes.email.trim() || null,
    telefono: ajustes.telefono.trim() || null,
  };
  const porSlug = new Map(clics.map((c) => [c.slug, Number(c.n)]));

  return filas.map((e) => ({
    ...e,
    href: resolver(e, origenes),
    clics: porSlug.get(e.slug) ?? 0,
  }));
}

/** Cuántos enlaces activos quedaron sin destino. Lo usa /admin/pendientes. */
export async function contarEnlacesSinDestino(): Promise<number> {
  return (await getEnlacesAdmin()).filter((e) => e.activo && !e.href).length;
}

// ── Escritura ────────────────────────────────────────────────────────────────

/**
 * Slug a partir de la etiqueta, con sufijo si ya existe.
 *
 * El slug es la identidad del enlace para las métricas y no cambia nunca: solo
 * se calcula al CREAR. Renombrar el botón no debe partir en dos su historial de
 * clics (ver el comentario de la migración 009).
 */
export async function slugLibre(etiqueta: string): Promise<string> {
  const base =
    etiqueta
      .toLowerCase()
      .normalize('NFD')
      // Tildes: NFD las separa en marcas combinantes y acá se van, así que
      // «Cómo llegar» produce 'como-llegar' y no 'c-mo-llegar'.
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'enlace';

  const usados = new Set(
    (await rows<{ slug: string }>(`SELECT slug FROM enlaces`)).map((r) => r.slug),
  );
  if (!usados.has(base)) return base;

  for (let i = 2; i < 200; i++) {
    if (!usados.has(`${base}-${i}`)) return `${base}-${i}`;
  }
  // Inalcanzable en la práctica; mejor un slug feo que una excepción.
  return `${base}-${usados.size + 1}`;
}

export interface DatosEnlace {
  tipo: string;
  etiqueta: string;
  descripcion: string;
  url: string;
  forma: 'boton' | 'circulo';
  activo: boolean;
  destacado: boolean;
}

/** Normaliza lo que llega del formulario. Cae a valores válidos en vez de
 *  lanzar: un `tipo` desconocido solo puede venir de un POST manipulado. */
function saneado(d: DatosEnlace): DatosEnlace {
  return {
    tipo: esTipoValido(d.tipo) ? d.tipo : 'sitio',
    etiqueta: d.etiqueta.trim().slice(0, 80),
    descripcion: d.descripcion.trim().slice(0, 160),
    url: d.url.trim().slice(0, 500),
    forma: d.forma === 'circulo' ? 'circulo' : 'boton',
    activo: d.activo,
    destacado: d.destacado,
  };
}

export async function crearEnlace(d: DatosEnlace): Promise<void> {
  const s = saneado(d);
  const slug = await slugLibre(s.etiqueta);
  const [{ max }] = await rows<{ max: number | null }>(
    `SELECT max(orden) max FROM enlaces`,
  );

  await query(
    `INSERT INTO enlaces (slug, tipo, etiqueta, descripcion, url, forma, orden, activo, destacado)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    // Al final de la lista, con hueco de 10: reordenar no obliga a renumerar.
    [slug, s.tipo, s.etiqueta, s.descripcion, s.url, s.forma, (max ?? 0) + 10, s.activo, s.destacado],
  );
  if (s.destacado) await dejarUnSoloDestacado(slug);
}

export async function actualizarEnlace(id: string, d: DatosEnlace): Promise<void> {
  const s = saneado(d);
  const [fila] = await rows<{ slug: string }>(
    `UPDATE enlaces
        SET tipo = $2, etiqueta = $3, descripcion = $4, url = $5,
            forma = $6, activo = $7, destacado = $8, updated_at = now()
      WHERE id = $1
      RETURNING slug`,
    [id, s.tipo, s.etiqueta, s.descripcion, s.url, s.forma, s.activo, s.destacado],
  );
  if (fila && s.destacado) await dejarUnSoloDestacado(fila.slug);
}

/** Un destacado y solo uno: el botón con borde de tinta es el que dice «esto es
 *  lo que quiero que toques». Dos destacados no destacan ninguno. */
async function dejarUnSoloDestacado(slug: string): Promise<void> {
  await query(`UPDATE enlaces SET destacado = false WHERE slug <> $1`, [slug]);
}

export async function borrarEnlace(id: string): Promise<void> {
  await query(`DELETE FROM enlaces WHERE id = $1`, [id]);
}

/**
 * Sube o baja un enlace intercambiando su `orden` con el vecino.
 *
 * En transacción: son dos UPDATE que solo tienen sentido juntos. A medias
 * dejarían dos enlaces con el mismo orden y un vecino desaparecido de su sitio.
 */
export async function moverEnlace(id: string, hacia: 'arriba' | 'abajo'): Promise<void> {
  await withTransaction(async (q) => {
    const { rows: actual } = await q(
      `SELECT id, orden FROM enlaces WHERE id = $1`,
      [id],
    );
    if (actual.length === 0) return;
    const { orden } = actual[0] as { orden: number };

    // El vecino inmediato en la dirección pedida. El desempate por created_at
    // repite el ORDER BY de las listas: sin él, dos enlaces con el mismo orden
    // se intercambiarían al azar.
    const { rows: vecino } = await q(
      hacia === 'arriba'
        ? `SELECT id, orden FROM enlaces WHERE orden < $1 ORDER BY orden DESC, created_at DESC LIMIT 1`
        : `SELECT id, orden FROM enlaces WHERE orden > $1 ORDER BY orden ASC,  created_at ASC  LIMIT 1`,
      [orden],
    );
    if (vecino.length === 0) return; // Ya está en la punta.

    const v = vecino[0] as { id: string; orden: number };
    await q(`UPDATE enlaces SET orden = $2 WHERE id = $1`, [id, v.orden]);
    await q(`UPDATE enlaces SET orden = $2 WHERE id = $1`, [v.id, orden]);
  });
}


/** Los apartamentos publicados con su portada y su anuncio de Airbnb, para el
 *  carrusel que se despliega bajo «Reservar por Airbnb». Sin URL salen igual
 *  (portada + nombre) pero sin enlace, como el resto de la página. */
export interface AnuncioAirbnb { slug: string; nombre: string; zona: string; portada: string | null; url: string; rating: number | null; resenas: number; detalle: string }
export async function getAnunciosAirbnb(): Promise<AnuncioAirbnb[]> {
  const rs = await rows<{ slug: string; name: string; zone: string; cover: string | null; airbnb_url: string; airbnb_rating: number | null; airbnb_resenas: number; airbnb_detalle: string }>(
    `SELECT p.slug, p.name, z.name AS zone, p.airbnb_url, p.airbnb_rating, p.airbnb_resenas, p.airbnb_detalle,
            (SELECT i.path FROM property_images i WHERE i.property_id = p.id ORDER BY i.is_cover DESC, i.sort_order LIMIT 1) AS cover
       FROM properties p LEFT JOIN zones z ON z.slug = p.zone_slug
      WHERE p.is_published ORDER BY (p.airbnb_url <> '') DESC, p.sort_order, p.name`);
  return rs.map((r) => ({ slug: r.slug, nombre: r.name, zona: r.zone ?? '', portada: r.cover, url: urlSegura(r.airbnb_url ?? '') ?? '', rating: r.airbnb_rating == null ? null : Number(r.airbnb_rating), resenas: Number(r.airbnb_resenas ?? 0), detalle: r.airbnb_detalle ?? '' }));
}
