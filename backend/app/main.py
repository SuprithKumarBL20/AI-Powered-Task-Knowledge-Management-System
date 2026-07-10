from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, tasks, documents, search, analytics

app = FastAPI(
    title="AI-Powered Task & Knowledge Management System API",
    description="Backend API for managing tasks, documents, semantic searches, and analytics.",
    version="1.0.0"
)

# CORS Configuration
# Allow all origins for development, but in production this should be restricted
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(documents.router)
app.include_router(search.router)
app.include_router(analytics.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to the AI-Powered Task & Knowledge Management System API",
        "docs_url": "/docs"
    }
