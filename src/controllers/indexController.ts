import type { Request, Response } from 'express';

import db from '../db/pool';
import type { HomeViewModel, Message } from '../types';

interface CountRow {
  count: string;
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown database error';

export const getHome = async (_req: Request, res: Response): Promise<void> => {
  try {
    const userResult = await db.query<CountRow>('SELECT COUNT(*)::text AS count FROM users');
    const messageResult = await db.query<Message>(`
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

    const messages = messageResult.rows;

    const viewModel: HomeViewModel = {
      title: 'Home',
      dbStatus: 'Connected',
      userCount: Number.parseInt(userResult.rows[0]?.count ?? '0', 10),
      messageCount: messages.length,
      messages,
    };

    res.render('index', viewModel);
  } catch (error: unknown) {
    console.error('Error fetching dashboard stats:', error);

    const viewModel: HomeViewModel = {
      title: 'Home',
      dbStatus: `Connection Error: ${getErrorMessage(error)}`,
      userCount: 0,
      messageCount: 0,
      messages: [],
    };

    res.render('index', viewModel);
  }
};
