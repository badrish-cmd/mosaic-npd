from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import DATABASE_URL

# Create database engine
# Only add sslmode for PostgreSQL URLs that don't already specify it
connect_args = {}
if DATABASE_URL.startswith("postgresql"):
    if "sslmode" not in DATABASE_URL:
        connect_args["sslmode"] = "require"
elif DATABASE_URL.startswith("sqlite"):
    # SQLite needs check_same_thread=False for FastAPI's async usage
    connect_args["check_same_thread"] = False

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

# Create session
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for models
Base = declarative_base()
