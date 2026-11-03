import { Pool, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      host: process.env.PGHOST || 'localhost',
      port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || '',
      database: process.env.PGDATABASE || 'anonymous_message_board',
    });

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle database client', err);
});

export const query = <R extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<R>> => pool.query<R>(text, params);

export default {
  query,
  pool,
};

