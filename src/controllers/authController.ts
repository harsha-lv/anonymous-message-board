import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import db from '../db/pool';

// Validation rules for sign-up
export const validateSignUp = [
  body('full_name')
    .trim()
    .notEmpty().withMessage('Full name is required.')
    .isLength({ min: 2, max: 255 }).withMessage('Full name must be between 2 and 255 characters.'),

  body('username')
    .trim()
    .notEmpty().withMessage('Username is required.')
    .isLength({ min: 3, max: 100 }).withMessage('Username must be between 3 and 100 characters.')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username can only contain letters, numbers, underscores, and dashes.')
    .custom(async (value: string) => {
      const result = await db.query('SELECT username FROM users WHERE LOWER(username) = LOWER($1)', [value]);
      if (result.rows.length > 0) {
        throw new Error('Username is already taken.');
      }
      return true;
    }),

  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required.')
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail()
    .custom(async (value: string) => {
      const result = await db.query('SELECT email FROM users WHERE LOWER(email) = LOWER($1)', [value]);
      if (result.rows.length > 0) {
        throw new Error('Email address is already registered.');
      }
      return true;
    }),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),

  body('confirm_password')
    .notEmpty().withMessage('Please confirm your password.')
    .custom((value: string, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match.');
      }
      return true;
    }),
];

// GET: Render sign-up form
export const getSignUp = (req: Request, res: Response): void => {
  res.render('sign-up', {
    title: 'Sign Up',
    errors: [],
    formData: {},
  });
};

// POST: Process sign-up submission
export const postSignUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);
  const { full_name, username, email, password } = req.body;

  if (!errors.isEmpty()) {
    res.status(400).render('sign-up', {
      title: 'Sign Up',
      errors: errors.array(),
      formData: {
        full_name,
        username,
        email,
      },
    });
    return;
  }

  try {
    // Hash password with bcrypt salt rounds = 10
    const hashedPassword = await bcrypt.hash(password, 10);

    // Default membership status: 'non_member'
    await db.query(
      `INSERT INTO users (full_name, username, email, password, membership_status)
       VALUES ($1, $2, $3, $4, 'non_member')`,
      [full_name, username, email, hashedPassword]
    );

    // Redirect to login page upon success
    res.redirect('/login?registered=true');
  } catch (err) {
    console.error('Error during user registration:', err);
    next(err);
  }
};

