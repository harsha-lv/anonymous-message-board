import { Router } from 'express';
import { getSignUp, postSignUp, validateSignUp } from '../controllers/authController';

const router = Router();

// Sign Up
router.get('/sign-up', getSignUp);
router.post('/sign-up', validateSignUp, postSignUp);

export default router;

