"""
Review Analyzer — extracts complaint themes with cited evidence from reviews
and Reddit posts. Returns rich objects per theme including intensity score,
review and Reddit citations, enabling data-backed concept generation.

Works with any product category by combining predefined themes with
dynamic keyword extraction from actual review text.
"""

from collections import defaultdict, Counter
import re
from sqlalchemy.orm import Session
from app import models

# ── Predefined complaint theme keyword mapping ──────────────────────────
# Covers common product complaint patterns across many categories
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
                     "redness", "stinging", "allergy", "scalp irritation", "skin irritation"],
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
        "keywords": ["leak", "packaging", "broken", "spill", "pump", "cap", "bottle",
                     "damage", "damaged", "dented"],
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
    "quality_issue": {
        "keywords": ["poor quality", "cheap quality", "low quality", "defective",
                     "faulty", "broke", "stopped working", "malfunction", "doesnt work",
                     "doesn't work", "not working", "fell apart"],
        "label": "Quality / Durability Issues",
        "icon": "⚠️",
    },
    "delivery_issue": {
        "keywords": ["late delivery", "delayed", "wrong item", "wrong product",
                     "missing", "not delivered", "delivery"],
        "label": "Delivery / Fulfillment Issues",
        "icon": "🚚",
    },
    "fake_product": {
        "keywords": ["fake", "counterfeit", "duplicate", "not original", "not genuine",
                     "copy", "fraud"],
        "label": "Authenticity Concerns",
        "icon": "🔍",
    },
    "taste_flavor": {
        "keywords": ["taste", "flavor", "bitter", "bland", "awful taste", "bad taste",
                     "unpleasant taste"],
        "label": "Taste / Flavor Issues",
        "icon": "👅",
    },
    "comfort_fit": {
        "keywords": ["uncomfortable", "tight", "loose", "doesn't fit", "size issue",
                     "wrong size", "not comfortable", "hurts"],
        "label": "Comfort / Fit Issues",
        "icon": "👔",
    },
}

# Words to ignore in dynamic theme extraction
STOP_WORDS = {
    "the", "a", "an", "is", "it", "was", "has", "have", "had", "been", "be",
    "are", "were", "do", "does", "did", "will", "would", "could", "should",
    "this", "that", "these", "those", "with", "from", "for", "and", "but",
    "or", "not", "no", "so", "very", "too", "just", "only", "also", "more",
    "much", "than", "then", "when", "what", "which", "who", "how", "all",
    "each", "every", "both", "few", "most", "some", "any", "other", "into",
    "over", "after", "before", "about", "up", "out", "off", "on", "in", "at",
    "to", "of", "by", "my", "your", "its", "our", "their", "me", "him", "her",
    "us", "them", "i", "you", "he", "she", "we", "they", "one", "two", "can",
    "get", "got", "make", "like", "use", "used", "using", "even", "good",
    "great", "nice", "best", "love", "product", "buy", "bought", "really",
    "well", "still", "need", "try", "tried", "first", "back", "time", "day",
    "days", "month", "months", "made", "way", "going", "am", "many", "lot",
    "new", "old", "long", "now", "because", "since", "after", "if",
}


def _extract_dynamic_themes(reviews, reddit_posts, existing_themes_count):
    """
    Extract frequent complaint-related bigrams from reviews that weren't
    already captured by predefined themes. Only triggers when predefined
    themes captured few results.
    """
    if existing_themes_count >= 3:
        return {}  # predefined themes are working well enough

    # Negative sentiment indicator words
    negative_indicators = {
        "bad", "poor", "worst", "terrible", "horrible", "awful", "hate",
        "disappointed", "disappointing", "problem", "issue", "complaint",
        "waste", "useless", "broken", "fail", "failed", "wrong", "worse",
        "annoying", "frustrating", "regret", "return", "refund",
    }

    all_texts = []
    for r in reviews:
        if r.review_text and r.rating is not None and r.rating <= 3:
            all_texts.append(r.review_text.lower())
    for p in reddit_posts:
        combined = ((p.title or "") + " " + (p.post_text or "")).lower()
        if combined.strip():
            all_texts.append(combined)

    if not all_texts:
        return {}

    # Count bigrams from negative reviews
    bigram_counter = Counter()
    for text in all_texts:
        words = re.findall(r'[a-z]+', text)
        words = [w for w in words if w not in STOP_WORDS and len(w) > 2]
        for i in range(len(words) - 1):
            bigram = f"{words[i]} {words[i+1]}"
            bigram_counter[bigram] += 1

    # Filter to bigrams that co-occur with negative sentiment
    dynamic_themes = {}
    total_reviews = len(reviews) if reviews else 1

    for bigram, count in bigram_counter.most_common(10):
        if count < 3:
            break
        words_in_bigram = set(bigram.split())
        if words_in_bigram & negative_indicators:
            continue  # skip pure negative words, want the actual topic

        # Check if this bigram appears in negative-sentiment texts
        negative_count = sum(
            1 for text in all_texts if bigram in text
        )
        if negative_count >= 3:
            theme_key = bigram.replace(" ", "_")
            intensity = round((negative_count / total_reviews) * 100, 2) if total_reviews else 0
            if intensity > 1:
                dynamic_themes[theme_key] = {
                    "intensity": intensity,
                    "label": bigram.title(),
                    "icon": "📊",
                    "review_count": negative_count,
                    "reddit_count": 0,
                    "review_citations": [],
                    "reddit_citations": [],
                }

    return dynamic_themes


def extract_complaint_signals(db: Session):
    """
    Extract complaint themes from reviews and Reddit posts.
    Combines predefined theme matching with dynamic extraction.

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

    # ── Dynamic themes for unmatched data ──────────────
    dynamic = _extract_dynamic_themes(reviews, reddit_posts, len(results))
    for key, val in dynamic.items():
        if key not in results:
            results[key] = val

    return results
