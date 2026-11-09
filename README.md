# Anonymous Message Board

A server-rendered message board where anyone can read posts, members can publish messages and see author details, and administrators can delete posts.

> Messages are not anonymous to members, administrators, or database operators. Each post is associated with its author's account.

## Features

- Username/password signup and login with bcrypt password hashing.
- PostgreSQL-backed sessions that persist across requests.
- Role-based access to posting, author details, timestamps, and deletion.
- Passcode-based membership and administrator access.
- Server-side form validation and feedback messages.
- POST-only logout that destroys the session and clears its cookie.

### Permissions

| Action | Guest | Signed-in non-member | Member | Administrator |
| --- | --- | --- | --- | --- |
| Read messages | Yes | Yes | Yes | Yes |
| View authors and timestamps | No | No | Yes | Yes |
| Create messages | No | No | Yes | Yes |
| Delete messages | No | No | No | Yes |

## Stack

TypeScript, Express, EJS, Passport Local, express-session, connect-pg-simple, bcryptjs, express-validator, and PostgreSQL via `pg`.

The database can be local PostgreSQL or hosted PostgreSQL such as Neon. Authentication is implemented with Passport; this app does **not** use Neon Auth.

## Local setup

Use a supported Node.js LTS release (Node.js 22 or newer recommended), npm, and an existing PostgreSQL database.

```sh
git clone https://github.com/harsha-lv/anonymous-message-board.git
cd anonymous-message-board
npm ci
cp .env.example .env
```

Edit `.env` with your database credentials, a random session secret, and your own membership/admin passcodes. Do not commit credentials.

For hosted PostgreSQL, set `DATABASE_URL` to the provider's connection string. It takes precedence over the individual `PG*` settings. For Neon, use the pooled connection string for application traffic and retain the provider's required SSL settings.

Initialize the schema and start development:

```sh
npm run db:init
npm run dev
```

Open <http://localhost:3000>. Schema initialization creates the `users`, `messages`, and `session` tables in the configured database; it does not create the database itself. Review the target before running it.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port; defaults to `3000`. |
| `NODE_ENV` | Set to `production` in production to enable secure session cookies and production configuration checks. |
| `DATABASE_URL` | Full PostgreSQL connection string; overrides `PG*` settings. |
| `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` | Alternative database configuration. See `.env.example` for local defaults. |
| `SESSION_SECRET` | Session-signing secret. Use a strong, unique value that stays consistent across app instances. Production rejects the built-in fallback. |
| `TRUST_PROXY` | Non-negative trusted proxy hop count; defaults to `1` in production and `0` otherwise. Match your host's actual proxy topology. |
| `MEMBER_PASSCODE` | Grants membership through `/membership`. Replace the development default. |
| `ADMIN_PASSCODE` | Grants administrator access through `/admin`. Replace the development default and keep it private. |
| `DOTENV_CONFIG_PATH` | Optional custom path to the environment file; otherwise the app loads the repository's `.env`. |

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Run the TypeScript app with file watching. |
| `npm run db:init` | Initialize tables and indexes in the configured database. |
| `npm test` | Run auth regression tests with mocked PostgreSQL I/O; no real database credentials are needed. |
| `npm run build` | Compile TypeScript into `dist/`. |
| `npm start` | Run the compiled app after building. |

The auth tests cover signup/password hashing, bcrypt's signup byte limit, malformed login inputs, secure cookies behind an HTTPS proxy, session rotation/restoration, access restrictions, and logout. They do not replace live database or deployment tests.

## Production configuration

1. Configure environment variables in your hosting platform; the local `.env` is not committed or deployed.
2. Set `NODE_ENV=production`, an explicit `DATABASE_URL` (or the `PG*` settings), a unique `SESSION_SECRET`, and private membership/admin passcodes.
3. Initialize the intended database schema before serving users.
4. Build with `npm run build`; a conventional Node host starts the app with `npm start`. Include `views/` and `public/` alongside `dist/` in the deployment.
5. Serve over HTTPS and set `TRUST_PROXY` to the actual number of trusted reverse-proxy hops. The trusted proxy must overwrite client-supplied `X-Forwarded-*` headers. Use `0` when terminating HTTPS directly without a proxy.
6. Verify signup, login, page reload/session persistence, role checks, and logout against the live database and production URL.

### Login troubleshooting

- **Login succeeds but you are immediately signed out:** check HTTPS, the session cookie, and `TRUST_PROXY`. If HTTPS terminates at a proxy that Express does not trust, secure cookies may not be issued. Proxy trust is now configurable for this reason.
- **Database or session-store errors:** verify database credentials, connectivity, SSL requirements, table initialization, and permissions. Hosted environments require explicit database configuration instead of silently falling back to localhost.
- **Sessions stop working after a restart or between instances:** ensure all instances use the same stable `SESSION_SECRET` and shared session database.
- **Login fails with surrounding whitespace in the username:** usernames are now trimmed before lookup; passwords are not trimmed.

### Before a public launch

This is a learning/demo application, not a claim of production security readiness. Add login/passcode rate limiting, CSRF protection, monitoring, and a verified backup/restore process. Consider replacing shared privilege passcodes with administrator-managed role assignment. A successful build or deployment alone does not verify live authentication.

## Project structure

```text
src/
  app.ts          Express setup, sessions, middleware, and routes
  config/         Environment configuration and Passport strategy
  controllers/    Authentication, messages, and membership handlers
  db/             PostgreSQL pool and schema initialization
  middleware/     Access checks and form validation
  routes/         Route definitions
  types/          Shared TypeScript types
  utils/          Validation and async-handler helpers
views/            EJS templates
public/           Stylesheets
tests/            Authentication regression tests
```

## License

ISC, as declared in `package.json`.
