// Lo que falta por llenar, en un solo lugar. SOLO SERVIDOR.
//
// POR QUÉ EXISTE: los pendientes estaban repartidos como avisos grandes en las
// pantallas de trabajo —el WhatsApp ocupaba media pantalla del inicio todos los
// días— y aun así los que NO se detectan solos (Google Business, Search Console)
// no aparecían en ninguna parte. Repartidos molestan y a la vez se olvidan.
//
// Acá se calculan TODOS desde el estado real de la base, con su motivo y con
// dónde se arreglan. Nada de listas escritas a mano que se quedan viejas.
//
// Los pendientes que no son del sitio (abrir una ficha de Google, verificar el
// dominio) no se pueden detectar: esos se marcan a mano y el visto se guarda en
// site_settings con el prefijo `hecho_`.

import { query, rows } from './db';
import { getAjustes } from './settings';
import { getInventoryHealth } from './queries';

export type Urgencia = 'bloquea' | 'importa' | 'cuando-puedas';

export interface Pendiente {
  clave: string;
  titulo: string;
  /** Por qué importa. Sin esto una lista de tareas es solo una lista. */
  motivo: string;
  urgencia: Urgencia;
  /** Ruta del panel donde se resuelve, si se resuelve acá. */
  donde?: string;
  /** Enlace externo, cuando la tarea es fuera del sitio. */
  externo?: { url: string; texto: string };
  /** Los manuales se pueden tachar a mano; los detectados desaparecen solos. */
  manual?: boolean;
  hecho?: boolean;
}

/** Tareas que el sitio no puede comprobar por su cuenta. */
const MANUALES: Omit<Pendiente, 'hecho' | 'manual'>[] = [
  {
    clave: 'gbp',
    titulo: 'Abrir la ficha de Google del negocio',
    motivo:
      'Es el 32% del posicionamiento local y es gratis. Configúrala como negocio con zona de servicio para no publicar tu dirección.',
    urgencia: 'bloquea',
    externo: {
      url: 'https://business.google.com/',
      texto: 'business.google.com',
    },
  },
  {
    clave: 'whatsapp_business',
    titulo: 'Pasar el WhatsApp a WhatsApp Business',
    motivo:
      'Te da catálogo, respuestas rápidas y etiquetas para no perder a nadie entre conversaciones.',
    urgencia: 'importa',
  },
  {
    clave: 'search_console',
    titulo: 'Verificar el dominio en Google Search Console',
    motivo:
      'Es la única forma de ver qué búsquedas traen tráfico de verdad. El hueco para el código está en app/layout.tsx.',
    urgencia: 'importa',
    externo: {
      url: 'https://search.google.com/search-console',
      texto: 'search.google.com/search-console',
    },
  },
  {
    clave: 'cloudflare_strict',
    titulo: 'Pasar Cloudflare a SSL «Full (strict)»',
    motivo:
      'El origen ya tiene certificado válido de Let’s Encrypt, así que es seguro y cierra un hueco.',
    urgencia: 'cuando-puedas',
  },
];

const ORDEN: Record<Urgencia, number> = {
  bloquea: 0,
  importa: 1,
  'cuando-puedas': 2,
};

export const ETIQUETA_URGENCIA: Record<Urgencia, string> = {
  bloquea: 'Bloquea el negocio',
  importa: 'Importa',
  'cuando-puedas': 'Cuando puedas',
};

export async function getPendientes(): Promise<Pendiente[]> {
  const [ajustes, health, hechos] = await Promise.all([
    getAjustes(),
    getInventoryHealth(),
    rows<{ key: string }>(
      `SELECT key FROM site_settings WHERE key LIKE 'hecho_%'`,
    ).then((rs) => new Set(rs.map((r) => r.key.slice('hecho_'.length)))),
  ]);

  const lista: Pendiente[] = [];

  // ── Detectados desde la base ─────────────────────────────────────────────
  if (ajustes.whatsapp.trim() === '') {
    lista.push({
      clave: 'wa',
      titulo: 'Poner tu número de WhatsApp',
      motivo:
        'Sin él, TODOS los botones de reservar del sitio están apagados: un interesado no tiene por dónde escribirte. Es el cambio que más mueve la aguja.',
      urgencia: 'bloquea',
      donde: '/admin/contenido',
    });
  }
  if (ajustes.email.trim() === '') {
    lista.push({
      clave: 'email',
      titulo: 'Poner un correo de contacto',
      motivo:
        'Aparece en el footer y en los datos estructurados que lee Google. Es una vía más para quien no usa WhatsApp.',
      urgencia: 'importa',
      donde: '/admin/contenido',
    });
  }
  if (ajustes.instagram.trim() === '') {
    lista.push({
      clave: 'instagram',
      titulo: 'Enlazar tu Instagram',
      motivo:
        'Refuerza tu identidad ante Google (se emite como `sameAs`) y la antigüedad del perfil es una prueba de confianza que no se puede falsificar.',
      urgencia: 'importa',
      donde: '/admin/contenido',
    });
  }
  if (health.relleno > 0) {
    lista.push({
      clave: 'relleno',
      titulo: `Retirar los ${health.relleno} listados de relleno`,
      motivo:
        'Tienen anfitriones inventados, fotos de stock y valoraciones que no vienen de ninguna reseña. Es el mayor lastre de posicionamiento del sitio, y en respuestas de IA es peor: los motores que verifican datos descubren que no existen y dejan de citarte.',
      urgencia: 'importa',
      donde: '/admin/propiedades',
    });
  }
  if (health.vehiculos === 0) {
    lista.push({
      clave: 'vehiculos',
      titulo: 'Cargar los vehículos',
      motivo:
        'El titular del sitio dice «Apartamentos y carros» y la página /autos existe, pero el catálogo está vacío. Con la tarifa, el depósito y el mínimo de días a la vista le ganas a casi todos los de la isla.',
      urgencia: 'importa',
      donde: '/admin/vehiculos',
    });
  }
  if (health.sinFotoPropia > 0) {
    lista.push({
      clave: 'sin_foto',
      titulo: `${health.sinFotoPropia} alojamientos sin foto propia`,
      motivo:
        'Usan imágenes de stock, que no generan confianza y no posicionan en Google Imágenes. Las tuyas, aunque imperfectas, sí — y son tu prueba de que la propiedad existe.',
      urgencia: 'cuando-puedas',
      donde: '/admin/propiedades',
    });
  }

  // ── Manuales ─────────────────────────────────────────────────────────────
  for (const m of MANUALES) {
    lista.push({ ...m, manual: true, hecho: hechos.has(m.clave) });
  }

  // Los tachados al final; el resto por urgencia.
  return lista.sort(
    (a, b) =>
      Number(a.hecho ?? false) - Number(b.hecho ?? false) ||
      ORDEN[a.urgencia] - ORDEN[b.urgencia],
  );
}

/** Cuántos quedan sin hacer. Alimenta el punto de aviso de la lateral. */
export async function contarPendientes(): Promise<number> {
  return (await getPendientes()).filter((p) => !p.hecho).length;
}

/** Marca o desmarca una tarea manual. */
export async function marcarPendiente(
  clave: string,
  hecho: boolean,
): Promise<void> {
  if (!MANUALES.some((m) => m.clave === clave)) return;
  if (hecho) {
    await query(
      `INSERT INTO site_settings (key, value) VALUES ($1, 'si')
       ON CONFLICT (key) DO UPDATE SET value = 'si', updated_at = now()`,
      [`hecho_${clave}`],
    );
  } else {
    await query(`DELETE FROM site_settings WHERE key = $1`, [`hecho_${clave}`]);
  }
}
