import React, { useEffect, useState } from "react";
import api from "../services/api.js";
import { formatCurrency } from "../utils/format.js";

const Dashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/api/expenses");
        setExpenses(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const total = expenses.reduce((sum, item) => sum + item.amount, 0);
  const categories = new Set(expenses.map((item) => item.category)).size;
  const now = new Date();
  const monthTotal = expenses
    .filter((item) => {
      const date = new Date(item.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, item) => sum + item.amount, 0);

  const recent = expenses.slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Spent", value: formatCurrency(total) },
          { label: "Transactions", value: expenses.length },
          { label: "Categories", value: categories },
          { label: "This Month", value: formatCurrency(monthTotal) }
        ].map((card) => (
          <div key={card.label} className="card p-5">
            <p className="text-xs uppercase tracking-wide text-slate-400">{card.label}</p>
            <p className="text-xl font-semibold text-ink mt-2">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <p className="text-xs text-slate-500">Latest 5</p>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : recent.length ? (
          <div className="space-y-3">
            {recent.map((expense) => (
              <div key={expense._id} className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <p className="text-sm font-semibold">{expense.title}</p>
                  <p className="text-xs text-slate-500">{expense.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-ember">{formatCurrency(expense.amount)}</p>
                  <p className="text-xs text-slate-500">{new Date(expense.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No expenses yet.</p>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
