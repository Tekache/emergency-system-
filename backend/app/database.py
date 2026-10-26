from motor.motor_asyncio import AsyncIOMotorClient
from . import config

client = None
db = None


def get_db():
    return db


async def connect():
    global client, db
    client = AsyncIOMotorClient(config.MONGODB_URI, serverSelectionTimeoutMS=8000, tz_aware=True)
    db = client[config.MONGODB_DB]
    try:
        await db.users.create_index("email", unique=True)
        await db.emergency_reports.create_index([("created_at", -1)])
        await db.emergency_reports.create_index("reporter_id")
        await db.emergency_reports.create_index("status")
        await db.incident_updates.create_index([("report_id", 1), ("created_at", 1)])
    except Exception as exc:
        print("\nCould not connect to MongoDB. Check MONGODB_URI and that Atlas Network Access allows your IP (or 0.0.0.0/0 for Render).\n")
        raise exc


async def close():
    if client:
        client.close()
