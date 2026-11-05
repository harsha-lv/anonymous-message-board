import '../config/env';
import net from 'net';
import { Pool, type PoolConfig, type QueryResult, type QueryResultRow } from 'pg';
import { config } from '../config/env';

/**
 * node-postgres creates its own sockets and calls `socket.connect(port, host)`.
 * Node's "happy eyeballs" (autoSelectFamily) can stall against Neon's pooler
 * when DNS returns a mix of reachable IPv4 and unreachable IPv6 addresses.
 * Disable it per socket so the driver connects reliably.
 */
const createDatabaseSocket = (): net.Socket => {
  const socket = new net.Socket();

  const nodeConnect = net.Socket.prototype.connect.bind(socket) as (
    options: net.NetConnectOpts
  ) => net.Socket;

  (socket as unknown as { connect: (port: number, host: string) => net.Socket }).connect = (
    port: number,
    host: string
  ): net.Socket => nodeConnect({ port, host, autoSelectFamily: false });

  return socket;
};

/**
 * Builds the pg pool configuration.
 *
 * DATABASE_URL takes precedence over the individual PG* variables. SSL is
 * enabled when the connection string asks for it (sslmode) or in production;
 * `channel_binding` is a libpq-only option and is removed before handing the
 * URL to node-postgres.
 */
const buildPoolConfig = (): PoolConfig => {
  if (config.database.url) {
    const url = new URL(config.database.url);
    const sslMode = url.searchParams.get('sslmode');

    url.searchParams.delete('sslmode');
    url.searchParams.delete('channel_binding');

    const useSsl =
      sslMode === 'disable' ? false : sslMode !== null ? true : config.isProduction;

    return {
      connectionString: url.toString(),
      ssl: useSsl,
      stream: createDatabaseSocket,
      connectionTimeoutMillis: 15_000,
    };
  }

  return {
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    ssl: config.isProduction,
  };
};

export const pool = new Pool(buildPoolConfig());

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
