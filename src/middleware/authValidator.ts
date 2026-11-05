import { body, type CustomValidator, type ValidationChain } from 'express-validator';

/** Confirms that `confirm_password` matches `password`. */
export const verifyPasswordMatch: CustomValidator = (confirmPassword, { req }) => {
  const { password } = req.body as { password?: string };

  if (confirmPassword !== password) {
    throw new Error('Passwords do not match.');
  }

  return true;
};

export const validateConfirmPassword: ValidationChain = body('confirm_password')
  .notEmpty()
  .withMessage('Please confirm your password.')
  .custom(verifyPasswordMatch);

/**
 * Sign-up validation chain.
 *
 * Username/email availability is intentionally enforced by the database's
 * UNIQUE constraints (handled in the controller). Running queries inside
 * validators caused infrastructure failures to be reported as field errors.
 */
export const validateSignUpRules: ValidationChain[] = [
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required.')
    .isLength({ min: 2, max: 255 })
    .withMessage('Full name must be between 2 and 255 characters.'),

  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required.')
    .isLength({ min: 3, max: 100 })
    .withMessage('Username must be between 3 and 100 characters.')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and dashes.'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Please enter a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),

  validateConfirmPassword,
];

/** Validation chain for the message creation form. */
export const validateMessageRules: ValidationChain[] = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Message title is required.')
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters.'),

  body('text')
    .trim()
    .notEmpty()
    .withMessage('Message text is required.')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message text must be between 1 and 5000 characters.'),
];
