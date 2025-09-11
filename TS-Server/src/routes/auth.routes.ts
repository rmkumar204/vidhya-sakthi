import express from 'express';
import { registerUserWithEmail, loginUser, completeRegistration, googleLogin, checkUser, sendOtp, verifyOtp, resetPassword } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/check-user', checkUser);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

router.post('/register', registerUserWithEmail);
router.post('/login', loginUser);
router.post('/complete-registration', protect, completeRegistration);

export default router;