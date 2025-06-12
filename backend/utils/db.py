from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    # Force a connection check
    client.server_info()
    print("Connected to database")
except Exception as e:
    print(f"Failed to connect to database: {e}")

db = client[DB_NAME]
