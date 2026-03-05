import os
from dotenv import load_dotenv
from pathlib import Path

# Explicitly load .env from backend folder
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Fallback to local SQLite for development
    _db_path = Path(__file__).resolve().parent.parent / "mosaic_local.db"
    DATABASE_URL = f"sqlite:///{_db_path}"
    print(f"⚠️  DATABASE_URL not set — using local SQLite: {_db_path}")

# Render provides postgres:// but SQLAlchemy 2.0+ requires postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)