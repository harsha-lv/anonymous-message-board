import { Router } from 'express';

import {
  getSignUp,
  postSignUp,
  validateSignUp,
  getLogin,
  postLogin,
  getLogout,
} from '../controllers/authController';
import { isGuest, isAuthenticated } from '../middleware/auth';

const router: Router = Router();

router.get('/sign-up', isGuest, getSignUp);
router.post('/sign-up', isGuest, validateSignUp, postSignUp);

router.get('/login', isGuest, getLogin);
router.post('/login', isGuest, postLogin);

router.get('/logout', isAuthenticated, getLogout);
router.post('/logout', isAuthenticated, getLogout);

export default router;
