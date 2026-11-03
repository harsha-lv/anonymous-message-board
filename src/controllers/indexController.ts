import { Request, Response, NextFunction } from 'express';
import db from '../db/pool';
import { Message } from '../types';

export const getHome = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userRes = await db.query<{ count: string }>('SELECT COUNT(*) FROM users');
    const messageRes = await db.query<Message>(`
      SELECT 
        m.id, 
        m.title, 
        m.text, 
        m.timestamp, 
        m.username, 
        u.full_name
      FROM messages m
      LEFT JOIN users u ON m.username = u.username
      ORDER BY m.timestamp DESC
    `);

    res.render('index', {
      title: 'Home',
      dbStatus: 'Connected',
      userCount: userRes.rows[0].count,
      messageCount: messageRes.rows.length,
      messages: messageRes.rows,
    });
  } catch (err: any) {
    console.error('Error fetching dashboard stats:', err);
    res.render('index', {
      title: 'Home',
      dbStatus: `Connection Error: ${err.message}`,
      userCount: 0,
      messageCount: 0,
      messages: [],
    });
  }
};
