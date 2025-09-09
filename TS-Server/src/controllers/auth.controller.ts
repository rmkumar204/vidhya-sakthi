import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User, { IUser } from '../models/user.model';
import generateToken from '../utils/generateToken';
import { EmailPasswordRegisterSchema, EmailPasswordLoginSchema, UserRegistrationSchema } from '../shared/types';
import { Types } from 'mongoose';
import { getGoogleOAuthTokens, getGoogleUser } from '../services/google.service';
 
/**
 * @desc    Register a new user with email/password
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUserWithEmail = asyncHandler(async (req, res) => {
  const validation = EmailPasswordRegisterSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400);
    throw new Error(validation.error.errors.map(e => e.message).join(', '));
  }

  const { email, password, role } = validation.data;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = (await User.create({
    email,
    password_hash: password,
    role,
  })) as IUser;

  if (user) {
    res.status(201).json({
      _id: user._id,
      email: user.email,
      role: user.role,
      registration_complete: user.registration_complete,
      token: generateToken(user._id.toString()),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = EmailPasswordLoginSchema.parse(req.body);

  const user = await User.findOne({ email }).exec() as IUser | null;

  if (user && user.password_hash && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      role: user.role,
      token: generateToken(user._id.toString()),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Login with Google
// @route   POST /api/auth/google/login
// @access   Public
const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.body;

  if (!code) {
    res.status(400);
    throw new Error('Google OAuth code is required');
  }

  const { id_token, access_token } = await getGoogleOAuthTokens({ code });
  const googleUser = await getGoogleUser({ id_token, access_token });

  if (!googleUser.verified_email) {
    res.status(403);
    throw new Error('Google account is not verified');
  }

  let user = await User.findOne({ email: googleUser.email }).exec() as IUser | null;

  if (!user) {
    // If user doesn't exist, create a new one.
    // The role will be assigned on the registration completion step.
    user = (await User.create({
      email: googleUser.email,
      first_name: googleUser.given_name,
      last_name: googleUser.family_name,
      google_sub: googleUser.id,
      // role is not set yet, will be set during profile completion
    })) as IUser;
  }

  const isProfileComplete = !!(user.role && user.state); // Simple check for profile completion

  res.status(200).json({
    _id: user._id,
    name: user.first_name ? `${user.first_name} ${user.last_name}` : googleUser.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id.toString()),
    isProfileComplete,
  });
});

/**
 * @desc    Complete user registration with detailed profile info
 * @route   POST /api/auth/complete-registration
 * @access  Private
 */
const completeRegistration = asyncHandler(async (req, res) => {
    const userId = req.user._id; // from 'protect' middleware
    const validation = UserRegistrationSchema.safeParse(req.body);

    if (!validation.success) {
        res.status(400);
        throw new Error(validation.error.errors.map(e => e.message).join(', '));
    }

    const { personal, educational, preferences } = validation.data;

    const user = await User.findById(userId).exec() as IUser | null;

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Update user with all the details
    user.first_name = personal.first_name;
    user.middle_name = personal.middle_name;
    user.last_name = personal.last_name;
    user.mobile_number = personal.mobile_number;
    user.date_of_birth = new Date(personal.date_of_birth);
    user.state = personal.state;
    user.district = personal.district;
    user.block = personal.block;
    user.place_city = personal.place_city;
    user.pin_code = personal.pin_code;

    // Update education array
    if (educational.education) {
        user.education.splice(0, user.education.length); // Clear the array
        for (const edu of educational.education) {
            user.education.addToSet(edu);
        }
    }

    // Update experience array
    if (educational.experience) {
        user.experience.splice(0, user.experience.length); // Clear the array
        for (const exp of educational.experience) {
            user.experience.addToSet(exp);
        }
    }

    // Update languages array
    if (educational.languages) {
        user.languages.splice(0, user.languages.length); // Clear the array
        for (const lang of educational.languages) {
            user.languages.addToSet(lang);
        }
    }
    
    // Set preferences with default values for required fields
    if (preferences) {
        user.preferences = {
            max_hours_per_week: preferences.max_hours_per_week,
            max_mentees: preferences.max_mentees,
            mentoring_requirements: preferences.mentoring_requirements,
            skills_interests: preferences.skills_interests || [],
            availability: preferences.availability || {
                weekdays: false,
                weekends: false,
                mornings: false,
                afternoons: false,
                evenings: false
            }
        };
    }

    user.registration_complete = true;

    const updatedUser = await user.save();

    res.json({
        _id: updatedUser._id,
        email: updatedUser.email,
        role: updatedUser.role,
        first_name: updatedUser.first_name,
        registration_complete: updatedUser.registration_complete,
        token: generateToken(updatedUser._id.toString()),
    });
});


export { registerUserWithEmail, loginUser, completeRegistration, googleLogin };
