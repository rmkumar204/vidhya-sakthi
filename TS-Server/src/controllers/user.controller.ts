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


export { getUserProfile, checkRegistrationStatus };
