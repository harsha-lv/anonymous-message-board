import './config/env';

import path from 'path';
import express, { type NextFunction, type Request, type Response } from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import flash from 'connect-flash';

import { config } from './config/env';
import { pool } from './db/pool';
import passport from './config/passport';
import indexRouter from './routes/indexRouter';
import authRouter from './routes/authRouter';
import messageRouter from './routes/messageRouter';
import type { HomeViewModel } from './types';

const app = express();

// Resolve views and public directories relative to this file so the app works
// regardless of the directory it is launched from.
const viewsPath = path.resolve(__dirname, '../views');
const publicPath = path.resolve(__dirname, '../public');

app.set('views', viewsPath);
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(publicPath));

const PgSession = connectPgSimple(session);

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    name: 'anonymous_board.sid',
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: 'lax',
      secure: config.isProduction,
    },
  })
);

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

app.use((req: Request, res: Response, next: NextFunction): void => {
  res.locals.currentUser = req.user ?? null;
  res.locals.errorMessages = req.flash('error');
  res.locals.successMessages = req.flash('success');
  next();
});

app.use('/', indexRouter);
app.use('/', authRouter);
app.use('/', messageRouter);

app.use((_req: Request, res: Response): void => {
  const viewModel: HomeViewModel = {
    title: '404 Not Found',
    dbStatus: '404: Page not found',
    userCount: 0,
    messageCount: 0,
    messages: [],
  };

  res.status(404).render('index', viewModel);
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('Unhandled Server Error:', error);
  res.status(500).send('Internal Server Error');
});

if (require.main === module) {
  app.listen(config.port, (): void => {
    console.log(`Server is running at http://localhost:${config.port}`);
  });
}

export default app;
