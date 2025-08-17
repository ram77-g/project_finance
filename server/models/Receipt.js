import mongoose from 'mongoose';

const receiptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileUrl: { type: String, required: true }, // Path to file
  uploadedAt: { type: Date, default: Date.now }
});

const Receipt = mongoose.model('Receipt', receiptSchema);
export default Receipt;