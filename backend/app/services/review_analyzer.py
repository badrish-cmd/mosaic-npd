"""
Review Analyzer — extracts complaint themes with cited evidence from reviews
and Reddit posts. Returns rich objects per theme including intensity score,
review and Reddit citations, enabling data-backed concept generation.
"""

from collections import defaultdict
from sqlalchemy.orm import Session
from app import models

# ── Complaint theme keyword mapping ──────────────────────────────────────
# Covers haircare, skincare, wellness, and health product categories
COMPLAINT_THEMES = {
    "greasy_texture": {
        "keywords": ["greasy", "sticky", "oily", "heavy", "residue", "thick", "messy"],
        "label": "Greasy / Heavy Texture",
        "icon": "💧",
    },
    "slow_results": {
        "keywords": ["slow", "takes too long", "no results", "didn't work", "months",
                     "no change", "useless", "ineffective", "no improvement", "waste"],
        "label": "Slow / No Visible Results",
        "icon": "⏳",
    },
    "irritation": {
        "keywords": ["itch", "irritation", "burn", "rash", "sensitive", "reaction",
                     "redness", "stinging", "allergy", "scalp irritation"],
        "label": "Skin / Scalp Irritation",
        "icon": "🔥",
    },
    "price_concern": {
        "keywords": ["expensive", "costly", "price", "overpriced", "not worth",
                     "waste of money", "too much", "cheaper"],
        "label": "Price / Value Concern",
        "icon": "💰",
    },
    "packaging_issue": {
        "keywords": ["leak", "packaging", "broken", "spill", "pump", "cap", "bottle"],
        "label": "Packaging Problems",
        "icon": "📦",
    },
    "fragrance_issue": {
        "keywords": ["smell", "fragrance", "scent", "chemical smell", "odor", "stink"],
        "label": "Unpleasant Fragrance",
        "icon": "👃",
    },
    "hair_fall": {
        "keywords": ["hair fall", "hair loss", "shedding", "thinning", "bald",
                     "losing hair", "receding"],
        "label": "Hair Fall / Thinning",
        "icon": "💇",
    },
    "dryness": {
        "keywords": ["dry", "flaky", "dandruff", "parched", "rough", "brittle"],
        "label": "Dryness / Flaking",
        "icon": "🏜️",
    },
    "ingredient_safety": {
        "keywords": ["chemical", "artificial", "paraben", "sulfate", "harmful",
                     "toxic", "side effect"],
        "label": "Ingredient Safety Concerns",
        "icon": "⚗️",
    },
    "size_quantity": {
        "keywords": ["small", "quantity", "less product", "tiny", "runs out",
                     "finished quickly"],
        "label": "Size / Quantity Issues",
        "icon": "📏",
    },
}


def extract_complaint_signals(db: Session):
    """
    Extract complaint themes from reviews and Reddit posts.

    Returns dict: theme_key -> {
        intensity, label, icon,
        review_count, reddit_count,
        review_citations, reddit_citations
    }
    """
    reviews = db.query(models.ReviewRaw).all()
    reddit_posts = db.query(models.RedditRaw).all()

    total_reviews = len(reviews)
    if total_reviews == 0:
        return {}

    results = {}

    for theme_key, config in COMPLAINT_THEMES.items():
        keywords = config["keywords"]
        review_citations = []
        reddit_citations = []

        # ── Scan reviews ───────────────────────────────
        for review in reviews:
            text = (review.review_text or "").lower()
            for kw in keywords:
                if kw in text:
                    review_citations.append({
                        "text": (review.review_text or "")[:200].strip(),
                        "product": review.product_name,
                        "brand": review.brand,
                        "rating": review.rating,
                        "source": review.source,
                    })
                    break  # count each review once per theme

        # ── Scan Reddit ────────────────────────────────
        for post in reddit_posts:
            combined = ((post.title or "") + " " + (post.post_text or "")).lower()
            for kw in keywords:
                if kw in combined:
                    reddit_citations.append({
                        "title": post.title,
                        "subreddit": post.subreddit,
                        "upvotes": post.upvotes,
                        "text": (post.post_text or "")[:200].strip(),
                    })
                    break

        review_count = len(review_citations)
        reddit_count = len(reddit_citations)

        if review_count > 0 or reddit_count > 0:
            intensity = round((review_count / total_reviews) * 100, 2)
            results[theme_key] = {
                "intensity": intensity,
                "label": config["label"],
                "icon": config["icon"],
                "review_count": review_count,
                "reddit_count": reddit_count,
                "review_citations": review_citations[:5],
                "reddit_citations": reddit_citations[:5],
            }

    return results
