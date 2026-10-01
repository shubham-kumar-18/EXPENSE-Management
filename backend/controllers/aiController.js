import Expense from "../models/Expense.js";
import User from "../models/User.js";
import { buildBudgetData, buildInsightsData } from "../services/financialAnalysisService.js";
import { generateBudgetRecommendation, generateFinancialInsights } from "../services/aiService.js";

const loadExpenses = (userId) =>
  Expense.find({ userId }).select("amount category date").lean();

const forwardAiError = (error, res, next) =>
  error.statusCode
    ? res.status(error.statusCode).json({ message: error.message })
    : next(error);

export const getFinancialInsights = async (req, res, next) => {
  try {
    const expenses = (await loadExpenses(req.user.id)).map((expense) => ({
      ...expense,
      date: new Date(expense.date)
    }));

    if (!expenses.length) {
      return res.status(422).json({
        message: "Not enough transaction data to generate reliable insights yet. Add more expenses to unlock AI insights."
      });
    }

    const data = buildInsightsData(expenses);

    if (!data.monthlyTransactionCount) {
      return res.status(422).json({
        message: "Add expenses for the current month to generate reliable insights."
      });
    }

    res.json({
      insights: await generateFinancialInsights(data),
      financialData: data
    });
  } catch (error) {
    forwardAiError(error, res, next);
  }
};

export const getRecommendedBudget = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("monthlyIncome").lean();

    if (!user?.monthlyIncome) {
      return res.status(400).json({
        message: "Add your monthly income before generating a recommended budget."
      });
    }

    const expenses = (await loadExpenses(req.user.id)).map((expense) => ({
      ...expense,
      date: new Date(expense.date)
    }));

    if (!expenses.length) {
      return res.status(422).json({
        message: "Not enough transaction data to generate a reliable budget yet. Add expenses first."
      });
    }

    const data = buildBudgetData(expenses, user.monthlyIncome);
    res.json({
      budget: await generateBudgetRecommendation(data),
      financialData: data
    });
  } catch (error) {
    forwardAiError(error, res, next);
  }
};
