from app.services.brand_fit import calculate_brand_fit
from fastapi import APIRouter, Depends
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


@router.get("/complaints")
def get_complaint_analysis(db: Session = Depends(get_db)):
    return extract_complaint_signals(db)

@router.get("/opportunities")
def get_opportunities(db: Session = Depends(get_db)):
    return calculate_opportunity_scores(db)

@router.get("/concepts")
def get_concepts(db: Session = Depends(get_db)):
    # Get opportunity analysis (includes cited evidence chains)
    opportunities = calculate_opportunity_scores(db)

    # Fetch raw data for concept generation context
    trends = db.query(models.TrendRaw).all()
    competition = db.query(models.CompetitionProduct).all()

    # Clear previous concepts
    db.query(models.ProductConcept).delete()

    # Generate multi-concept output with full citations
    raw_concepts = generate_concepts(opportunities, trends, competition)

    concepts = []
    for concept_data in raw_concepts:
        # Calculate brand fit
        brand_fit = calculate_brand_fit(concept_data, concept_data)

        # Refine brief via AI if API key available
        refined_brief = refine_with_ai(concept_data["executive_brief"])

        # Save to DB
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