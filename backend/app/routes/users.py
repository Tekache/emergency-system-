import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pymongo.errors import DuplicateKeyError

from ..database import get_db
from ..schemas import AdminUserCreate, AdminUserUpdate, Role, UserOut
from ..security import hash_password, require_roles
from ..serializers import user_out
from ..utils import to_oid, utcnow

router = APIRouter(prefix="/api/users", tags=["Users (admin)"])


@router.get("", response_model=list[UserOut])
async def list_users(role: Optional[Role] = None, search: Optional[str] = None, admin: dict = Depends(require_roles("admin"))):
    q: dict = {}
    if role:
        q["role"] = role
    if search and search.strip():
        rx = {"$regex": re.escape(search.strip()), "$options": "i"}
        q["$or"] = [{"full_name": rx}, {"email": rx}]
    docs = await get_db().users.find(q).sort("created_at", -1).to_list(500)
    return [user_out(d) for d in docs]


@router.get("/responders", response_model=list[UserOut])
async def active_responders(admin: dict = Depends(require_roles("admin"))):
    docs = await get_db().users.find({"role": "responder", "is_active": True}).sort("full_name", 1).to_list(500)
    return [user_out(d) for d in docs]


@router.post("", response_model=UserOut, status_code=201)
async def create_user(data: AdminUserCreate, admin: dict = Depends(require_roles("admin"))):
    doc = {
        "full_name": data.full_name,
        "email": data.email.lower(),
        "phone": data.phone,
        "address": None,
        "password_hash": hash_password(data.password),
        "role": data.role,
        "is_active": True,
        "created_at": utcnow(),
    }
    try:
        res = await get_db().users.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    doc["_id"] = res.inserted_id
    return user_out(doc)


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(user_id: str, data: AdminUserUpdate, admin: dict = Depends(require_roles("admin"))):
    changes = data.model_dump(exclude_unset=True, exclude_none=True)
    if not changes:
        raise HTTPException(status_code=400, detail="Nothing to update")
    oid = to_oid(user_id, "user ID")
    if oid == admin["_id"] and (changes.get("is_active") is False or changes.get("role", "admin") != "admin"):
        raise HTTPException(status_code=400, detail="You cannot deactivate or demote your own account")
    doc = await get_db().users.find_one_and_update({"_id": oid}, {"$set": changes}, return_document=True)
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return user_out(doc)
