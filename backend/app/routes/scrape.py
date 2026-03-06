"""
Scrape Routes — API endpoints for live data collection from Reddit,
Google Trends, Amazon, and Flipkart.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.scraper import (
    scrape_reddit,
    scrape_trends,
    scrape_amazon_reviews,
    scrape_competition,
    run_full_scrape,
)
from app import models

router = APIRouter(prefix="/scrape")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class ScrapeRequest(BaseModel):
    category: str
    keywords: list[str]
    subreddits: list[str] | None = None


class ScrapeRedditRequest(BaseModel):
    category: str
    keywords: list[str]
    subreddits: list[str] | None = None
    max_posts: int = 50


class ScrapeTrendsRequest(BaseModel):
    keywords: list[str]
    geo: str = "IN"


class ScrapeReviewsRequest(BaseModel):
    category: str
    keywords: list[str]
    max_reviews: int = 50


# ── Full pipeline scrape ────────────────────────────────────────────

@router.post("/all")
def scrape_all(req: ScrapeRequest, db: Session = Depends(get_db)):
    """Run all scrapers for a category — one-click live data collection."""
    if not req.keywords:
        raise HTTPException(status_code=400, detail="At least one keyword is required")
    if not req.category:
        raise HTTPException(status_code=400, detail="Category is required")

    try:
        result = run_full_scrape(db, req.category, req.keywords, req.subreddits)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scraping pipeline error: {str(e)}")


# ── Individual scrapers ─────────────────────────────────────────────

@router.post("/reddit")
def scrape_reddit_endpoint(req: ScrapeRedditRequest,
                           db: Session = Depends(get_db)):
    """Scrape Reddit posts for given keywords."""
    if not req.keywords:
        raise HTTPException(status_code=400, detail="At least one keyword is required")

    try:
        # Clear existing reddit data
        db.query(models.RedditRaw).delete()
        db.commit()

        count = scrape_reddit(db, req.category, req.keywords,
                              req.subreddits, req.max_posts)
        return {"source": "reddit", "posts_scraped": count}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Reddit scraping error: {str(e)}")


@router.post("/trends")
def scrape_trends_endpoint(req: ScrapeTrendsRequest,
                           db: Session = Depends(get_db)):
    """Fetch Google Trends data for keywords."""
    if not req.keywords:
        raise HTTPException(status_code=400, detail="At least one keyword is required")

    try:
        db.query(models.TrendRaw).delete()
        db.commit()

        count = scrape_trends(db, req.keywords, req.geo)
        return {"source": "trends", "trends_fetched": count}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Trends scraping error: {str(e)}")


@router.post("/reviews")
def scrape_reviews_endpoint(req: ScrapeReviewsRequest,
                            db: Session = Depends(get_db)):
    """Scrape product reviews from Amazon and Flipkart."""
    if not req.keywords:
        raise HTTPException(status_code=400, detail="At least one keyword is required")

    try:
        db.query(models.ReviewRaw).delete()
        db.commit()

        count = scrape_amazon_reviews(db, req.category, req.keywords,
                                      req.max_reviews)
        return {"source": "reviews", "reviews_scraped": count}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Review scraping error: {str(e)}")


@router.post("/competition")
def scrape_competition_endpoint(req: ScrapeReviewsRequest,
                                db: Session = Depends(get_db)):
    """Build competition table from Amazon search results."""
    if not req.keywords:
        raise HTTPException(status_code=400, detail="At least one keyword is required")

    try:
        db.query(models.CompetitionProduct).delete()
        db.commit()

        count = scrape_competition(db, req.category, req.keywords,
                                   req.max_reviews)
        return {"source": "competition", "products_scraped": count}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Competition scraping error: {str(e)}")
