import mongoose, { Schema, Document, Types } from 'mongoose';

interface IConnectionRequest extends Document {
  mentee: Types.ObjectId;
  mentor: Types.ObjectId;
  project: Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string; // Optional message from mentee
  response_message?: string; // Optional response from mentor
  requested_at: Date;
  responded_at?: Date;
  conversation?: Types.ObjectId; // Reference to conversation if accepted
}

const connectionRequestSchema: Schema = new Schema(
  {
    mentee: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    mentor: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    project: { 
      type: Schema.Types.ObjectId, 
      ref: 'Project', 
      required: true 
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      required: true
    },
    message: { 
      type: String,
      maxlength: 500
    },
    response_message: { 
      type: String,
      maxlength: 500
    },
    requested_at: {
      type: Date,
      default: Date.now
    },
    responded_at: {
      type: Date
    },
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation'
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
connectionRequestSchema.index({ mentee: 1, status: 1 });
connectionRequestSchema.index({ mentor: 1, status: 1 });
connectionRequestSchema.index({ project: 1 });

// Prevent duplicate pending requests for same mentee-mentor-project combination
connectionRequestSchema.index(
  { mentee: 1, mentor: 1, project: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { status: 'pending' }
  }
);

const ConnectionRequest = mongoose.model<IConnectionRequest>('ConnectionRequest', connectionRequestSchema);

export default ConnectionRequest;
export type { IConnectionRequest };