import { Link } from "react-router-dom";
import { STATUS_LABELS } from "../utils/constants";
import { formatDateTime } from "../utils/format";

export const StatusBadge = ({ status }) => <span className={`badge badge-${status}`}>{STATUS_LABELS[status] || status}</span>;

export const Alert = ({ type = "error", children }) => (
  <div className={`alert alert-${type}`} role="alert">
    {children}
  </div>
);

export const Spinner = () => (
  <div className="spinner-wrap" aria-label="Loading">
    <div className="spinner" />
  </div>
);

export const StatCard = ({ label, value, tone = "" }) => (
  <div className={`stat ${tone}`}>
    <div className="stat-value">{value ?? 0}</div>
    <div className="stat-label">{label}</div>
  </div>
);

export function ReportTable({ reports, showReporter = false, showAssigned = false }) {
  if (!reports.length) return <p className="empty">No reports found.</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Incident ID</th>
            <th>Type</th>
            <th>Location</th>
            <th>Reported</th>
            {showReporter && <th>Reporter</th>}
            <th>Status</th>
            {showAssigned && <th>Assigned</th>}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id}>
              <td><strong>{r.incident_code}</strong></td>
              <td>{r.emergency_type}</td>
              <td>{r.location}</td>
              <td>{formatDateTime(r.created_at)}</td>
              {showReporter && <td>{r.reporter_name}</td>}
              <td><StatusBadge status={r.status} /></td>
              {showAssigned && <td>{r.assigned_responder_name || "Unassigned"}</td>}
              <td><Link className="btn btn-sm" to={`/reports/${r.id}`}>View</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
