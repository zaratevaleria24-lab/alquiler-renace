// Guardado de fotos subidas desde el panel. SOLO SERVIDOR.
//
// DÓNDE VIVEN LOS ARCHIVOS: /var/www/margarita-uploads, NO dentro del proyecto.
// Es la regla del servidor ("nunca servir nada desde /root/ vía nginx"): nginx
// sirve /uploads/* directo desde /var/www con cache largo, sin pasar por Node.
// La base guarda la ruta pública (/uploads/properties/<slug>/<archivo>.webp);
// el matcher del middleware ya excluye /uploads.
//
// OPTIMIZACIÓN: toda foto se convierte a WebP redimensionada (ancho máx 1600,
// sin agrandar) con sharp — el mismo criterio del commit "imagenes a WebP" que
// optimizó las 26 originales. Una foto de teléfono de 4MB queda en ~150-300KB,
// que es la diferencia entre cargar o no con una conexión venezolana.

import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? '/var/www/margarita-uploads';
/** Prefijo público que sirve nginx. */
const PUBLIC_PREFIX = '/uploads';

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
  const dirFisico = path.join(UPLOADS_DIR, 'properties', carpeta);

  await mkdir(dirFisico, { recursive: true });
  await sharp(webp).toFile(path.join(dirFisico, nombre));

  return `${PUBLIC_PREFIX}/properties/${carpeta}/${nombre}`;
}

/**
 * Borra el archivo físico de una foto subida. Solo toca rutas bajo /uploads:
 * las fotos históricas del seed viven en public/ (van con el repo) y de esas
 * solo se borra la fila en la base.
 */
export async function borrarArchivoFoto(publicPath: string): Promise<void> {
  if (!publicPath.startsWith(`${PUBLIC_PREFIX}/`)) return;

  const relativo = publicPath.slice(PUBLIC_PREFIX.length + 1);
  const fisico = path.join(UPLOADS_DIR, relativo);
  // path.join normaliza: si tras normalizar se salió de UPLOADS_DIR, era un
  // intento de traversal guardado en la base — no se toca.
  if (!fisico.startsWith(UPLOADS_DIR + path.sep)) return;

  await unlink(fisico).catch(() => {
    // Si el archivo ya no existe, borrar la fila igual es lo correcto.
  });
}
