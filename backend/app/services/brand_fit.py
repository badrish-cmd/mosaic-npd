"""
Brand Fit Calculator — scores how well a product concept aligns with the
brand's target demographics, pricing strategy, and category focus.
"""


def calculate_brand_fit(concept, opportunity):
    """
    Score 0–100 indicating alignment between concept and brand profile.

    Evaluates:
      - Gender alignment (target persona)
      - Price band alignment (₹500–₹1000 sweet spot)
      - Opportunity strength weighting
      - Category alignment (haircare, grooming, wellness)
    """
    score = 0

    # ── Gender alignment (25 pts) ───────────────────────
    persona = (concept.get("persona", "") + " " + concept.get("target_consumer", "")).lower()
    if any(w in persona for w in ["male", "men", "his", "man"]):
        score += 25
    elif "unisex" in persona:
        score += 15

    # ── Price alignment (20 pts) ────────────────────────
    price_range = concept.get("price_range", "")
    # Brand sweet spot: ₹500–₹1,000
    if any(p in price_range for p in ["699", "799", "649", "749"]):
        score += 20
    elif any(p in price_range for p in ["599", "499", "549"]):
        score += 18
    elif any(p in price_range for p in ["999", "899"]):
        score += 15
    elif any(p in price_range for p in ["1,299", "1,199"]):
        score += 8

    # ── Opportunity strength (30 pts) ───────────────────
    opp_score = 0
    if isinstance(opportunity, dict):
        opp_score = opportunity.get("opportunity_score", 0)
    elif hasattr(opportunity, "opportunity_score"):
        opp_score = opportunity.opportunity_score
    else:
        try:
            opp_score = float(opportunity)
        except (TypeError, ValueError):
            pass

    if opp_score >= 60:
        score += 30
    elif opp_score >= 40:
        score += 25
    elif opp_score >= 20:
        score += 15
    else:
        score += 5

    # ── Category alignment (25 pts) ─────────────────────
    product_name = concept.get("product_name", "").lower()
    category = concept.get("category", "").lower()
    combined = product_name + " " + category
    ingredient = concept.get("ingredient_direction", "").lower()
    full_text = combined + " " + ingredient

    if any(k in full_text for k in ["hair", "scalp", "growth", "root", "strand", "follicle"]):
        score += 25
    elif any(k in full_text for k in ["skin", "groom", "beard", "face"]):
        score += 20
    elif any(k in full_text for k in ["wellness", "health", "vitamin", "supplement"]):
        score += 15
    else:
        score += 5

    return min(score, 100)
