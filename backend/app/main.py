from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import admin_auth, admin_routes
from app.routers import participant_auth, participant_routes








app = FastAPI(
    title="ROSE Event Management API",
    description="API for ROSE Foundation mobile health screening events",
    version="1.0.0"
)

# CORS middleware (allow frontend to access backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {
        "message": "ROSE Event Management API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}

app.include_router(admin_auth.router)
app.include_router(admin_routes.router)
app.include_router(participant_auth.router)
app.include_router(participant_routes.router)