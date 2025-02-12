def decodemedicament(med)-> dict:
    return {
        "_id" : str(med["_id"]),
        "libelle" : med["libelle"],
        "prix" : med["prix"],
        "dosage" : med["dosage"],
        "manufacturer" : med["manufacturer"],
    }
#all_medicament
def decodemedicaments(meds)->list:
    return [decodemedicament(med) for med in meds]

