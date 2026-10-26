import { Link } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import { api } from "../services/api";
import { Alert, Spinner } from "../components/ui";
import { eventLabel, formatDateTime } from "../utils/format";

export default function SystemRecords() {
  const { data, error, loading } = useFetch(() => api.activity(), []);
  return (
    <div className="card">
      <h1>System records</h1>
      <p className="muted">The 100 most recent incident activities recorded in the database.</p>
      {error && <Alert>{error}</Alert>}
      {loading ? <Spinner /> : data && (data.length === 0 ? <p className="empty">No activity yet.</p> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Time</th><th>Incident</th><th>Activity</th><th>By</th><th>Note</th></tr></thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id}>
                  <td>{formatDateTime(u.created_at)}</td>
                  <td><Link to={`/reports/${u.report_id}`}>{u.incident_code}</Link></td>
                  <td>{eventLabel(u)}</td>
                  <td>{u.author_name} ({u.author_role})</td>
                  <td>{u.note || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
