from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
import pandas as pd
import numpy as np
import io
import traceback

router = APIRouter(prefix="/upload", tags=["Upload"])


# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def clean(val, default=None):
    """Convert pandas NaN/NaT to None, or return default if value is missing."""
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return default
    if isinstance(val, np.integer):
        return int(val)
    if isinstance(val, np.floating):
        return float(val)
    return val


def safe_int(val):
    """Safely convert to int or return None."""
    v = clean(val)
    if v is None:
        return None
    try:
        return int(float(v))
    except (ValueError, TypeError):
        return None


def safe_float(val):
    """Safely convert to float or return None."""
    v = clean(val)
    if v is None:
        return None
    try:
        return float(v)
    except (ValueError, TypeError):
        return None


def safe_str(val, default=""):
    """Safely convert to string or return default."""
    v = clean(val, default)
    return str(v) if v is not None else default


# ── Column validation helpers ────────────────────────────────────────
REQUIRED_COLUMNS = {
    "reviews": ["product_name", "brand", "category", "review_text", "rating", "source"],
    "reddit": ["subreddit", "title", "post_text", "upvotes", "keyword_detected"],
    "trends": ["keyword", "search_volume", "growth_percent", "timeframe"],
    "competition": ["product_name", "brand", "category", "format", "price", "ingredient_focus"],
}


def validate_columns(df: pd.DataFrame, data_type: str):
    """Raise 400 if the CSV is missing required columns for the given data type."""
    required = REQUIRED_COLUMNS.get(data_type, [])
    actual = [c.strip().lower() for c in df.columns]
    missing = [col for col in required if col.lower() not in actual]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=(
                f"CSV is missing required columns for '{data_type}' format: {', '.join(missing)}. "
                f"Expected columns: {', '.join(required)}. "
                f"Found columns: {', '.join(df.columns.tolist())}. "
                f"Use the Format page to convert your file first."
            ),
        )
    # Normalize column names to lowercase
    df.columns = [c.strip().lower() for c in df.columns]


def _clear_analysis(db: Session):
    """Remove stale analysis results so dashboard shows nothing until re-run."""
    db.query(models.OpportunityCluster).delete()
    db.query(models.ProductConcept).delete()


@router.post("/reviews")
async def upload_reviews(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode("utf-8-sig")))
    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file contains no data rows.")
    validate_columns(df, "reviews")

    try:
        db.query(models.ReviewRaw).delete()
        _clear_analysis(db)
        for _, row in df.iterrows():
            review = models.ReviewRaw(
                product_name=safe_str(row.get("product_name")),
                brand=safe_str(row.get("brand")),
                category=safe_str(row.get("category")),
                review_text=safe_str(row.get("review_text")),
                rating=safe_float(row.get("rating")),
                source=safe_str(row.get("source"), "upload"),
            )
            db.add(review)

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"❌ Upload reviews error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    return {"message": f"Reviews uploaded successfully ({len(df)} rows)"}


@router.post("/reddit")
async def upload_reddit(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode("utf-8-sig")))
    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file contains no data rows.")
    validate_columns(df, "reddit")

    try:
        db.query(models.RedditRaw).delete()
        _clear_analysis(db)
        for _, row in df.iterrows():
            record = models.RedditRaw(
                subreddit=safe_str(row.get("subreddit"), "unknown"),
                title=safe_str(row.get("title")),
                post_text=safe_str(row.get("post_text")),
                upvotes=safe_int(row.get("upvotes")),
                keyword_detected=clean(row.get("keyword_detected")),
            )
            db.add(record)

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"❌ Upload reddit error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    return {"message": f"Reddit data uploaded successfully ({len(df)} rows)"}


@router.post("/trends")
async def upload_trends(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode("utf-8-sig")))
    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file contains no data rows.")
    validate_columns(df, "trends")

    try:
        db.query(models.TrendRaw).delete()
        _clear_analysis(db)
        for _, row in df.iterrows():
            record = models.TrendRaw(
                keyword=safe_str(row.get("keyword")),
                search_volume=safe_int(row.get("search_volume")),
                growth_percent=safe_float(row.get("growth_percent")),
                timeframe=clean(row.get("timeframe")),
            )
            db.add(record)

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"❌ Upload trends error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    return {"message": f"Trends data uploaded successfully ({len(df)} rows)"}


@router.post("/competition")
async def upload_competition(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode("utf-8-sig")))
    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file contains no data rows.")
    validate_columns(df, "competition")

    try:
        db.query(models.CompetitionProduct).delete()
        _clear_analysis(db)
        for _, row in df.iterrows():
            record = models.CompetitionProduct(
                product_name=safe_str(row.get("product_name")),
                brand=safe_str(row.get("brand")),
                category=safe_str(row.get("category")),
                format=safe_str(row.get("format")),
                price=safe_float(row.get("price")),
                ingredient_focus=clean(row.get("ingredient_focus")),
            )
            db.add(record)

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"❌ Upload competition error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    return {"message": f"Competition data uploaded successfully ({len(df)} rows)"}


# ── Cumulative upload: single CSV containing data for ALL tables ──
# The CSV must have a "data_type" column to distinguish rows.
# Valid data_type values: reviews, reddit, trends, competition
CUMULATIVE_REQUIRED = {
    "reviews": ["product_name", "brand", "category", "review_text", "rating", "source"],
    "reddit": ["subreddit", "title", "post_text"],
    "trends": ["keyword"],
    "competition": ["product_name", "brand", "category", "format"],
}

@router.post("/cumulative")
async def upload_cumulative(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode("utf-8-sig")))

    if "data_type" not in df.columns:
        raise HTTPException(
            status_code=400,
            detail="CSV must contain a 'data_type' column with values: reviews, reddit, trends, competition"
        )

    counts = {"reviews": 0, "reddit": 0, "trends": 0, "competition": 0}

    for _, row in df.iterrows():
        dtype = safe_str(row.get("data_type")).strip().lower()

        if dtype == "reviews":
            db.add(models.ReviewRaw(
                product_name=safe_str(row.get("product_name")),
                brand=safe_str(row.get("brand")),
                category=safe_str(row.get("category")),
                review_text=safe_str(row.get("review_text")),
                rating=safe_float(row.get("rating")),
                source=safe_str(row.get("source"), "cumulative_upload"),
            ))
            counts["reviews"] += 1

        elif dtype == "reddit":
            db.add(models.RedditRaw(
                subreddit=safe_str(row.get("subreddit"), "unknown"),
                title=safe_str(row.get("title")),
                post_text=safe_str(row.get("post_text")),
                upvotes=safe_int(row.get("upvotes")),
                keyword_detected=clean(row.get("keyword_detected")),
            ))
            counts["reddit"] += 1

        elif dtype == "trends":
            db.add(models.TrendRaw(
                keyword=safe_str(row.get("keyword")),
                search_volume=safe_int(row.get("search_volume")),
                growth_percent=safe_float(row.get("growth_percent")),
                timeframe=clean(row.get("timeframe")),
            ))
            counts["trends"] += 1

        elif dtype == "competition":
            db.add(models.CompetitionProduct(
                product_name=safe_str(row.get("product_name")),
                brand=safe_str(row.get("brand")),
                category=safe_str(row.get("category")),
                format=safe_str(row.get("format")),
                price=safe_float(row.get("price")),
                ingredient_focus=clean(row.get("ingredient_focus")),
            ))
            counts["competition"] += 1

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"❌ Upload cumulative error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    total = sum(counts.values())
    breakdown = ", ".join(f"{k}: {v}" for k, v in counts.items() if v > 0)
    return {"message": f"Cumulative upload successful — {total} rows ({breakdown})"}