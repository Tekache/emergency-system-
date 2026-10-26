import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import { api } from "../services/api";
import { Alert, ReportTable, Spinner, StatCard } from "../components/ui";

export default function UserDashboard() {
  const { user } = useAuth();
  const stats = useFetch(() => api.stats(), []);
  const reports = useFetch(() => api.myReports(), []);
  const s = stats.data;

  return (
    <>
      <h1>Welcome, {user.full_name.split(" ")[0]}</h1>
      <div className="btn-row">
        <Link className="btn" to="/report">Report Emergency</Link>
        <Link className="btn btn-outline" to="/my-reports">My Reports</Link>
        <Link className="btn btn-outline" to="/profile">Profile</Link>
      </div>
      {(stats.error || reports.error) && <Alert>{stats.error || reports.error}</Alert>}
      {s && (
        <div className="grid-4">
          <StatCard label="Total reports" value={s.total} />
          <StatCard label="Pending" value={s.pending} tone="warn" />
          <StatCard label="Being handled" value={s.accepted + s.in_progress} tone="info" />
          <StatCard label="Resolved" value={s.resolved} tone="ok" />
        </div>
      )}
      <div className="card">
        <h2>Recent reports</h2>
        {reports.loading ? <Spinner /> : reports.data && <ReportTable reports={reports.data.slice(0, 5)} />}
      </div>
    </>
  );
}
