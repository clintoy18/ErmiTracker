import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";

const AddDonation = lazy(() => import("./pages/AddDonation"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DistributionsList = lazy(() => import("./pages/DistributionsList"));
const DonationsList = lazy(() => import("./pages/DonationsList"));
const Login = lazy(() => import("./pages/Login"));
const PublicView = lazy(() => import("./pages/PublicView"));

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-6 text-center">
          <p className="rounded-2xl bg-white px-6 py-4 text-sm font-medium text-slate-600 shadow-card">
            Loading page...
          </p>
        </div>
      }
    >
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/login" element={<Login />} />
          <Route path="/public" element={<PublicView />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/donations/add"
            element={
              <ProtectedRoute>
                <AddDonation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/donations"
            element={
              <ProtectedRoute>
                <DonationsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/distributions"
            element={
              <ProtectedRoute>
                <DistributionsList />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
