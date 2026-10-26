import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { Alert } from "../components/ui";
import { EMERGENCY_TYPES } from "../utils/constants";
import { PHONE_RE } from "../utils/format";

const blank = (phone) => ({ emergency_type: "", location: "", description: "", contact_phone: phone || "" });

export default function ReportEmergency() {
  const { user } = useAuth();
  const [f, setF] = useState(blank(user.phone));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const problem =
      (!f.emergency_type && "Select an emergency type") ||
      (f.location.trim().length < 3 && "Enter the location of the emergency") ||
      (f.description.trim().length < 10 && "Describe the incident (at least 10 characters)") ||
      (f.contact_phone && !PHONE_RE.test(f.contact_phone) && "Enter a valid contact phone number");
    if (problem) return setError(problem);
    setBusy(true);
    setError("");
    try {
      setCreated(await api.createReport({ ...f, location: f.location.trim(), description: f.description.trim(), contact_phone: f.contact_phone.trim() || null }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (created)
    return (
      <section className="card report-confirmation center">
        <span className="confirmation-mark" aria-hidden="true">&#10003;</span>
        <span className="eyebrow"><span className="eyebrow-dot" /> Report received</span>
        <h1>Your report is now on record.</h1>
        <p className="muted">Your incident details have been saved for community responders to review. Keep this reference to find the report again.</p>
        <div className="incident-code">{created.incident_code}</div>
        <Alert type="info">The report is Pending until a responder updates it. This platform does not automatically contact emergency services.</Alert>
        <div className="btn-row center confirmation-actions">
          <Link className="btn" to={`/reports/${created.id}`}>View incident updates</Link>
          <Link className="btn btn-outline" to="/my-reports">Back to my reports</Link>
        </div>
        <button className="btn btn-outline confirmation-another" onClick={() => { setCreated(null); setF(blank(user.phone)); }}>Submit another report</button>
      </section>
    );

  return (
    <section className="report-layout">
      <form className="card form report-form" onSubmit={submit} noValidate>
        <div className="report-heading">
          <span className="eyebrow"><span className="eyebrow-dot" /> Community incident intake</span>
          <h1>Report an incident</h1>
          <p>Share clear, accurate details so a designated community responder can review your report.</p>
        </div>
        {error && <Alert>{error}</Alert>}
        <div className="form-section-label">Incident details</div>
        <label htmlFor="emergency-type">What type of incident are you reporting?
          <select id="emergency-type" value={f.emergency_type} onChange={set("emergency_type")} required>
            <option value="">Choose an incident type</option>
            {EMERGENCY_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label htmlFor="incident-location">Where did it happen?
          <input id="incident-location" value={f.location} onChange={set("location")} placeholder="Street, landmark or area in Tudun Wada" maxLength={300} autoComplete="street-address" required />
        </label>
        <label htmlFor="incident-description">What happened?
          <textarea id="incident-description" rows={5} value={f.description} onChange={set("description")} placeholder="Describe what you observed, who may be affected and any details that could help responders identify the location." maxLength={2000} required />
        </label>
        <div className="form-section-label">How to reach you</div>
        <label htmlFor="contact-phone">Contact phone <span className="muted">(optional)</span>
          <input id="contact-phone" type="tel" value={f.contact_phone} onChange={set("contact_phone")} autoComplete="tel" placeholder="A number responders can use to ask for clarification" />
        </label>
        <button className="btn btn-lg" disabled={busy}>{busy ? "Submitting report..." : "Submit incident report"}</button>
        <small className="muted">Submitting records this incident for community responders. It does not request emergency dispatch.</small>
      </form>
      <aside className="report-side">
        <section className="report-side-card priority">
          <h2>Is someone in immediate danger?</h2>
          <p>Do not wait for a community report to be reviewed. Contact emergency services directly.</p>
          <p className="emergency-number"><strong>In Nigeria, call 112.</strong></p>
        </section>
        <section className="report-side-card">
          <h2>Helpful details to include</h2>
          <p>A little more context can make a report easier to review.</p>
          <ul className="check-list">
            <li><span className="check-mark" aria-hidden="true">&#10003;</span><span>A nearby street, landmark or recognizable location</span></li>
            <li><span className="check-mark" aria-hidden="true">&#10003;</span><span>What you observed and when it happened</span></li>
            <li><span className="check-mark" aria-hidden="true">&#10003;</span><span>Whether anyone may need urgent assistance</span></li>
          </ul>
        </section>
        <section className="report-side-card">
          <h2>What happens next?</h2>
          <p>Your report is saved with a reference number. Designated responders can review it, update its status and add a record of progress.</p>
        </section>
      </aside>
    </section>
  );
}
