import React, { useMemo, useState } from "react";
import api from "../services/api.js";
import { formatCurrency } from "../utils/format.js";

const Reports = () => {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const monthLabel = useMemo(() => {
    const labels = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ];
    return labels[Number(month) - 1] || "";
  }, [month]);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/api/reports/monthly?month=${Number(month)}&year=${Number(year)}`, {
        responseType: "blob"
      });
      const url = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
      setPreviewUrl(url);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <section className="card p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Reports</p>
            <h2 className="text-2xl font-display font-semibold">Monthly PDF</h2>
            <p className="text-sm text-slate-500 mt-1">
              Generate a summary report for {monthLabel} {year}.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-wide text-slate-400">Currency</p>
            <p className="text-sm font-semibold text-ink">INR (₹)</p>
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="grid gap-3 md:grid-cols-[160px_160px_1fr] items-end">
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">Month</label>
            <select className="input mt-2" value={month} onChange={(e) => setMonth(e.target.value)}>
              {Array.from({ length: 12 }).map((_, idx) => {
                const value = String(idx + 1).padStart(2, "0");
                return (
                  <option key={value} value={value}>
                    {value} - {new Date(0, idx).toLocaleString("en-US", { month: "long" })}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">Year</label>
            <input className="input mt-2" value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
          <button className="btn-primary md:w-auto px-5" onClick={handleGenerate} disabled={loading}>
            {loading ? "Generating..." : "Generate PDF"}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Selected Month", value: `${monthLabel} ${year}` },
            { label: "Estimated Budget", value: formatCurrency(0) },
            { label: "Status", value: previewUrl ? "Ready" : "Not generated" }
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">{card.label}</p>
              <p className="text-base font-semibold text-ink mt-2">{card.value}</p>
            </div>
          ))}
        </div>
        {previewUrl && (
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white/80">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 bg-white/90">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Preview</p>
                <p className="text-sm font-semibold text-ink">Expense AI Report</p>
              </div>
              <a
                className="btn-secondary w-full sm:w-auto text-center"
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                download={`expense-ai-${year}-${month}.pdf`}
              >
                Download
              </a>
            </div>
            <iframe title="Report Preview" src={previewUrl} className="w-full h-[600px]"></iframe>
          </div>
        )}
      </section>
    </div>
  );
};

export default Reports;
