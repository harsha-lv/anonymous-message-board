import type { Request, Response } from 'express';

import db from '../db/pool';
import { validateMessageRules } from '../middleware/authValidator';
import { asyncHandler } from '../utils/asyncHandler';
import { getFormErrors } from '../utils/validation';
import type {
  NewMessageBody,
  NewMessageFormData,
  NewMessageViewModel,
} from '../types';

export const validateMessage = validateMessageRules;

export const getNewMessage = (_req: Request, res: Response): void => {
  const viewModel: NewMessageViewModel = {
    title: 'Create Message',
    errors: [],
    formData: {},
  };

  res.render('new-message', viewModel);
};

export const postNewMessage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const body = req.body as NewMessageBody;
  const formData: NewMessageFormData = { title: body.title, text: body.text };
  const errors = getFormErrors(req);

  if (errors.length > 0) {
    const viewModel: NewMessageViewModel = {
      title: 'Create Message',
      errors,
      formData,
    };

    res.status(400).render('new-message', viewModel);
    return;
  }

  if (!req.user) {
    res.redirect('/login');
    return;
  }

  await db.query(
    'INSERT INTO messages (title, text, username) VALUES ($1, $2, $3)',
    [body.title, body.text, req.user.username]
  );

  req.flash('success', 'Message posted successfully!');
  res.redirect('/');
});

export const deleteMessage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const rawId = req.params.id;
  const id = Number.parseInt(Array.isArray(rawId) ? (rawId[0] ?? '') : (rawId ?? ''), 10);

  if (!Number.isInteger(id) || id <= 0) {
    req.flash('error', 'Message not found.');
    res.redirect('/');
    return;
  }

  const result = await db.query('DELETE FROM messages WHERE id = $1', [id]);

  if ((result.rowCount ?? 0) === 0) {
    req.flash('error', 'Message not found.');
  } else {
    req.flash('success', 'Message deleted successfully.');
  }

  res.redirect('/');
});
