import { useState } from "react";
import useFetch from "../hooks/useFetch";
import { api } from "../services/api";
import { Alert, ReportTable, Spinner } from "../components/ui";
import { STATUS_LABELS } from "../utils/constants";

export default function MyReports() {
  const [status, setStatus] = useState("");
  const { data, error, loading } = useFetch(() => api.myReports({ status }), [status]);
  return (
    <div className="card">
      <div className="row-between">
        <h1>My reports</h1>
        <select className="inline" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {error && <Alert>{error}</Alert>}
      {loading ? <Spinner /> : data && <ReportTable reports={data} showAssigned />}
    </div>
  );
}
