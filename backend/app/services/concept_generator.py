"""
Product Concept Generator — converts opportunity signals into PM-ready
product concept briefs. Fully data-driven: derives all parameters
(formats, ingredients, pricing, positioning) from the actual uploaded
competition, trends, and complaint data. Works with any product category.
"""

from collections import Counter


# ── Market landscape helpers ─────────────────────────────────────────

def _detect_category(opportunities, competition):
    """Infer product category from uploaded data."""
    cats = Counter()
    for c in competition:
        cat = (c.category or "").strip()
        if cat:
            cats[cat] += 1
    if cats:
        return cats.most_common(1)[0][0]
    return "Consumer Product"


def _market_formats(competition):
    """Return Counter of existing formats in competitive landscape."""
    out = Counter()
    for c in competition:
        f = (c.format or "").strip()
        if f:
            out[f] += 1
    return out


def _market_ingredients(competition):
    """Return Counter of existing ingredients."""
    out = Counter()
    for c in competition:
        ing = (c.ingredient_focus or "").strip()
        if ing:
            out[ing] += 1
    return out


def _market_pricing(competition):
    """Analyse pricing from competition."""
    prices = sorted(c.price for c in competition if c.price and c.price > 0)
    if not prices:
        return {"min": 0, "max": 0, "avg": 0}
    return {
        "min": prices[0],
        "max": prices[-1],
        "avg": round(sum(prices) / len(prices), 2),
    }


def _market_brands(competition):
    """Return Counter of brands."""
    out = Counter()
    for c in competition:
        b = (c.brand or "").strip()
        if b:
            out[b] += 1
    return out


def _format_gap(existing_formats, idx):
    """Pick the least-represented format as a gap opportunity."""
    if not existing_formats:
        return "Standard format"
    by_rarity = sorted(existing_formats.items(), key=lambda x: x[1])
    return by_rarity[idx % len(by_rarity)][0]


def _ingredient_gap(existing_ingredients, idx):
    """Pick an underrepresented ingredient."""
    if not existing_ingredients:
        return "Innovative formulation"
    by_rarity = sorted(existing_ingredients.items(), key=lambda x: x[1])
    return by_rarity[idx % len(by_rarity)][0]


def _price_range(pricing, tier):
    """Generate price range from actual market data."""
    avg = pricing["avg"]
    if avg == 0:
        return "Market competitive"
    if tier in ("Tier 1 – Launch Priority",
                "Tier 2 – Strong Validation Candidate"):
        lo = round(avg * 0.9, -1)
        hi = round(avg * 1.3, -1)
    else:
        lo = round(avg * 0.7, -1)
        hi = round(avg * 1.0, -1)
    if lo == hi:
        hi = lo + 100
    return f"{lo:.0f}–{hi:.0f}"


def _market_size_est(search_volume, avg_price):
    """Rough addressable-market estimate from search demand."""
    if not search_volume:
        return "Emerging segment"
    annual = search_volume * max(avg_price, 100) * 0.01 * 12
    if annual >= 1_000_000_000:
        return f"~{annual / 1_000_000_000:.1f}B addressable"
    if annual >= 1_000_000:
        return f"~{annual / 1_000_000:.0f}M addressable"
    if annual >= 1_000:
        return f"~{annual / 1_000:.0f}K addressable"
    return "Niche segment"


# ── Evidence builder ─────────────────────────────────────────────────

def _build_evidence(opp):
    """Assemble formatted citation strings from opportunity data."""
    lines, seen = [], set()

    for c in opp.get("review_citations", [])[:3]:
        stars = f" ({c['rating']:.0f}★)" if c.get("rating") else ""
        line = f"Review: \"{c['text'][:120]}\" — {c.get('source', 'Upload')}{stars}"
        if line not in seen:
            seen.add(line)
            lines.append(line)

    for c in opp.get("reddit_citations", [])[:2]:
        up = f" ({c['upvotes']} upvotes)" if c.get("upvotes") else ""
        line = f"Reddit: \"{c.get('title', '')}\" — r/{c.get('subreddit', '')}{up}"
        if line not in seen:
            seen.add(line)
            lines.append(line)

    for c in opp.get("trend_citations", [])[:2]:
        vol = f"{c['search_volume']:,}" if c.get("search_volume") else "N/A"
        gr = f" +{c['growth_percent']:.0f}%" if c.get("growth_percent") else ""
        line = f"Trend: \"{c.get('keyword', '')}\" — {vol} monthly searches{gr}"
        if line not in seen:
            seen.add(line)
            lines.append(line)

    return lines


# ── Main entry point ─────────────────────────────────────────────────

def generate_concepts(opportunities, db_trends, db_competition):
    """
    Generate fully-formed product concepts from scored opportunities.
    All parameters are derived from actual uploaded data — no hardcoded
    category assumptions.
    """
    concepts = []

    # Analyse competitive landscape from uploaded data
    category = _detect_category(opportunities, db_competition)
    formats = _market_formats(db_competition)
    ingredients = _market_ingredients(db_competition)
    pricing = _market_pricing(db_competition)
    brands = _market_brands(db_competition)

    comp_count = len(db_competition)
    if comp_count <= 3:
        comp_ctx = f"Low competition ({comp_count} products) — early mover advantage"
    elif comp_count <= 8:
        comp_ctx = f"Moderate competition ({comp_count} products) — differentiation needed"
    else:
        comp_ctx = f"Crowded market ({comp_count} products) — strong differentiation required"

    top_formats_str = ", ".join(
        f for f, _ in formats.most_common(5)) if formats else "Limited data"
    top_brands_str = ", ".join(
        b for b, _ in brands.most_common(5)) if brands else "Limited data"

    idx = 0
    for opp in sorted(opportunities,
                      key=lambda x: x["opportunity_score"], reverse=True):
        if opp["tier"] == "Tier 4 – Monitor":
            continue

        theme = opp["theme"]
        theme_label = opp.get("theme_label",
                              theme.replace("_", " ").title())
        complaint = opp["complaint_intensity"]
        trend_growth = opp.get("trend_growth", 0)
        reddit_mentions = opp.get("reddit_mentions", 0)
        score = opp["opportunity_score"]
        search_vol = opp.get("search_volume", 0)
        market_est = _market_size_est(search_vol, pricing["avg"])

        # Derive concept attributes from real market data
        fmt = _format_gap(formats, idx)
        ing = _ingredient_gap(ingredients, idx)
        pr = _price_range(pricing, opp["tier"])

        # Product name from theme + category
        tw = theme_label.split()
        prefix = tw[0] if tw else "Pro"
        cat_word = category.split()[-1] if category else "Product"
        # Avoid duplication like "HairHaircare"
        if cat_word.lower().startswith(prefix.lower()) or prefix.lower().startswith(cat_word.lower()):
            cat_word = ""
        suffix = ["Pro", "Plus", "Max", "Elite", "Prime"][idx % 5]
        product_name = f"{prefix}{cat_word} {suffix}".replace("  ", " ")

        persona = (
            f"Consumers who experience {theme_label.lower()} with current "
            f"{category.lower()} products and actively seek better alternatives"
        )

        positioning = (
            f"Purpose-built {category.lower()} solution that directly "
            f"addresses {theme_label.lower()} — the #{idx + 1} unmet need "
            f"in this market"
        )

        evidence_lines = _build_evidence(opp)
        ev_block = ("\n".join(f"• {l}" for l in evidence_lines)
                    if evidence_lines
                    else "• Evidence from uploaded consumer datasets")

        if trend_growth >= 80:
            trend_ctx = "strong and accelerating demand"
        elif trend_growth >= 40:
            trend_ctx = "solid upward trend"
        elif trend_growth > 0:
            trend_ctx = "moderate growth pattern"
        else:
            trend_ctx = "stable demand"

        executive_brief = f"""\
MARKET INSIGHT
Consumer complaints about '{theme_label}' show {complaint:.1f}% intensity \
across analyzed reviews. Search trend growth: +{trend_growth:.0f}% \
({trend_ctx}). Reddit signals: {reddit_mentions} relevant discussions. \
{comp_ctx}. Estimated market: {market_est}.

TARGET CONSUMER
{persona}. This segment actively searches for solutions and relies on \
peer reviews and social proof.

PRODUCT CONCEPT
{product_name} — {fmt} format with {ing}.
Price positioning: {pr}.
Core promise: {positioning}.

COMPETITIVE ANALYSIS
{comp_ctx}. Existing formats: {top_formats_str}. \
Top competitors: {top_brands_str}. \
Key gap: No focused solution for '{theme_label}' complaint cluster.

CITED CONSUMER EVIDENCE
{ev_block}

WHY THIS WILL WORK
Complaint intensity ({complaint:.1f}%) + search demand (+{trend_growth:.0f}%) \
+ community signals ({reddit_mentions} Reddit mentions) create clear \
whitespace. Opportunity score: {score:.1f} ({opp['tier']}). This concept \
directly addresses stated consumer demand with a differentiated offering."""

        concepts.append({
            "product_name": product_name,
            "category": category,
            "persona": persona,
            "target_consumer": persona,
            "format": fmt,
            "ingredient_direction": ing,
            "price_range": pr,
            "positioning": positioning,
            "opportunity_score": score,
            "tier": opp["tier"],
            "market_size_estimate": market_est,
            "competition_intensity": min(comp_count * 10, 100),
            "cited_evidence": evidence_lines,
            "executive_brief": executive_brief,
        })

        idx += 1

    return concepts
