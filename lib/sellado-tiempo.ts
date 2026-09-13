// Prueba de tiempo INDEPENDIENTE de nuestro servidor. SOLO SERVIDOR.
//
// Dos anclas sobre la huella de la firma (firma_hash):
//  1. Sello RFC 3161 de una autoridad de tiempo pública (DigiCert; si falla,
//     Sectigo o FreeTSA). Es el estándar que usan DocuSign, Adobe Sign y los
//     PSC. Se verifica con `openssl ts -verify` y la raíz del sistema: un perito
//     no necesita creernos nada.
//  2. Anclaje en Bitcoin con OpenTimestamps (`ots`): la huella queda en un
//     bloque de la cadena, imposible de alterar o antedatar. Al principio la
//     prueba es «pendiente» (los calendarios la agregan en horas); `mejorarOts`
//     la completa después.
// Ambas usan binarios del sistema (openssl, ots) con ficheros temporales.
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const TSAS = [
  { url: 'http://timestamp.digicert.com', nombre: 'DigiCert Timestamp Authority' },
  { url: 'http://timestamp.sectigo.com', nombre: 'Sectigo Timestamp Authority' },
  { url: 'https://freetsa.org/tsr', nombre: 'FreeTSA' },
];
const CA = '/etc/ssl/certs/ca-certificates.crt';

export interface SelloTiempo { token: string; autoridad: string; hora: string }

async function conTemporal<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), 'mr-ts-'));
  try { return await fn(dir); } finally { await rm(dir, { recursive: true, force: true }); }
}

/** Pide un sello de tiempo RFC 3161 sobre el texto `hash` (la huella de la firma). */
export async function sellarTiempo(hash: string): Promise<SelloTiempo | null> {
  return conTemporal(async (dir) => {
    const dato = join(dir, 'h.txt'), q = join(dir, 'q.tsq');
    await writeFile(dato, hash);
    await run('openssl', ['ts', '-query', '-data', dato, '-sha256', '-cert', '-no_nonce', '-out', q]);
    const cuerpo = await readFile(q);
    for (const tsa of TSAS) {
      try {
        const r = await fetch(tsa.url, { method: 'POST', headers: { 'Content-Type': 'application/timestamp-query' }, body: cuerpo, signal: AbortSignal.timeout(15000) });
        if (!r.ok) continue;
        const tsr = Buffer.from(await r.arrayBuffer());
        const f = join(dir, 'r.tsr'); await writeFile(f, tsr);
        const { stdout } = await run('openssl', ['ts', '-reply', '-in', f, '-text']);
        if (!/Status: Granted/.test(stdout)) continue;
        const m = stdout.match(/Time stamp: (.+)/);
        const hora = m ? new Date(m[1].trim().replace(' GMT', ' UTC')).toISOString() : new Date().toISOString();
        return { token: tsr.toString('base64'), autoridad: tsa.nombre, hora };
      } catch { /* siguiente autoridad */ }
    }
    return null;
  });
}

/** Comprueba el sello contra la huella y la raíz de confianza del sistema. */
export async function verificarSelloTiempo(hash: string, tokenB64: string): Promise<{ ok: boolean; detalle: string }> {
  if (!tokenB64) return { ok: false, detalle: 'sin sello' };
  return conTemporal(async (dir) => {
    const dato = join(dir, 'h.txt'), f = join(dir, 'r.tsr');
    await writeFile(dato, hash); await writeFile(f, Buffer.from(tokenB64, 'base64'));
    try {
      const { stdout, stderr } = await run('openssl', ['ts', '-verify', '-data', dato, '-in', f, '-CAfile', CA]);
      const txt = (await run('openssl', ['ts', '-reply', '-in', f, '-text'])).stdout;
      const serie = txt.match(/Serial number: (.+)/)?.[1] ?? '', hora = txt.match(/Time stamp: (.+)/)?.[1] ?? '', pol = txt.match(/Policy OID: (.+)/)?.[1] ?? '';
      return { ok: /Verification: OK/.test(stdout + stderr), detalle: `serie ${serie} · ${hora} · política ${pol}` };
    } catch (e) { return { ok: false, detalle: (e as Error).message.slice(0, 200) }; }
  });
}

/** Ancla la huella en Bitcoin vía OpenTimestamps. Devuelve la prueba .ots (base64). */
export async function anclarOts(hash: string): Promise<string | null> {
  return conTemporal(async (dir) => {
    const f = join(dir, 'firma.txt'); await writeFile(f, hash);
    try {
      await run('ots', ['stamp', f], { timeout: 60000 });
      return (await readFile(f + '.ots')).toString('base64');
    } catch { return null; }
  });
}

/** Intenta completar la prueba con la confirmación de Bitcoin. `anclado` cuando ya está en un bloque. */
export async function mejorarOts(hash: string, otsB64: string): Promise<{ prueba: string; estado: 'pendiente' | 'anclado'; info: string }> {
  return conTemporal(async (dir) => {
    const f = join(dir, 'firma.txt'); await writeFile(f, hash); await writeFile(f + '.ots', Buffer.from(otsB64, 'base64'));
    try { await run('ots', ['upgrade', f + '.ots'], { timeout: 60000 }); } catch { /* aún pendiente o sin red */ }
    let info = '';
    try { info = (await run('ots', ['info', f + '.ots'], { timeout: 30000 })).stdout; } catch {}
    const prueba = (await readFile(f + '.ots')).toString('base64');
    return { prueba, estado: /BitcoinBlockHeaderAttestation|verify BitcoinBlockHeader/i.test(info) ? 'anclado' : 'pendiente', info };
  });
}
