import type { NextFunction, Request, Response } from 'express';
import type { MembershipStatus } from '../types';

const MEMBER_STATUSES: readonly MembershipStatus[] = ['member', 'admin'];

const hasMemberAccess = (user: Express.User): boolean =>
  user.is_admin || MEMBER_STATUSES.includes(user.membership_status);

const hasAdminAccess = (user: Express.User): boolean =>
  user.is_admin || user.membership_status === 'admin';

export const isAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated()) {
    next();
    return;
  }

  res.redirect('/login');
};

export const isGuest = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.isAuthenticated()) {
    next();
    return;
  }

  res.redirect('/');
};

export const isMember = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated() && hasMemberAccess(req.user)) {
    next();
    return;
  }

  res.redirect('/join-club');
};

export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated() && hasAdminAccess(req.user)) {
    next();
    return;
  }

  res.status(403).send('Forbidden: Administrator privileges required to perform this action.');
};
