import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/User.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const otpExpiryMinutes = 10;

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const createOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const hashOtp = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

const authResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  monthlyIncome: user.monthlyIncome ?? null,
  token: signToken(user._id)
});

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("name email monthlyIncome");
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      monthlyIncome: user.monthlyIncome ?? null
    });
  } catch (err) {
    next(err);
  }
};

export const updateMonthlyIncome = async (req, res, next) => {
  try {
    const monthlyIncome = Number(req.body.monthlyIncome);
    if (!Number.isFinite(monthlyIncome) || monthlyIncome <= 0) {
      res.status(400);
      throw new Error("Monthly income must be a positive number");
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { monthlyIncome },
      { new: true, runValidators: true }
    ).select("name email monthlyIncome");
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      monthlyIncome: user.monthlyIncome
    });
  } catch (err) {
    next(err);
  }
};

export const sendPasswordResetOtp = async (user, otp) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP settings are incomplete");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    requireTLS: process.env.SMTP_SECURE !== "true",
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    const info = await transporter.sendMail({
      from: `"Expense AI" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: user.email,
      subject: "Expense AI - Password Reset OTP",
      text: `Hello ${user.name},

Your Expense AI password reset OTP is:

${otp}

This OTP expires in ${otpExpiryMinutes} minutes.

If you did not request this password reset, please ignore this email.

Expense AI Team`
    });

    console.log(`Password reset email sent: ${info.messageId}`);
  } catch (error) {
    console.error("Password reset email error:", error.message);
    throw new Error("Unable to send the reset OTP. Please verify the SMTP settings and try again.");
  }
};

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400);
      throw new Error("All fields are required");
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      res.status(400);
      throw new Error("Please enter a valid email address");
    }
    if (password.length < 6) {
      res.status(400);
      throw new Error("Password must be at least 6 characters");
    }
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(400);
      throw new Error("Email already registered");
    }
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({ name: name.trim(), email: normalizedEmail, password: hashed });
    res.status(201).json(authResponse(user));
  } catch (err) {
    if (err?.code === 11000) {
      res.status(400);
      return next(new Error("Email already registered"));
    }
    next(err);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400);
      throw new Error("Email and password are required");
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      res.status(400);
      throw new Error("Please enter a valid email address");
    }
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(401);
      throw new Error("Invalid credentials");
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      res.status(401);
      throw new Error("Invalid credentials");
    }
    res.json(authResponse(user));
  } catch (err) {
    next(err);
  }
};

export const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400);
      throw new Error("Email is required");
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      res.status(400);
      throw new Error("Please enter a valid email address");
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (user) {
      const otp = createOtp();
      const previousOtp = user.passwordResetOtp;
      const previousExpiry = user.passwordResetExpires;
      user.passwordResetOtp = hashOtp(otp);
      user.passwordResetExpires = new Date(Date.now() + otpExpiryMinutes * 60 * 1000);
      await user.save();
      try {
        await sendPasswordResetOtp(user, otp);
      } catch (error) {
        user.passwordResetOtp = previousOtp;
        user.passwordResetExpires = previousExpiry;
        await user.save();
        throw error;
      }
    } else {
      console.log(`Password reset requested for unknown email: ${normalizedEmail}`);
    }

    res.json({
      message: "If an account exists for this email, an OTP has been sent."
    });
  } catch (err) {
    next(err);
  }
};

export const resetPasswordWithOtp = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      res.status(400);
      throw new Error("Email, OTP, and new password are required");
    }
    if (password.length < 6) {
      res.status(400);
      throw new Error("Password must be at least 6 characters");
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      res.status(400);
      throw new Error("Please enter a valid email address");
    }

    const user = await User.findOne({
      email: normalizedEmail,
      passwordResetOtp: hashOtp(otp.trim()),
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      res.status(400);
      throw new Error("Invalid or expired OTP");
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.passwordResetOtp = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json(authResponse(user));
  } catch (err) {
    next(err);
  }
};
