import mongoose from 'mongoose';

// Define the interface for OTP document
export interface IOtp extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  otp: string;
  purpose: 'register' | 'reset';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// OTP Schema
const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true, // For faster queries
    },
    otp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      required: true,
      enum: ['register', 'reset'],
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Create TTL index for automatic cleanup of expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp = mongoose.model<IOtp>('Otp', otpSchema);

export default Otp;
