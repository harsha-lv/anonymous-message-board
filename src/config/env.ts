import path from 'path';
import dotenv from 'dotenv';

/**
 * Load the project's .env file based on this file's location rather than the
 * current working directory. This keeps configuration consistent whether the
 * app is started from the project root, an IDE, or another folder.
 */
const envPath = process.env.DOTENV_CONFIG_PATH ?? path.resolve(__dirname, '../../.env');

dotenv.config({ path: envPath });

const readString = (key: string, fallback: string): string => {
  const value = process.env[key];
  return value !== undefined && value.trim() !== '' ? value.trim() : fallback;
};

const readInteger = (key: string, fallback: number): number => {
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const nodeEnv = readString('NODE_ENV', 'development');
const isProduction = nodeEnv === 'production';
const trustProxy = Number(readString('TRUST_PROXY', isProduction ? '1' : '0'));
if (!Number.isInteger(trustProxy) || trustProxy < 0) {
  throw new Error('TRUST_PROXY must be a non-negative integer (trusted proxy hops).');
}

const sessionSecret = readString('SESSION_SECRET', 'anonymous_message_board_secret_key');
if (isProduction && sessionSecret === 'anonymous_message_board_secret_key') {
  throw new Error('Set a unique SESSION_SECRET in the production environment.');
}

const databaseUrl = process.env.DATABASE_URL?.trim() || undefined;
const pgHost = process.env.PGHOST?.trim() || undefined;

/**
 * Hosted platforms should always provide an explicit database configuration.
 * Without this guard the app silently falls back to localhost:5432, which is
 * exactly what produces "ECONNREFUSED 127.0.0.1:5432" in production.
 */
const isHostedPlatform = isProduction || Boolean(
  process.env.VERCEL ||
  process.env.RENDER ||
  process.env.DYNO ||
  process.env.FLY_APP_NAME ||
  process.env.RAILWAY_ENVIRONMENT ||
  process.env.K_SERVICE
);

if (!databaseUrl && !pgHost) {
  if (isHostedPlatform) {
    throw new Error(
      'Database is not configured. Set DATABASE_URL in the production environment ' +
      '(or provide PGHOST, PGPORT, PGUSER, PGPASSWORD, and PGDATABASE). ' +
      '.env files are not deployed to production.'
    );
  }

  console.warn('[config] No DATABASE_URL or PGHOST set; falling back to localhost:5432.');
}

export interface DatabaseConfig {
  readonly url: string | undefined;
  readonly host: string;
  readonly port: number;
  readonly user: string;
  readonly password: string;
  readonly database: string;
}

export interface AppConfig {
  readonly nodeEnv: string;
  readonly isProduction: boolean;
  readonly trustProxy: number;
  readonly port: number;
  readonly sessionSecret: string;
  readonly database: DatabaseConfig;
  readonly passcodes: {
    readonly member: string;
    readonly admin: string;
  };
}

export const config: AppConfig = {
  nodeEnv,
  isProduction,
  trustProxy,
  port: readInteger('PORT', 3000),
  sessionSecret,
  database: {
    url: databaseUrl,
    host: pgHost ?? 'localhost',
    port: readInteger('PGPORT', 5432),
    user: readString('PGUSER', 'postgres'),
    password: process.env.PGPASSWORD ?? '',
    database: readString('PGDATABASE', 'anonymous_message_board'),
  },
  passcodes: {
    member: readString('MEMBER_PASSCODE', 'member123'),
    admin: readString('ADMIN_PASSCODE', 'admin123'),
  },
};

export default config;
