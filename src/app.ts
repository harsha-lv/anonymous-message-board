import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

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

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(publicPath));

// Global variables for templates
app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.currentUser = null; // Will be populated in Part 2 auth
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

