export const EMERGENCY_TYPES = ["Accident", "Fire", "Medical Emergency", "Security Incident", "Other Emergency"];

export const STATUS_LABELS = {
  pending: "Pending",
  accepted: "Accepted",
  in_progress: "In Progress",
  resolved: "Resolved",
  cancelled: "Cancelled",
};

// Must match TRANSITIONS in backend/app/services.py
export const TRANSITIONS = {
  pending: ["accepted", "cancelled"],
  accepted: ["in_progress", "resolved", "cancelled"],
  in_progress: ["resolved", "cancelled"],
  resolved: [],
  cancelled: [],
};

export const ROLE_LABELS = { user: "Community User", responder: "Responder", admin: "Administrator" };
