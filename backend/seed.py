"""Create or ensure the configured administrator and responder accounts."""
import argparse
import os
from datetime import datetime, timezone

import bcrypt
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument(
    "--reset-passwords",
    action="store_true",
    help="set the configured account passwords from backend/.env, including for existing accounts",
)
args = parser.parse_args()


def required_env(name):
    value = os.getenv(name, "").strip()
    if not value:
        raise SystemExit(f"{name} must be set in backend/.env")
    return value


def account_settings():
    admin_email = required_env("ADMIN_EMAIL").lower()
    admin_password = required_env("ADMIN_PASSWORD")
    responder_email = required_env("RESPONDER_EMAIL").lower()
    responder_password = required_env("RESPONDER_PASSWORD")
    if admin_email == responder_email:
        raise SystemExit("ADMIN_EMAIL and RESPONDER_EMAIL must be different")
    for name, password in (("ADMIN_PASSWORD", admin_password), ("RESPONDER_PASSWORD", responder_password)):
        if len(password) < 8 or len(password) > 72 or not any(c.isalpha() for c in password) or not any(c.isdigit() for c in password):
            raise SystemExit(f"{name} must be 8-72 characters and contain a letter and a number")
    return [
        ("System Administrator", admin_email, admin_password, "admin"),
        ("Community Responder", responder_email, responder_password, "responder"),
    ]


accounts = account_settings()
client = MongoClient(required_env("MONGODB_URI"), serverSelectionTimeoutMS=8000)
db = client[os.getenv("MONGODB_DB", "tudun_wada_emergency")]
db.users.create_index("email", unique=True)

for name, email, password, role in accounts:
    existing = db.users.find_one({"email": email})
    if existing:
        changes = {}
        if existing.get("role") != role:
            changes["role"] = role
        if args.reset_passwords:
            changes["password_hash"] = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        if changes:
            db.users.update_one({"_id": existing["_id"]}, {"$set": changes})
            if "password_hash" in changes:
                if "role" in changes:
                    print(f"Updated configured account role and password: {role} ({email})")
                else:
                    print(f"Reset configured account password: {role} ({email})")
            else:
                print(f"Updated configured account role: {role} ({email})")
        else:
            print(f"Already configured: {role} ({email})")
        continue
    db.users.insert_one({
        "full_name": name, "email": email, "phone": "0000000000", "address": None,
        "password_hash": bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode(),
        "role": role, "is_active": True, "created_at": datetime.now(timezone.utc),
    })
    print(f"Created {role}: {email}")
if args.reset_passwords:
    print("Done. Configured account passwords were synchronized with backend/.env.")
else:
    print("Done. Existing account passwords are not changed.")
client.close()
