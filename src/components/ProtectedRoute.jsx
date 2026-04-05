import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowRoles }) {
  const { user, loading, profile, error, role } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="rounded-2xl bg-white px-6 py-4 text-sm font-medium text-slate-600 shadow-card">
          Checking session...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Your account is missing a Supabase profile row in public.users."}
        </p>
      </div>
    );
  }

  if (allowRoles && !allowRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
