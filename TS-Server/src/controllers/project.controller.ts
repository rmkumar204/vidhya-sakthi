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
  const { 
    q, 
    status, 
    industry, 
    mentor, 
    content_types,
    sector,
    duration_min,
    duration_max,
    page = '1', 
    limit = '10',
    sort_by = 'createdAt',
    sort_order = 'desc'
  } = req.query as Record<string, string>;
  
  const filter: any = {};
  
  // Search functionality
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { required_skills: { $elemMatch: { $regex: q, $options: 'i' } } },
      { industry: { $regex: q, $options: 'i' } },
      { sector: { $regex: q, $options: 'i' } }
    ];
  }
  
  // Filter functionality
  if (status) filter.status = status;
  if (industry) filter.industry = industry;
  if (sector) filter.sector = sector;
  if (mentor) filter.mentor = mentor;
  if (content_types) {
    const types = content_types.split(',').map(t => t.trim());
    filter.content_types = { $in: types };
  }
  
  // Duration range filter
  if (duration_min || duration_max) {
    filter.duration_weeks = {};
    if (duration_min) filter.duration_weeks.$gte = parseInt(duration_min);
    if (duration_max) filter.duration_weeks.$lte = parseInt(duration_max);
  }
  
  // Pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Max 50 items per page
  const skip = (pageNum - 1) * limitNum;
  
  // Sorting
  const sortOptions: any = {};
  const validSortFields = ['createdAt', 'title', 'duration_weeks', 'max_mentees'];
  const sortField = validSortFields.includes(sort_by) ? sort_by : 'createdAt';
  sortOptions[sortField] = sort_order === 'asc' ? 1 : -1;
  
  // Execute queries
  const [projects, totalCount] = await Promise.all([
    Project.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate('mentor', 'first_name last_name email')
      .lean(),
    Project.countDocuments(filter)
  ]);
  
  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;
  
  res.json({
    projects,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalCount,
      limit: limitNum,
      hasNextPage,
      hasPrevPage
    },
    filters: {
      q,
      status,
      industry,
      sector,
      content_types,
      duration_min,
      duration_max
    }
  });
});

// GET /api/projects/:id
export const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('mentor', 'first_name last_name email')
    .lean();
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }
  res.json(project);
});

// GET /api/projects/filters/options - Get available filter options
export const getFilterOptions = asyncHandler(async (req, res) => {
  const [industries, sectors, contentTypes] = await Promise.all([
    Project.distinct('industry').then(items => items.filter(Boolean)),
    Project.distinct('sector').then(items => items.filter(Boolean)),
    Project.distinct('content_types').then(items => items.filter(Boolean))
  ]);
  
  res.json({
    industries: industries.sort(),
    sectors: sectors.sort(),
    contentTypes: contentTypes.sort(),
    statuses: ['open', 'in_progress', 'completed', 'on_hold', 'cancelled']
  });
});


