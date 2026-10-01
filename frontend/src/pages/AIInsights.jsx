import React from "react";
import FinancialAnalysis from "../components/FinancialAnalysis.jsx";

const AIInsights = () => (
  <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
    <section>
      <p className="text-xs uppercase tracking-wide text-slate-400">Expense AI</p>
      <h1 className="text-2xl font-display font-semibold text-ink">Smart financial analysis</h1>
      <p className="text-sm text-slate-500 mt-1">Recommendations are generated from your own recorded expenses.</p>
    </section>
    <FinancialAnalysis />
  </div>
);

export default AIInsights;
