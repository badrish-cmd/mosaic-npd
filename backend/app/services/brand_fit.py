"""
Brand Fit Calculator — generic scoring based on data quality,
market opportunity strength, and evidence backing. Works with
any product category without hardcoded assumptions.
"""


def calculate_brand_fit(concept, opportunity):
    """
    Score 0–100 indicating concept viability and data confidence.

    Evaluates:
      - Opportunity strength (40 pts)
      - Evidence backing (30 pts)
      - Market data completeness (30 pts)
    """
    score = 0

    # ── Opportunity strength (40 pts) ───────────────────
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
        score += 40
    elif opp_score >= 40:
        score += 30
    elif opp_score >= 20:
        score += 20
    else:
        score += 10

    # ── Evidence backing (30 pts) ───────────────────────
    evidence = concept.get("cited_evidence", [])
    score += min(len(evidence) * 6, 30) if evidence else 5

    # ── Market data completeness (30 pts) ───────────────
    if concept.get("category"):
        score += 8
    if concept.get("format"):
        score += 7
    if concept.get("price_range") and concept["price_range"] != "Market competitive":
        score += 8
    if concept.get("market_size_estimate") and concept["market_size_estimate"] != "Emerging segment":
        score += 7

    return min(score, 100)
