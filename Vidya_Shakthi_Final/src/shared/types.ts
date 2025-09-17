import z from "zod";
import React from "react";

// User roles
export const UserRole = z.enum(['mentor', 'mentee', 'reviewer', 'state_admin', 'super_admin']);
export type UserRoleType = z.infer<typeof UserRole>;

// Registration steps enum
export const RegistrationStep = z.enum(['personal', 'educational', 'preferences']);
export type RegistrationStepType = z.infer<typeof RegistrationStep>;

// User registration schema - split into steps
export const PersonalDetailsSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, "Last name is required"),
  mobile_number: z.string().min(10, "Valid mobile number is required"),
  date_of_birth: z.string(),
  state: z.string().min(1, "State is required"),
  district: z.string().min(1, "District is required"),
  block: z.string().min(1, "Block is required"),
  place_city: z.string().min(1, "Place/City is required"),
  pin_code: z.string().min(6, "Valid PIN code is required"),
});

export const EducationalDetailsSchema = z.object({
  education: z.array(z.object({
    degree_diploma: z.string().min(1, "Degree/Diploma is required"),
    subject: z.string().min(1, "Subject is required"),
    year_of_completion: z.number().min(1900).max(new Date().getFullYear()),
  })).min(1, "At least one education record is required"),
  experience: z.array(z.object({
    industry: z.string().min(1, "Industry is required"),
    sector: z.string().min(1, "Sector is required"),
    role: z.string().min(1, "Role is required"),
    years_of_experience: z.number().min(0),
  })).optional(),
  languages: z.array(z.object({
    language: z.string().min(1, "Language is required"),
    can_read: z.boolean().default(false),
    can_write: z.boolean().default(false),
    can_speak: z.boolean().default(false),
    can_understand: z.boolean().default(false),
  })).min(1, "At least one language is required"),
});

export const PreferencesSchema = z.object({
  max_hours_per_week: z.number().min(1).max(168).optional(),
  max_mentees: z.number().min(1).optional(), // for mentors
  mentoring_requirements: z.string().optional(), // for mentees
  skills_interests: z.array(z.string()).optional(),
  availability: z.object({
    weekdays: z.boolean().default(false),
    weekends: z.boolean().default(false),
    mornings: z.boolean().default(false),
    afternoons: z.boolean().default(false),
    evenings: z.boolean().default(false),
  }).optional(),
});

// Complete user registration schema
export const UserRegistrationSchema = z.object({
  email: z.string().email(),
  role: UserRole,
  personal: PersonalDetailsSchema,
  educational: EducationalDetailsSchema,
  preferences: PreferencesSchema,
});

export type UserRegistrationType = z.infer<typeof UserRegistrationSchema>;
export type PersonalDetailsType = z.infer<typeof PersonalDetailsSchema>;
export type EducationalDetailsType = z.infer<typeof EducationalDetailsSchema>;
export type PreferencesType = z.infer<typeof PreferencesSchema>;

// Legacy schemas for backward compatibility
export const EducationSchema = z.object({
  degree_diploma: z.string().min(1, "Degree/Diploma is required"),
  subject: z.string().min(1, "Subject is required"),
  year_of_completion: z.number().min(1900).max(new Date().getFullYear()),
});

export type EducationType = z.infer<typeof EducationSchema>;

export const ExperienceSchema = z.object({
  industry: z.string().min(1, "Industry is required"),
  sector: z.string().min(1, "Sector is required"),
  role: z.string().min(1, "Role is required"),
  years_of_experience: z.number().min(0),
});

export type ExperienceType = z.infer<typeof ExperienceSchema>;

export const LanguageProficiencySchema = z.object({
  language: z.string().min(1, "Language is required"),
  can_read: z.boolean().default(false),
  can_write: z.boolean().default(false),
  can_speak: z.boolean().default(false),
  can_understand: z.boolean().default(false),
});

export type LanguageProficiencyType = z.infer<typeof LanguageProficiencySchema>;

// Email/Password authentication schemas
export const EmailPasswordLoginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const EmailPasswordRegisterSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  role: UserRole,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type EmailPasswordLoginType = z.infer<typeof EmailPasswordLoginSchema>;
export type EmailPasswordRegisterType = z.infer<typeof EmailPasswordRegisterSchema>;

// Theme type
export type ThemeType = 'light' | 'dark';

// Role card type
export interface RoleCard {
  role: UserRoleType;
  title: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
}

// Registration step info
export interface StepInfo {
  key: RegistrationStepType;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}


export enum MediaType {
  VIDEO = 'Video',
  AUDIO = 'Audio',
  DOCUMENT = 'Document',
  IMAGE = 'Image',
}