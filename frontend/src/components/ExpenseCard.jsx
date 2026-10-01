import React from "react";
import { formatCurrency } from "../utils/format.js";

const ExpenseCard = ({ expense, onEdit, onDelete }) => {
  return (
    <div className="card p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{new Date(expense.date).toLocaleDateString()}</p>
        <h3 className="text-base font-semibold text-ink break-words">{expense.title}</h3>
        <p className="text-xs text-slate-500">{expense.category}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        <span className="text-base font-semibold text-ember">{formatCurrency(expense.amount)}</span>
        <button className="btn-secondary" onClick={() => onEdit(expense)}>
          Edit
        </button>
        <button className="btn-secondary" onClick={() => onDelete(expense._id)}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default ExpenseCard;
