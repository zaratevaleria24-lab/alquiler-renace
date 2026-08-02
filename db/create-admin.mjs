// Crea o actualiza el usuario del panel.
//
//   node db/create-admin.mjs correo@ejemplo.com
//
// Genera una contraseña aleatoria fuerte y la imprime UNA sola vez. No se pide
// por teclado a propósito: una contraseña escrita a mano en una sesión de
// terminal queda en el historial del shell, y una elegida por la persona suele
// ser reutilizada de otro sitio.
//
// Si el correo ya existe, se le asigna una contraseña nueva (útil para recuperar
// el acceso). Las sesiones abiertas se invalidan.

import { readFileSync } from 'node:fs';
import { randomBytes, scrypt as scryptCb } from 'node:crypto';
import { promisify } from 'node:util';
import pg from 'pg';

const scrypt = promisify(scryptCb);
const SCRYPT = { N: 32768, r: 8, p: 1, maxmem: 96 * 1024 * 1024 };

const email = process.argv[2];
if (!email || !email.includes('@')) {
  console.error('Uso: node db/create-admin.mjs correo@ejemplo.com');
  process.exit(1);
}

const url = readFileSync('.env', 'utf8')
  .split('\n')
  .find((l) => l.startsWith('POSTGRES_URL='))
  ?.slice('POSTGRES_URL='.length)
  .trim();
if (!url) {
  console.error('No se encontró POSTGRES_URL en .env');
  process.exit(1);
}

// Contraseña legible pero fuerte: 4 grupos de 5 caracteres. ~100 bits de
// entropía y se puede dictar por teléfono sin errores.
const ALFABETO = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const grupo = () =>
  Array.from(randomBytes(5))
    .map((b) => ALFABETO[b % ALFABETO.length])
    .join('');
const password = [grupo(), grupo(), grupo(), grupo()].join('-');

const salt = randomBytes(16);
const hash = await scrypt(password, salt, 64, SCRYPT);
const stored = [
  'scrypt',
  SCRYPT.N,
  SCRYPT.r,
  SCRYPT.p,
  salt.toString('base64'),
  hash.toString('base64'),
].join('$');

const client = new pg.Client({ connectionString: url });
await client.connect();

const { rows } = await client.query(
  `INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)
   ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
   RETURNING id, (created_at = now()) AS es_nuevo`,
  [email.toLowerCase(), stored],
);

// Al cambiar la contraseña se invalidan las sesiones: si el cambio es por
// sospecha de acceso ajeno, dejar sesiones vivas lo haría inútil.
await client.query(`DELETE FROM sessions WHERE user_id = $1`, [rows[0].id]);
await client.end();

console.log('');
console.log('  ' + (rows[0].es_nuevo ? 'Usuario creado' : 'Contraseña actualizada'));
console.log('  ─────────────────────────────────────────────');
console.log(`  correo:     ${email.toLowerCase()}`);
console.log(`  contraseña: ${password}`);
console.log('  ─────────────────────────────────────────────');
console.log('  Guárdala ahora: no se puede volver a mostrar, solo se');
console.log('  guardó su hash. Para generar otra, corre este script de nuevo.');
console.log('');
