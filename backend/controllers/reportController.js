import Expense from "../models/Expense.js";
import generatePDF from "../utils/generatePDF.js";

export const getMonthlyReport = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);
    if (!month || !year) {
      res.status(400);
      throw new Error("month and year are required");
    }

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const expenses = await Expense.find({
      userId: req.user.id,
      date: { $gte: start, $lt: end }
    }).sort({ date: -1 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=report-${year}-${month}.pdf`);

    generatePDF(res, { month, year, expenses });
  } catch (err) {
    next(err);
  }
};
