import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import { api } from "../services/api";
import { Alert, Spinner } from "../components/ui";
import { ROLE_LABELS } from "../utils/constants";
import { EMAIL_RE, PHONE_RE, formatDateTime, passwordError } from "../utils/format";

function CreateUser({ onDone }) {
  const [f, setF] = useState({ full_name: "", email: "", phone: "", password: "", role: "responder" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    const problem =
      (f.full_name.trim().length < 2 && "Enter the full name") ||
      (!EMAIL_RE.test(f.email) && "Enter a valid email address") ||
      (!PHONE_RE.test(f.phone) && "Enter a valid phone number") ||
      passwordError(f.password);
    if (problem) return setError(problem);
    setBusy(true);
    setError("");
    try {
      await api.createUser({ ...f, full_name: f.full_name.trim(), email: f.email.trim(), phone: f.phone.trim() });
      setF({ full_name: "", email: "", phone: "", password: "", role: "responder" });
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="card form" onSubmit={submit} noValidate>
      <h2>Create an account</h2>
      <p className="muted">Create a community or staff account. To change the role of an existing account, use its role selector below.</p>
      {error && <Alert>{error}</Alert>}
      <div className="grid-2">
        <label>Full name<input value={f.full_name} onChange={set("full_name")} /></label>
        <label>Email<input type="email" value={f.email} onChange={set("email")} /></label>
        <label>Phone<input type="tel" value={f.phone} onChange={set("phone")} /></label>
        <label>Temporary password<input type="password" value={f.password} onChange={set("password")} autoComplete="new-password" /></label>
        <label>Role
          <select value={f.role} onChange={set("role")}>
            {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </div>
      <button className="btn" disabled={busy}>{busy ? "Creating..." : "Create account"}</button>
    </form>
  );
}

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(search), 300);
    return () => clearTimeout(t);
  }, [search]);
  const { data, error: loadError, loading, reload } = useFetch(() => api.listUsers({ role, search: q }), [role, q]);

  const change = async (id, body) => {
    setError("");
    try {
      await api.updateUser(id, body);
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <div>
        <h1>User and role management</h1>
        <p className="muted">Manage community accounts, assign responder or administrator access, and deactivate accounts when needed.</p>
      </div>
      <CreateUser onDone={reload} />
      <div className="card">
        <div className="filters">
          <input type="search" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role">
            <option value="">All roles</option>
            {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        {(error || loadError) && <Alert>{error || loadError}</Alert>}
        {loading ? <Spinner /> : data && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {data.map((u) => (
                  <tr key={u.id}>
                    <td>{u.full_name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone}</td>
                    <td>
                      <select className="inline" value={u.role} disabled={u.id === me.id} onChange={(e) => change(u.id, { role: e.target.value })} aria-label={`Role for ${u.full_name}`}>
                        {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </td>
                    <td>{formatDateTime(u.created_at)}</td>
                    <td><span className={`badge ${u.is_active ? "badge-resolved" : "badge-cancelled"}`}>{u.is_active ? "Active" : "Deactivated"}</span></td>
                    <td>
                      {u.id !== me.id && (
                        <button className="btn btn-sm btn-outline" onClick={() => change(u.id, { is_active: !u.is_active })}>
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
