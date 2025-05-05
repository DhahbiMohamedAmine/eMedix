from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routes.auth_router import router as auth_router
from routes.appointment_router import router as appointment_router
from routes.users_router import router as users_router
from routes.tooth_router import router as tooth_router
from routes.medicament_router import router as medicament_router
from routes.prescription_router import router as prescription_router
from routes.stats_router import router as stats_router
from routes.cart_router import router as cart_router
from routes.billing_router import router as billing_router
from routes.message_router import router as message_router
from routes.paiment import router as payment_router

app = FastAPI()

# Include the authentication routes
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(appointment_router, prefix="/appointments", tags=["appointments"])
app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(tooth_router, prefix="/tooth", tags=["tooth"])
app.include_router(medicament_router, prefix="/medicaments", tags=["medicaments"])
app.include_router(prescription_router, prefix="/prescriptions", tags=["prescriptions"])
app.include_router(stats_router, prefix="/stats", tags=["stats"])

app.include_router(billing_router, prefix="/billing", tags=["billing"])
app.include_router(cart_router, prefix="/cart", tags=["Cart"])
app.include_router(message_router, tags=["chat"])
app.include_router(payment_router, tags=["payment"])

app.mount("/static", StaticFiles(directory="static"), name="static")
origins = [
    "http://localhost:3000",  # Your frontend URL
]

# Add CORS middleware to your FastAPI app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello FastAPI"}