import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { Alert } from "../components/ui";
import { ROLE_LABELS } from "../utils/constants";
import { passwordError, PHONE_RE } from "../utils/format";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [f, setF] = useState({ full_name: user.full_name, phone: user.phone || "", address: user.address || "" });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setPassword = (k) => (e) => setPasswords({ ...passwords, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (f.full_name.trim().length < 2) return setMsg({ type: "error", text: "Enter your full name" });
    if (!PHONE_RE.test(f.phone)) return setMsg({ type: "error", text: "Enter a valid phone number" });
    setBusy(true);
    try {
      setUser(await api.updateProfile({ full_name: f.full_name.trim(), phone: f.phone.trim(), address: f.address.trim() || null }));
      setMsg({ type: "success", text: "Profile updated" });
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="profile-sections narrow">
      <form className="card form" onSubmit={submit} noValidate>
        <div>
          <h1>Profile</h1>
          <p className="muted">Manage your account details.</p>
        </div>
        {msg && <Alert type={msg.type}>{msg.text}</Alert>}
        <label>Email<input value={user.email} disabled /></label>
        <label>Role<input value={ROLE_LABELS[user.role]} disabled /></label>
        <label>Full name<input value={f.full_name} onChange={set("full_name")} /></label>
        <label>Phone<input type="tel" value={f.phone} onChange={set("phone")} /></label>
        <label>Address<input value={f.address} onChange={set("address")} /></label>
        <button className="btn" disabled={busy}>{busy ? "Saving..." : "Save profile changes"}</button>
      </form>

      <form
        className="card form"
        onSubmit={async (e) => {
          e.preventDefault();
          const problem =
            (!passwords.current && "Enter your current password") ||
            passwordError(passwords.next) ||
            (passwords.next !== passwords.confirm && "New passwords do not match");
          if (problem) return setPasswordMsg({ type: "error", text: problem });
          setPasswordBusy(true);
          setPasswordMsg(null);
          try {
            await api.changePassword({ current_password: passwords.current, new_password: passwords.next });
            setPasswords({ current: "", next: "", confirm: "" });
            setPasswordMsg({ type: "success", text: "Your password has been changed." });
          } catch (err) {
            setPasswordMsg({ type: "error", text: err.message });
          } finally {
            setPasswordBusy(false);
          }
        }}
        noValidate
      >
        <div>
          <h2>Change password</h2>
          <p className="muted">Choose a new password you do not use elsewhere. You’ll need your current password to confirm the change.</p>
        </div>
        {passwordMsg && <Alert type={passwordMsg.type}>{passwordMsg.text}</Alert>}
        <label>Current password
          <input type="password" autoComplete="current-password" value={passwords.current} onChange={setPassword("current")} />
        </label>
        <label>New password
          <input type="password" autoComplete="new-password" value={passwords.next} onChange={setPassword("next")} />
        </label>
        <small className="muted">At least 8 characters, with a letter and a number.</small>
        <label>Confirm new password
          <input type="password" autoComplete="new-password" value={passwords.confirm} onChange={setPassword("confirm")} />
        </label>
        <button className="btn btn-outline" disabled={passwordBusy}>{passwordBusy ? "Changing password..." : "Change password"}</button>
      </form>
    </div>
  );
}
