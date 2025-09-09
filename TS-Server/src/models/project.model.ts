import mongoose, { Schema, Document, Types } from 'mongoose';

interface IProject extends Document {
  title: string;
  description: string;
  mentor: Types.ObjectId;
  status: 'open' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  max_mentees: number;
  industry?: string;
  sector?: string;
  required_skills?: string[];
  duration_weeks?: number;
  is_approved: boolean;
  approved_by?: Types.ObjectId;
  approved_at?: Date;
}

const projectSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    mentor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'completed', 'on_hold', 'cancelled'],
      default: 'open',
    },
    max_mentees: { type: Number, default: 5 },
    industry: { type: String },
    sector: { type: String },
    required_skills: [{ type: String }],
    duration_weeks: { type: Number },
    is_approved: { type: Boolean, default: false },
    approved_by: { type: Schema.Types.ObjectId, ref: 'User' },
    approved_at: { type: Date },
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model<IProject>('Project', projectSchema);

export default Project;
