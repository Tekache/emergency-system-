import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import { api } from "../services/api";
import { Alert, ReportTable, Spinner } from "../components/ui";
import { EMERGENCY_TYPES, STATUS_LABELS } from "../utils/constants";

const STATUS_BY_VIEW = {
  all: ["pending", "accepted", "in_progress", "resolved", "cancelled"],
  active: ["accepted", "in_progress"],
  history: ["resolved", "cancelled"],
};

export default function ReportsList({ view = "all" }) {
  const { user } = useAuth();
  const [f, setF] = useState({ search: "", status: "", emergency_type: "", date_from: "", date_to: "" });
  const [applied, setApplied] = useState(f);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    const t = setTimeout(() => setApplied(f), 300);
    return () => clearTimeout(t);
  }, [f]);

  useEffect(() => {
    setF((p) => ({ ...p, status: "" }));
  }, [view]);

  const { data, error, loading } = useFetch(() => api.listReports({ ...applied, view }), [JSON.stringify(applied), view]);

  const title =
    view === "history" ? "Incident history" :
    view === "active" ? (user.role === "responder" ? "My active incidents" : "Active incidents") :
    "Emergency reports";

  return (
    <div className="card">
      <h1>{title}</h1>
      <div className="filters">
        <input type="search" placeholder="Search ID, location, reporter..." value={f.search} onChange={set("search")} />
        <select value={f.status} onChange={set("status")} aria-label="Status">
          <option value="">All statuses</option>
          {STATUS_BY_VIEW[view].map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select value={f.emergency_type} onChange={set("emergency_type")} aria-label="Emergency type">
          <option value="">All types</option>
          {EMERGENCY_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <input type="date" value={f.date_from} onChange={set("date_from")} aria-label="From date" />
        <input type="date" value={f.date_to} onChange={set("date_to")} aria-label="To date" />
      </div>
      {error && <Alert>{error}</Alert>}
      {loading ? <Spinner /> : data && <ReportTable reports={data} showReporter showAssigned />}
    </div>
  );
}
