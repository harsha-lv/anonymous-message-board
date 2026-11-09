import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import bcrypt from 'bcryptjs';

// Never load developer credentials or contact a real database in these tests.
process.env.DOTENV_CONFIG_PATH = '/tmp/opencode/auth-tests-no-env';
process.env.NODE_ENV = 'production';
process.env.PGHOST = 'test.invalid';
process.env.DATABASE_URL = '';
process.env.SESSION_SECRET = 'test-only-session-secret';
process.env.TRUST_PROXY = '1';

let server: Server;
let baseUrl: string;
let pool: typeof import('../src/db/pool').pool;
let originalQuery: typeof pool.query;
const sessions = new Map<string, any>();
const users: any[] = [];
let userQueries = 0;

before(async () => {
  ({ pool } = await import('../src/db/pool'));
  originalQuery = pool.query;
  // Exercise Passport and connect-pg-simple, replacing only PostgreSQL I/O.
  pool.query = (async (sql: string, params: any[] = []) => {
    let rows: any[] = [];
    if (sql.includes('SELECT to_regclass')) {
      rows = [{ to_regclass: 'session' }];
    } else if (sql.startsWith('SELECT sess FROM')) {
      const sess = sessions.get(params[0]);
      rows = sess ? [{ sess: structuredClone(sess) }] : [];
    } else if (sql.startsWith('INSERT INTO "session"')) {
      sessions.set(params[2], JSON.parse(JSON.stringify(params[0])));
    } else if (sql.startsWith('DELETE FROM "session"')) {
      sessions.delete(params[0]);
    } else if (sql.startsWith('UPDATE "session"')) {
      // Expiration touching does not change the stored identity.
    } else if (sql.includes('FROM users WHERE LOWER(username)')) {
      userQueries++;
      rows = users.filter((user) => user.username.toLowerCase() === params[0].toLowerCase());
    } else if (sql.includes('FROM users') && sql.includes('WHERE id = $1')) {
      rows = users.filter((user) => user.id === params[0]);
    } else if (sql.includes('INSERT INTO users')) {
      users.push({
        id: users.length + 1, full_name: params[0], username: params[1],
        email: params[2], password: params[3], membership_status: 'non_member',
        is_admin: false, created_at: new Date(),
      });
    } else {
      throw new Error(`Unexpected test query: ${sql}`);
    }
    return { rows, rowCount: rows.length };
  }) as typeof pool.query;

  const { default: app } = await import('../src/app');
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  if (pool) {
    pool.query = originalQuery;
    await pool.end();
  }
});

const request = (path: string, body?: Record<string, unknown>, cookie?: string, https = true) =>
  fetch(`${baseUrl}${path}`, {
    method: body ? 'POST' : 'GET',
    redirect: 'manual',
    headers: {
      ...(https ? { 'X-Forwarded-Proto': 'https' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

const cookieFrom = (response: Response): string => {
  const header = response.headers.get('set-cookie');
  assert.ok(header, 'Expected session cookie');
  return header.split(';')[0];
};

test('authentication lifecycle behind an HTTPS reverse proxy', async (t) => {
  let cookie: string;
  let oldCookie: string;

  await t.test('signup hashes the password and redirects to login', async () => {
    const response = await request('/sign-up', {
      full_name: 'Test User', username: 'TestUser', email: 'test@example.com',
      password: 'password123', confirm_password: 'password123',
    });
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), '/login?registered=true');
    assert.equal(users.length, 1);
    assert.notEqual(users[0].password, 'password123');
    assert.ok(await bcrypt.compare('password123', users[0].password));
  });

  await t.test('bcrypt byte limit is checked before account creation', async () => {
    const password = '😀'.repeat(19);
    const response = await request('/sign-up', {
      full_name: 'Other User', username: 'other', email: 'other@example.com',
      password, confirm_password: password,
    });
    assert.equal(response.status, 400);
    assert.match(await response.text(), /no more than 72 bytes/);
    assert.equal(users.length, 1);
  });

  await t.test('malformed login is rejected without querying users', async () => {
    const count = userQueries;
    const response = await request('/login', { username: { bad: true }, password: ['bad'] });
    assert.equal(response.status, 302);
    assert.equal(userQueries, count);
    const page = await request('/login', undefined, cookieFrom(response));
    assert.match(await page.text(), /Please enter your username and password/);
  });

  await t.test('failed login has one generic error and a secure cookie', async () => {
    const response = await request('/login', { username: 'TestUser', password: 'wrong' });
    assert.equal(response.headers.get('location'), '/login');
    assert.match(response.headers.get('set-cookie')!, /; Secure/);
    assert.match(response.headers.get('set-cookie')!, /; HttpOnly/);
    assert.match(response.headers.get('set-cookie')!, /; SameSite=Lax/);
    oldCookie = cookieFrom(response);
    const page = await request('/login', undefined, oldCookie);
    const html = await page.text();
    assert.equal(html.split('Incorrect username or password.').length - 1, 1);
    const missingUser = await request('/login', { username: 'missing', password: 'wrong' });
    const missingPage = await request('/login', undefined, cookieFrom(missingUser));
    assert.match(await missingPage.text(), /Incorrect username or password/);
  });

  await t.test('login trims username, keeps password intact and rotates the session', async () => {
    const response = await request('/login', { username: '  testuser  ', password: 'password123' }, oldCookie);
    assert.equal(response.headers.get('location'), '/');
    cookie = cookieFrom(response);
    assert.notEqual(cookie, oldCookie);
    const stored = [...sessions.values()].find((sess) => sess.passport?.user === 1);
    assert.ok(stored);
    assert.equal(stored.passport.user, 1);
    assert.equal(JSON.stringify(stored).includes(users[0].password), false);
  });

  await t.test('session restores identity and enforces member and admin access', async () => {
    const page = await request('/membership', undefined, cookie);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /TestUser/);
    assert.equal((await request('/login', undefined, cookie)).headers.get('location'), '/');
    assert.equal((await request('/new-message', undefined, cookie)).headers.get('location'), '/membership');
    assert.equal((await request('/messages/1/delete', {}, cookie)).status, 403);
    assert.equal((await request('/membership', undefined, oldCookie)).headers.get('location'), '/login');
  });

  await t.test('GET cannot log out; POST destroys the session and clears the cookie', async () => {
    assert.equal((await request('/logout', undefined, cookie)).status, 404);
    assert.equal((await request('/membership', undefined, cookie)).status, 200);
    const response = await request('/logout', {}, cookie);
    assert.equal(response.headers.get('location'), '/');
    assert.match(response.headers.get('set-cookie')!, /anonymous_board.sid=;/);
    assert.equal([...sessions.values()].some((sess) => sess.passport?.user === 1), false);
    assert.equal((await request('/membership', undefined, cookie)).headers.get('location'), '/login');
  });

  await t.test('production does not issue cookies over unencrypted HTTP', async () => {
    const response = await request('/login', { username: 'TestUser', password: 'password123' }, undefined, false);
    assert.equal(response.headers.get('set-cookie'), null);
  });
});
