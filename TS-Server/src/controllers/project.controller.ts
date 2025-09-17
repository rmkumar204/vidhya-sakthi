import asyncHandler from 'express-async-handler';
import Project from '../models/project.model';

// POST /api/projects
export const createProject = asyncHandler(async (req, res) => {
  const mentorId = req.user?._id || req.body.mentor; // middleware should set req.user
  if (!mentorId) {
    // allow creation without mentor for demo; set a null mentor
    // alternatively, you can return 400 with message
  }
  const project = await Project.create({
    title: req.body.title,
    description: req.body.description,
    mentor: mentorId,
    status: 'open',
    max_mentees: req.body.max_mentees ?? 5,
    industry: req.body.industry,
    sector: req.body.sector,
    required_skills: req.body.required_skills ?? [],
    duration_weeks: req.body.duration_weeks,
    content_types: req.body.content_types ?? [],
    thumbnail_url: req.body.thumbnail_url,
  });
  res.status(201).json(project);
});

// GET /api/projects
export const listProjects = asyncHandler(async (req, res) => {
  const { q, status, industry, mentor } = req.query as Record<string, string>;
  const filter: any = {};
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { required_skills: { $elemMatch: { $regex: q, $options: 'i' } } },
    ];
  }
  if (status) filter.status = status;
  if (industry) filter.industry = industry;
  if (mentor) filter.mentor = mentor;

  const projects = await Project.find(filter).sort({ createdAt: -1 }).lean();
  res.json(projects);
});

// GET /api/projects/:id
export const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }
  res.json(project);
});


