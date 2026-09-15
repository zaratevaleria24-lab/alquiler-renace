// Cloudflare R2: almacenamiento de las fotos del panel. SOLO SERVIDOR.
//
// QUÉ RESUELVE: hasta el 2026-09-15 las fotos subidas vivían solo en el disco
// de este servidor y las servía nginx. Ahora van también al bucket y se sirven
// desde `media.margaritarenace.com.ve`, que es un dominio NUESTRO con el borde
// de Cloudflare delante. Eso saca el tráfico de imágenes del servidor y las
// acerca al visitante.
//
// ⚠️ EL DOMINIO PROPIO NO ES UN CAPRICHO. Venezuela bloquea los dominios de CDN
// ajenos: en julio las fotos estaban en Unsplash y sencillamente no cargaban,
// hubo que bajarlas todas. Por eso el bucket se sirve por un subdominio del
// dominio del sitio y NUNCA por la URL `pub-….r2.dev` que R2 ofrece por su
// cuenta. Si algún día `R2_PUBLIC_URL` apunta a un dominio que no sea nuestro,
// se rompe el sitio para el público al que le hablamos.
//
// POR QUÉ NO SE USA EL SDK DE AWS: `@aws-sdk/client-s3` arrastra decenas de
// megas de dependencias para lo que acá son dos peticiones —PUT y DELETE— con
// una firma. Firmarla a mano son sesenta líneas y ninguna dependencia nueva, en
// la misma línea por la que el proyecto usa `pg` sin ORM. Este servidor comparte
// 3,7 GB con otros dos productos.
//
// LAS CREDENCIALES viven en /etc/margarita-renace/r2.env (600, fuera del repo),
// como el resto de secretos. Se leen al vuelo y se cachean: cambiarlas no
// obliga a `pm2 delete/start`, basta reiniciar.

import { createHash, createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';

interface Config {
  key: string;
  secret: string;
  bucket: string;
  endpoint: string;
  publico: string;
}

let cache: Config | null | undefined;

function config(): Config | null {
  if (cache !== undefined) return cache;
  try {
    const txt = readFileSync('/etc/margarita-renace/r2.env', 'utf8');
    const leer = (k: string) =>
      txt.match(new RegExp(`^${k}=\\s*(.+)$`, 'm'))?.[1].trim() ?? '';
    const c: Config = {
      key: leer('R2_ACCESS_KEY_ID'),
      secret: leer('R2_SECRET_ACCESS_KEY'),
      bucket: leer('R2_BUCKET'),
      endpoint: leer('R2_ENDPOINT').replace(/\/$/, ''),
      publico: leer('R2_PUBLIC_URL').replace(/\/$/, ''),
    };
    cache = Object.values(c).every(Boolean) ? c : null;
  } catch {
    cache = null; // sin archivo: el panel sigue guardando solo en disco
  }
  return cache;
}

/** ¿Hay bucket configurado? Si no, todo sigue funcionando contra el disco. */
export function r2Activo(): boolean {
  return config() !== null;
}

// ── Firma AWS SigV4 ─────────────────────────────────────────────────────────

const sha256 = (d: Buffer | string) =>
  createHash('sha256').update(d).digest('hex');
const hmac = (k: Buffer | string, d: string) =>
  createHmac('sha256', k).update(d).digest();

function cabecerasFirmadas(
  c: Config,
  metodo: 'PUT' | 'DELETE',
  clave: string,
  cuerpo: Buffer,
  tipo?: string,
): Record<string, string> {
  const host = new URL(c.endpoint).host;
  const t = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const fecha = t.slice(0, 8);
  const hash = sha256(cuerpo);

  // Cada segmento se codifica por separado: la barra separa y no se escapa.
  const ruta =
    `/${c.bucket}/` + clave.split('/').map(encodeURIComponent).join('/');

  // Las cabeceras firmadas van en orden alfabético y en minúsculas. El
  // content-type se firma solo cuando se manda, o la firma no cuadra.
  const cab: Record<string, string> = {
    host,
    'x-amz-content-sha256': hash,
    'x-amz-date': t,
  };
  if (tipo) cab['content-type'] = tipo;

  const nombres = Object.keys(cab).sort();
  const canonicas = nombres.map((n) => `${n}:${cab[n]}\n`).join('');
  const firmadas = nombres.join(';');

  const canonica = `${metodo}\n${ruta}\n\n${canonicas}\n${firmadas}\n${hash}`;
  const alcance = `${fecha}/auto/s3/aws4_request`;
  const porFirmar = `AWS4-HMAC-SHA256\n${t}\n${alcance}\n${sha256(canonica)}`;

  const clv = hmac(
    hmac(hmac(hmac(`AWS4${c.secret}`, fecha), 'auto'), 's3'),
    'aws4_request',
  );
  const firma = createHmac('sha256', clv).update(porFirmar).digest('hex');

  return {
    ...cab,
    Authorization:
      `AWS4-HMAC-SHA256 Credential=${c.key}/${alcance}, ` +
      `SignedHeaders=${firmadas}, Signature=${firma}`,
  };
}

function urlDe(c: Config, clave: string): string {
  return `${c.endpoint}/${c.bucket}/` +
    clave.split('/').map(encodeURIComponent).join('/');
}

// ── Operaciones ─────────────────────────────────────────────────────────────

/**
 * Sube un objeto y devuelve su URL pública, o `null` si no se pudo.
 *
 * Devuelve null en vez de lanzar A PROPÓSITO: quien llama ya guardó el archivo
 * en disco, así que un fallo del bucket debe degradar a servir desde el
 * servidor —como hasta ayer— y no romperle la subida a la dueña.
 *
 * EL `contentType` ES OBLIGATORIO y no un detalle: probando el 2026-09-15, un
 * objeto subido sin él quedó como `application/x-www-form-urlencoded`. Con ese
 * tipo el navegador puede descargar la imagen en vez de mostrarla y Google
 * Imágenes no la indexa.
 */
export async function subirAR2(
  clave: string,
  cuerpo: Buffer,
  contentType: string,
): Promise<string | null> {
  const c = config();
  if (!c) return null;
  try {
    const r = await fetch(urlDe(c, clave), {
      method: 'PUT',
      body: new Uint8Array(cuerpo),
      headers: cabecerasFirmadas(c, 'PUT', clave, cuerpo, contentType),
      signal: AbortSignal.timeout(30_000),
    });
    if (!r.ok) {
      console.error('[r2] no se pudo subir', clave, r.status, await r.text());
      return null;
    }
    return `${c.publico}/${clave}`;
  } catch (err) {
    console.error('[r2] error al subir', clave, err);
    return null;
  }
}

/**
 * Borra un objeto. No lanza: si falla, la fila de la base ya se borró y lo que
 * queda es un archivo huérfano en el bucket, no un panel roto.
 *
 * ⚠️ BORRAR DEL BUCKET NO LO QUITA DE LA VISTA ENSEGUIDA. La regla de caché de
 * Cloudflare guarda el objeto en el borde con un TTL de un año, así que la URL
 * sigue devolviendo la foto después de borrarla (comprobado el 2026-09-15). En
 * la práctica da igual: los nombres llevan marca de tiempo y no se reutilizan,
 * así que el sitio deja de enlazarla y nadie la pide. Solo importa si alguien
 * tiene el enlace directo. Para que desaparezca de verdad hace falta purgar la
 * caché, y eso pide OTRO token de Cloudflare con permiso de purga, que hoy no
 * existe.
 */
export async function borrarDeR2(clave: string): Promise<void> {
  const c = config();
  if (!c) return;
  try {
    const cuerpo = Buffer.alloc(0);
    const r = await fetch(urlDe(c, clave), {
      method: 'DELETE',
      headers: cabecerasFirmadas(c, 'DELETE', clave, cuerpo),
      signal: AbortSignal.timeout(20_000),
    });
    if (!r.ok && r.status !== 404) {
      console.error('[r2] no se pudo borrar', clave, r.status);
    }
  } catch (err) {
    console.error('[r2] error al borrar', clave, err);
  }
}

/** De una URL pública del bucket a su clave. `null` si no es del bucket. */
export function claveDeUrl(url: string): string | null {
  const c = config();
  if (!c || !url.startsWith(`${c.publico}/`)) return null;
  return decodeURIComponent(url.slice(c.publico.length + 1));
}

/** ¿Esta ruta guardada en la base la sirve el bucket? */
export function esDeR2(url: string): boolean {
  return claveDeUrl(url) !== null;
}
