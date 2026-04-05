import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout, displayName, organizationName, role } = useAuth();
  const navLinks = [
    { to: "/", label: "Public View" },
    {
      to: "/dashboard",
      label: role === "admin" ? "Admin Dashboard" : "Organization Dashboard",
    },
    { to: "/donations/add", label: "Log Activity" },
    { to: "/donations", label: "Donations" },
    { to: "/distributions", label: "Distributions" },
  ];

  return (
    <header className="border-b border-brand-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand-600">
              Emergency Response
            </p>
            <h1 className="text-xl font-semibold text-brand-900">
              ErmiTracker
            </h1>
            {user ? (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span>{displayName}</span>
                <span>|</span>
                <span>{organizationName}</span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    role === "admin"
                      ? "bg-brand-100 text-brand-800"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {role === "admin" ? "Admin" : "Organization"}
                </span>
              </div>
            ) : null}
          </div>
          {user ? (
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 transition hover:border-brand-500 hover:bg-brand-50"
            >
              Logout
            </button>
          ) : (
            <NavLink
              to="/login"
              className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
            >
              Sign In
            </NavLink>
          )}
        </div>

        <nav className="flex flex-wrap gap-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-600 text-white"
                    : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
