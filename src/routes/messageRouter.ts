import { Router } from 'express';

import {
  getNewMessage,
  postNewMessage,
  validateMessage,
  deleteMessage,
} from '../controllers/messageController';
import {
  getMembership,
  postMembership,
  getAdmin,
  postAdmin,
} from '../controllers/membershipController';
import { isAuthenticated, isAdmin, isMember } from '../middleware/auth';

const router: Router = Router();

// Message creation (members and admins only)
router.get('/new-message', isAuthenticated, isMember, getNewMessage);
router.post('/new-message', isAuthenticated, isMember, validateMessage, postNewMessage);

// Message deletion (Admin only)
router.post('/messages/:id/delete', isAuthenticated, isAdmin, deleteMessage);

// Membership passcode
router.get('/membership', isAuthenticated, getMembership);
router.post('/membership', isAuthenticated, postMembership);

// Admin secret passcode
router.get('/admin', isAuthenticated, getAdmin);
router.post('/admin', isAuthenticated, postAdmin);

export default router;
