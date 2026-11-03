import { Request, Response, NextFunction } from 'express';
import db from '../db/pool';

export const getHome = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userRes = await db.query<{ count: string }>('SELECT COUNT(*) FROM users');
    const messageRes = await db.query<{ count: string }>('SELECT COUNT(*) FROM messages');

    res.render('index', {
      title: 'Home',
      dbStatus: 'Connected',
      userCount: userRes.rows[0].count,
      messageCount: messageRes.rows[0].count,
    });
  } catch (err: any) {
    console.error('Error fetching dashboard stats:', err);
    res.render('index', {
      title: 'Home',
      dbStatus: `Connection Error: ${err.message}`,
      userCount: 0,
      messageCount: 0,
    });
  }
};

