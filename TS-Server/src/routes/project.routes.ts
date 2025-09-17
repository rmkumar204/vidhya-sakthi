import express from 'express';
import { createProject, listProjects, getProject } from '../controllers/project.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.route('/')
  .get(listProjects)
  .post( createProject);

router.route('/:id')
  .get(getProject);

export default router;




