import { Router } from 'express';
import {
  getNewMessage,
  postNewMessage,
  validateMessage,
  deleteMessage,
} from '../controllers/messageController';
import {
  getJoinClub,
  postJoinClub,
  getAdmin,
  postAdmin,
} from '../controllers/clubController';
import { isAuthenticated, isAdmin } from '../middleware/auth';

const router = Router();

// Message creation
router.get('/new-message', isAuthenticated, getNewMessage);
router.post('/new-message', isAuthenticated, validateMessage, postNewMessage);

// Message deletion (Admin only)
router.post('/messages/:id/delete', isAuthenticated, isAdmin, deleteMessage);

// Club membership passcode
router.get('/join-club', isAuthenticated, getJoinClub);
router.post('/join-club', isAuthenticated, postJoinClub);

// Admin secret passcode
router.get('/admin', isAuthenticated, getAdmin);
router.post('/admin', isAuthenticated, postAdmin);

export default router;

