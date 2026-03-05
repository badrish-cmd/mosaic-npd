"""
Opportunity Scoring Engine — computes opportunity scores from review complaints,
Google Trends, Reddit signals, and competitive landscape. Returns scored
opportunities with market sizing and full citation chains.
"""

from sqlalchemy.orm import Session
from app import models
from app.services.review_analyzer import extract_complaint_signals


def normalize(value, max_value=100):
    return min((value / max_value) * 100, 100) if max_value else 0


def estimate_market_size(search_volume):
    """Rough addressable market estimate from monthly search volume."""
    if search_volume >= 50000:
        return "Large addressable market (50K+ searches/mo)"
    elif search_volume >= 30000:
        return "Significant market (30K+ searches/mo)"
    elif search_volume >= 15000:
        return "Growing market (15K+ searches/mo)"
    elif search_volume >= 5000:
        return "Moderate market (5K+ searches/mo)"
    else:
        return "Niche segment (<5K searches/mo)"


def calculate_competition_intensity(competition_count, prices=None):
    """Score competition intensity 0–100."""
    base = min(competition_count * 10, 80)
    # Price clustering penalty
    if prices and len(prices) >= 3:
        spread = max(prices) - min(prices) if prices else 0
        if spread < 200:
            base = min(base + 10, 100)  # tight pricing = intense
    return base


def calculate_opportunity_scores(db: Session):
    """
    Returns list of opportunity dicts with scores, tier, market estimates,
    and full citation chains for downstream concept generation.
    """
    complaints = extract_complaint_signals(db)
    trends = db.query(models.TrendRaw).all()
    reddit_posts = db.query(models.RedditRaw).all()
    competition = db.query(models.CompetitionProduct).all()

    competition_count = len(competition)
    comp_prices = [c.price for c in competition if c.price]
    comp_intensity = calculate_competition_intensity(competition_count, comp_prices)

    # Clear previous clusters
    db.query(models.OpportunityCluster).delete()

    results = []

    for theme, theme_data in complaints.items():
        complaint_score = theme_data["intensity"]

        # ── Trend matching ──────────────────────────────
        trend_growth = 0
        matched_search_volume = 0
        trend_citations = []
        theme_words = theme.split("_")

        for trend in trends:
            kw_lower = (trend.keyword or "").lower()
            if any(w in kw_lower for w in theme_words):
                trend_growth = max(trend_growth, trend.growth_percent or 0)
                matched_search_volume += (trend.search_volume or 0)
                trend_citations.append({
                    "keyword": trend.keyword,
                    "search_volume": trend.search_volume,
                    "growth_percent": trend.growth_percent,
                    "timeframe": trend.timeframe,
                })

        # ── Reddit signal ───────────────────────────────
        reddit_mentions = theme_data.get("reddit_count", 0)
        reddit_strength = min(reddit_mentions * 10, 100)

        # ── Demand index ────────────────────────────────
        demand_index = (
            normalize(complaint_score)
            + normalize(trend_growth)
            + normalize(reddit_strength)
        ) / 3

        # ── Supply pressure ─────────────────────────────
        if competition_count <= 3:
            supply_pressure = 20
        elif competition_count <= 6:
            supply_pressure = 35
        else:
            supply_pressure = 60

        gap_score = max(demand_index - (supply_pressure * 0.3), 0)

        # ── Confidence multiplier ───────────────────────
        confidence_multiplier = 1.0
        if complaint_score > 30 and trend_growth > 50:
            confidence_multiplier = 1.2
        elif complaint_score > 20:
            confidence_multiplier = 1.1

        final_score = round(gap_score * confidence_multiplier, 2)

        # ── Tier classification ─────────────────────────
        if final_score >= 65:
            tier = "Tier 1 – Launch Priority"
        elif final_score >= 40:
            tier = "Tier 2 – Strong Validation Candidate"
        elif final_score >= 20:
            tier = "Tier 3 – Explore"
        else:
            tier = "Tier 4 – Monitor"

        market_size = estimate_market_size(matched_search_volume)

        # ── Save cluster ────────────────────────────────
        cluster = models.OpportunityCluster(
            theme=theme,
            complaint_intensity=complaint_score,
            search_growth=trend_growth,
            reddit_mentions=reddit_mentions,
            competition_density=competition_count,
            opportunity_score=final_score,
            tier=tier,
        )
        db.add(cluster)

        results.append({
            "theme": theme,
            "theme_label": theme_data["label"],
            "theme_icon": theme_data["icon"],
            "complaint_intensity": complaint_score,
            "trend_growth": trend_growth,
            "search_volume": matched_search_volume,
            "reddit_mentions": reddit_mentions,
            "competition_density": competition_count,
            "competition_intensity": comp_intensity,
            "demand_index": round(demand_index, 2),
            "gap_score": round(gap_score, 2),
            "opportunity_score": final_score,
            "market_size_estimate": market_size,
            "tier": tier,
            # Citations for downstream concept generation
            "review_citations": theme_data.get("review_citations", []),
            "reddit_citations": theme_data.get("reddit_citations", []),
            "trend_citations": trend_citations,
        })

    db.commit()
    return results
