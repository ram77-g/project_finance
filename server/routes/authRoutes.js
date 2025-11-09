import express from 'express';
import { signup, login, getCurrentUser } from '../controllers/authController.js';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

//Public routes — no token required
router.post('/signup', signup);
router.post('/login', login);

//Protected route — token required
router.get('/me', requireAuth, getCurrentUser);

export default router;