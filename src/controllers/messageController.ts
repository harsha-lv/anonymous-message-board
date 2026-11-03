import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../db/pool';

export const validateMessage = [
  body('title')
    .trim()
    .notEmpty().withMessage('Message title is required.')
    .isLength({ min: 1, max: 255 }).withMessage('Title must be between 1 and 255 characters.'),

  body('text')
    .trim()
    .notEmpty().withMessage('Message text is required.')
    .isLength({ min: 1, max: 5000 }).withMessage('Message text must be between 1 and 5000 characters.'),
];

// GET: Render new message form
export const getNewMessage = (req: Request, res: Response): void => {
  res.render('new-message', {
    title: 'Create Message',
    errors: [],
    formData: {},
  });
};

// POST: Save new message to database
export const postNewMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);
  const { title, text } = req.body;

  if (!errors.isEmpty()) {
    return res.status(400).render('new-message', {
      title: 'Create Message',
      errors: errors.array(),
      formData: { title, text },
    });
  }

  try {
    if (!req.user) {
      return res.redirect('/login');
    }

    await db.query(
      'INSERT INTO messages (title, text, username) VALUES ($1, $2, $3)',
      [title, text, req.user.username]
    );

    req.flash('success', 'Message posted successfully!');
    res.redirect('/');
  } catch (err) {
    console.error('Error creating message:', err);
    next(err);
  }
};

// POST: Delete message by ID (Admin only)
export const deleteMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM messages WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      req.flash('error', 'Message not found.');
    } else {
      req.flash('success', 'Message deleted successfully.');
    }

    res.redirect('/');
  } catch (err) {
    console.error('Error deleting message:', err);
    next(err);
  }
};
