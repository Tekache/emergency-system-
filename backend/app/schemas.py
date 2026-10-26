import re
from datetime import datetime
from typing import Annotated, Literal, Optional, get_args

from email_validator import validate_email
from pydantic import AfterValidator, BaseModel, ConfigDict, Field

EmergencyType = Literal["Accident", "Fire", "Medical Emergency", "Security Incident", "Other Emergency"]
Status = Literal["pending", "accepted", "in_progress", "resolved", "cancelled"]
Role = Literal["user", "responder", "admin"]
EMERGENCY_TYPES = list(get_args(EmergencyType))
STATUSES = list(get_args(Status))

PHONE_RE = re.compile(r"^[0-9+\-\s()]{7,20}$")


def _check_password(v: str) -> str:
    if len(v.encode("utf-8")) > 72:
        raise ValueError("Password must be at most 72 bytes")
    if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
        raise ValueError("Password must contain at least one letter and one number")
    return v


def _check_phone(v: str) -> str:
    if not PHONE_RE.match(v):
        raise ValueError("Enter a valid phone number")
    return v


def _check_email(v: str) -> str:
    address = v.strip()
    local_part, separator, domain = address.rpartition("@")
    if not separator:
        raise ValueError("Enter a valid email address")
    if domain.lower().endswith(".local"):
        checked = validate_email(f"{local_part}@{domain[:-6]}.com", check_deliverability=False)
        return f"{checked.local_part}@{domain.lower()}"
    return validate_email(address, check_deliverability=False).normalized


Password = Annotated[str, Field(min_length=8, max_length=72), AfterValidator(_check_password)]
Phone = Annotated[str, AfterValidator(_check_phone)]
EmailAddress = Annotated[str, AfterValidator(_check_email)]


class Base(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)


# ---------- Auth / users ----------
class RegisterIn(Base):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailAddress
    phone: Phone
    address: Optional[str] = Field(default=None, max_length=200)
    password: Password


class LoginIn(Base):
    email: EmailAddress
    password: str = Field(min_length=1, max_length=128)


class PasswordChange(Base):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: Password


class ProfileUpdate(Base):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    phone: Optional[Phone] = None
    address: Optional[str] = Field(default=None, max_length=200)


class AdminUserCreate(Base):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailAddress
    phone: Phone
    password: Password
    role: Role


class AdminUserUpdate(Base):
    is_active: Optional[bool] = None
    role: Optional[Role] = None


class UserOut(BaseModel):
    id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    role: Role
    is_active: bool
    created_at: datetime


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Reports ----------
class ReportCreate(Base):
    emergency_type: EmergencyType
    description: str = Field(min_length=10, max_length=2000)
    location: str = Field(min_length=3, max_length=300)
    contact_phone: Optional[Phone] = None


class StatusUpdateIn(Base):
    status: Status
    note: Optional[str] = Field(default=None, max_length=1000)


class NoteIn(Base):
    note: str = Field(min_length=1, max_length=1000)


class AssignIn(Base):
    responder_id: str


class UpdateOut(BaseModel):
    id: str
    report_id: str
    incident_code: str
    kind: str
    from_status: Optional[str] = None
    to_status: Optional[str] = None
    note: Optional[str] = None
    author_id: str
    author_name: str
    author_role: str
    created_at: datetime


class ReportOut(BaseModel):
    id: str
    incident_code: str
    emergency_type: str
    description: str
    location: str
    contact_phone: Optional[str] = None
    status: Status
    reporter_id: str
    reporter_name: str
    reporter_phone: Optional[str] = None
    assigned_responder_id: Optional[str] = None
    assigned_responder_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ReportDetailOut(ReportOut):
    updates: list[UpdateOut] = []


class DashboardStats(BaseModel):
    total: int
    pending: int
    accepted: int
    in_progress: int
    resolved: int
    cancelled: int
    by_type: dict[str, int] = {}
    my_active: Optional[int] = None
    total_users: Optional[int] = None
    total_responders: Optional[int] = None
    total_admins: Optional[int] = None
