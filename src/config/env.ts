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
  readonly port: number;
  readonly sessionSecret: string;
  readonly database: DatabaseConfig;
  readonly passcodes: {
    readonly club: string;
    readonly admin: string;
  };
}

export const config: AppConfig = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: readInteger('PORT', 3000),
  sessionSecret: readString('SESSION_SECRET', 'clubhouse_secret_key_123'),
  database: {
    url: process.env.DATABASE_URL?.trim() || undefined,
    host: readString('PGHOST', 'localhost'),
    port: readInteger('PGPORT', 5432),
    user: readString('PGUSER', 'postgres'),
    password: process.env.PGPASSWORD ?? '',
    database: readString('PGDATABASE', 'anonymous_message_board'),
  },
  passcodes: {
    club: readString('CLUB_PASSCODE', 'club123'),
    admin: readString('ADMIN_PASSCODE', 'admin123'),
  },
};

export default config;
