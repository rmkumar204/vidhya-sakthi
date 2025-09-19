import mongoose, { Schema, Document, Types } from 'mongoose';

interface INotification extends Document {
  recipient: Types.ObjectId;
  type: 'connection_request' | 'request_accepted' | 'request_rejected' | 'new_message' | 'project_update' | 'system';
  title: string;
  message: string;
  data?: any; // Additional data related to the notification
  read: boolean;
  created_at: Date;
  read_at?: Date;
  action_url?: string; // URL to navigate when notification is clicked
}

const notificationSchema: Schema = new Schema(
  {
    recipient: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    type: {
      type: String,
      enum: ['connection_request', 'request_accepted', 'request_rejected', 'new_message', 'project_update', 'system'],
      required: true
    },
    title: { 
      type: String, 
      required: true,
      maxlength: 200
    },
    message: { 
      type: String, 
      required: true,
      maxlength: 1000
    },
    data: {
      type: Schema.Types.Mixed
    },
    read: {
      type: Boolean,
      default: false
    },
    created_at: {
      type: Date,
      default: Date.now
    },
    read_at: {
      type: Date
    },
    action_url: {
      type: String
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
notificationSchema.index({ recipient: 1, read: 1, created_at: -1 });
notificationSchema.index({ recipient: 1, type: 1 });

const Notification = mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
export type { INotification };