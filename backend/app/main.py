import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import patients, analysis, signals

app = FastAPI(
    title="Cardiac Digital Twin API",
    version="2.0.0",
    description="Backend for real-time cardiac monitoring and AI analysis"
)

# CORS for Next.js frontend
frontend_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(patients.router, prefix="/api/v1")
app.include_router(analysis.router, prefix="/api/v1")
app.include_router(signals.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "Cardiac Digital Twin API is running"}
