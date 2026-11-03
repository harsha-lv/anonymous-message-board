import { Request, Response, NextFunction } from 'express';

export const isAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

export const isGuest = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};

export const isMember = (req: Request, res: Response, next: NextFunction): void => {
  if (
    req.isAuthenticated() &&
    (req.user.membership_status === 'member' || req.user.membership_status === 'admin' || req.user.is_admin)
  ) {
    return next();
  }
  res.redirect('/join-club');
};

export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated() && (req.user.is_admin || req.user.membership_status === 'admin')) {
    return next();
  }
  res.status(403).send('Forbidden: Administrator privileges required to perform this action.');
};
