import '../config/env';
import { Pool, type PoolConfig, type QueryResult, type QueryResultRow } from 'pg';
import { config } from '../config/env';

const poolConfig: PoolConfig = config.database.url
  ? {
      connectionString: config.database.url,
      ssl: config.isProduction ? { rejectUnauthorized: false } : false,
    }
  : {
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
    };

export const pool = new Pool(poolConfig);

pool.on('error', (error: Error): void => {
  console.error('Unexpected error on idle database client:', error);
});

export const query = <R extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: readonly unknown[]
): Promise<QueryResult<R>> => pool.query<R>(text, params as unknown[] | undefined);

export const closePool = (): Promise<void> => pool.end();

const db = { query, pool, closePool };

export default db;
