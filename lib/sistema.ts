// Estado del sistema, para la pantalla de Configuración. SOLO SERVIDOR.
//
// Datos que la dueña no tiene forma de comprobar por su cuenta y que valen para
// dormir tranquila: cuándo fue el último respaldo, cuánto pesa la base, cuántas
// fotos hay subidas. Todo de solo lectura — acá no se toca nada.
//
// Si algo no se puede leer se devuelve null y la pantalla lo dice, en vez de
// inventar un dato: un "todo bien" falso en la sección de respaldos es
// exactamente lo que uno no quiere descubrir el día que hace falta restaurar.

import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { rows } from './db';

/** Rutas de infraestructura, fuera del proyecto. Configurables por si cambian. */
const DIR_BACKUPS = process.env.BACKUPS_DIR ?? '/root/backups/margarita';
const DIR_UPLOADS = process.env.UPLOADS_DIR ?? '/var/www/margarita-uploads';

export interface EstadoSistema {
  ultimoRespaldo: { fecha: Date; nombre: string; bytes: number } | null;
  respaldosGuardados: number;
  tamanoBase: string | null;
  fotosSubidas: number;
  sesionesAbiertas: number;
}

async function contarArchivos(dir: string): Promise<number> {
  try {
    const entradas = await readdir(dir, { withFileTypes: true, recursive: true });
    return entradas.filter((e) => e.isFile()).length;
  } catch {
    return 0;
  }
}

export async function getEstadoSistema(): Promise<EstadoSistema> {
  const [respaldos, tamano, fotos, sesiones] = await Promise.all([
    (async () => {
      try {
        const nombres = (await readdir(DIR_BACKUPS)).filter(
          (n) => n.startsWith('db-') && n.endsWith('.sql.gz'),
        );
        if (!nombres.length) return { ultimo: null, total: 0 };

        const detalles = await Promise.all(
          nombres.map(async (n) => {
            const s = await stat(path.join(DIR_BACKUPS, n));
            return { fecha: s.mtime, nombre: n, bytes: s.size };
          }),
        );
        detalles.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
        return { ultimo: detalles[0], total: detalles.length };
      } catch {
        return { ultimo: null, total: 0 };
      }
    })(),

    rows<{ t: string }>(
      `SELECT pg_size_pretty(pg_database_size(current_database())) AS t`,
    )
      .then((rs) => rs[0]?.t ?? null)
      .catch(() => null),

    contarArchivos(DIR_UPLOADS),

    rows<{ n: string }>(
      `SELECT count(*) AS n FROM sessions WHERE expires_at > now()`,
    )
      .then((rs) => Number(rs[0]?.n ?? 0))
      .catch(() => 0),
  ]);

  return {
    ultimoRespaldo: respaldos.ultimo,
    respaldosGuardados: respaldos.total,
    tamanoBase: tamano,
    fotosSubidas: fotos,
    sesionesAbiertas: sesiones,
  };
}
