import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const navClass = ({ isActive }) =>
  `text-sm font-semibold ${isActive ? "text-ink" : "text-slate-500 hover:text-ink"}`;

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-sand/80 backdrop-blur-xl border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-4 py-4 flex flex-wrap items-center justify-between gap-4">
        <Link to="/" className="text-xl font-display font-semibold text-ink shrink-0">
          Expense AI
        </Link>
        {user ? (
          <nav className="flex flex-1 flex-wrap items-center justify-end gap-x-5 gap-y-3">
            <NavLink to="/dashboard" className={navClass}>
              Dashboard
            </NavLink>
            <NavLink to="/expenses" className={navClass}>
              Expenses
            </NavLink>
            <NavLink to="/lending" className={navClass}>
              Lending
            </NavLink>
            <NavLink to="/analytics" className={navClass}>
              Analytics
            </NavLink>
            <NavLink to="/insights" className={navClass}>
              AI Insights
            </NavLink>
            <NavLink to="/reports" className={navClass}>
              Reports
            </NavLink>
            <button className="btn-secondary" onClick={logout}>
              Logout
            </button>
          </nav>
        ) : (
          <nav className="flex items-center gap-4">
            <NavLink to="/register" className="btn-primary">
              Get Started
            </NavLink>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
