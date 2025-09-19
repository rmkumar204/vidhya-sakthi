import express from 'express';
import { 
  createConnectionRequest, 
  listConnectionRequests, 
  respondToConnectionRequest, 
  getConnectionRequest 
} from '../controllers/connectionRequest.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.route('/')
  .get(protect, listConnectionRequests)
  .post(protect, createConnectionRequest);

router.route('/:id')
  .get(protect, getConnectionRequest);

router.route('/:id/respond')
  .put(protect, respondToConnectionRequest);

export default router;