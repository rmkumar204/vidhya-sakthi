import express from 'express';
import { createProject, listProjects, getProject, getFilterOptions } from '../controllers/project.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.route('/')
  .get(listProjects)
  .post(protect, createProject);

router.route('/filters/options')
  .get(getFilterOptions);

router.route('/:id')
  .get(getProject);

export default router;




