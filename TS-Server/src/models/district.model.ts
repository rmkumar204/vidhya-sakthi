import { Schema, model, Document, Types } from 'mongoose';

export interface IDistrict extends Document {
  name: string;
  state_id: Types.ObjectId;
}

const districtSchema = new Schema<IDistrict>({
  name: { type: String, required: true },
  state_id: { type: Schema.Types.ObjectId, ref: 'State', required: true }
});

export const District = model<IDistrict>('District', districtSchema);
