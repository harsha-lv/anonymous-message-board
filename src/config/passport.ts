import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import db from '../db/pool';
import { User } from '../types';

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const result = await db.query<User & { password: string }>(
        'SELECT * FROM users WHERE LOWER(username) = LOWER($1)',
        [username]
      );

      const user = result.rows[0];

      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }

      // Secure verification comparing hashed password with bcrypt
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      // Exclude password hash from the user object in memory
      const { password: _, ...authenticatedUser } = user;
      return done(null, authenticatedUser);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const result = await db.query<Express.User>(
      'SELECT id, full_name, username, email, membership_status, is_admin, created_at FROM users WHERE id = $1',
      [id]
    );

    const user = result.rows[0];
    if (!user) {
      return done(null, false);
    }

    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;

