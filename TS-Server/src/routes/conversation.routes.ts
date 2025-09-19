import express from 'express';
import { 
  getConversations, 
  getConversation, 
  sendMessage, 
  editMessage, 
  deleteConversation 
} from '../controllers/conversation.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.route('/')
  .get(protect, getConversations);

router.route('/:id')
  .get(protect, getConversation)
  .delete(protect, deleteConversation);

router.route('/:id/messages')
  .post(protect, sendMessage);

router.route('/:id/messages/:messageId')
  .put(protect, editMessage);

export default router;