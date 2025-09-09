import express from 'express';
import { registerUserWithEmail, loginUser, completeRegistration } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/register', registerUserWithEmail);
router.post('/login', loginUser);
router.post('/complete-registration', protect, completeRegistration);

// NOTE: A secure Google OAuth flow would have routes here
// e.g., router.get('/google') to redirect to Google
// and router.post('/google/callback') to handle the callback from Google
// This keeps your client_secret safe on the backend.

export default router;
