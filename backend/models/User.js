import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    monthlyIncome: { type: Number, min: 0, default: null },
    passwordResetOtp: { type: String },
    passwordResetExpires: { type: Date }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
