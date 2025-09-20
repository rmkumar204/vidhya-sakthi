import express from 'express';
import { 
  createConnectionRequest, 
  createGuidanceConnectionRequest,
  listConnectionRequests, 
  respondToConnectionRequest, 
  getConnectionRequest 
} from '../controllers/connectionRequest.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.route('/')
  .get(protect, listConnectionRequests)
  .post(protect, createConnectionRequest);

router.route('/guidance')
  .post(protect, createGuidanceConnectionRequest);

router.route('/:id')
  .get(protect, getConnectionRequest);

router.route('/:id/respond')
  .put(protect, respondToConnectionRequest);

export default router;