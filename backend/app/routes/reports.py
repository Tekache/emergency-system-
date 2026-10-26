import datetime as dt
import re
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo import ReturnDocument

from ..database import get_db
from ..schemas import (AssignIn, EmergencyType, NoteIn, ReportCreate, ReportDetailOut, ReportOut,
                       Status, StatusUpdateIn)
from ..security import get_current_user, require_roles
from ..serializers import report_out
from ..services import (TRANSITIONS, ensure_can_view, get_report_or_404, log_update, report_detail)
from ..utils import to_oid, utcnow

router = APIRouter(prefix="/api/reports", tags=["Emergency Reports"])
STAFF = ("responder", "admin")


@router.post("", response_model=ReportOut, status_code=201)
async def create_report(data: ReportCreate, user: dict = Depends(require_roles("user"))):
    db = get_db()
    counter = await db.counters.find_one_and_update(
        {"_id": "incident"}, {"$inc": {"seq": 1}}, upsert=True, return_document=ReturnDocument.AFTER
    )
    now = utcnow()
    doc = {
        "incident_code": f"INC-{counter['seq']:05d}",
        "emergency_type": data.emergency_type,
        "description": data.description,
        "location": data.location,
        "contact_phone": data.contact_phone or user.get("phone"),
        "status": "pending",
        "reporter_id": user["_id"],
        "reporter_name": user["full_name"],
        "reporter_phone": user.get("phone"),
        "assigned_responder_id": None,
        "assigned_responder_name": None,
        "created_at": now,
        "updated_at": now,
    }
    res = await db.emergency_reports.insert_one(doc)
    doc["_id"] = res.inserted_id
    await log_update(doc, user, "created", to_status="pending", note="Emergency report submitted")
    return report_out(doc)


@router.get("/mine", response_model=list[ReportOut])
async def my_reports(status: Optional[Status] = None, user: dict = Depends(require_roles("user"))):
    q = {"reporter_id": user["_id"]}
    if status:
        q["status"] = status
    docs = await get_db().emergency_reports.find(q).sort("created_at", -1).to_list(500)
    return [report_out(d) for d in docs]


@router.get("", response_model=list[ReportOut])
async def list_reports(
    view: Literal["all", "active", "history"] = "all",
    status: Optional[Status] = None,
    emergency_type: Optional[EmergencyType] = None,
    search: Optional[str] = Query(default=None, max_length=100),
    date_from: Optional[dt.date] = None,
    date_to: Optional[dt.date] = None,
    limit: int = Query(default=200, ge=1, le=500),
    user: dict = Depends(require_roles(*STAFF)),
):
    q: dict = {}
    if view == "active":
        q["status"] = {"$in": ["accepted", "in_progress"]}
        if user["role"] == "responder":
            q["assigned_responder_id"] = user["_id"]
    elif view == "history":
        q["status"] = {"$in": ["resolved", "cancelled"]}
    if status:
        q["status"] = status
    if emergency_type:
        q["emergency_type"] = emergency_type
    if search and search.strip():
        rx = {"$regex": re.escape(search.strip()), "$options": "i"}
        q["$or"] = [{"incident_code": rx}, {"location": rx}, {"description": rx}, {"reporter_name": rx}]
    if date_from:
        q.setdefault("created_at", {})["$gte"] = dt.datetime.combine(date_from, dt.time.min, tzinfo=dt.timezone.utc)
    if date_to:
        q.setdefault("created_at", {})["$lt"] = dt.datetime.combine(date_to + dt.timedelta(days=1), dt.time.min, tzinfo=dt.timezone.utc)
    docs = await get_db().emergency_reports.find(q).sort("created_at", -1).to_list(limit)
    return [report_out(d) for d in docs]


@router.get("/{report_id}", response_model=ReportDetailOut)
async def get_report(report_id: str, user: dict = Depends(get_current_user)):
    doc = await get_report_or_404(report_id)
    ensure_can_view(doc, user)
    return await report_detail(doc["_id"])


@router.patch("/{report_id}/status", response_model=ReportDetailOut)
async def update_status(report_id: str, data: StatusUpdateIn, user: dict = Depends(require_roles(*STAFF))):
    doc = await get_report_or_404(report_id)
    current = doc["status"]
    if data.status == current:
        raise HTTPException(status_code=400, detail=f"This incident is already {current.replace('_', ' ')}")
    if data.status not in TRANSITIONS[current]:
        raise HTTPException(status_code=400, detail=f"Cannot change status from {current.replace('_', ' ')} to {data.status.replace('_', ' ')}")
    if user["role"] == "responder" and current != "pending" and doc.get("assigned_responder_id") != user["_id"]:
        raise HTTPException(status_code=403, detail="This incident is assigned to another responder")
    if data.status == "cancelled" and not data.note:
        raise HTTPException(status_code=400, detail="Please give a reason for cancelling this incident")

    changes = {"status": data.status, "updated_at": utcnow()}
    if data.status == "accepted" and not doc.get("assigned_responder_id"):
        changes["assigned_responder_id"] = user["_id"]
        changes["assigned_responder_name"] = user["full_name"]
    await get_db().emergency_reports.update_one({"_id": doc["_id"]}, {"$set": changes})
    await log_update(doc, user, "status_change", from_status=current, to_status=data.status, note=data.note)
    return await report_detail(doc["_id"])


@router.post("/{report_id}/notes", response_model=ReportDetailOut, status_code=201)
async def add_note(report_id: str, data: NoteIn, user: dict = Depends(require_roles(*STAFF))):
    doc = await get_report_or_404(report_id)
    if user["role"] == "responder" and doc.get("assigned_responder_id") != user["_id"]:
        raise HTTPException(status_code=403, detail="Only the assigned responder can add notes. Accept the incident first.")
    await log_update(doc, user, "note", note=data.note)
    await get_db().emergency_reports.update_one({"_id": doc["_id"]}, {"$set": {"updated_at": utcnow()}})
    return await report_detail(doc["_id"])


@router.patch("/{report_id}/assign", response_model=ReportDetailOut)
async def assign_responder(report_id: str, data: AssignIn, user: dict = Depends(require_roles("admin"))):
    doc = await get_report_or_404(report_id)
    if doc["status"] in ("resolved", "cancelled"):
        raise HTTPException(status_code=400, detail="A closed incident cannot be reassigned")
    responder = await get_db().users.find_one({"_id": to_oid(data.responder_id, "responder ID"), "role": "responder", "is_active": True})
    if not responder:
        raise HTTPException(status_code=404, detail="Active responder not found")
    await get_db().emergency_reports.update_one(
        {"_id": doc["_id"]},
        {"$set": {"assigned_responder_id": responder["_id"], "assigned_responder_name": responder["full_name"], "updated_at": utcnow()}},
    )
    await log_update(doc, user, "assignment", note=f"Assigned to {responder['full_name']}")
    return await report_detail(doc["_id"])


@router.post("/{report_id}/cancel", response_model=ReportDetailOut)
async def cancel_own_report(report_id: str, user: dict = Depends(require_roles("user"))):
    doc = await get_report_or_404(report_id)
    ensure_can_view(doc, user)
    if doc["status"] != "pending":
        raise HTTPException(status_code=400, detail="Only reports that are still pending can be cancelled")
    await get_db().emergency_reports.update_one({"_id": doc["_id"]}, {"$set": {"status": "cancelled", "updated_at": utcnow()}})
    await log_update(doc, user, "status_change", from_status="pending", to_status="cancelled", note="Cancelled by the reporter")
    return await report_detail(doc["_id"])
