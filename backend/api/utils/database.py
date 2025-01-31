from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError
import os

_db = None

def get_db():
    global _db
    if _db is None:
        client = AsyncIOMotorClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
        _db = client.dna_analysis
    return _db
