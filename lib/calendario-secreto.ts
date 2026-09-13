import { readFileSync } from 'node:fs';
import { timingSafeEqual } from 'node:crypto';

// Secreto compartido entre el cron, el Email Worker de Cloudflare y las rutas
// /api/calendario/sync y /api/airbnb/correo. Vive fuera del repo:
//   /etc/margarita-renace/calendario.env → CALENDARIO_SECRETO=…
let cache: string | null | undefined;
export function secretoCalendario(): string | null {
  if (cache !== undefined) return cache;
  try { cache = readFileSync('/etc/margarita-renace/calendario.env', 'utf8').match(/^\s*CALENDARIO_SECRETO\s*=\s*"?([^"\s]+)/m)?.[1] ?? null; } catch { cache = null; }
  return cache;
}

/** true si la cabecera Authorization trae el secreto correcto (comparación en tiempo constante). */
export function autorizado(req: Request): boolean {
  const s = secretoCalendario();
  const dado = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!s || !dado || dado.length !== s.length) return false;
  return timingSafeEqual(Buffer.from(dado), Buffer.from(s));
}
