from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routes.auth_router import router as auth_router
from routes.appointment_router import router as appointment_router
from routes.users_router import router as users_router
app = FastAPI()

# Include the authentication routes
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(appointment_router, prefix="/appointments", tags=["appointments"])
app.include_router(users_router, prefix="/users", tags=["users"])
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