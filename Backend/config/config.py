from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

uri = "mongodb://localhost:27017/"

client = MongoClient(uri, server_api=ServerApi('1'))

db = client.get_database("medcine")

medicament_collection = db.get_collection("medicament")

try:
    client.admin.command('ping')
    print("You are successfully connected to MongoDB")
    print(f"Connected to database: {db.name}")
except Exception as e:
    print(f"An error occurred while connecting to MongoDB: {e}")

