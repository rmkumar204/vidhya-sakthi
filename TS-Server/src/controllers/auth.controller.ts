import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User, { IUser } from '../models/user.model';
import Otp, { IOtp } from '../models/otp.model';
import generateToken from '../utils/generateToken';
import { EmailPasswordRegisterSchema, EmailPasswordLoginSchema, UserRegistrationSchema } from '../shared/types';
import { Types } from 'mongoose';
import { getGoogleOAuthTokens, getGoogleUser } from '../services/google.service';
import { sendOtpEmail } from '../services/mail.service';

export const checkUser = asyncHandler(async (req: Request, res: Response) => {
  const email = String(req.query.email || '').toLowerCase();
  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }
  const user = await User.findOne({ email }).select('_id').lean();
  res.json({ exists: !!user });
});

export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, purpose } = req.body as { email?: string; purpose?: 'register' | 'reset' };
  if (!email || !purpose) {
    res.status(400);
    throw new Error('Email and purpose are required');
  }
  const normalized = email.toLowerCase();
  const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
  
  try {
    // Delete any existing OTP for this email and purpose
    await Otp.deleteMany({ email: normalized, purpose });
    
    // Create new OTP record
    await Otp.create({
      email: normalized,
      otp,
      purpose,
      expiresAt
    });
    
    await sendOtpEmail(normalized, otp, purpose);
    res.json({ message: 'OTP sent', ttlSeconds: 300 });
  } catch (e) {
    // Clean up OTP record if email sending fails
    await Otp.deleteMany({ email: normalized, purpose });
    res.status(500);
    throw new Error('Failed to send OTP email');
  }
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, purpose } = req.body as { email?: string; otp?: string; purpose?: 'register' | 'reset' };
  if (!email || !otp) {
    res.status(400);
    throw new Error('Email and OTP are required');
  }
  const normalized = email.toLowerCase();
  
  // Find the OTP record in MongoDB
  const otpRecord = await Otp.findOne({ 
    email: normalized, 
    otp,
    expiresAt: { $gt: new Date() } // Only find non-expired OTPs
  });
  
  if (!otpRecord) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }
  
  if (purpose && otpRecord.purpose !== purpose) {
    res.status(400);
    throw new Error('OTP purpose mismatch');
  }
  
  // Only delete OTP for register purpose, keep it for reset purpose until password is actually reset
  if (otpRecord.purpose === 'register') {
    await Otp.deleteOne({ _id: otpRecord._id });
  }
  
  res.json({ verified: true });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body as { email?: string; otp?: string; newPassword?: string };
  if (!email || !otp || !newPassword) {
    res.status(400);
    throw new Error('Email, OTP and newPassword are required');
  }
  const normalized = email.toLowerCase();
  
  // Find the OTP record in MongoDB (without expiry check since OTP should already be verified)
  const otpRecord = await Otp.findOne({ 
    email: normalized, 
    otp: String(otp),
    purpose: 'reset'
  });
  
  if (!otpRecord) {
    res.status(400);
    throw new Error('Invalid OTP for password reset');
  }
  
  const user = await User.findOne({ email: normalized }).exec() as IUser | null;
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  user.password_hash = newPassword; // pre-save hook hashes
  await user.save();
  
  // Delete the OTP after successful password reset
  await Otp.deleteOne({ _id: otpRecord._id });
  
  res.json({ message: 'Password reset successful' });
});
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
