import { Router } from "express";
import { getFinancialInsights, getRecommendedBudget } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = Router();
router.use(protect);
router.get("/financial-insights", getFinancialInsights);
router.post("/recommended-budget", getRecommendedBudget);
export default router;
