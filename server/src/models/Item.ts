import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    unit: { type: String, required: true },
    quantity: { type: Number, required: true, default: 0 },
    minQuantity: { type: Number, required: true, default: 0 },
    maxQuantity: { type: Number },
    supplier: { type: String },
    expiryDate: { type: Date },
  },
  { timestamps: true }
);

itemSchema.index({ categoryId: 1 });
itemSchema.index({ name: 1 });

export const Item = mongoose.model('Item', itemSchema);
