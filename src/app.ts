import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import flash from 'connect-flash';
import dotenv from 'dotenv';

import { pool } from './db/pool';
import passport from './config/passport';
import indexRouter from './routes/indexRouter';
import authRouter from './routes/authRouter';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Resolve views and public directories relative to project root
const viewsPath = path.resolve(process.cwd(), 'views');
const publicPath = path.resolve(process.cwd(), 'public');

// View engine setup
app.set('views', viewsPath);
app.set('view engine', 'ejs');

// Body parsers and static assets
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(publicPath));

// PostgreSQL Session Store
const PgSession = connectPgSimple(session);

// Express Session configuration (creates and manages the session cookie in browser)
app.use(
  session({
    store: new PgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    name: 'clubhouse.sid',
    secret: process.env.SESSION_SECRET || 'clubhouse_secret_key_123',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days in milliseconds
      httpOnly: true, // Prevents client-side scripts from accessing the cookie
      sameSite: 'lax', // CSRF protection
      secure: process.env.NODE_ENV === 'production', // Transmit only over HTTPS in production
    },
  })
);

// Flash messages
app.use(flash());

// Passport authentication & session deserialization
app.use(passport.initialize());
app.use(passport.session());

// Global template variables
app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.currentUser = req.user || null;
  res.locals.errorMessages = req.flash('error');
  res.locals.successMessages = req.flash('success');
  next();
});

// Routes
app.use('/', indexRouter);
app.use('/', authRouter);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).render('index', {
    title: '404 Not Found',
    dbStatus: '404: Page not found',
    userCount: '-',
    messageCount: '-',
  });
});

// Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).send('Internal Server Error');
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

export default app;
