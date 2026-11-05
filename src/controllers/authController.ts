import type { NextFunction, Request, RequestHandler, Response } from 'express';
import bcrypt from 'bcryptjs';

import db from '../db/pool';
import { getViolatedConstraint, isUniqueViolation } from '../db/errors';
import passport from '../config/passport';
import { validateSignUpRules } from '../middleware/authValidator';
import { getFormErrors } from '../utils/validation';
import type {
  FormError,
  LoginViewModel,
  SignUpBody,
  SignUpFormData,
  SignUpViewModel,
} from '../types';

const BCRYPT_SALT_ROUNDS = 10;

export const validateSignUp = validateSignUpRules;

export const getSignUp = (_req: Request, res: Response): void => {
  const viewModel: SignUpViewModel = {
    title: 'Sign Up',
    errors: [],
    formData: {},
  };

  res.render('sign-up', viewModel);
};

export const postSignUp = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as SignUpBody;
  const formData: SignUpFormData = {
    full_name: body.full_name,
    username: body.username,
    email: body.email,
  };

  const errors = getFormErrors(req);

  if (errors.length > 0) {
    const viewModel: SignUpViewModel = { title: 'Sign Up', errors, formData };
    res.status(400).render('sign-up', viewModel);
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(body.password, BCRYPT_SALT_ROUNDS);

    await db.query(
      `INSERT INTO users (full_name, username, email, password, membership_status)
       VALUES ($1, $2, $3, $4, 'non_member')`,
      [body.full_name, body.username, body.email, hashedPassword]
    );

    res.redirect('/login?registered=true');
  } catch (error: unknown) {
    console.error('Error during user registration:', error);

    if (isUniqueViolation(error)) {
      const constraint = getViolatedConstraint(error);
      const isUsername = constraint.includes('username');
      const isEmail = constraint.includes('email');

      const fieldError: FormError = isUsername
        ? { path: 'username', msg: 'Username is already taken.' }
        : isEmail
          ? { path: 'email', msg: 'Email address is already registered.' }
          : { path: 'username', msg: 'An account with those details already exists.' };

      const viewModel: SignUpViewModel = {
        title: 'Sign Up',
        errors: [fieldError],
        formData,
      };

      res.status(400).render('sign-up', viewModel);
      return;
    }

    // Anything else (for example, the database being unreachable) is a server
    // failure, not a problem with the submitted fields.
    const viewModel: SignUpViewModel = {
      title: 'Sign Up',
      errors: [{
        path: '',
        msg: 'We could not create your account right now. Please try again in a moment.',
      }],
      formData,
    };

    res.status(500).render('sign-up', viewModel);
  }
};

export const getLogin = (req: Request, res: Response): void => {
  const viewModel: LoginViewModel = {
    title: 'Log In',
    registered: req.query.registered === 'true',
  };

  res.render('login', viewModel);
};

export const postLogin: RequestHandler = passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true,
});

export const getLogout = (req: Request, res: Response, next: NextFunction): void => {
  req.logout((error) => {
    if (error) {
      next(error);
      return;
    }

    res.redirect('/');
  });
};
