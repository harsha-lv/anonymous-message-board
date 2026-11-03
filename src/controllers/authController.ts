import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import db from '../db/pool';
import { validateSignUpRules } from '../middleware/authValidator';

// Export validation rules
export const validateSignUp = validateSignUpRules;

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
