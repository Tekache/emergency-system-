import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import { api } from "../services/api";
import { Alert, Spinner, StatusBadge } from "../components/ui";
import { STATUS_LABELS, TRANSITIONS } from "../utils/constants";
import { eventLabel, formatDateTime } from "../utils/format";

function StatusForm({ report, user, onDone }) {
  const options = TRANSITIONS[report.status];
  const [next, setNext] = useState(options[0] || "");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const mine = report.assigned_responder_id === user.id;

  if (!options.length) return <p className="muted">This incident is {STATUS_LABELS[report.status].toLowerCase()}. No further status changes are possible.</p>;
  if (user.role === "responder" && report.status !== "pending" && !mine)
    return <Alert type="info">This incident is assigned to {report.assigned_responder_name}. Only they or an administrator can update it.</Alert>;

  const submit = async (e) => {
    e.preventDefault();
    if (next === "cancelled" && !note.trim()) return setError("Give a reason for cancelling this incident");
    setBusy(true);
    setError("");
    try {
      await api.updateStatus(report.id, next, note.trim());
      setNote("");
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form" onSubmit={submit}>
      <h3>Update status</h3>
      {error && <Alert>{error}</Alert>}
      <label>New status
        <select value={next} onChange={(e) => setNext(e.target.value)}>
          {options.map((o) => <option key={o} value={o}>{o === "accepted" ? "Accept incident" : STATUS_LABELS[o]}</option>)}
        </select>
      </label>
      <label>Note {next === "cancelled" ? "(required)" : "(optional)"}
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
      </label>
      <button className="btn" disabled={busy}>{busy ? "Saving..." : "Update status"}</button>
    </form>
  );
}

function NoteForm({ report, onDone }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!note.trim()) return setError("Write a note first");
    setBusy(true);
    setError("");
    try {
      await api.addNote(report.id, note.trim());
      setNote("");
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="form" onSubmit={submit}>
      <h3>Add response note</h3>
      {error && <Alert>{error}</Alert>}
      <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} aria-label="Response note" />
      <button className="btn btn-outline" disabled={busy}>{busy ? "Saving..." : "Add note"}</button>
    </form>
  );
}

function AssignForm({ report, onDone }) {
  const { data } = useFetch(() => api.responders(), []);
  const [rid, setRid] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!rid) return setError("Select a responder");
    setBusy(true);
    setError("");
    try {
      await api.assign(report.id, rid);
      setRid("");
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="form" onSubmit={submit}>
      <h3>Assign responder</h3>
      {error && <Alert>{error}</Alert>}
      <select value={rid} onChange={(e) => setRid(e.target.value)} aria-label="Responder">
        <option value="">Select responder...</option>
        {(data || []).map((r) => <option key={r.id} value={r.id}>{r.full_name}</option>)}
      </select>
      <button className="btn btn-outline" disabled={busy}>{busy ? "Assigning..." : "Assign"}</button>
    </form>
  );
}

export default function ReportDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: r, error, loading, reload } = useFetch(() => api.getReport(id), [id]);
  const [actionError, setActionError] = useState("");
  const isStaff = user.role !== "user";
  const back = user.role === "user" ? "/my-reports" : "/incidents";

  if (loading && !r) return <Spinner />;
  if (error && !r) return (
    <div className="card center"><Alert>{error}</Alert><Link className="btn" to={back}>Back</Link></div>
  );
  if (!r) return null;

  const canNote = isStaff && (user.role === "admin" || r.assigned_responder_id === user.id);
  const cancelOwn = async () => {
    if (!window.confirm("Cancel this report?")) return;
    setActionError("");
    try {
      await api.cancelReport(r.id);
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <>
      <Link to={back}>&larr; Back to reports</Link>
      <div className="card">
        <div className="row-between">
          <h1>{r.incident_code}</h1>
          <StatusBadge status={r.status} />
        </div>
        {actionError && <Alert>{actionError}</Alert>}
        <dl className="details">
          <div><dt>Emergency type</dt><dd>{r.emergency_type}</dd></div>
          <div><dt>Location</dt><dd>{r.location}</dd></div>
          <div><dt>Reported</dt><dd>{formatDateTime(r.created_at)}</dd></div>
          <div><dt>Last updated</dt><dd>{formatDateTime(r.updated_at)}</dd></div>
          <div><dt>Reporter</dt><dd>{r.reporter_name}</dd></div>
          <div><dt>Contact phone</dt><dd>{r.contact_phone || "Not provided"}</dd></div>
          <div><dt>Assigned responder</dt><dd>{r.assigned_responder_name || "Unassigned"}</dd></div>
        </dl>
        <h3>Description</h3>
        <p className="pre">{r.description}</p>
        {user.role === "user" && r.status === "pending" && (
          <button className="btn btn-danger" onClick={cancelOwn}>Cancel this report</button>
        )}
      </div>

      {isStaff && (
        <div className="card actions">
          <StatusForm report={r} user={user} onDone={reload} />
          {canNote && <NoteForm report={r} onDone={reload} />}
          {user.role === "admin" && !["resolved", "cancelled"].includes(r.status) && <AssignForm report={r} onDone={reload} />}
        </div>
      )}

      <div className="card">
        <h2>Incident history</h2>
        <ol className="timeline">
          {r.updates.map((u) => (
            <li key={u.id}>
              <div className="tl-head"><strong>{eventLabel(u)}</strong><span className="muted">{formatDateTime(u.created_at)}</span></div>
              {u.note && <p className="pre">{u.note}</p>}
              <small className="muted">by {u.author_name}</small>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
