import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Alert } from "../components/ui";
import { EMAIL_RE } from "../utils/format";

export default function Login() {
  const { user, login } = useAuth();
  const loc = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={loc.state?.from || "/dashboard"} replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(form.email)) return setError("Enter a valid email address");
    if (!form.password) return setError("Enter your password");
    setBusy(true);
    setError("");
    try {
      await login(form.email.trim(), form.password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="card form narrow" onSubmit={submit} noValidate>
      <h1>Login</h1>
      {error && <Alert>{error}</Alert>}
      <label>Email
        <input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </label>
      <label>Password
        <input type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      </label>
      <button className="btn" disabled={busy}>{busy ? "Signing in..." : "Login"}</button>
      <p className="muted">No account? <Link to="/register">Register here</Link></p>
    </form>
  );
}
