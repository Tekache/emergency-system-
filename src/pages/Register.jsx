import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Alert } from "../components/ui";
import { EMAIL_RE, PHONE_RE, passwordError } from "../utils/format";

export default function Register() {
  const { user, register } = useAuth();
  const [f, setF] = useState({ full_name: "", email: "", phone: "", address: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    const problem =
      (f.full_name.trim().length < 2 && "Enter your full name") ||
      (!EMAIL_RE.test(f.email) && "Enter a valid email address") ||
      (!PHONE_RE.test(f.phone) && "Enter a valid phone number") ||
      passwordError(f.password) ||
      (f.password !== f.confirm && "Passwords do not match");
    if (problem) return setError(problem);
    setBusy(true);
    setError("");
    try {
      await register({ full_name: f.full_name.trim(), email: f.email.trim(), phone: f.phone.trim(), address: f.address.trim() || null, password: f.password });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="card form narrow" onSubmit={submit} noValidate>
      <h1>Create an account</h1>
      <p className="muted">New registrations start as Community Users. An Administrator manages access for responders and other administrators.</p>
      {error && <Alert>{error}</Alert>}
      <label>Full name<input value={f.full_name} onChange={set("full_name")} autoComplete="name" /></label>
      <label>Email<input type="email" value={f.email} onChange={set("email")} autoComplete="email" /></label>
      <label>Phone number<input type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" /></label>
      <label>Home address (optional)<input value={f.address} onChange={set("address")} /></label>
      <label>Password<input type="password" value={f.password} onChange={set("password")} autoComplete="new-password" /></label>
      <small className="muted">At least 8 characters, with a letter and a number.</small>
      <label>Confirm password<input type="password" value={f.confirm} onChange={set("confirm")} autoComplete="new-password" /></label>
      <button className="btn" disabled={busy}>{busy ? "Creating account..." : "Register"}</button>
      <p className="muted">Already registered? <Link to="/login">Login</Link></p>
    </form>
  );
}
