// Conexión a Postgres. SOLO SERVIDOR.
//
// Se copia el patrón de clientes-form-2.0 (Leiros), que lleva meses en
// producción sin incidentes: un Pool de `pg` y un helper `query`. Sin ORM — el
// esquema es pequeño y es una dependencia menos que mantener.
//
// ⚠️ Este módulo NUNCA debe entrar en un componente cliente. Un navegador no
// puede hablar con Postgres, y el propio bundler falla al intentar resolver las
// dependencias nativas de `pg`. Por eso los datos se leen en Server Components
// y se pasan como props. Ver lib/queries.ts.

import pg from 'pg';

const { Pool } = pg;

if (!process.env.POSTGRES_URL) {
  // Falla temprano y con un mensaje claro. Sin esto, el primer síntoma sería un
  // error de conexión opaco en medio de un render.
  throw new Error(
    'Falta POSTGRES_URL. Debe estar en el .env del proyecto (ver docker-compose.yml).',
  );
}

// En desarrollo, Next recarga los módulos en caliente y crearía un Pool nuevo en
// cada recarga hasta agotar las conexiones de Postgres. Guardarlo en globalThis
// hace que sobreviva a las recargas.
const globalForPg = globalThis as unknown as { _margaritaPool?: pg.Pool };

const pool =
  globalForPg._margaritaPool ??
  new Pool({
    connectionString: process.env.POSTGRES_URL,
    // 10 conexiones alcanzan de sobra: el sitio es estático y solo consulta en
    // build y al revalidar. Pasarse solo ocuparía memoria del servidor, que
    // comparte 3.7GB con otros dos productos.
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPg._margaritaPool = pool;
}

// Un error de conexión no debe tumbar el proceso: se registra y el pool
// reintenta. Sin este manejador, un corte de red con Postgres mata la app.
pool.on('error', (err) => {
  console.error('[db] error inesperado del pool:', err.message);
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  sql: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  const client = await pool.connect();
  try {
    return await client.query<T>(sql, params);
  } finally {
    // Siempre en finally: si la consulta lanza y no se libera el cliente, el
    // pool se agota en silencio y la app se cuelga a la tercera vez.
    client.release();
  }
}

/**
 * Varias escrituras como una sola unidad. Necesario porque query() toma un
 * cliente NUEVO del pool en cada llamada: un BEGIN por query() y el COMMIT
 * caerían en conexiones distintas y no transaccionarían nada.
 */
export async function withTransaction<T>(
  fn: (
    q: (sql: string, params?: unknown[]) => Promise<pg.QueryResult>,
  ) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn((sql, params) => client.query(sql, params));
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Devuelve solo las filas, que es lo que quieren casi todas las llamadas. */
export async function rows<T extends pg.QueryResultRow = pg.QueryResultRow>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  return (await query<T>(sql, params)).rows;
}

export default pool;
