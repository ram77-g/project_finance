import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      default: 'Default'
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      default: 'User'
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      default: 'user@example.com'
    },
    password: {
      type: String,
      required: true
    },
    monthlyBudget: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    profilePicture: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);