from app.services.brand_fit import calculate_brand_fit
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.review_analyzer import extract_complaint_signals
from app.services.scoring import calculate_opportunity_scores
from app.services.concept_generator import generate_concepts
from app.services.ai_adapter import refine_with_ai
from app import models

router = APIRouter(prefix="/analysis")


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Data counts (lightweight, no computation) ──────────────────
@router.get("/status")
def get_status(db: Session = Depends(get_db)):
    """Return row counts so the dashboard knows what data exists."""
    return {
        "reviews": db.query(models.ReviewRaw).count(),
        "reddit": db.query(models.RedditRaw).count(),
        "trends": db.query(models.TrendRaw).count(),
        "competition": db.query(models.CompetitionProduct).count(),
        "opportunity_clusters": db.query(models.OpportunityCluster).count(),
        "product_concepts": db.query(models.ProductConcept).count(),
    }


# ── Complaints: GET returns saved, POST re-computes ───────────
@router.get("/complaints")
def get_saved_complaints(db: Session = Depends(get_db)):
    """Return complaint analysis from current data without side-effects."""
    review_count = db.query(models.ReviewRaw).count()
    if review_count == 0:
        return {}
    return extract_complaint_signals(db)


# ── Opportunities: GET returns saved, POST re-computes ────────
@router.get("/opportunities")
def get_saved_opportunities(db: Session = Depends(get_db)):
    """Return previously saved opportunity clusters."""
    saved = db.query(models.OpportunityCluster).order_by(
        models.OpportunityCluster.opportunity_score.desc()
    ).all()
    return [
        {
            "theme": c.theme,
            "theme_label": c.theme.replace("_", " ").title(),
            "theme_icon": "",
            "complaint_intensity": c.complaint_intensity,
            "trend_growth": c.search_growth,
            "search_volume": 0,
            "reddit_mentions": c.reddit_mentions,
            "competition_density": c.competition_density,
            "competition_intensity": 0,
            "demand_index": 0,
            "gap_score": 0,
            "opportunity_score": c.opportunity_score,
            "market_size_estimate": "",
            "tier": c.tier,
            "review_citations": [],
            "reddit_citations": [],
            "trend_citations": [],
        }
        for c in saved
    ]


@router.post("/opportunities")
def compute_opportunities(db: Session = Depends(get_db)):
    """Re-compute opportunity scores from current uploaded data."""
    review_count = db.query(models.ReviewRaw).count()
    if review_count == 0:
        raise HTTPException(status_code=400, detail="No review data found. Upload reviews first.")
    return calculate_opportunity_scores(db)


# ── Concepts: GET returns saved, POST re-generates ────────────
@router.post("/concepts")
def generate_new_concepts(db: Session = Depends(get_db)):
    """Generate concepts from current data (re-runs full pipeline)."""
    review_count = db.query(models.ReviewRaw).count()
    if review_count == 0:
        raise HTTPException(status_code=400, detail="No review data found. Upload reviews first.")

    opportunities = calculate_opportunity_scores(db)
    if not opportunities:
        raise HTTPException(status_code=400, detail="No opportunities found. Upload more data sources.")

    trends = db.query(models.TrendRaw).all()
    competition = db.query(models.CompetitionProduct).all()

    db.query(models.ProductConcept).delete()

    raw_concepts = generate_concepts(opportunities, trends, competition)

    concepts = []
    for concept_data in raw_concepts:
        brand_fit = calculate_brand_fit(concept_data, concept_data)
        refined_brief = refine_with_ai(concept_data["executive_brief"])

        db_concept = models.ProductConcept(
            product_name=concept_data["product_name"],
            persona=concept_data["persona"],
            format=concept_data["format"],
            ingredient_direction=concept_data["ingredient_direction"],
            price_range=concept_data["price_range"],
            positioning=concept_data["positioning"],
            supporting_data=refined_brief,
            opportunity_score=concept_data["opportunity_score"],
            brand_fit_score=brand_fit,
            tier=concept_data["tier"],
        )
        db.add(db_concept)

        concepts.append({
            "product_name": concept_data["product_name"],
            "category": concept_data.get("category", ""),
            "persona": concept_data.get("persona", ""),
            "target_consumer": concept_data.get("target_consumer", ""),
            "format": concept_data.get("format", ""),
            "ingredient_direction": concept_data.get("ingredient_direction", ""),
            "price_range": concept_data.get("price_range", ""),
            "positioning": concept_data.get("positioning", ""),
            "opportunity_score": concept_data["opportunity_score"],
            "brand_fit_score": brand_fit,
            "tier": concept_data["tier"],
            "market_size_estimate": concept_data.get("market_size_estimate", ""),
            "competition_intensity": concept_data.get("competition_intensity", 0),
            "cited_evidence": concept_data.get("cited_evidence", []),
            "executive_brief": refined_brief,
        })

    db.commit()
    return concepts


@router.get("/concepts")
def get_saved_concepts(db: Session = Depends(get_db)):
    """Return previously generated concepts from the DB without regenerating."""
    saved = db.query(models.ProductConcept).order_by(
        models.ProductConcept.opportunity_score.desc()
    ).all()
    return [
        {
            "product_name": c.product_name,
            "persona": c.persona,
            "format": c.format,
            "ingredient_direction": c.ingredient_direction,
            "price_range": c.price_range,
            "positioning": c.positioning,
            "opportunity_score": c.opportunity_score,
            "brand_fit_score": c.brand_fit_score,
            "tier": c.tier,
            "executive_brief": c.supporting_data,
            "category": "",
            "target_consumer": c.persona,
            "market_size_estimate": "",
            "competition_intensity": 0,
            "cited_evidence": [],
        }
        for c in saved
    ]


# ── Full pipeline: single button to run everything ────────────
@router.post("/run")
def run_full_analysis(db: Session = Depends(get_db)):
    """Run full analysis pipeline: complaints → opportunities → concepts."""
    review_count = db.query(models.ReviewRaw).count()
    if review_count == 0:
        raise HTTPException(status_code=400, detail="No review data found. Upload data first.")

    # Step 1: complaints (read-only, no DB writes)
    complaints = extract_complaint_signals(db)

    # Step 2: opportunities (writes to opportunity_clusters)
    opportunities = calculate_opportunity_scores(db)

    # Step 3: concepts
    trends = db.query(models.TrendRaw).all()
    competition = db.query(models.CompetitionProduct).all()
    db.query(models.ProductConcept).delete()

    raw_concepts = generate_concepts(opportunities, trends, competition)
    concepts = []
    for concept_data in raw_concepts:
        brand_fit = calculate_brand_fit(concept_data, concept_data)
        refined_brief = refine_with_ai(concept_data["executive_brief"])
        db.add(models.ProductConcept(
            product_name=concept_data["product_name"],
            persona=concept_data["persona"],
            format=concept_data["format"],
            ingredient_direction=concept_data["ingredient_direction"],
            price_range=concept_data["price_range"],
            positioning=concept_data["positioning"],
            supporting_data=refined_brief,
            opportunity_score=concept_data["opportunity_score"],
            brand_fit_score=brand_fit,
            tier=concept_data["tier"],
        ))
        concepts.append({
            "product_name": concept_data["product_name"],
            "category": concept_data.get("category", ""),
            "persona": concept_data.get("persona", ""),
            "target_consumer": concept_data.get("target_consumer", ""),
            "format": concept_data.get("format", ""),
            "ingredient_direction": concept_data.get("ingredient_direction", ""),
            "price_range": concept_data.get("price_range", ""),
            "positioning": concept_data.get("positioning", ""),
            "opportunity_score": concept_data["opportunity_score"],
            "brand_fit_score": brand_fit,
            "tier": concept_data["tier"],
            "market_size_estimate": concept_data.get("market_size_estimate", ""),
            "competition_intensity": concept_data.get("competition_intensity", 0),
            "cited_evidence": concept_data.get("cited_evidence", []),
            "executive_brief": refined_brief,
        })

    db.commit()
    return {
        "complaints": complaints,
        "opportunities": opportunities,
        "concepts": concepts,
    }