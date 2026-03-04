from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import health, analysis, upload

# ---------------------------------------------------
# App Initialization
# ---------------------------------------------------

app = FastAPI(
    title="Mosaic Product Strategy Intelligence Engine",
    version="1.0.0"
)

# ---------------------------------------------------
# CORS Middleware (Allow Frontend Connection)
# ---------------------------------------------------
# During development allow all origins
# For production, restrict to your frontend domain

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 🔥 Use "*" during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------
# Include Routes
# ---------------------------------------------------

app.include_router(health.router)
app.include_router(analysis.router)
app.include_router(upload.router)

# ---------------------------------------------------
# Auto-create tables on startup
# ---------------------------------------------------

@app.on_event("startup")
def startup():
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables ready")
    except Exception as e:
        print("❌ Database initialization failed:", e)

# ---------------------------------------------------
# Root Endpoint
# ---------------------------------------------------

@app.get("/")
def root():
    return {"status": "Backend is running successfully"}