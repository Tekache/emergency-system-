def _s(v):
    return str(v) if v else None


def user_out(d):
    return {
        "id": str(d["_id"]),
        "full_name": d["full_name"],
        "email": d["email"],
        "phone": d.get("phone"),
        "address": d.get("address"),
        "role": d["role"],
        "is_active": d.get("is_active", True),
        "created_at": d["created_at"],
    }


def report_out(d):
    return {
        "id": str(d["_id"]),
        "incident_code": d["incident_code"],
        "emergency_type": d["emergency_type"],
        "description": d["description"],
        "location": d["location"],
        "contact_phone": d.get("contact_phone"),
        "status": d["status"],
        "reporter_id": str(d["reporter_id"]),
        "reporter_name": d["reporter_name"],
        "reporter_phone": d.get("reporter_phone"),
        "assigned_responder_id": _s(d.get("assigned_responder_id")),
        "assigned_responder_name": d.get("assigned_responder_name"),
        "created_at": d["created_at"],
        "updated_at": d["updated_at"],
    }


def update_out(d):
    return {
        "id": str(d["_id"]),
        "report_id": str(d["report_id"]),
        "incident_code": d["incident_code"],
        "kind": d["kind"],
        "from_status": d.get("from_status"),
        "to_status": d.get("to_status"),
        "note": d.get("note"),
        "author_id": str(d["author_id"]),
        "author_name": d["author_name"],
        "author_role": d["author_role"],
        "created_at": d["created_at"],
    }
