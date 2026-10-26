import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LINKS = {
  user: [["/dashboard", "Dashboard"], ["/report", "Report Emergency"], ["/my-reports", "My Reports"], ["/profile", "Profile"]],
  responder: [["/dashboard", "Dashboard"], ["/incidents", "Emergency Reports"], ["/incidents/active", "My Active"], ["/incidents/history", "History"], ["/profile", "Profile"]],
  admin: [["/dashboard", "Dashboard"], ["/incidents", "Reports"], ["/incidents/history", "History"], ["/admin/users", "Users"], ["/admin/records", "System Records"], ["/profile", "Profile"]],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const links = user ? LINKS[user.role] : [["/", "Home"], ["/about", "About"]];
  const close = () => setOpen(false);

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="brand" onClick={close}>
          <span className="brand-mark">!</span> Tudun Wada Emergency Reporting
        </Link>
        <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
          <span /><span /><span />
        </button>
        <nav className={`nav-links ${open ? "open" : ""}`}>
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end onClick={close}>{label}</NavLink>
          ))}
          {user ? (
            <button className="btn btn-outline btn-sm" onClick={() => { close(); logout(); nav("/"); }}>Logout</button>
          ) : (
            <>
              <NavLink to="/login" onClick={close}>Login</NavLink>
              <Link to="/register" className="btn btn-sm" onClick={close}>Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
