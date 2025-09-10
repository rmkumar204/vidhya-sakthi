import { z } from 'zod';

// --- User Roles ---
export const UserRole = z.enum(['mentor', 'mentee', 'reviewer', 'state_admin', 'super_admin']);
export type UserRoleType = z.infer<typeof UserRole>;

// --- Registration Steps ---
export const RegistrationStep = z.enum(['personal', 'educational', 'preferences']);
export type RegistrationStepType = z.infer<typeof RegistrationStep>;

// --- Personal Details ---
export const PersonalDetailsSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, "Last name is required"),
  mobile_number: z.string().min(10, "Valid mobile number is required"),
  date_of_birth: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
  state: z.string().min(1, "State is required"),
  district: z.string().min(1, "District is required"),
  block: z.string().min(1, "Block is required"),
  place_city: z.string().min(1, "Place/City is required"),
  pin_code: z.string().min(6, "Valid PIN code is required"),
});
export type PersonalDetailsType = z.infer<typeof PersonalDetailsSchema>;

// --- Educational Details ---
export const EducationSchema = z.object({
  degree_diploma: z.string().min(1, "Degree/Diploma is required"),
  subject: z.string().min(1, "Subject is required"),
  year_of_completion: z.number().int().min(1950).max(new Date().getFullYear() + 10),
});

export const ExperienceSchema = z.object({
  industry: z.string().min(1, "Industry is required"),
  sector: z.string().min(1, "Sector is required"),
  role: z.string().min(1, "Role is required"),
  years_of_experience: z.number().int().min(0),
});

export const LanguageProficiencySchema = z.object({
  language: z.string().min(1, "Language is required"),
  can_read: z.boolean().default(false),
  can_write: z.boolean().default(false),
  can_speak: z.boolean().default(false),
  can_understand: z.boolean().default(false),
});

export const EducationalDetailsSchema = z.object({
  education: z.array(EducationSchema).min(1, "At least one education record is required"),
  experience: z.array(ExperienceSchema).optional(),
  languages: z.array(LanguageProficiencySchema).min(1, "At least one language is required"),
});
export type EducationalDetailsType = z.infer<typeof EducationalDetailsSchema>;

// --- Preferences ---
export const PreferencesSchema = z.object({
  max_hours_per_week: z.number().int().min(1).optional(),
  max_mentees: z.number().int().min(1).optional(), // for mentors
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
export type PreferencesType = z.infer<typeof PreferencesSchema>;

// --- Full Registration Payload ---
export const UserRegistrationSchema = z.object({
  // email: z.string().email(),
  role: UserRole,
  personal: PersonalDetailsSchema,
  educational: EducationalDetailsSchema,
  preferences: PreferencesSchema,
});
export type UserRegistrationType = z.infer<typeof UserRegistrationSchema>;

// --- Login Schemas ---
export const EmailPasswordLoginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export const EmailPasswordRegisterSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: UserRole,
});
