import { Schema, model, Document, Types } from 'mongoose';

export interface IPincode extends Document {
  code: string;
  taluk_id: Types.ObjectId;
}

const pincodeSchema = new Schema<IPincode>(
  {
    code: { type: String, required: true },
    taluk_id: { type: Schema.Types.ObjectId, ref: 'Taluk', required: true }
  },
  { collection: 'pincode' } // 👈 force correct collection name
);

export const Pincode = model<IPincode>('Pincode', pincodeSchema);
