import React, { useEffect, useState } from "react";
import api from "../services/api.js";
import { formatCurrency } from "../utils/format.js";

const errorMessage = (error, fallback) => {
  const status = error.response?.status;
  return status === 400 || status === 422
    ? error.response?.data?.message || fallback
    : fallback;
};

const FinancialAnalysis = () => {
  const [income, setIncome] = useState("");
  const [insights, setInsights] = useState(null);
  const [budget, setBudget] = useState(null);
  const [incomeLoading, setIncomeLoading] = useState(true);
  const [savingIncome, setSavingIncome] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [incomeError, setIncomeError] = useState("");
  const [insightError, setInsightError] = useState("");
  const [budgetError, setBudgetError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/auth/me");
        setIncome(data.monthlyIncome ?? "");
      } catch {
        setIncomeError("Unable to load your income setting.");
      } finally {
        setIncomeLoading(false);
      }
    })();
  }, []);

  const saveIncome = async (event) => {
    event.preventDefault();
    setIncomeError("");
    setSavingIncome(true);

    try {
      const { data } = await api.put("/api/auth/me/monthly-income", {
        monthlyIncome: Number(income)
      });
      setIncome(data.monthlyIncome);
      setBudget(null);
    } catch (error) {
      setIncomeError(
        errorMessage(error, "Unable to update monthly income. Please try again.")
      );
    } finally {
      setSavingIncome(false);
    }
  };

  const loadInsights = async () => {
    setInsightError("");
    setInsightLoading(true);

    try {
      const { data } = await api.get("/api/ai/financial-insights");
      setInsights(data.insights);
    } catch (error) {
      setInsightError(
        errorMessage(error, "Unable to generate AI insights. Please try again.")
      );
    } finally {
      setInsightLoading(false);
    }
  };

  const loadBudget = async () => {
    setBudgetError("");
    setBudgetLoading(true);

    try {
      const { data } = await api.post("/api/ai/recommended-budget");
      setBudget(data.budget);
    } catch (error) {
      setBudgetError(
        errorMessage(
          error,
          "Unable to generate a recommended budget. Please try again."
        )
      );
    } finally {
      setBudgetLoading(false);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Expense AI</p>
            <h2 className="text-xl font-semibold">AI Financial Insights</h2>
          </div>
          <button className="btn-secondary" onClick={loadInsights} disabled={insightLoading}>
            {insightLoading
              ? "Analyzing your spending..."
              : insights
                ? "Refresh Insights"
                : "Generate Insights"}
          </button>
        </div>

        {insightLoading ? (
          <p className="text-sm text-slate-500">Analyzing your spending...</p>
        ) : insightError ? (
          <p className="text-sm text-slate-500">{insightError}</p>
        ) : insights ? (
          <div className="space-y-4">
            <p className="font-semibold text-ink">{insights.summary}</p>
            <ul className="space-y-2 text-sm text-slate-700">
              {insights.insights.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-accent">â€¢</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                Suggestions
              </p>
              {insights.suggestions.map((item) => (
                <p key={item} className="text-sm text-slate-700 mb-1 last:mb-0">
                  {item}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Generate insights from your actual expenses for the current month.
          </p>
        )}
      </div>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Plan ahead</p>
            <h2 className="text-xl font-semibold">AI Recommended Budget</h2>
          </div>
          <button
            className="btn-secondary"
            onClick={loadBudget}
            disabled={budgetLoading || incomeLoading || !income}
          >
            {budgetLoading ? "Building budget..." : "Generate Budget"}
          </button>
        </div>

        <form onSubmit={saveIncome} className="flex flex-wrap gap-2 mb-4">
          <label className="sr-only" htmlFor="monthly-income">
            Monthly Income
          </label>
          <input
            id="monthly-income"
            type="number"
            min="1"
            step="1"
            value={income}
            onChange={(event) => setIncome(event.target.value)}
            placeholder="Monthly income (â‚¹)"
            className="input flex-1 min-w-[170px]"
            disabled={incomeLoading || savingIncome}
          />
          <button
            className="btn-primary"
            type="submit"
            disabled={incomeLoading || savingIncome}
          >
            {savingIncome ? "Updating..." : "Update Income"}
          </button>
        </form>

        {incomeError ? <p className="text-sm text-slate-500 mb-3">{incomeError}</p> : null}
        {budgetLoading ? (
          <p className="text-sm text-slate-500">Analyzing your spending pattern...</p>
        ) : budgetError ? (
          <p className="text-sm text-slate-500">{budgetError}</p>
        ) : budget ? (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Monthly income</span>
              <strong>{formatCurrency(budget.monthlyIncome)}</strong>
            </div>
            {budget.categories.map((item) => (
              <div key={item.category} className="rounded-xl bg-slate-50 p-3">
                <div className="flex justify-between font-semibold">
                  <span>{item.category}</span>
                  <span>{formatCurrency(item.recommendedBudget)}</span>
                </div>
                {item.category !== "Savings" && (
                  <p className="text-xs text-slate-500 mt-1">
                    Current average: {formatCurrency(item.currentAverage)} Â· Potential saving: {formatCurrency(item.potentialSaving)}
                  </p>
                )}
              </div>
            ))}
            <div className="flex justify-between pt-2 font-semibold">
              <span>Recommended savings</span>
              <span className="text-accent">{formatCurrency(budget.recommendedSavings)}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Set your monthly income, then generate a budget based on your spending history.
          </p>
        )}
      </div>
    </section>
  );
};

export default FinancialAnalysis;
