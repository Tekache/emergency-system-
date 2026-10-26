from fastapi import APIRouter, Depends

from ..database import get_db
from ..schemas import STATUSES, DashboardStats, UpdateOut
from ..security import get_current_user, require_roles
from ..serializers import update_out

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def stats(user: dict = Depends(get_current_user)):
    """Statistics are calculated live from MongoDB. Community users only see their own reports."""
    db = get_db()
    match = {"reporter_id": user["_id"]} if user["role"] == "user" else {}
    counts = {s: 0 for s in STATUSES}
    async for row in db.emergency_reports.aggregate([{"$match": match}, {"$group": {"_id": "$status", "n": {"$sum": 1}}}]):
        counts[row["_id"]] = row["n"]
    by_type = {}
    async for row in db.emergency_reports.aggregate([{"$match": match}, {"$group": {"_id": "$emergency_type", "n": {"$sum": 1}}}]):
        by_type[row["_id"]] = row["n"]
    out = {**counts, "total": sum(counts.values()), "by_type": by_type}
    if user["role"] == "responder":
        out["my_active"] = await db.emergency_reports.count_documents(
            {"assigned_responder_id": user["_id"], "status": {"$in": ["accepted", "in_progress"]}}
        )
    if user["role"] == "admin":
        roles = {"user": 0, "responder": 0, "admin": 0}
        async for row in db.users.aggregate([{"$group": {"_id": "$role", "n": {"$sum": 1}}}]):
            roles[row["_id"]] = row["n"]
        out.update(total_users=roles["user"], total_responders=roles["responder"], total_admins=roles["admin"])
    return out


@router.get("/activity", response_model=list[UpdateOut])
async def activity(admin: dict = Depends(require_roles("admin"))):
    docs = await get_db().incident_updates.find().sort([("created_at", -1), ("_id", -1)]).to_list(100)
    return [update_out(d) for d in docs]
