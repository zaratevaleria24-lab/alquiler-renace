// Guardado de fotos subidas desde el panel. SOLO SERVIDOR.
//
// DÓNDE VAN LOS ARCHIVOS (desde el 2026-09-15): a los DOS sitios.
//
//   1. Al bucket de Cloudflare R2, que es de donde las sirve el sitio. La base
//      guarda la URL completa: https://media.margaritarenace.com.ve/<clave>.
//      Se sirven desde el borde de Cloudflare, no desde este servidor.
//   2. Al disco, en /var/www/margarita-uploads, como antes.
//
// LA COPIA EN DISCO NO SOBRA, y no es por desconfianza del bucket: es lo que
// recoge el respaldo nocturno (`uploads-*.tar.gz`). Sin ella, las fotos serían
// lo único del proyecto sin ninguna copia bajo nuestro control. Y si el bucket
// falla en mitad de una subida, la foto ya está en disco y se sirve desde acá
// como hasta ayer, en vez de perderse.
//
// SI NO HAY BUCKET CONFIGURADO todo esto se salta solo y el módulo se comporta
// igual que siempre: disco y rutas /uploads/…, que nginx sigue sirviendo. Las
// fotos anteriores al 2026-09-15 conservan esa ruta y no hace falta tocarlas.
//
// ⚠️ La regla del servidor sigue en pie: nunca servir nada desde /root/ por
// nginx, y nunca apuntar una imagen a un dominio ajeno — ver lib/r2.ts sobre
// por qué el bucket va por un subdominio nuestro y no por una URL r2.dev.
//
// OPTIMIZACIÓN: toda foto se convierte a WebP redimensionada (ancho máx 1600,
// sin agrandar) con sharp — el mismo criterio del commit "imagenes a WebP" que
// optimizó las 26 originales. Una foto de teléfono de 4MB queda en ~150-300KB,
// que es la diferencia entre cargar o no con una conexión venezolana.

import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

import { borrarDeR2, claveDeUrl, subirAR2 } from './r2';

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? '/var/www/margarita-uploads';
/** Prefijo público que sirve nginx para lo que se quedó en disco. */
const PUBLIC_PREFIX = '/uploads';

/**
 * Deja un archivo en disco y en el bucket, y devuelve la dirección con la que
 * hay que guardarlo en la base: la del bucket si llegó, y si no la local.
 *
 * Se escriben los MISMOS bytes en los dos sitios. Antes el disco recibía
 * `sharp(webp).toFile(...)`, que volvía a codificar lo ya codificado: una
 * pasada de más y una pérdida de calidad para nada.
 */
async function publicar(clave: string, cuerpo: Buffer): Promise<string> {
  const fisico = path.join(UPLOADS_DIR, clave);
  await mkdir(path.dirname(fisico), { recursive: true });
  await writeFile(fisico, cuerpo);

  const url = await subirAR2(clave, cuerpo, 'image/webp');
  return url ?? `${PUBLIC_PREFIX}/${clave}`;
}

const MAX_WIDTH = 1600;
const WEBP_QUALITY = 78;
/** Techo por archivo ANTES de optimizar. El bodySizeLimit global es 15MB. */
export const MAX_FOTO_BYTES = 12 * 1024 * 1024;

export class FotoInvalidaError extends Error {}

/**
 * Convierte y guarda UNA foto. Devuelve la ruta pública para property_images.
 *
 * El nombre del archivo se genera acá (timestamp + índice): jamás se usa el
 * nombre que manda el navegador, que puede traer rutas, unicode raro o
 * colisiones. La extensión siempre es .webp porque siempre se reencodea —
 * reencodear también descarta cualquier payload que viniera en un archivo
 * disfrazado de imagen.
 */
export async function guardarFoto(
  file: File,
  propertySlug: string,
  indice: number,
  raiz: 'properties' | 'guia' = 'properties',
): Promise<string> {
  if (file.size === 0) throw new FotoInvalidaError('archivo vacío');
  if (file.size > MAX_FOTO_BYTES) {
    throw new FotoInvalidaError('la foto pesa más de 12MB');
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let webp: Buffer;
  try {
    webp = await sharp(buffer)
      .rotate() // aplica la orientación EXIF (las fotos de teléfono la traen)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch {
    // sharp no lo pudo decodificar: no era una imagen.
    throw new FotoInvalidaError('el archivo no es una imagen válida');
  }

  // El slug viene de NUESTRA base (validado al crear), pero se sanea igual:
  // defensa en profundidad contra un path traversal si algún día cambia el
  // origen del dato.
  const carpeta = propertySlug.replace(/[^a-z0-9-]/g, '');
  const nombre = `${Date.now()}-${indice}.webp`;

  // La miniatura va primero: si falla, mejor enterarse antes de publicar la
  // grande y dejar una ficha de guía con una tarjeta rota.
  if (raiz === 'guia') {
    const mini = await sharp(webp)
      .resize({ width: 480, withoutEnlargement: true })
      .webp({ quality: 70 })
      .toBuffer();
    await publicar(`${raiz}/${carpeta}/${nombre.replace(/\.webp$/, '-s.webp')}`, mini);
  }

  return publicar(`${raiz}/${carpeta}/${nombre}`, webp);
}

/**
 * Guarda una imagen del SITIO (portada, logo…), no de una propiedad.
 *
 * Va a su propia carpeta y con nombre por fecha en vez de sobreescribir: si la
 * dueña sube una portada peor, la anterior sigue en disco y basta con volver a
 * apuntar el ajuste. Además evita que el navegador siga mostrando la vieja por
 * caché, que es lo que pasaría reusando el mismo nombre.
 *
 * El hero es la imagen más grande del sitio y su LCP, así que se permite más
 * ancho que en las fotos de propiedad.
 */
export async function guardarImagenSitio(
  file: File,
  clave: string,
): Promise<string> {
  if (file.size === 0) throw new FotoInvalidaError('archivo vacío');
  if (file.size > MAX_FOTO_BYTES) {
    throw new FotoInvalidaError('la imagen pesa más de 12MB');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let webp: Buffer;
  try {
    webp = await sharp(buffer)
      .rotate()
      .resize({ width: 2000, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch {
    throw new FotoInvalidaError('el archivo no es una imagen válida');
  }

  const nombre = `${clave.replace(/[^a-z0-9_-]/g, '')}-${Date.now()}.webp`;
  return publicar(`sitio/${nombre}`, webp);
}

/**
 * Borra el archivo de una foto subida, en el bucket y en disco.
 *
 * Acepta las dos formas que puede tener una fila: la URL del bucket (desde el
 * 2026-09-15) y la ruta /uploads/… de antes. Las fotos históricas de la semilla
 * viven en public/ y van con el repo: de esas solo se borra la fila.
 *
 * Si la foto es de la guía, arrastra su miniatura `-s.webp`. Sin esto quedarían
 * huérfanas acumulándose en el bucket, que además se paga por lo que ocupa.
 *
 * ⚠️ Borrar del bucket NO la quita de la vista enseguida: el borde de
 * Cloudflare la sigue sirviendo. El porqué y qué haría falta, en lib/r2.ts.
 */
export async function borrarArchivoFoto(publicPath: string): Promise<void> {
  const clave =
    claveDeUrl(publicPath) ??
    (publicPath.startsWith(`${PUBLIC_PREFIX}/`)
      ? publicPath.slice(PUBLIC_PREFIX.length + 1)
      : null);
  if (!clave) return;

  const claves = [clave];
  if (clave.startsWith('guia/')) {
    claves.push(clave.replace(/\.webp$/, '-s.webp'));
  }

  for (const k of claves) {
    await borrarDeR2(k);

    const fisico = path.join(UPLOADS_DIR, k);
    // path.join normaliza: si tras normalizar se salió de UPLOADS_DIR, era un
    // intento de traversal guardado en la base — no se toca.
    if (!fisico.startsWith(UPLOADS_DIR + path.sep)) continue;
    await unlink(fisico).catch(() => {
      // Si el archivo ya no existe, borrar la fila igual es lo correcto.
    });
  }
}

/**
 * Descarga una foto de una URL, la reencodea a WebP y la guarda bajo
 * prospectos/<carpeta>/. Para los anuncios de Marketplace: sus URLs de
 * Facebook caducan en menos de dos horas y Venezuela bloquea ese CDN, así que
 * si no se copia al servidor en el momento, la foto se pierde. Devuelve la
 * ruta pública, o null si la URL ya no sirve (no es error: es lo esperable).
 */
export async function guardarFotoRemota(
  url: string,
  carpeta: string,
  indice: number,
  raiz: 'prospectos' | 'guia' = 'prospectos',
): Promise<string | null> {
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36' },
    });
    if (!r.ok) return null;
    const buffer = Buffer.from(await r.arrayBuffer());
    if (buffer.length === 0 || buffer.length > MAX_FOTO_BYTES) return null;
    const webp = await sharp(buffer)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    const dir = carpeta.replace(/[^a-z0-9-]/gi, '');
    const nombre = `${indice}.webp`;
    // Miniatura de 480px para las tarjetas: 30 KB en vez de 300. La grande queda
    // para la galería. Ver miniatura() en lib/guia-comun.ts.
    const mini = await sharp(webp)
      .resize({ width: 480, withoutEnlargement: true })
      .webp({ quality: 70 })
      .toBuffer();
    await publicar(`${raiz}/${dir}/${nombre.replace(/\.webp$/, '-s.webp')}`, mini);
    return publicar(`${raiz}/${dir}/${nombre}`, webp);
  } catch {
    return null;
  }
}
