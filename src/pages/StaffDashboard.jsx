import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import { api } from "../services/api";
import { Alert, ReportTable, Spinner, StatCard } from "../components/ui";

export default function StaffDashboard() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const stats = useFetch(() => api.stats(), []);
  const reports = useFetch(() => api.listReports({ limit: 10 }), []);
  const s = stats.data;
  const maxType = s ? Math.max(1, ...Object.values(s.by_type)) : 1;

  return (
    <>
      <h1>{isAdmin ? "Administrator Dashboard" : "Responder Dashboard"}</h1>
      {(stats.error || reports.error) && <Alert>{stats.error || reports.error}</Alert>}
      {s && (
        <>
          <div className="grid-4">
            <StatCard label="Total incidents" value={s.total} />
            <StatCard label="Pending" value={s.pending} tone="warn" />
            <StatCard label="Active" value={s.accepted + s.in_progress} tone="info" />
            <StatCard label="Resolved" value={s.resolved} tone="ok" />
          </div>
          {isAdmin ? (
            <div className="grid-4">
              <StatCard label="Community users" value={s.total_users} />
              <StatCard label="Responders" value={s.total_responders} />
              <StatCard label="Administrators" value={s.total_admins} />
              <StatCard label="Cancelled" value={s.cancelled} />
            </div>
          ) : (
            <div className="grid-4">
              <StatCard label="Assigned to me (active)" value={s.my_active} tone="info" />
            </div>
          )}
          <div className="card">
            <h2>Incidents by emergency type</h2>
            {Object.keys(s.by_type).length === 0 ? <p className="empty">No reports yet.</p> : (
              Object.entries(s.by_type).map(([t, n]) => (
                <div className="bar-row" key={t}>
                  <span>{t}</span>
                  <div className="bar"><div style={{ width: `${(n / maxType) * 100}%` }} /></div>
                  <strong>{n}</strong>
                </div>
              ))
            )}
          </div>
        </>
      )}
      <div className="card">
        <div className="row-between">
          <h2>Latest reports</h2>
          <Link className="btn btn-sm" to="/incidents">View all</Link>
        </div>
        {reports.loading ? <Spinner /> : reports.data && <ReportTable reports={reports.data} showReporter showAssigned />}
      </div>
    </>
  );
}
