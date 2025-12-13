from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import admin_auth, admin_routes
from app.routers import participant_auth, participant_routes
from app.routers import event
from app.routers import results
from app.routers import dashboard

app = FastAPI(
    title="ROSE Event Management API",
    description="API for ROSE Foundation mobile health screening events",
    version="1.0.0",
    redirect_slashes=False
)

# CORS middleware (allow frontend to access backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://solterra.diy0.dev"
    ],
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
app.include_router(event.router)
app.include_router(results.router)
app.include_router(dashboard.router)