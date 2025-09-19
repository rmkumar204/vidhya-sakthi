import mongoose, { Schema, Document, Types } from 'mongoose';

interface IMessage extends Document {
  sender: Types.ObjectId;
  content: string;
  timestamp: Date;
  edited?: boolean;
  edited_at?: Date;
  message_type: 'text' | 'file' | 'image' | 'voice' | 'video_call' | 'audio_call' | 'call_started' | 'call_ended' | 'screen_share_started' | 'screen_share_ended';
  file_url?: string;
  call_duration?: number; // For call messages
  call_metadata?: {
    callId: string;
    callType: 'audio' | 'video';
    participants: string[];
    startTime: Date;
    endTime?: Date;
  };
}

interface IConversation extends Document {
  participants: Types.ObjectId[];
  project: Types.ObjectId;
  connection_request: Types.ObjectId;
  messages: IMessage[];
  last_message?: string;
  last_message_at?: Date;
  created_at: Date;
  is_active: boolean;
}

const messageSchema: Schema = new Schema({
  sender: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  content: { 
    type: String, 
    required: true,
    maxlength: 2000
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  edited: {
    type: Boolean,
    default: false
  },
  edited_at: {
    type: Date
  },
  message_type: {
    type: String,
    enum: ['text', 'file', 'image', 'voice', 'video_call', 'audio_call', 'call_started', 'call_ended', 'screen_share_started', 'screen_share_ended'],
    default: 'text'
  },
  file_url: {
    type: String
  },
  call_duration: {
    type: Number // Duration in seconds
  },
  call_metadata: {
    callId: {
      type: String
    },
    callType: {
      type: String,
      enum: ['audio', 'video']
    },
    participants: [{
      type: String
    }],
    startTime: {
      type: Date
    },
    endTime: {
      type: Date
    }
  }
});

const conversationSchema: Schema = new Schema(
  {
    participants: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    }],
    project: { 
      type: Schema.Types.ObjectId, 
      ref: 'Project', 
      required: true 
    },
    connection_request: { 
      type: Schema.Types.ObjectId, 
      ref: 'ConnectionRequest', 
      required: true 
    },
    messages: [messageSchema],
    last_message: {
      type: String
    },
    last_message_at: {
      type: Date
    },
    created_at: {
      type: Date,
      default: Date.now
    },
    is_active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
conversationSchema.index({ participants: 1, is_active: 1 });
conversationSchema.index({ project: 1 });
conversationSchema.index({ connection_request: 1 });
conversationSchema.index({ last_message_at: -1 });

const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);

export default Conversation;
export type { IConversation, IMessage };