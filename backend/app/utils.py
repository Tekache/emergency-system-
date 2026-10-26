from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException


def utcnow():
    return datetime.now(timezone.utc)


def to_oid(value, label="ID"):
    try:
        return ObjectId(str(value))
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail=f"Invalid {label}")
