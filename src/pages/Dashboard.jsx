import AdminDashboard from "./AdminDashboard";
import OrganizationDashboard from "./OrganizationDashboard";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { role } = useAuth();

  return role === "admin" ? <AdminDashboard /> : <OrganizationDashboard />;
}
