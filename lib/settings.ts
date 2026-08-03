// Contenido del sitio editable desde el panel. SOLO SERVIDOR.
//
// La base guarda texto plano en site_settings (clave/valor). Este módulo es el
// que sabe qué claves existen, qué significan y cuál es su valor por defecto.
//
// REGLA: si no hay fila, se usa el valor por defecto de acá. Nunca se muestra
// vacío por una clave ausente, y borrar la fila devuelve el original — que es
// exactamente lo que hoy está escrito a mano en el código.
//
// Los componentes CLIENTE no pueden importar esto (abre Postgres). Reciben lo
// que necesiten por props desde un Server Component. Ver app/page.tsx.

import { rows, query } from './db';

interface Campo<K extends string = string> {
  key: K;
  label: string;
  tipo: 'texto' | 'imagen';
  /** Texto de apoyo bajo el campo. No todos lo necesitan. */
  ayuda?: string;
  /** Lo que muestra el sitio si no hay fila en la base. */
  porDefecto: string;
}

/**
 * Campos editables, en el orden en que aparecen en el formulario del panel.
 *
 * `satisfies` y no `: Campo[]`: así se comprueba la forma de cada entrada pero
 * se conservan las claves literales, que es lo que hace que ClaveAjuste sea una
 * unión de cadenas concretas y no `string` — y con eso el tipo Ajustes obliga a
 * que toda clave usada exista de verdad.
 */
export const CAMPOS = [
  {
    key: 'hero_image',
    label: 'Foto de portada',
    tipo: 'imagen',
    ayuda:
      'La primera imagen que ve el visitante, a pantalla completa. Horizontal y luminosa; se optimiza sola a WebP.',
    porDefecto: '/images/photo-1507525428034.webp',
  },
  {
    key: 'hero_image_alt',
    label: 'Descripción de la foto',
    tipo: 'texto',
    ayuda:
      'Para lectores de pantalla y para Google Imágenes. Menciona el lugar y la isla.',
    porDefecto: 'Playa del Caribe en Isla de Margarita, Venezuela',
  },
  {
    key: 'hero_kicker',
    label: 'Línea sobre el titular',
    tipo: 'texto',
    porDefecto: 'Isla de Margarita · Venezuela',
  },
  {
    key: 'hero_subtitulo',
    label: 'Frase bajo el titular',
    tipo: 'texto',
    ayuda: 'Una sola frase. Concreta, no publicitaria.',
    porDefecto:
      'Por noche o por mes, en dólares y hablando directo con quien te recibe.',
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    tipo: 'texto',
    ayuda:
      'Solo dígitos con código de país, sin + ni espacios: 584121234567. Es lo que enciende TODOS los botones de reservar del sitio.',
    porDefecto: '',
  },
  {
    key: 'email',
    label: 'Correo de contacto',
    tipo: 'texto',
    ayuda: 'Aparece en el footer y en los datos estructurados de Google.',
    porDefecto: '',
  },
  {
    key: 'telefono',
    label: 'Teléfono',
    tipo: 'texto',
    ayuda: 'Formato internacional: +58 295 000 0000. Opcional.',
    porDefecto: '',
  },
  {
    key: 'direccion',
    label: 'Dirección física',
    tipo: 'texto',
    ayuda:
      'Suma para el SEO local y para Google Business Profile. Puede ser la zona sin número exacto.',
    porDefecto: '',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    tipo: 'texto',
    ayuda: 'URL completa. Refuerza la identidad de la marca ante Google.',
    porDefecto: '',
  },
] as const satisfies readonly Campo[];

export type ClaveAjuste = (typeof CAMPOS)[number]['key'];

/**
 * La misma lista, con el tipo ENSANCHADO, para recorrerla en el formulario.
 *
 * CAMPOS conserva tipos literales por el `as const`, y eso hace que `ayuda` solo
 * exista en los miembros que la traen: al recorrer el array TypeScript se queja
 * de leerla. Acá se aplana a Campo<ClaveAjuste>, donde `ayuda` es opcional y
 * `key` sigue siendo la unión concreta — así indexar Ajustes con ella es válido.
 */
export const CAMPOS_UI: readonly Campo<ClaveAjuste>[] = CAMPOS;

export type Ajustes = Record<ClaveAjuste, string>;

const PORDEFECTO = Object.fromEntries(
  CAMPOS.map((c) => [c.key, c.porDefecto]),
) as Ajustes;

/**
 * Todo el contenido del sitio, con los valores por defecto rellenados.
 *
 * Una sola consulta: se llama en el build de cada página estática y en cada
 * revalidación, así que no conviene una consulta por clave.
 */
export async function getAjustes(): Promise<Ajustes> {
  const rs = await rows<{ key: string; value: string }>(
    `SELECT key, value FROM site_settings`,
  );
  const guardados = Object.fromEntries(
    rs
      // Una clave que ya no existe en CAMPOS se ignora en vez de colarse en el
      // objeto: pasa si algún día se retira un campo y queda su fila.
      .filter((r) => r.key in PORDEFECTO)
      // Vacío = "no configurado", así que cae al valor por defecto.
      .filter((r) => r.value.trim() !== '')
      .map((r) => [r.key, r.value]),
  );
  return { ...PORDEFECTO, ...guardados };
}

/**
 * Datos de contacto, en la forma que ya esperaban lib/schema.ts y el footer.
 *
 * Sustituye a la constante CONTACT de lib/site.ts, que estaba en null a mano.
 * `hasContactInfo` decide si el footer muestra su franja de contacto.
 */
export interface Contacto {
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  streetAddress: string | null;
  sameAs: string[];
}

export function contactoDesde(a: Ajustes): Contacto {
  const oNull = (v: string) => (v.trim() === '' ? null : v.trim());
  return {
    phone: oNull(a.telefono),
    // Solo dígitos: si alguien escribe '+58 412 123 4567' el enlace de wa.me se
    // rompería. Se limpia acá en vez de confiar en cómo se escribió.
    whatsapp: oNull(a.whatsapp.replace(/\D/g, '')),
    email: oNull(a.email),
    streetAddress: oNull(a.direccion),
    sameAs: [a.instagram].map((s) => s.trim()).filter(Boolean),
  };
}

export async function getContacto(): Promise<Contacto> {
  return contactoDesde(await getAjustes());
}

/** Guarda un puñado de claves. Vacío BORRA la fila: vuelve al valor original. */
export async function guardarAjustes(
  entradas: { key: ClaveAjuste; value: string }[],
): Promise<void> {
  for (const { key, value } of entradas) {
    if (value.trim() === '') {
      await query(`DELETE FROM site_settings WHERE key = $1`, [key]);
    } else {
      await query(
        `INSERT INTO site_settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()`,
        [key, value.trim()],
      );
    }
  }
}
