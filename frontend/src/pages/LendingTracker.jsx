import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { formatCurrency } from "../utils/format.js";

const initialForm = { person: "", type: "lent", amount: "", note: "" };

const makeId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const LendingTracker = () => {
  const { user } = useAuth();
  const storageKey = `expense-ai-lending-${user?.email || user?._id || "guest"}`;
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [activeRecord, setActiveRecord] = useState(null);
  const [entryAmount, setEntryAmount] = useState("");
  const [entryMode, setEntryMode] = useState("payment");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setRecords(saved ? JSON.parse(saved) : []);
    } catch {
      setRecords([]);
    }
  }, [storageKey]);

  const saveRecords = (nextRecords) => {
    setRecords(nextRecords);
    localStorage.setItem(storageKey, JSON.stringify(nextRecords));
  };

  const totals = useMemo(
    () => ({
      toReceive: records
        .filter((record) => record.type === "lent")
        .reduce((sum, record) => sum + record.balance, 0),
      toPay: records
        .filter((record) => record.type === "borrowed")
        .reduce((sum, record) => sum + record.balance, 0)
    }),
    [records]
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.person.trim()) return setError("Enter the person's name.");
    if (!Number.isFinite(amount) || amount <= 0) return setError("Enter an amount greater than zero.");

    const now = new Date().toISOString();
    saveRecords([
      {
        id: makeId(),
        person: form.person.trim(),
        type: form.type,
        balance: amount,
        note: form.note.trim(),
        createdAt: now,
        activity: [{ id: makeId(), amount, kind: "created", date: now }]
      },
      ...records
    ]);
    setForm(initialForm);
    setError("");
  };

  const openEntry = (record, mode) => {
    setActiveRecord(record);
    setEntryMode(mode);
    setEntryAmount("");
    setError("");
  };

  const handleEntry = (event) => {
    event.preventDefault();
    const amount = Number(entryAmount);
    if (!Number.isFinite(amount) || amount <= 0) return setError("Enter an amount greater than zero.");
    if (entryMode === "payment" && amount > activeRecord.balance) {
      return setError(`Payment cannot be more than ${formatCurrency(activeRecord.balance)}.`);
    }

    const now = new Date().toISOString();
    const nextRecords = records
      .map((record) => {
        if (record.id !== activeRecord.id) return record;
        const balance = entryMode === "payment" ? record.balance - amount : record.balance + amount;
        return {
          ...record,
          balance,
          activity: [{ id: makeId(), amount, kind: entryMode, date: now }, ...(record.activity || [])]
        };
      })
      .filter((record) => record.balance > 0);

    saveRecords(nextRecords);
    setActiveRecord(null);
    setEntryAmount("");
    setError("");
  };

  const markSettled = (id) => {
    saveRecords(records.filter((record) => record.id !== id));
    setActiveRecord(null);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-ink">Lending & Borrowing</h1>
          <p className="mt-1 text-sm text-slate-500">Keep track of money you gave and money you borrowed.</p>
        </div>
        <div className="flex gap-3 text-sm">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2">
            <p className="text-xs text-emerald-700">You will receive</p>
            <p className="font-semibold text-emerald-800">{formatCurrency(totals.toReceive)}</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-2">
            <p className="text-xs text-amber-700">You need to pay</p>
            <p className="font-semibold text-amber-800">{formatCurrency(totals.toPay)}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <div className="card h-fit p-6">
          <h2 className="text-lg font-semibold">Add a record</h2>
          <p className="mt-1 text-sm text-slate-500">Add every new loan or borrowing separately.</p>
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <input
              className="input"
              placeholder="Person's name"
              value={form.person}
              onChange={(event) => setForm({ ...form, person: event.target.value })}
            />
            <select
              className="input"
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value })}
            >
              <option value="lent">I gave money to someone</option>
              <option value="borrowed">I borrowed money from someone</option>
            </select>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
            />
            <input
              className="input"
              placeholder="Note (optional)"
              value={form.note}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button className="btn-primary w-full">Add record</button>
          </form>
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Open balances</h2>
            <span className="text-xs text-slate-500">{records.length} active</span>
          </div>
          {records.length ? (
            <div className="space-y-3">
              {records.map((record) => (
                <article key={record.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-ink">{record.person}</h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${record.type === "lent" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                        >
                          {record.type === "lent" ? "They owe you" : "You owe them"}
                        </span>
                      </div>
                      {record.note && <p className="mt-1 text-sm text-slate-500">{record.note}</p>}
                      <p className="mt-1 text-xs text-slate-400">
                        Added {new Date(record.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-ink">{formatCurrency(record.balance)}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="btn-secondary !px-3 !py-1.5"
                      onClick={() => openEntry(record, "payment")}
                    >
                      {record.type === "lent" ? "They paid you" : "I paid them"}
                    </button>
                    <button
                      className="btn-secondary !px-3 !py-1.5"
                      onClick={() => openEntry(record, "additional")}
                    >
                      Add more money
                    </button>
                    <button
                      className="text-sm font-semibold text-slate-500 hover:text-red-600"
                      onClick={() => markSettled(record.id)}
                    >
                      Settled / Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">No active lending or borrowing records.</p>
          )}
        </div>
      </section>

      {activeRecord && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/30 px-4" role="dialog" aria-modal="true">
          <form className="card w-full max-w-md p-6" onSubmit={handleEntry}>
            <h2 className="text-lg font-semibold">
              {entryMode === "payment" ? "Record a payment" : "Add more money"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{activeRecord.person} · Current balance {formatCurrency(activeRecord.balance)}</p>
            <input
              autoFocus
              className="input mt-5"
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount"
              value={entryAmount}
              onChange={(event) => setEntryAmount(event.target.value)}
            />
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setActiveRecord(null);
                  setError("");
                }}
              >
                Cancel
              </button>
              <button className="btn-primary">Save</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};

export default LendingTracker;
