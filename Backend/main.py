from fastapi import FastAPI
from routes.MedicamentRouter import MedicamentRouter
app = FastAPI()

app.include_router(MedicamentRouter)

