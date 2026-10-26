from fastapi import HTTPException

from .database import get_db
from .serializers import report_out, update_out
from .utils import to_oid, utcnow

# Allowed status lifecycle: pending -> accepted -> in_progress -> resolved (cancelled from any open state)
TRANSITIONS = {
    "pending": {"accepted", "cancelled"},
    "accepted": {"in_progress", "resolved", "cancelled"},
    "in_progress": {"resolved", "cancelled"},
    "resolved": set(),
    "cancelled": set(),
}


async def get_report_or_404(report_id: str) -> dict:
    doc = await get_db().emergency_reports.find_one({"_id": to_oid(report_id, "report ID")})
    if not doc:
        raise HTTPException(status_code=404, detail="Report not found")
    return doc


def ensure_can_view(doc: dict, user: dict):
    if user["role"] == "user" and doc["reporter_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="You do not have access to this report")


async def log_update(report: dict, user: dict, kind: str, from_status=None, to_status=None, note=None):
    await get_db().incident_updates.insert_one(
        {
            "report_id": report["_id"],
            "incident_code": report["incident_code"],
            "kind": kind,
            "from_status": from_status,
            "to_status": to_status,
            "note": note,
            "author_id": user["_id"],
            "author_name": user["full_name"],
            "author_role": user["role"],
            "created_at": utcnow(),
        }
    )


async def report_detail(oid) -> dict:
    db = get_db()
    doc = await db.emergency_reports.find_one({"_id": oid})
    updates = await db.incident_updates.find({"report_id": oid}).sort([("created_at", 1), ("_id", 1)]).to_list(500)
    return {**report_out(doc), "updates": [update_out(u) for u in updates]}
