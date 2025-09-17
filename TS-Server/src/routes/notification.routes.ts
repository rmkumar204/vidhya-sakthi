import express from 'express';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification, 
  getUnreadCount 
} from '../controllers/notification.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.route('/')
  .get(protect, getNotifications);

router.route('/unread-count')
  .get(protect, getUnreadCount);

router.route('/mark-all-read')
  .put(protect, markAllNotificationsAsRead);

router.route('/:id')
  .delete(protect, deleteNotification);

router.route('/:id/read')
  .put(protect, markNotificationAsRead);

export default router;