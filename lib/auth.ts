// Autenticación del panel. SOLO SERVIDOR.
//
// Sin dependencias nuevas: se usa `crypto` de Node.
//
// POR QUÉ scrypt Y NO argon2: los paquetes de argon2 requieren compilación
// nativa, y este servidor ya sufrió un OOM compilando dependencias (3.7GB de RAM
// compartidos con otros dos productos en producción). scrypt viene incluido en
// Node, es memory-hard, y OWASP lo acepta junto a argon2 y bcrypt para
// contraseñas. Es una elección legítima, no un atajo.
//
// Lo que NUNCA se hace acá:
//   · Guardar la contraseña en claro, ni un hash rápido tipo SHA. Un SHA de
//     contraseñas se revienta con diccionario en minutos si la base se filtra.
//   · Guardar el token de sesión tal cual. Se guarda su hash, así que con la
//     base en la mano nadie puede fabricar una cookie válida.
//   · Comparar hashes con `===`. Se usa comparación en tiempo constante, porque
//     un `===` filtra información por el tiempo que tarda en fallar.

import {
  randomBytes,
  scrypt as scryptCb,
  createHash,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { cookies } from 'next/headers';
import { rows, query } from './db';

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options?: { N?: number; r?: number; p?: number; maxmem?: number },
) => Promise<Buffer>;

// Parámetros de coste. N=2^15 con r=8 usa ~32MB por hash y tarda ~100ms en este
// servidor: suficiente para que un ataque por diccionario sea impracticable, y
// lo bastante liviano para no competir con los tres productos en producción.
// maxmem se sube porque el límite por defecto de Node (32MB) queda justo.
const SCRYPT = { N: 32768, r: 8, p: 1, maxmem: 96 * 1024 * 1024 };
const KEYLEN = 64;

const SESSION_COOKIE = 'mr_session';
const SESSION_DAYS = 14;

/** Hash con sal aleatoria. Formato: scrypt$N$r$p$salt$hash, todo en base64. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEYLEN, SCRYPT);
  return [
    'scrypt',
    SCRYPT.N,
    SCRYPT.r,
    SCRYPT.p,
    salt.toString('base64'),
    hash.toString('base64'),
  ].join('$');
}

/**
 * Verifica una contraseña contra su hash almacenado.
 *
 * Los parámetros se leen DEL PROPIO HASH y no de la constante de arriba: así, si
 * algún día se sube el coste, las contraseñas viejas siguen validando en vez de
 * dejar a la dueña fuera de su panel.
 */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  try {
    const [scheme, N, r, p, saltB64, hashB64] = stored.split('$');
    if (scheme !== 'scrypt') return false;

    const salt = Buffer.from(saltB64, 'base64');
    const expected = Buffer.from(hashB64, 'base64');
    const actual = await scrypt(password, salt, expected.length, {
      N: Number(N),
      r: Number(r),
      p: Number(p),
      maxmem: SCRYPT.maxmem,
    });

    // Longitudes distintas harían lanzar a timingSafeEqual.
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    // Un hash corrupto o con formato raro es un fallo de autenticación, no una
    // excepción que deba propagarse a la pantalla de login.
    return false;
  }
}

/** Hash del token de sesión. SHA-256 basta: el token ya es aleatorio de 256 bits,
 *  así que no hay nada que un atacante pueda adivinar por diccionario. */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Hash de IP para el registro de intentos: permite limitar por origen sin
 *  guardar direcciones IP en claro. */
export function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

// ── Límite de intentos ──────────────────────────────────────────────────────

const MAX_FALLOS = 8;
// Techo por CUENTA. Más alto que el de IP a propósito: quien se equivoca de
// verdad lo hace desde una sola IP y choca primero con el límite de 8, así que
// este solo entra en juego cuando los intentos llegan repartidos entre varios
// orígenes — que es exactamente la forma de un ataque.
const MAX_FALLOS_CUENTA = 15;
const VENTANA_MINUTOS = 15;

/**
 * ¿Hay que rechazar este intento sin llegar a comprobar la contraseña?
 *
 * El panel queda expuesto a internet, así que esto no es opcional. Se cuentan
 * solo los FALLOS: un login correcto no consume cupo.
 *
 * DOS CONTADORES, NO UNO:
 *   · por hash de IP — frena la fuerza bruta desde un origen.
 *   · por cuenta — frena la que viene repartida entre muchos orígenes. El
 *     límite por IP solo no la para: cada IP gasta sus 8 y ninguna se bloquea.
 *     Hasta el 2026-07-29 además era esquivable del todo, porque la cabecera
 *     CF-Connecting-IP de la que sale el hash la mandaba el cliente y nginx la
 *     reenviaba tal cual (arreglado en el vhost del panel).
 *
 * Las dos cuentas van en UNA consulta: son dos agregados sobre la misma tabla y
 * la misma ventana, y este código corre en la ruta de cada intento de login.
 */
export async function estaBloqueado(
  ipHash: string,
  email?: string | null,
): Promise<boolean> {
  const [r] = await rows<{ fallos_ip: string; fallos_cuenta: string }>(
    `SELECT
       count(*) FILTER (WHERE ip_hash = $1)                        AS fallos_ip,
       count(*) FILTER (WHERE $2 <> '' AND lower(email) = $2)      AS fallos_cuenta
     FROM login_attempts
     WHERE NOT ok AND created_at > now() - ($3 || ' minutes')::interval`,
    [ipHash, (email ?? '').toLowerCase(), VENTANA_MINUTOS],
  );
  return (
    Number(r.fallos_ip) >= MAX_FALLOS ||
    Number(r.fallos_cuenta) >= MAX_FALLOS_CUENTA
  );
}

export async function registrarIntento(
  ipHash: string,
  email: string | null,
  ok: boolean,
): Promise<void> {
  await query(
    `INSERT INTO login_attempts (ip_hash, email, ok) VALUES ($1, $2, $3)`,
    [ipHash, email, ok],
  );
}

// ── Sesiones ────────────────────────────────────────────────────────────────

export async function crearSesion(userId: string): Promise<void> {
  // 32 bytes de aleatoriedad criptográfica. El token viaja en la cookie; en la
  // base solo queda su hash.
  const token = randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await query(
    `INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)`,
    [hashToken(token), userId, expires],
  );
  await query(`UPDATE admin_users SET last_login_at = now() WHERE id = $1`, [
    userId,
  ]);

  // Limpieza oportunista de sesiones vencidas: evita montar un cron solo para
  // esto y mantiene la tabla pequeña.
  await query(`DELETE FROM sessions WHERE expires_at < now()`);

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    // httpOnly: el JavaScript de la página no puede leerla, así que un XSS no
    // se lleva la sesión. Nunca guardar tokens en localStorage.
    httpOnly: true,
    secure: true,
    // 'lax' y no 'strict': con 'strict' la cookie no viaja al volver desde un
    // enlace externo y el panel pediría login otra vez sin motivo.
    sameSite: 'lax',
    path: '/',
    expires,
  });
}

export interface AdminUser {
  id: string;
  email: string;
}

/** Usuario de la sesión actual, o null. Es el guardia de todas las rutas del panel. */
export async function usuarioActual(): Promise<AdminUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [r] = await rows<{ id: string; email: string }>(
    `SELECT u.id, u.email
     FROM sessions s JOIN admin_users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [hashToken(token)],
  );
  return r ?? null;
}

/**
 * Cambia la contraseña del usuario, comprobando la actual.
 *
 * POR QUÉ EXISTE: hasta hoy la única forma era entrar por SSH y correr
 * `node db/create-admin.mjs`, o sea que la dueña no podía cambiar su propia
 * contraseña sin mí. Eso no es aceptable en un panel que ya está expuesto a
 * internet.
 *
 * Se piden las DOS: la actual y la nueva. Sin la actual, cualquiera con la
 * sesión abierta —un teléfono desbloqueado sobre una mesa— podría dejar a la
 * dueña fuera de su propio panel.
 *
 * Y se cierran TODAS las demás sesiones. Cambiar la contraseña suele significar
 * "creo que alguien más entró": si las sesiones viejas siguen valiendo, el cambio
 * no sirve de nada. La actual se conserva para no expulsar a quien lo hizo.
 */
export async function cambiarPassword(
  userId: string,
  actual: string,
  nueva: string,
): Promise<'ok' | 'actual-incorrecta' | 'usuario-inexistente'> {
  const [u] = await rows<{ password_hash: string }>(
    `SELECT password_hash FROM admin_users WHERE id = $1`,
    [userId],
  );
  if (!u) return 'usuario-inexistente';
  if (!(await verifyPassword(actual, u.password_hash))) {
    return 'actual-incorrecta';
  }

  await query(`UPDATE admin_users SET password_hash = $2 WHERE id = $1`, [
    userId,
    await hashPassword(nueva),
  ]);

  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  await query(
    `DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2`,
    [userId, token ? hashToken(token) : ''],
  );
  return 'ok';
}

export async function cerrarSesion(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    // Se borra de la BASE, no solo la cookie: si alguien copió el token, dejar
        // solo de enviarlo no lo invalida.
    await query(`DELETE FROM sessions WHERE token_hash = $1`, [hashToken(token)]);
  }
  store.delete(SESSION_COOKIE);
}

/**
 * Busca al usuario y valida su contraseña.
 *
 * Cuando el correo no existe, se verifica igual contra un hash señuelo. Sin eso,
 * un correo inexistente responde muy rápido y uno existente tarda ~100ms, y esa
 * diferencia permite averiguar qué correos están registrados.
 */
const HASH_SEÑUELO =
  'scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$' + 'A'.repeat(88);

export async function autenticar(
  email: string,
  password: string,
): Promise<AdminUser | null> {
  const [u] = await rows<{ id: string; email: string; password_hash: string }>(
    `SELECT id, email, password_hash FROM admin_users WHERE lower(email) = lower($1)`,
    [email],
  );

  if (!u) {
    await verifyPassword(password, HASH_SEÑUELO);
    return null;
  }
  const ok = await verifyPassword(password, u.password_hash);
  return ok ? { id: u.id, email: u.email } : null;
}
