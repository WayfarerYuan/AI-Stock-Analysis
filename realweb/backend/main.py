import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from realweb.backend.routers import analysis

app = FastAPI(title="RealWeb Stock Analysis")

# CORS (allow all for dev, restrict in prod if needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(analysis.router, prefix="/api")

# Static Files (Frontend)
# We expect the frontend build to be in ../frontend/dist (relative to this file's execution context usually)
# In Docker, we will copy dist to /app/realweb/static
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if not os.path.exists(static_dir):
    # Fallback for local dev if not built yet or different structure
    static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend/dist")

if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
else:
    print(f"Warning: Static directory not found at {static_dir}. Frontend will not be served.")

@app.get("/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}
