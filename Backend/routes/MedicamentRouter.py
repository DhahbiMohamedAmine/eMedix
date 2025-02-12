from fastapi import APIRouter
from models.MedicamentModel import Medicament
from config.config import medicament_collection
from serializers.medicament import decodemedicament, decodemedicaments
from bson import ObjectId
MedicamentRouter=APIRouter()

#post_request
@MedicamentRouter.post("/medicaments")
def createMedicament(med:Medicament):
    med = dict(med)
    res = medicament_collection.insert_one(med)
    med_id = str(res.inserted_id)
    return {
        "statut" : "ok",
        "message" : "medicament inserted successfully",
        "_id" : med_id
    }
#get_all
@MedicamentRouter.get("/medicaments")
def get_all_medicaments():
    res=medicament_collection.find()
    data = decodemedicaments(res)
    return {
        "statut" : "ok",
        "data": data
        }

#get_by_id
@MedicamentRouter.get("/medicaments/{id}")
def get_medicament(_id:str):
    res = medicament_collection.find_one({"_id": ObjectId(_id)})
    data = decodemedicament(res)
    return {
        "statut" : "ok",
        "data": data
        }
#update medicament
@MedicamentRouter.put("/medicaments/{id}")
def update_medicament(_id:str,med:Medicament):
    med = dict(med)
    res = medicament_collection.update_one({"_id": ObjectId(_id)}, {"$set": med})
    return {
        "statut" : "ok",
        "message" : "medicament updated successfully"
        }
#delete medicament
@MedicamentRouter.delete("/medicaments/{id}")
def delete_medicament(_id:str):
    res = medicament_collection.delete_one({"_id": ObjectId(_id)})
    return {
        "statut" : "ok",
        "message" : "medicament deleted successfully"
        }
