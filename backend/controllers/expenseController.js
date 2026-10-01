import Expense from "../models/Expense.js";

export const getExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    next(err);
  }
};

export const createExpense = async (req, res, next) => {
  try {
    const { title, amount, category, date } = req.body;
    if (!title || amount == null || !category || !date) {
      res.status(400);
      throw new Error("All fields are required");
    }
    const expense = await Expense.create({
      userId: req.user.id,
      title,
      amount,
      category,
      date
    });
    res.status(201).json(expense);
  } catch (err) {
    next(err);
  }
};

export const updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findOne({ _id: id, userId: req.user.id });
    if (!expense) {
      res.status(404);
      throw new Error("Expense not found");
    }
    const { title, amount, category, date } = req.body;
    expense.title = title ?? expense.title;
    expense.amount = amount ?? expense.amount;
    expense.category = category ?? expense.category;
    expense.date = date ?? expense.date;

    const updated = await expense.save();
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findOne({ _id: id, userId: req.user.id });
    if (!expense) {
      res.status(404);
      throw new Error("Expense not found");
    }
    await expense.deleteOne();
    res.json({ message: "Expense deleted" });
  } catch (err) {
    next(err);
  }
};
