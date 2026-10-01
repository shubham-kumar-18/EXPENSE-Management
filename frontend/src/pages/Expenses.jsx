import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api.js";
import ExpenseCard from "../components/ExpenseCard.jsx";
import { formatCurrency } from "../utils/format.js";

const emptyForm = {
  title: "",
  amount: "",
  category: "",
  date: new Date().toISOString().slice(0, 10)
};

const validateExpense = ({ title, amount, category, date }) => {
  if (!title.trim()) return "Title is required";
  if (!category.trim()) return "Category is required";
  if (!date) return "Date is required";
  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) return "Amount must be greater than zero";
  return "";
};

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/expenses");
      setExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const total = useMemo(() => expenses.reduce((sum, item) => sum + item.amount, 0), [expenses]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = (expense) => {
    setEditingId(expense._id);
    setForm({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date.slice(0, 10)
    });
  };

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const validationError = validateExpense(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        category: form.category.trim(),
        amount: Number(form.amount)
      };
      if (editingId) {
        await api.put(`/api/expenses/${editingId}`, payload);
      } else {
        await api.post("/api/expenses", payload);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setError("");
    try {
      await api.delete(`/api/expenses/${id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete expense");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <section className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">All Expenses</h2>
            <p className="text-xs text-slate-500">Total: {formatCurrency(total)}</p>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : expenses.length ? (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <ExpenseCard key={expense._id} expense={expense} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No expenses added yet.</p>
          )}
        </div>

        <div className="card self-start p-5">
          <h2 className="text-lg font-semibold mb-4">{editingId ? "Edit Expense" : "Add Expense"}</h2>
          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <input className="input" placeholder="Title" name="title" value={form.title} onChange={handleChange} />
            <input
              className="input"
              placeholder="Amount"
              type="number"
              min="0"
              step="0.01"
              name="amount"
              value={form.amount}
              onChange={handleChange}
            />
            <input
              className="input"
              placeholder="Category"
              name="category"
              value={form.category}
              onChange={handleChange}
            />
            <input className="input" type="date" name="date" value={form.date} onChange={handleChange} />
            <div className="flex items-center gap-3">
              <button className="btn-primary" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update" : "Add"}
              </button>
              {editingId && (
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Expenses;
