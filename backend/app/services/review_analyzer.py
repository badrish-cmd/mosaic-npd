"""
Review Analyzer — extracts complaint themes from reviews and Reddit posts
using data-driven phrase extraction. Works with ANY product category by
mining actual review text rather than matching hardcoded keywords.

Returns rich objects per theme including intensity score, review and Reddit
citations, enabling data-backed concept generation.
"""

from collections import defaultdict, Counter
import re
from sqlalchemy.orm import Session
from app import models

# ── Stop words — common English words to filter from phrase extraction ──
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
    "new", "old", "long", "now", "because", "since", "if", "then", "okay",
    "thing", "things", "came", "come", "say", "said", "know", "think",
    "thought", "look", "looking", "want", "wanted", "give", "gave", "take",
    "took", "tell", "told", "see", "saw", "seem", "seems", "keep", "start",
    "started", "work", "works", "worked", "working", "put", "end", "ended",
    "last", "went", "done", "doing", "being", "getting", "goes",
    "star", "stars", "review", "reviews", "rating", "rate", "rated",
    "amazon", "flipkart", "online", "ordered", "order", "received",
    "feels", "feel", "felt", "makes", "making", "having", "applying",
    "applied", "apply", "caused", "causes", "cause", "result", "results",
    "actually", "really", "little", "bit", "right", "maybe", "anything",
    "everything", "something", "nothing", "already", "always", "never",
    "often", "usually", "sometimes", "kind", "sort", "quite", "rather",
    "however", "although", "though", "enough", "almost", "around",
    "during", "between", "through", "against", "without", "upon",
    "while", "until", "within", "along", "across", "toward", "towards",
    "becomes", "become", "became", "remain", "remained", "remains",
    "given", "shown", "based", "supposed", "expected", "left",
    "visible", "showed", "show", "showing", "shows",
    "takes", "took", "taken", "taking",
    "hours", "hour", "minutes", "minute", "weeks", "week",
    "leaves", "leave", "leaving", "half", "full", "whole",
    "formula", "formulation", "basically", "especially",
    "completely", "absolutely", "definitely", "probably", "simply",
    "literally", "highly", "extremely", "totally",
    "barely", "finished", "daily", "monthly", "weekly", "overnight",
    "noticed", "notice", "changed", "change", "changes", "compared",
    "helped", "help", "helps", "worked", "stopped", "continues",
}

# ── Icon mapping for common complaint words (cosmetic enhancement) ──────
_ICON_MAP = {
    "price": "💰", "expensive": "💰", "cost": "💰", "money": "💰",
    "cheap": "💰", "overpriced": "💰", "worth": "💰",
    "delivery": "🚚", "shipping": "🚚", "late": "🚚", "delayed": "🚚",
    "quality": "⚠️", "broken": "⚠️", "defective": "⚠️", "damage": "⚠️",
    "smell": "👃", "scent": "👃", "odor": "👃", "fragrance": "👃",
    "size": "📏", "small": "📏", "tiny": "📏", "quantity": "📏",
    "dry": "🏜️", "dryness": "🏜️", "flaky": "🏜️",
    "greasy": "💧", "oily": "💧", "sticky": "💧",
    "irritation": "🔥", "itch": "🔥", "burn": "🔥", "rash": "🔥",
    "hair": "💇", "scalp": "💇", "fall": "💇", "thinning": "💇",
    "taste": "👅", "flavor": "👅", "bitter": "👅",
    "battery": "🔋", "charge": "🔋", "power": "🔋",
    "screen": "📱", "display": "📱",
    "noise": "🔊", "loud": "🔊", "sound": "🔊",
    "heat": "🌡️", "hot": "🌡️", "overheat": "🌡️",
    "fit": "👔", "comfortable": "👔", "tight": "👔", "loose": "👔",
    "fake": "🔍", "counterfeit": "🔍", "original": "🔍",
    "color": "🎨", "colour": "🎨", "fade": "🎨",
    "leak": "📦", "packaging": "📦", "spill": "📦", "cap": "📦",
    "slow": "⏳", "results": "⏳", "effect": "⏳",
    "chemical": "⚗️", "ingredient": "⚗️", "paraben": "⚗️",
    "software": "💻", "app": "💻", "bug": "💻", "crash": "💻",
    "camera": "📷", "photo": "📷",
    "material": "🧵", "fabric": "🧵",
    "food": "🍽️", "stale": "🍽️", "expired": "🍽️",
    "service": "📞", "support": "📞", "customer": "📞",
}


def _get_icon(phrase):
    """Pick a relevant icon for a complaint phrase."""
    for word in phrase.lower().split():
        if word in _ICON_MAP:
            return _ICON_MAP[word]
    return "📊"


def _group_phrases(top_phrases):
    """Group overlapping phrases into distinct complaint themes."""
    groups = []
    used = set()

    for phrase, count in top_phrases:
        if phrase in used:
            continue

        group_phrases = [(phrase, count)]
        phrase_words = set(phrase.split())
        used.add(phrase)

        for other, other_count in top_phrases:
            if other in used:
                continue
            other_words = set(other.split())
            shared = phrase_words & other_words
            if shared and any(len(w) > 3 for w in shared):
                group_phrases.append((other, other_count))
                used.add(other)

        group_phrases.sort(key=lambda x: x[1], reverse=True)
        groups.append({
            "representative": group_phrases[0][0],
            "total_count": group_phrases[0][1],
            "all_words": set(w for p, _ in group_phrases for w in p.split()),
        })

    groups.sort(key=lambda g: g["total_count"], reverse=True)
    return groups


def extract_complaint_signals(db: Session):
    """
    Extract complaint themes by mining actual review text.
    Works with ANY product category — no hardcoded keywords.

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

    # ── Phase 1: Identify complaint reviews ─────────────────────────
    negative_reviews = [r for r in reviews
                        if r.rating is not None and r.rating <= 3]
    if len(negative_reviews) < max(3, total_reviews * 0.1):
        negative_reviews = reviews  # use all if too few have low ratings

    # ── Phase 2: Extract frequent n-grams ───────────────────────────
    phrase_counter = Counter()
    phrase_citations = defaultdict(list)
    # Also track important single words for small-dataset fallback
    word_counter = Counter()
    word_citations = defaultdict(list)

    for review in negative_reviews:
        text = (review.review_text or "").lower()
        words = [w for w in re.findall(r'[a-z]+', text)
                 if w not in STOP_WORDS and len(w) > 2]

        citation = {
            "text": (review.review_text or "")[:200].strip(),
            "product": review.product_name,
            "brand": review.brand,
            "rating": review.rating,
            "source": review.source,
        }

        seen = set()
        for n in [2, 3]:
            for i in range(len(words) - n + 1):
                phrase = " ".join(words[i:i + n])
                if phrase not in seen:
                    seen.add(phrase)
                    phrase_counter[phrase] += 1
                    if len(phrase_citations[phrase]) < 5:
                        phrase_citations[phrase].append(citation)

        # Track single important words
        seen_words = set()
        for w in words:
            if w not in seen_words and len(w) > 3:
                seen_words.add(w)
                word_counter[w] += 1
                if len(word_citations[w]) < 5:
                    word_citations[w].append(citation)

    # ── Phase 3: Filter + group into themes ─────────────────────────
    min_count = max(2, int(total_reviews * 0.01))
    top_phrases = [(p, c) for p, c in phrase_counter.most_common(200)
                   if c >= min_count]

    groups = _group_phrases(top_phrases)

    # ── Phase 3b: Fallback — if too few n-gram themes, add top words ─
    if len(groups) < 3:
        used_words = set()
        for g in groups:
            used_words |= g["all_words"]
        for word, count in word_counter.most_common(30):
            if word in used_words or count < 2:
                continue
            groups.append({
                "representative": word,
                "total_count": count,
                "all_words": {word},
            })
            used_words.add(word)
            if len(groups) >= 10:
                break
        groups.sort(key=lambda g: g["total_count"], reverse=True)

    # ── Phase 4: Build final results ────────────────────────────────
    results = {}

    for group in groups[:15]:
        rep = group["representative"]
        count = group["total_count"]
        intensity = round((count / total_reviews) * 100, 2)

        if intensity < 0.5:
            continue

        theme_key = rep.replace(" ", "_")
        label = rep.title()
        icon = _get_icon(rep)
        citations = phrase_citations.get(rep, []) or word_citations.get(rep, [])

        # ── Scan Reddit for matching words ──────────────────────────
        theme_words = {w for w in group["all_words"] if len(w) > 3}
        reddit_citations = []
        for post in reddit_posts:
            combined = ((post.title or "") + " " + (post.post_text or "")).lower()
            if any(w in combined for w in theme_words):
                reddit_citations.append({
                    "title": post.title,
                    "subreddit": post.subreddit,
                    "upvotes": post.upvotes,
                    "text": (post.post_text or "")[:200].strip(),
                })
                if len(reddit_citations) >= 5:
                    break

        results[theme_key] = {
            "intensity": intensity,
            "label": label,
            "icon": icon,
            "review_count": count,
            "reddit_count": len(reddit_citations),
            "review_citations": citations[:5],
            "reddit_citations": reddit_citations[:5],
        }

    return results
