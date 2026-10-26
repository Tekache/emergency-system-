from datetime import timedelta

import bcrypt
import jwt
from bson import ObjectId
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from . import config
from .database import get_db
from .utils import utcnow

bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user_id, role: str) -> str:
    exp = utcnow() + timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(user_id), "role": role, "exp": exp}, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)


def _unauthorized(msg: str):
    return HTTPException(status_code=401, detail=msg, headers={"WWW-Authenticate": "Bearer"})


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    if not creds:
        raise _unauthorized("Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, config.JWT_SECRET, algorithms=[config.JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise _unauthorized("Your session has expired. Please log in again.")
    except jwt.PyJWTError:
        raise _unauthorized("Invalid authentication token")
    try:
        uid = ObjectId(payload.get("sub"))
    except Exception:
        raise _unauthorized("Invalid authentication token")
    # Role and active state are always read from the database, never trusted from the token.
    user = await get_db().users.find_one({"_id": uid})
    if not user or not user.get("is_active", True):
        raise _unauthorized("Account not found or deactivated")
    return user


def require_roles(*roles: str):
    async def checker(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="You do not have permission to perform this action")
        return user

    return checker
