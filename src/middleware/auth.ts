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
  if (req.isAuthenticated() && (req.user.membership_status === 'member' || req.user.membership_status === 'admin')) {
    return next();
  }
  res.status(403).render('index', {
    title: 'Access Denied',
    dbStatus: 'Club member access only',
    userCount: '-',
    messageCount: '-',
  });
};

export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated() && req.user.membership_status === 'admin') {
    return next();
  }
  res.status(403).send('Forbidden: Admin access required');
};
