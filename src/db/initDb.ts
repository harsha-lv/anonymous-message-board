import { pool } from './pool';

const createTablesSQL = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    membership_status VARCHAR(50) DEFAULT 'non_member',
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

  CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    username VARCHAR(100) NOT NULL REFERENCES users(username) ON UPDATE CASCADE ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS "session" (
    "sid" VARCHAR NOT NULL COLLATE "default",
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
  );

  CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_messages_username ON messages(username);
  CREATE INDEX IF NOT EXISTS idx_session_expire ON "session"("expire");
`;

async function initDb(): Promise<void> {
  console.log('Connecting to PostgreSQL to initialize schema (TS)...');
  try {
    await pool.query(createTablesSQL);
    console.log('Database initialized successfully: "users", "messages", and "session" tables are ready.');
  } catch (err) {
    console.error('Error initializing database schema:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDb();
