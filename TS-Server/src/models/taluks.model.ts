import { Schema, model, Document, Types } from 'mongoose';

export interface ITaluks extends Document {
  name: string;
  district_id: Types.ObjectId;
}

const TaluksSchema = new Schema<ITaluks>({
  name: { type: String, required: true },
  district_id: { type: Schema.Types.ObjectId, ref: 'District', required: true }
});

export const Taluks = model<ITaluks>('Taluks', TaluksSchema);
