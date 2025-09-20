import express from 'express';
import { getUserProfile, checkRegistrationStatus, getUserById, getMentors } from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.route('/profile').get(protect, getUserProfile);
router.route('/registration-status').get(protect, checkRegistrationStatus);
router.route('/mentors').get(protect, getMentors);
router.route('/:id').get(protect, getUserById);

export default router;
