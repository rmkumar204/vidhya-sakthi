import { Schema, model, Document } from 'mongoose';

export interface IState extends Document {
  name: string;
}

const stateSchema = new Schema<IState>({
  name: { type: String, required: true, unique: true }
});

export const State = model<IState>('State', stateSchema);
