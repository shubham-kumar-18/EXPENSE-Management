import { Router } from "express";
import {
  registerUser,
  loginUser,
  requestPasswordReset,
  resetPasswordWithOtp
} from "../controllers/authController.js";
import { getCurrentUser, updateMonthlyIncome } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPasswordWithOtp);
router.get("/me", protect, getCurrentUser);
router.put("/me/monthly-income", protect, updateMonthlyIncome);

export default router;
