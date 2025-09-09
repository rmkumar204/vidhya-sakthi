import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRoleType } from '../shared/types';

// Define the interface for User document
export interface IUser extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password_hash?: string;
  google_sub?: string;
  role: UserRoleType;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  mobile_number?: string;
  date_of_birth?: Date;
  state?: string;
  district?: string;
  block?: string;
  place_city?: string;
  pin_code?: string;
  education: mongoose.Types.DocumentArray<any>;
  experience: mongoose.Types.DocumentArray<any>;
  languages: mongoose.Types.DocumentArray<any>;
  preferences?: any;
  is_approved: boolean;
  is_active: boolean;
  registration_complete: boolean;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

// Sub-schemas for embedded documents
const educationSchema = new mongoose.Schema({
  degree_diploma: { type: String, required: true },
  subject: { type: String, required: true },
  year_of_completion: { type: Number },
});

const experienceSchema = new mongoose.Schema({
  industry: { type: String, required: true },
  sector: { type: String, required: true },
  role: { type: String, required: true },
  years_of_experience: { type: Number },
});

const languageProficiencySchema = new mongoose.Schema({
  language: { type: String, required: true },
  can_read: { type: Boolean, default: false },
  can_write: { type: Boolean, default: false },
  can_speak: { type: Boolean, default: false },
  can_understand: { type: Boolean, default: false },
});

const preferencesSchema = new mongoose.Schema({
  max_hours_per_week: { type: Number },
  max_mentees: { type: Number }, // For mentors
  mentoring_requirements: { type: String }, // For mentees
  skills_interests: { type: [String], required: false },
  availability: {
    weekdays: { type: Boolean, default: false },
    weekends: { type: Boolean, default: false },
    mornings: { type: Boolean, default: false },
    afternoons: { type: Boolean, default: false },
    evenings: { type: Boolean, default: false },
  },
});

// Main User Schema
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password_hash: {
      type: String,
    },
    google_sub: { // Google User ID
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
    },
    role: {
      type: String,
      required: true,
      enum: ['mentor', 'mentee', 'reviewer', 'state_admin', 'super_admin'],
    },
    first_name: { type: String },
    middle_name: { type: String },
    last_name: { type: String },
    mobile_number: { type: String },
    date_of_birth: { type: Date },
    state: { type: String },
    district: { type: String },
    block: { type: String },
    place_city: { type: String },
    pin_code: { type: String },
    
    education: [educationSchema],
    experience: [experienceSchema],
    languages: [languageProficiencySchema],
    preferences: preferencesSchema,

    is_approved: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    registration_complete: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password_hash);
};

// Middleware to hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password_hash') || !this.password_hash) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
  next();
});

const User = mongoose.model<IUser>('User', userSchema);

export default User;
