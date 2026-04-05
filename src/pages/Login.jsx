import { useState } from "react";
import { Navigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import FormInput from "../components/FormInput";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, login, register, error: profileError } = useAuth();
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({
    name: "",
    organizationName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      if (mode === "login") {
        await login(formData.email, formData.password);
      } else {
        await register({
          name: formData.name.trim(),
          organizationName: formData.organizationName.trim(),
          email: formData.email.trim(),
          password: formData.password,
        });
        setMessage(
          "Registration submitted. If email confirmation is enabled in Supabase, confirm the email before signing in.",
        );
        setMode("login");
      }
    } catch (authError) {
      setError(authError.message || "Authentication request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        eyebrow="Security"
        title="ErmiTracker access"
        description="Admins and organizations use Supabase Auth for login, and organization users can self-register."
      />

      <SectionCard
        title={mode === "login" ? "Sign in" : "Register organization user"}
        subtitle={
          mode === "login"
            ? "Your public.users profile controls whether you are an admin or organization user."
            : "Registration creates a Supabase Auth account and a public.users org profile."
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" ? (
            <>
              <FormInput
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
              />
              <FormInput
                label="Organization Name"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                placeholder="Helping Hands NGO"
                required
              />
            </>
          ) : null}

          <FormInput
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="staff@barangay.gov.ph"
            required
          />
          <FormInput
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
            required
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          {profileError ? <p className="text-sm text-red-600">{profileError}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting
              ? mode === "login"
                ? "Signing in..."
                : "Creating account..."
              : mode === "login"
                ? "Login"
                : "Register"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode((current) => (current === "login" ? "register" : "login"));
              setError("");
              setMessage("");
            }}
            className="w-full text-sm font-medium text-brand-700"
          >
            {mode === "login"
              ? "Need an organization account? Register here."
              : "Already have an account? Go back to login."}
          </button>
        </form>
      </SectionCard>
    </div>
  );
}
