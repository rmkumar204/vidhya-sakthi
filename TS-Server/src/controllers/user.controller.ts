import asyncHandler from 'express-async-handler';
import User from '../models/user.model';

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password_hash');

  if (user) {
    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      registration_complete: user.registration_complete,
      //... send other details as needed
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Check if user has completed registration
 * @route   GET /api/users/registration-status
 * @access  Private
 */
const checkRegistrationStatus = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('registration_complete');

    if (user) {
        res.json({
            registration_complete: user.registration_complete
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

/**
 * @desc    Get user by ID (for call UI)
 * @route   GET /api/users/:id
 * @access  Private
 */
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password_hash');

    if (user) {
        res.json({
            _id: user._id,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name,
            name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}`.trim() : user.email,
            registration_complete: user.registration_complete,
            is_active: user.is_active,
            is_approved: user.is_approved
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

/**
 * @desc    Get all mentors for guidance connection
 * @route   GET /api/users/mentors
 * @access  Private (mentees only)
 */
const getMentors = asyncHandler(async (req, res) => {
    const { page = '1', limit = '20', search = '' } = req.query as Record<string, string>;
    
    // Verify user is a mentee
    if (req.user.role !== 'mentee') {
        res.status(403);
        throw new Error('Only mentees can access mentors list');
    }
    
    const filter: any = {
        role: 'mentor',
        is_active: true,
        registration_complete: true
    };
    
    // Add search functionality
    if (search) {
        filter.$or = [
            { first_name: { $regex: search, $options: 'i' } },
            { last_name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { 'experience.role': { $regex: search, $options: 'i' } },
            { 'experience.sector': { $regex: search, $options: 'i' } },
            { 'preferences.skills_interests': { $elemMatch: { $regex: search, $options: 'i' } } }
        ];
    }
    
    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    
    // Execute queries
    const [mentors, totalCount] = await Promise.all([
        User.find(filter)
            .select('first_name last_name email experience preferences createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        User.countDocuments(filter)
    ]);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;
    
    // Format mentors data
    const formattedMentors = mentors.map(mentor => ({
        _id: mentor._id,
        name: `${mentor.first_name} ${mentor.last_name}`.trim() || mentor.email,
        email: mentor.email,
        experience: mentor.experience || [],
        skills: mentor.preferences?.skills_interests || [],
        availability: mentor.preferences?.availability || {},
        maxMentees: mentor.preferences?.max_mentees || 5
    }));
    
    res.json({
        mentors: formattedMentors,
        pagination: {
            currentPage: pageNum,
            totalPages,
            totalCount,
            limit: limitNum,
            hasNextPage,
            hasPrevPage
        }
    });
});


export { getUserProfile, checkRegistrationStatus, getUserById, getMentors };
