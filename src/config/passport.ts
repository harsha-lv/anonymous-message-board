import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';

import db from '../db/pool';
import type { UserProfile, UserRecord } from '../types';

const toUserProfile = (user: UserRecord): Express.User => ({
  id: user.id,
  full_name: user.full_name,
  username: user.username,
  email: user.email,
  membership_status: user.membership_status,
  is_admin: user.is_admin,
  created_at: user.created_at,
});

passport.use(
  new LocalStrategy(async (username: string, password: string, done): Promise<void> => {
    try {
      const result = await db.query<UserRecord>(
        'SELECT * FROM users WHERE LOWER(username) = LOWER($1)',
        [username.trim()]
      );

      const user = result.rows[0];

      if (user === undefined) {
        done(null, false, { message: 'Incorrect username or password.' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        done(null, false, { message: 'Incorrect username or password.' });
        return;
      }

      done(null, toUserProfile(user));
    } catch (error) {
      done(error);
    }
  })
);

passport.serializeUser((user: Express.User, done): void => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done): Promise<void> => {
  try {
    const result = await db.query<UserProfile>(
      `SELECT id, full_name, username, email, membership_status, is_admin, created_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    const user = result.rows[0];

    if (user === undefined) {
      done(null, false);
      return;
    }

    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
