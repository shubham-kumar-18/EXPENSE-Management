import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api.js";
import Chart from "../components/Chart.jsx";
import { formatCurrency } from "../utils/format.js";

const Analytics = () => {
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

  const grouped = useMemo(() => {
    return expenses.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {});
  }, [expenses]);

  const labels = Object.keys(grouped);
  const values = Object.values(grouped);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Spending",
        data: values,
        backgroundColor: ["#14b8a6", "#f97316", "#0ea5e9", "#64748b", "#facc15", "#a855f7"]
      }
    ]
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Spend Summary</h2>
            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : labels.length ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Total categories</span>
                  <span className="font-semibold text-ink">{labels.length}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Total spent</span>
                  <span className="font-semibold text-ink">
                    {formatCurrency(values.reduce((sum, value) => sum + value, 0))}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">Top Categories</p>
                  <div className="space-y-2">
                    {Object.entries(grouped)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 4)
                      .map(([category, amount]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-slate-600">{category}</span>
                          <span className="font-semibold text-ink">{formatCurrency(amount)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Add some expenses to see analytics.</p>
            )}
          </div>

          <div className="card p-6">
            <h3 className="text-base font-semibold mb-4">Category Distribution</h3>
            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : labels.length ? (
              <div className="h-[320px]">
                <Chart
                  type="pie"
                  data={chartData}
                  options={{ responsive: true, plugins: { legend: { position: "bottom" } }, maintainAspectRatio: false }}
                />
              </div>
            ) : (
              <p className="text-sm text-slate-500">No chart data yet.</p>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-base font-semibold mb-4">Spending by Category</h3>
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : labels.length ? (
            <div className="h-[420px]">
              <Chart
                type="bar"
                data={chartData}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: { x: { grid: { display: false } }, y: { ticks: { precision: 0 } } },
                  maintainAspectRatio: false
                }}
              />
            </div>
          ) : (
            <p className="text-sm text-slate-500">No chart data yet.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Analytics;
