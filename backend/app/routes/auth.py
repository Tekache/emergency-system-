from fastapi import APIRouter, Depends, HTTPException
from pymongo.errors import DuplicateKeyError

from ..database import get_db
from ..schemas import LoginIn, PasswordChange, ProfileUpdate, RegisterIn, TokenOut, UserOut
from ..security import create_access_token, get_current_user, hash_password, verify_password
from ..serializers import user_out
from ..utils import utcnow

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenOut, status_code=201)
async def register(data: RegisterIn):
    doc = {
        "full_name": data.full_name,
        "email": data.email.lower(),
        "phone": data.phone,
        "address": data.address or None,
        "password_hash": hash_password(data.password),
        "role": "user",  # public registration can only create community users
        "is_active": True,
        "created_at": utcnow(),
    }
    try:
        res = await get_db().users.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    doc["_id"] = res.inserted_id
    return {"access_token": create_access_token(doc["_id"], "user"), "token_type": "bearer", "user": user_out(doc)}


@router.post("/login", response_model=TokenOut)
async def login(data: LoginIn):
    user = await get_db().users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="This account has been deactivated. Contact an administrator.")
    return {"access_token": create_access_token(user["_id"], user["role"]), "token_type": "bearer", "user": user_out(user)}


@router.get("/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return user_out(user)


@router.patch("/me", response_model=UserOut)
async def update_me(data: ProfileUpdate, user: dict = Depends(get_current_user)):
    changes = data.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=400, detail="Nothing to update")
    await get_db().users.update_one({"_id": user["_id"]}, {"$set": changes})
    user.update(changes)
    return user_out(user)


@router.post("/me/password", status_code=204)
async def change_password(data: PasswordChange, user: dict = Depends(get_current_user)):
    if not verify_password(data.current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if verify_password(data.new_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Choose a new password different from your current password")
    await get_db().users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password_hash": hash_password(data.new_password)}},
    )
