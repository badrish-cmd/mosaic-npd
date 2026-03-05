"""
Product Concept Generator — converts opportunity signals into fully-formed,
PM-ready product concept briefs. Each concept includes product name, target
consumer profile, formulation direction, price point, format, competitive
positioning, and cited consumer evidence.
"""

from collections import Counter

# ── Ingredient knowledge base ────────────────────────────────────────
INGREDIENT_POOL = {
    "rosemary":      {"name": "Rosemary Oil",         "benefit": "DHT blocking & scalp stimulation"},
    "redensyl":      {"name": "Redensyl Complex",     "benefit": "Hair follicle stem cell activation"},
    "biotin":        {"name": "Biotin (Vitamin B7)",   "benefit": "Keratin infrastructure support"},
    "caffeine":      {"name": "Caffeine Complex",      "benefit": "Follicle stimulation & blood flow"},
    "onion":         {"name": "Onion Extract",         "benefit": "Sulfur-rich scalp nourishment"},
    "centella":      {"name": "Centella Asiatica",     "benefit": "Anti-inflammatory scalp healing"},
    "peptide":       {"name": "Copper Peptide Complex","benefit": "Follicle regeneration & collagen"},
    "niacinamide":   {"name": "Niacinamide (B3)",      "benefit": "Scalp barrier & sebum regulation"},
    "saw_palmetto":  {"name": "Saw Palmetto Extract",  "benefit": "Natural DHT inhibitor"},
    "keratin":       {"name": "Hydrolyzed Keratin",    "benefit": "Structural protein repair"},
    "argan":         {"name": "Argan Oil",             "benefit": "Deep moisture & shine restoration"},
    "tea_tree":      {"name": "Tea Tree Oil",          "benefit": "Antimicrobial scalp health"},
}

# ── Format innovation options ────────────────────────────────────────
FORMAT_OPTIONS = [
    {"format": "Fast-absorbing spray serum",        "appeal": "convenience, non-greasy daily use",      "price_band": "₹699–₹899"},
    {"format": "High-potency concentrated serum",   "appeal": "clinical efficacy in small doses",       "price_band": "₹799–₹999"},
    {"format": "Derma-roller + serum combo kit",    "appeal": "enhanced absorption, salon-at-home",     "price_band": "₹999–₹1,299"},
    {"format": "Caffeine-infused scalp tonic",      "appeal": "daily refresh, lightweight texture",     "price_band": "₹449–₹649"},
    {"format": "Overnight repair hair mask",        "appeal": "intensive treatment, passive routine",   "price_band": "₹599–₹799"},
    {"format": "Dissolvable oral strip supplement",  "appeal": "no-pill convenience, fast absorption",   "price_band": "₹399–₹599"},
    {"format": "Biotin gummy supplement",           "appeal": "enjoyable daily habit, compliance",      "price_band": "₹499–₹699"},
    {"format": "Precision pump serum",              "appeal": "mess-free, measured dosing",             "price_band": "₹649–₹849"},
    {"format": "2-in-1 shampoo + treatment",        "appeal": "routine simplification",                "price_band": "₹549–₹749"},
    {"format": "Cooling scalp gel",                 "appeal": "soothing sensation, immediate relief",  "price_band": "₹499–₹699"},
]

# ── Theme → concept direction mapping ────────────────────────────────
THEME_DIRECTIONS = {
    "greasy_texture": {
        "angle": "lightweight, non-greasy formulation",
        "personas": [
            "Urban professionals aged 22–35 seeking daily-use hair solutions without oily residue",
            "Active lifestyle males who need gym-friendly, fast-absorbing grooming products",
        ],
        "names": ["ScalpLite", "AeroGrowth", "LightStrand", "ClearRoot"],
        "positioning": "First truly non-greasy growth solution — lightweight performance without compromise",
        "preferred_formats": [0, 3, 7],  # spray, tonic, pump
    },
    "slow_results": {
        "angle": "accelerated, visible results within 4–6 weeks",
        "personas": [
            "Impatient consumers aged 25–40 seeking visible hair regrowth within 30 days",
            "First-time hair treatment users wanting quick, measurable proof of efficacy",
        ],
        "names": ["RapidRoot", "FastTrack Growth", "QuickStrand", "SpeedGrow"],
        "positioning": "Clinically accelerated regrowth — visible results in 30 days or your money back",
        "preferred_formats": [1, 2, 3],  # concentrated, combo kit, tonic
    },
    "irritation": {
        "angle": "gentle, sensitive-scalp-safe formulation with zero irritation",
        "personas": [
            "Sensitive-scalp consumers who've experienced adverse reactions from harsh products",
            "Users with dermatological conditions (eczema, psoriasis) seeking safe regrowth",
        ],
        "names": ["ScalpCalm", "GentleGrow", "SoothRoot", "DermaStrand"],
        "positioning": "Dermatologically balanced — effective regrowth without scalp discomfort",
        "preferred_formats": [9, 4, 7],  # cooling gel, mask, pump
    },
    "price_concern": {
        "angle": "value-optimized pricing with premium efficacy",
        "personas": [
            "Value-conscious males aged 20–30 on limited grooming budgets",
            "Students and young professionals seeking proven results under ₹500",
        ],
        "names": ["CoreGrowth", "EssenStrand", "ValuePro Growth", "SmartGrow"],
        "positioning": "Premium-grade efficacy at the most accessible price point in India",
        "preferred_formats": [3, 8, 5],  # tonic, 2in1, strips
    },
    "packaging_issue": {
        "angle": "innovative, leak-proof, travel-ready packaging",
        "personas": [
            "Frequent travellers who need reliable, mess-free grooming products",
            "Premium-experience seekers who value thoughtful product design",
        ],
        "names": ["PrecisionPro", "SecureScalp", "SmartDose", "NeatGrow"],
        "positioning": "Precision-engineered delivery system — zero waste, zero mess, total control",
        "preferred_formats": [7, 2, 0],  # pump, combo kit, spray
    },
    "fragrance_issue": {
        "angle": "fragrance-free or naturally scented formulation",
        "personas": [
            "Scent-sensitive consumers who avoid artificial chemical fragrances",
            "Minimalist grooming enthusiasts preferring clean, unscented products",
        ],
        "names": ["PureGrow", "NakedStrand", "CleanRoot", "ZeroScent Growth"],
        "positioning": "Zero artificial fragrance — pure active performance, nothing else",
        "preferred_formats": [0, 7, 1],  # spray, pump, concentrated
    },
    "hair_fall": {
        "angle": "aggressive anti-fall and density-building regimen",
        "personas": [
            "Men aged 25–45 experiencing noticeable hair thinning and density loss",
            "Consumers who've tried 2+ products without success, seeking clinical strength",
        ],
        "names": ["DensityMax", "FallGuard Pro", "ThickStrand", "ReGrowth+"],
        "positioning": "Clinically formulated density restoration — addresses root cause of hair fall",
        "preferred_formats": [1, 2, 4],  # concentrated, combo kit, mask
    },
    "dryness": {
        "angle": "deep hydration and long-lasting moisture restoration",
        "personas": [
            "Consumers with dry, flaky scalps in India's varied climatic conditions",
            "Users seeking Ayurveda-inspired deep nourishment without heaviness",
        ],
        "names": ["HydraScalp", "MoistureRoot", "AquaStrand", "DeepDew"],
        "positioning": "48-hour adaptive hydration that transforms dry, flaky scalps",
        "preferred_formats": [4, 9, 8],  # mask, gel, 2in1
    },
    "ingredient_safety": {
        "angle": "clean-label, transparent, plant-based formulation",
        "personas": [
            "Health-conscious consumers who scrutinize every ingredient on the label",
            "Ayurveda and natural product enthusiasts demanding toxin-free solutions",
        ],
        "names": ["PureRoot", "CleanGrowth", "PlantStrand", "NaturaPro"],
        "positioning": "100% clean-label — zero parabens, sulfates, or synthetic actives",
        "preferred_formats": [3, 8, 0],  # tonic, 2in1, spray
    },
    "size_quantity": {
        "angle": "generous quantity with maximum value per rupee",
        "personas": [
            "Regular users frustrated by small bottles that deplete within 2 weeks",
            "Budget-aware families seeking bulk-value grooming products",
        ],
        "names": ["MaxSupply", "MegaGrow", "LastLong Pro", "ValuePack Growth"],
        "positioning": "3-month supply in one bottle — India's best ml-per-rupee growth solution",
        "preferred_formats": [8, 3, 7],  # 2in1, tonic, pump
    },
}


# ── Helper functions ─────────────────────────────────────────────────

def _get_direction_for_theme(theme, theme_label):
    """Get concept direction for a theme, with generic fallback for unknown themes."""
    if theme in THEME_DIRECTIONS:
        return THEME_DIRECTIONS[theme]

    # Generic fallback for dynamically detected themes
    return {
        "angle": f"addressing {theme_label.lower()} with improved formulation",
        "personas": [
            f"Consumers actively seeking solutions for {theme_label.lower()}",
            f"Users who've experienced {theme_label.lower()} with current products",
        ],
        "names": [
            theme_label.split()[0] + "Pro",
            theme_label.split()[0] + "Fix",
            "Solution+" + theme_label.split()[0],
            "Advanced" + theme_label.split()[0],
        ],
        "positioning": f"Purpose-built solution that directly addresses {theme_label.lower()} — backed by consumer evidence",
        "preferred_formats": [0, 1, 7],
    }


def _detect_category_from_data(opportunities, db_competition):
    """Infer product category from actual uploaded data."""
    categories = Counter()
    for c in db_competition:
        cat = (c.category or "").strip()
        if cat:
            categories[cat] += 1
    if categories:
        return categories.most_common(1)[0][0]
    # Infer from theme labels
    for opp in opportunities:
        label = opp.get("theme_label", "").lower()
        if any(w in label for w in ["hair", "scalp", "shampoo"]):
            return "Haircare"
        if any(w in label for w in ["skin", "face", "acne"]):
            return "Skincare"
    return "Consumer Product"


def _find_format_gap(competition, preferred_indices=None):
    """Identify underserved product formats from competitive landscape."""
    existing_formats = {}
    for c in competition:
        fmt = (c.format or "").lower()
        existing_formats[fmt] = existing_formats.get(fmt, 0) + 1

    # Try preferred formats first
    if preferred_indices:
        for idx in preferred_indices:
            if idx < len(FORMAT_OPTIONS):
                opt = FORMAT_OPTIONS[idx]
                opt_words = opt["format"].lower().split()
                if not any(any(w in k for w in opt_words[:2]) for k in existing_formats):
                    return opt

    # Fallback: any format not well-represented
    for opt in FORMAT_OPTIONS:
        opt_words = opt["format"].lower().split()
        if not any(any(w in k for w in opt_words[:2]) for k in existing_formats):
            return opt

    return FORMAT_OPTIONS[0]


def _match_trending_ingredients(trends, competition):
    """Find trending ingredients, marking those already saturated in competition."""
    trending = []
    seen_keys = set()  # deduplicate by ingredient key
    existing = set()
    for c in competition:
        if c.ingredient_focus:
            existing.add(c.ingredient_focus.lower())

    for trend in trends:
        kw = (trend.keyword or "").lower()
        for ing_key, ing_data in INGREDIENT_POOL.items():
            if ing_key in kw and ing_key not in seen_keys:
                seen_keys.add(ing_key)
                saturated = any(ing_key in ei for ei in existing)
                trending.append({
                    **ing_data,
                    "key": ing_key,
                    "search_volume": trend.search_volume,
                    "growth": trend.growth_percent,
                    "saturated": saturated,
                })

    # Prefer unsaturated + high growth
    trending.sort(key=lambda x: (not x["saturated"], x.get("growth", 0)), reverse=True)
    return trending


def _build_cited_evidence(opp):
    """Assemble list of formatted citation strings from opportunity data."""
    lines = []
    seen = set()  # deduplicate identical citations

    for cite in opp.get("review_citations", [])[:3]:
        stars = f"{cite['rating']:.0f}\u2605" if cite.get("rating") else ""
        line = f"Review: \"{cite['text'][:120]}\" \u2014 {cite['source']} {stars}"
        if line not in seen:
            seen.add(line)
            lines.append(line)

    for cite in opp.get("reddit_citations", [])[:2]:
        upvotes = f"({cite['upvotes']} upvotes)" if cite.get("upvotes") else ""
        line = f"Reddit: \"{cite['title']}\" \u2014 r/{cite['subreddit']} {upvotes}"
        if line not in seen:
            seen.add(line)
            lines.append(line)

    for cite in opp.get("trend_citations", [])[:2]:
        vol = f"{cite['search_volume']:,}" if cite.get("search_volume") else "N/A"
        growth = f"+{cite['growth_percent']:.0f}%" if cite.get("growth_percent") else ""
        line = f"Trend: \"{cite['keyword']}\" \u2014 {vol} monthly searches {growth}"
        if line not in seen:
            seen.add(line)
            lines.append(line)

    return lines


# ── Main entry point ─────────────────────────────────────────────────

def generate_concepts(opportunities, db_trends, db_competition):
    """
    Generate fully-formed product concepts from scored opportunities.

    Each concept is a complete PM-ready brief with:
      - Product name and category
      - Target consumer profile
      - Format, formulation direction, and price point
      - Competitive positioning
      - Cited consumer evidence (reviews, Reddit, trends)
      - Structured executive brief

    Returns list of concept dicts.
    """
    concepts = []

    # Analyze competitive landscape
    prices = [c.price for c in db_competition if c.price]
    avg_price = sum(prices) / len(prices) if prices else 700
    trending_ingredients = _match_trending_ingredients(db_trends, db_competition)
    detected_category = _detect_category_from_data(opportunities, db_competition)

    concept_idx = 0

    for opp in sorted(opportunities, key=lambda x: x["opportunity_score"], reverse=True):
        if opp["tier"] == "Tier 4 – Monitor":
            continue

        theme = opp["theme"]
        theme_label = opp.get("theme_label", theme.replace("_", " ").title())
        direction = _get_direction_for_theme(theme, theme_label)

        # ── Select ingredients ──────────────────────────
        if trending_ingredients and len(trending_ingredients) >= 2:
            # Rotate start by 1 per concept to diversify ingredient combos
            start = concept_idx % len(trending_ingredients)
            ing_a = trending_ingredients[start]
            ing_b = trending_ingredients[(start + 1) % len(trending_ingredients)]
            selected = [ing_a, ing_b]
        elif trending_ingredients:
            selected = trending_ingredients[:2]
        else:
            selected = [
                {"name": "Redensyl Complex", "benefit": "Hair follicle stem cell activation"},
                {"name": "Rosemary Oil",     "benefit": "DHT blocking & scalp stimulation"},
            ]

        ingredient_str = " + ".join(i["name"] for i in selected[:2])
        ingredient_detail = "; ".join(
            f"{i['name']} ({i['benefit']})" for i in selected[:2]
        )

        # ── Select format ───────────────────────────────
        preferred = direction.get("preferred_formats")
        fmt = _find_format_gap(db_competition, preferred)

        # ── Build product name ──────────────────────────
        name_base = direction["names"][concept_idx % len(direction["names"])]
        # Append differentiating format word
        fmt_word = fmt["format"].split()[0]
        product_name = f"{name_base} {fmt_word}"

        # ── Build persona ───────────────────────────────
        persona = direction["personas"][concept_idx % len(direction["personas"])]

        # ── Build cited evidence ────────────────────────
        evidence_lines = _build_cited_evidence(opp)

        # ── Competition context ─────────────────────────
        comp_count = opp.get("competition_density", 0)
        comp_intensity = opp.get("competition_intensity", 0)
        if comp_count <= 3:
            comp_context = (f"Low competitive intensity ({comp_count} products) — "
                           "significant early mover advantage available")
        elif comp_count <= 6:
            comp_context = (f"Moderate competition ({comp_count} products) — "
                           "differentiated positioning essential")
        else:
            comp_context = (f"Crowded market ({comp_count} products, intensity {comp_intensity}/100) — "
                           "requires strong brand story and format innovation")

        # ── Trend context ───────────────────────────────
        trend_growth = opp.get("trend_growth", 0)
        if trend_growth >= 80:
            trend_context = "strong and accelerating demand momentum"
        elif trend_growth >= 40:
            trend_context = "solid upward demand trend"
        else:
            trend_context = "stable or emerging demand pattern"

        # ── Market estimates ────────────────────────────
        complaint = opp["complaint_intensity"]
        score = opp["opportunity_score"]
        search_vol = opp.get("search_volume", 0)
        market_est = opp.get("market_size_estimate", "TBD")
        reddit_mentions = opp.get("reddit_mentions", 0)
        theme_label = opp.get("theme_label", theme.replace("_", " "))

        # ── Executive brief ─────────────────────────────
        evidence_block = "\n".join(f"• {line}" for line in evidence_lines) if evidence_lines else "• Evidence derived from uploaded consumer datasets"

        executive_brief = f"""MARKET INSIGHT
Consumer complaints about '{theme_label}' show {complaint:.1f}% intensity \
across analyzed reviews. Search trend growth stands at +{trend_growth:.0f}%, \
indicating {trend_context}. Reddit community signals: {reddit_mentions} \
relevant discussions detected across Indian wellness communities.
{comp_context}.
Estimated addressable market: {market_est}.

TARGET CONSUMER
{persona}. This segment actively seeks {direction['angle']} and is willing \
to invest ₹{int(avg_price * 0.8)}–₹{int(avg_price * 1.2)} for a solution \
that demonstrably works. They are digitally savvy, research products online, \
and trust peer reviews over brand advertising.

PRODUCT CONCEPT
{product_name} — {fmt['format']} formulated with {ingredient_detail}.
Suggested retail price: {fmt['price_band']}.
Core promise: {direction['positioning']}.

FORMULATION DIRECTION
Primary actives: {ingredient_str}.
Format rationale: {fmt['appeal']} — directly addresses the consumer pain point.
Differentiation: Novel format + trending ingredient combination not currently \
available from any competitor in this category.

COMPETITIVE POSITIONING
{comp_context}.
Key differentiator: Directly solves the consumer friction point \
('{theme_label}') that current market leaders fail to address. Format \
innovation and ingredient story enable clear shelf differentiation.

CITED CONSUMER EVIDENCE
{evidence_block}

WHY THIS WILL WORK
The convergence of complaint intensity ({complaint:.1f}%), validated search \
demand (+{trend_growth:.0f}% growth, {search_vol:,} monthly searches), and \
{comp_context.split('—')[0].strip().lower()} creates a clear whitespace \
opportunity. Opportunity score: {score:.1f} ({opp['tier']}). Consumer \
language consistently emphasizes the need for {direction['angle']} — this \
concept directly answers that articulated demand with a differentiated format \
and evidence-backed formulation.""".strip()

        concepts.append({
            "product_name": product_name,
            "category": detected_category,
            "persona": persona,
            "target_consumer": persona,
            "format": fmt["format"],
            "ingredient_direction": ingredient_detail,
            "price_range": fmt["price_band"],
            "positioning": direction["positioning"],
            "opportunity_score": score,
            "tier": opp["tier"],
            "market_size_estimate": market_est,
            "competition_intensity": comp_intensity,
            "cited_evidence": evidence_lines,
            "executive_brief": executive_brief,
        })

        concept_idx += 1

    return concepts
