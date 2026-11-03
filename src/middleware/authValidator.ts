import { body, CustomValidator } from 'express-validator';
import db from '../db/pool';

/**
 * Custom validator logic to check if password confirmation matches the password field.
 */
export const verifyPasswordMatch: CustomValidator = (confirmPassword, { req }) => {
  const password = req.body.password;
  if (confirmPassword !== password) {
    throw new Error('Passwords do not match.');
  }
  return true;
};

/**
 * Custom validator middleware for the confirm_password field.
 */
export const validateConfirmPassword = body('confirm_password')
  .notEmpty().withMessage('Please confirm your password.')
  .custom(verifyPasswordMatch);

/**
 * Full sign-up validation middleware chain.
 */
export const validateSignUpRules = [
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

  // Dedicated custom validator middleware for password confirmation
  validateConfirmPassword,
];

