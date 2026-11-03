import { Request, Response, NextFunction } from 'express';
import db from '../db/pool';

const CLUB_PASSCODE = process.env.CLUB_PASSCODE || 'club123';
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'admin123';

// GET: Render Join Club passcode page
export const getJoinClub = (req: Request, res: Response): void => {
  if (req.user && (req.user.membership_status === 'member' || req.user.is_admin)) {
    return res.redirect('/');
  }
  res.render('join-club', {
    title: 'Join the Club',
    error: null,
  });
};

// POST: Verify club secret passcode
export const postJoinClub = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { passcode } = req.body;

  if (passcode !== CLUB_PASSCODE) {
    return res.status(400).render('join-club', {
      title: 'Join the Club',
      error: 'Incorrect club passcode. Please try again.',
    });
  }

  try {
    if (!req.user) {
      return res.redirect('/login');
    }

    await db.query(
      "UPDATE users SET membership_status = 'member' WHERE id = $1",
      [req.user.id]
    );

    // Update session user
    req.user.membership_status = 'member';
    req.flash('success', '🎉 Welcome to the Club! You can now view all message authors and post dates.');
    res.redirect('/');
  } catch (err) {
    console.error('Error updating membership status:', err);
    next(err);
  }
};

// GET: Render Admin passcode page
export const getAdmin = (req: Request, res: Response): void => {
  if (req.user && req.user.is_admin) {
    return res.redirect('/');
  }
  res.render('admin-access', {
    title: 'Admin Access',
    error: null,
  });
};

// POST: Verify admin secret passcode
export const postAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { passcode } = req.body;

  if (passcode !== ADMIN_PASSCODE) {
    return res.status(400).render('admin-access', {
      title: 'Admin Access',
      error: 'Incorrect admin passcode. Access denied.',
    });
  }

  try {
    if (!req.user) {
      return res.redirect('/login');
    }

    await db.query(
      "UPDATE users SET is_admin = TRUE, membership_status = 'admin' WHERE id = $1",
      [req.user.id]
    );

    // Update session user
    req.user.is_admin = true;
    req.user.membership_status = 'admin';
    req.flash('success', '🛡️ Administrator privileges granted! You can now delete messages.');
    res.redirect('/');
  } catch (err) {
    console.error('Error elevating user to admin:', err);
    next(err);
  }
};
