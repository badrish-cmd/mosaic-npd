from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/")
def health_check():
    return {"status": "Backend is running successfully"}


@router.get("/health/db")
def db_health(db: Session = Depends(get_db)):
    """Return row counts per table to verify data is persisting."""
    try:
        counts = {
            "reviews": db.query(models.ReviewRaw).count(),
            "reddit": db.query(models.RedditRaw).count(),
            "trends": db.query(models.TrendRaw).count(),
            "competition": db.query(models.CompetitionProduct).count(),
            "opportunity_clusters": db.query(models.OpportunityCluster).count(),
            "product_concepts": db.query(models.ProductConcept).count(),
        }
        return {"status": "connected", "row_counts": counts}
    except Exception as e:
        return {"status": "error", "detail": str(e)}