import type { Request, Response } from 'express';

import { config } from '../config/env';
import db from '../db/pool';
import { asyncHandler } from '../utils/asyncHandler';
import type { PasscodeBody, PasscodeViewModel } from '../types';

export const getMembership = (req: Request, res: Response): void => {
  if (req.user && (req.user.membership_status === 'member' || req.user.is_admin)) {
    res.redirect('/');
    return;
  }

  const viewModel: PasscodeViewModel = {
    title: 'Membership',
    error: null,
  };

  res.render('membership', viewModel);
};

export const postMembership = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { passcode } = req.body as PasscodeBody;

  if (passcode !== config.passcodes.member) {
    const viewModel: PasscodeViewModel = {
      title: 'Membership',
      error: 'Incorrect member passcode. Please try again.',
    };

    res.status(400).render('membership', viewModel);
    return;
  }

  if (!req.user) {
    res.redirect('/login');
    return;
  }

  await db.query(
    "UPDATE users SET membership_status = 'member' WHERE id = $1",
    [req.user.id]
  );

  req.user.membership_status = 'member';
  req.flash('success', 'Membership activated! You can now post messages and view authors and dates.');
  res.redirect('/');
});

export const getAdmin = (req: Request, res: Response): void => {
  if (req.user?.is_admin) {
    res.redirect('/');
    return;
  }

  const viewModel: PasscodeViewModel = {
    title: 'Admin Access',
    error: null,
  };

  res.render('admin-access', viewModel);
};

export const postAdmin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { passcode } = req.body as PasscodeBody;

  if (passcode !== config.passcodes.admin) {
    const viewModel: PasscodeViewModel = {
      title: 'Admin Access',
      error: 'Incorrect admin passcode. Access denied.',
    };

    res.status(400).render('admin-access', viewModel);
    return;
  }

  if (!req.user) {
    res.redirect('/login');
    return;
  }

  await db.query(
    "UPDATE users SET is_admin = TRUE, membership_status = 'admin' WHERE id = $1",
    [req.user.id]
  );

  req.user.is_admin = true;
  req.user.membership_status = 'admin';
  req.flash('success', 'Administrator privileges granted! You can now delete messages.');
  res.redirect('/');
});
