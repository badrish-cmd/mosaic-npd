import { useState, useEffect, useCallback, useRef } from "react";

/* ════════════════════════════════════════════════════════════════════════════
   CONFIG & HELPERS
   ════════════════════════════════════════════════════════════════════════════ */
const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const TIER_META = {
  "Tier 1 – Launch Priority":          { letter: "S", bg: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "rgba(245,158,11,0.32)", glow: "0 0 32px rgba(245,158,11,0.18)" },
  "Tier 2 – Strong Validation Candidate": { letter: "A", bg: "rgba(34,197,94,0.10)", color: "#4ade80", border: "rgba(34,197,94,0.28)", glow: "0 0 32px rgba(34,197,94,0.14)" },
  "Tier 3 – Explore":                  { letter: "B", bg: "rgba(59,130,246,0.10)", color: "#60a5fa", border: "rgba(59,130,246,0.28)", glow: "none" },
  "Tier 4 – Monitor":                  { letter: "C", bg: "rgba(100,116,139,0.12)", color: "#94a3b8", border: "rgba(100,116,139,0.28)", glow: "none" },
};

const THEME_ICONS = {
  greasy_texture: "💧", slow_results: "⏳", irritation: "🔥",
  price_concern: "💰", packaging_issue: "📦", fragrance_issue: "👃",
  hair_fall: "💇", dryness: "🏜️", ingredient_safety: "⚗️", size_quantity: "📏",
};

const THEME_LABELS = {
  greasy_texture: "Greasy / Heavy Texture", slow_results: "Slow / No Visible Results",
  irritation: "Skin / Scalp Irritation", price_concern: "Price / Value Concern",
  packaging_issue: "Packaging Problems", fragrance_issue: "Unpleasant Fragrance",
  hair_fall: "Hair Fall / Thinning", dryness: "Dryness / Flaking",
  ingredient_safety: "Ingredient Safety Concerns", size_quantity: "Size / Quantity Issues",
};

function tierOf(name) { return TIER_META[name] || TIER_META["Tier 4 – Monitor"]; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/* ════════════════════════════════════════════════════════════════════════════
   ANIMATED COUNTER — counts from 0 → target
   ════════════════════════════════════════════════════════════════════════════ */
function AnimatedNumber({ value, duration = 1200, decimals = 0 }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    let start = null;
    const from = 0;
    function step(ts) {
      if (!start) start = ts;
      const p = clamp((ts - start) / duration, 0, 1);
      const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setDisplay(from + (value - from) * ease);
      if (p < 1) raf.current = requestAnimationFrame(step);
    }
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);
  return <>{display.toFixed(decimals)}</>;
}

/* ════════════════════════════════════════════════════════════════════════════
   SKELETON LOADER
   ════════════════════════════════════════════════════════════════════════════ */
function Skeleton({ width = "100%", height = 20, radius = 8, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: "linear-gradient(90deg, rgba(30,41,59,0.6) 25%, rgba(51,65,85,0.4) 50%, rgba(30,41,59,0.6) 75%)",
      backgroundSize: "800px 100%",
      animation: "shimmer 1.8s ease infinite",
      ...style,
    }} />
  );
}

function StatSkeleton() {
  return (
    <div style={{ ...cardBase, padding: "24px" }}>
      <Skeleton width={80} height={12} style={{ marginBottom: 12 }} />
      <Skeleton width={60} height={32} style={{ marginBottom: 8 }} />
      <Skeleton width={100} height={12} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   SHARED STYLES
   ════════════════════════════════════════════════════════════════════════════ */
const cardBase = {
  background: "rgba(15,23,42,0.65)",
  border: "1px solid rgba(51,65,85,0.5)",
  borderRadius: 14,
  backdropFilter: "blur(12px)",
};

/* ════════════════════════════════════════════════════════════════════════════
   COMPLAINT BAR CHART
   ════════════════════════════════════════════════════════════════════════════ */
function ComplaintChart({ data }) {
  const [hovered, setHovered] = useState(null);
  if (!data || Object.keys(data).length === 0) return null;

  /* Support both old {theme: number} and new {theme: {intensity, label, icon, ...}} */
  const entries = Object.entries(data).map(([theme, val]) => {
    const isObj = typeof val === "object" && val !== null;
    return {
      theme,
      intensity: isObj ? val.intensity : val,
      icon: (isObj && val.icon) || THEME_ICONS[theme] || "📊",
      label: (isObj && val.label) || THEME_LABELS[theme] || theme.replace(/_/g, " "),
      reviewCount: isObj ? val.review_count : null,
      redditCount: isObj ? val.reddit_count : null,
    };
  }).sort((a, b) => b.intensity - a.intensity);

  const max = Math.max(...entries.map(e => e.intensity), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {entries.map((entry, i) => {
        const pct = (entry.intensity / max) * 100;
        const active = hovered === entry.theme;
        return (
          <div key={entry.theme}
            onMouseEnter={() => setHovered(entry.theme)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "default", transition: "transform 0.2s", transform: active ? "translateX(4px)" : "none" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: active ? "#f8fafc" : "#cbd5e1", fontWeight: 500, transition: "color 0.2s" }}>
                <span style={{ fontSize: 15 }}>{entry.icon}</span>
                {entry.label}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {entry.reviewCount != null && (
                  <span style={{ fontSize: 10, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>
                    {entry.reviewCount}r{entry.redditCount ? ` · ${entry.redditCount}rd` : ""}
                  </span>
                )}
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: active ? "#fbbf24" : "#94a3b8", fontWeight: 600, transition: "color 0.2s" }}>
                  {entry.intensity.toFixed(1)}%
                </span>
              </span>
            </div>
            <div style={{ height: 8, background: "rgba(30,41,59,0.7)", borderRadius: 4, overflow: "hidden", position: "relative" }}>
              <div style={{
                height: "100%",
                width: `${pct}%`,
                borderRadius: 4,
                background: active
                  ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                  : "linear-gradient(90deg, rgba(245,158,11,0.6), rgba(251,191,36,0.6))",
                boxShadow: active ? "0 0 12px rgba(245,158,11,0.4)" : "none",
                transition: "width 1.2s cubic-bezier(0.22, 1, 0.36, 1), background 0.2s, box-shadow 0.2s",
                animation: `barGrow 1.2s cubic-bezier(0.22, 1, 0.36, 1) both`,
                animationDelay: `${i * 0.08}s`,
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   OPPORTUNITY RADAR (mini donut-like visual)
   ════════════════════════════════════════════════════════════════════════════ */
function ScoreRing({ score, size = 56, stroke = 5, color = "#f59e0b" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = clamp(score / 100, 0, 1);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(51,65,85,0.5)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)" }}
      />
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   OPPORTUNITY CARD
   ════════════════════════════════════════════════════════════════════════════ */
function OpportunityCard({ opp, rank }) {
  const [expanded, setExpanded] = useState(false);
  const t = tierOf(opp.tier);

  return (
    <div
      className="dash-card"
      onClick={() => setExpanded(!expanded)}
      style={{
        ...cardBase,
        padding: 0,
        cursor: "pointer",
        borderColor: expanded ? t.border : "rgba(51,65,85,0.5)",
        boxShadow: expanded ? t.glow : "0 4px 24px rgba(0,0,0,0.3)",
        transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ padding: "20px 22px", display: "flex", alignItems: "center", gap: 16 }}>
        {/* Rank */}
        {rank <= 3 && (
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: rank === 1 ? "linear-gradient(135deg,#f59e0b,#d97706)" : rank === 2 ? "linear-gradient(135deg,#94a3b8,#64748b)" : "linear-gradient(135deg,#cd7f32,#92400e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 800, color: rank <= 2 ? "#0f172a" : "#fef3c7",
            boxShadow: rank === 1 ? "0 0 16px rgba(245,158,11,0.5)" : "none",
            flexShrink: 0,
          }}>
            #{rank}
          </div>
        )}
        {rank > 3 && (
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: "rgba(51,65,85,0.4)", border: "1px solid rgba(71,85,105,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#64748b", flexShrink: 0,
          }}>
            #{rank}
          </div>
        )}

        {/* Score ring */}
        <div style={{ position: "relative", flexShrink: 0, width: 56, height: 56 }}>
          <ScoreRing score={opp.opportunity_score} color={t.color} />
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: t.color, fontFamily: "'JetBrains Mono', monospace",
          }}>
            {opp.opportunity_score.toFixed(0)}
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9" }}>
              {opp.theme_icon || THEME_ICONS[opp.theme]} {opp.theme_label || THEME_LABELS[opp.theme] || opp.theme.replace(/_/g, " ")}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
              padding: "3px 8px", borderRadius: 6,
              background: t.bg, color: t.color, border: `1px solid ${t.border}`,
            }}>
              {t.letter}-TIER
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
            complaint {opp.complaint_intensity.toFixed(1)}% · trend +{opp.trend_growth.toFixed(0)}% · reddit {opp.reddit_mentions}
          </div>
        </div>

        {/* Expand arrow */}
        <svg width={18} height={18} fill="none" stroke="#64748b" strokeWidth={2}
          style={{ transition: "transform 0.3s", transform: expanded ? "rotate(180deg)" : "rotate(0)", flexShrink: 0 }}>
          <path d="M4 7l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Expanded detail */}
      <div style={{
        maxHeight: expanded ? 260 : 0,
        opacity: expanded ? 1 : 0,
        overflow: "hidden",
        transition: "max-height 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease",
      }}>
        <div style={{ padding: "0 22px 20px", borderTop: `1px solid ${t.border}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 16 }}>
            {[
              { label: "Complaint Intensity", value: `${opp.complaint_intensity.toFixed(1)}%`, icon: "📊" },
              { label: "Trend Growth", value: `+${opp.trend_growth.toFixed(0)}%`, icon: "📈" },
              { label: "Reddit Mentions", value: opp.reddit_mentions, icon: "💬" },
              { label: "Competition Density", value: opp.competition_density, icon: "🏢" },
              { label: "Opportunity Score", value: opp.opportunity_score.toFixed(1), icon: "⭐" },
              { label: "Tier", value: opp.tier.split("–")[1]?.trim() || opp.tier, icon: "🏷️" },
              ...(opp.market_size_estimate ? [{ label: "Market Size Est.", value: opp.market_size_estimate, icon: "💹" }] : []),
              ...(opp.search_volume ? [{ label: "Search Volume", value: opp.search_volume.toLocaleString(), icon: "🔍" }] : []),
            ].map(({ label, value, icon }) => (
              <div key={label} style={{
                padding: "12px 14px", borderRadius: 10,
                background: "rgba(2,6,23,0.5)", border: "1px solid rgba(30,41,59,0.6)",
              }}>
                <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>{icon} {label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CONCEPT CARD
   ════════════════════════════════════════════════════════════════════════════ */
function ConceptCard({ concept, index }) {
  const [expanded, setExpanded] = useState(false);
  const t = tierOf(concept.tier);
  const evidence = concept.cited_evidence || [];
  const hasRichData = concept.category || concept.target_consumer || concept.format;

  return (
    <div
      className="dash-card"
      style={{
        ...cardBase,
        overflow: "hidden",
        borderColor: expanded ? t.border : "rgba(51,65,85,0.5)",
        boxShadow: expanded ? t.glow : "0 4px 24px rgba(0,0,0,0.3)",
        transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
        animationDelay: `${index * 0.08}s`,
      }}
    >
      {/* Glow accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${t.color}, transparent)`, opacity: 0.6 }} />

      <div style={{ padding: "22px 24px" }}>
        {/* Top row: badges + scores */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
                padding: "3px 10px", borderRadius: 6,
                background: t.bg, color: t.color, border: `1px solid ${t.border}`,
              }}>
                {t.letter}-TIER
              </span>
              {concept.category && (
                <span style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: "0.03em",
                  padding: "3px 10px", borderRadius: 6,
                  background: "rgba(59,130,246,0.08)", color: "#60a5fa",
                  border: "1px solid rgba(59,130,246,0.2)",
                }}>
                  {concept.category}
                </span>
              )}
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9", margin: 0, letterSpacing: "-0.01em" }}>
              {concept.product_name}
            </h3>
          </div>

          {/* Score badges */}
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ position: "relative", width: 50, height: 50 }}>
                <ScoreRing score={concept.opportunity_score} size={50} stroke={4} color={t.color} />
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: t.color, fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {concept.opportunity_score.toFixed(0)}
                </div>
              </div>
              <div style={{ fontSize: 9, color: "#475569", marginTop: 2, letterSpacing: "0.05em" }}>OPP</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ position: "relative", width: 50, height: 50 }}>
                <ScoreRing score={concept.brand_fit_score} size={50} stroke={4} color="#60a5fa" />
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "#60a5fa", fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {concept.brand_fit_score.toFixed(0)}
                </div>
              </div>
              <div style={{ fontSize: 9, color: "#475569", marginTop: 2, letterSpacing: "0.05em" }}>FIT</div>
            </div>
          </div>
        </div>

        {/* Key details grid */}
        {hasRichData && (
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px",
            padding: "14px 16px", borderRadius: 10, marginBottom: 14,
            background: "rgba(2,6,23,0.4)", border: "1px solid rgba(30,41,59,0.5)",
          }}>
            {concept.target_consumer && (
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={{ fontSize: 10, color: "#475569", letterSpacing: "0.05em" }}>👤 TARGET CONSUMER</span>
                <p style={{ fontSize: 12, color: "#cbd5e1", margin: "3px 0 0", lineHeight: 1.4 }}>
                  {concept.target_consumer.length > 120 ? concept.target_consumer.slice(0, 120) + "…" : concept.target_consumer}
                </p>
              </div>
            )}
            {concept.format && (
              <div>
                <span style={{ fontSize: 10, color: "#475569", letterSpacing: "0.05em" }}>🧴 FORMAT</span>
                <p style={{ fontSize: 12, color: "#cbd5e1", margin: "3px 0 0" }}>{concept.format}</p>
              </div>
            )}
            {concept.price_range && (
              <div>
                <span style={{ fontSize: 10, color: "#475569", letterSpacing: "0.05em" }}>💰 PRICE</span>
                <p style={{ fontSize: 12, color: "#cbd5e1", margin: "3px 0 0" }}>{concept.price_range}</p>
              </div>
            )}
            {concept.ingredient_direction && (
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={{ fontSize: 10, color: "#475569", letterSpacing: "0.05em" }}>🧬 KEY INGREDIENTS</span>
                <p style={{ fontSize: 12, color: "#cbd5e1", margin: "3px 0 0", lineHeight: 1.4 }}>{concept.ingredient_direction}</p>
              </div>
            )}
            {concept.market_size_estimate && (
              <div>
                <span style={{ fontSize: 10, color: "#475569", letterSpacing: "0.05em" }}>📊 EST. MARKET</span>
                <p style={{ fontSize: 12, color: "#4ade80", margin: "3px 0 0", fontWeight: 600 }}>{concept.market_size_estimate}</p>
              </div>
            )}
            {concept.positioning && (
              <div style={{ gridColumn: concept.market_size_estimate ? "auto" : "1 / -1" }}>
                <span style={{ fontSize: 10, color: "#475569", letterSpacing: "0.05em" }}>🎯 POSITIONING</span>
                <p style={{ fontSize: 12, color: "#cbd5e1", margin: "3px 0 0", lineHeight: 1.4 }}>{concept.positioning}</p>
              </div>
            )}
          </div>
        )}

        {/* Cited evidence */}
        {evidence.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.05em", marginBottom: 8 }}>📝 CITED CONSUMER EVIDENCE</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {evidence.slice(0, expanded ? evidence.length : 3).map((line, i) => (
                <div key={i} style={{
                  fontSize: 11, lineHeight: 1.45, color: "#94a3b8",
                  padding: "8px 12px", borderRadius: 8,
                  background: "rgba(2,6,23,0.5)", border: "1px solid rgba(30,41,59,0.4)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {line}
                </div>
              ))}
              {!expanded && evidence.length > 3 && (
                <span style={{ fontSize: 11, color: "#475569", fontStyle: "italic" }}>
                  +{evidence.length - 3} more citations…
                </span>
              )}
            </div>
          </div>
        )}

        {/* Executive brief (expandable) */}
        {concept.executive_brief && (
          <div style={{
            maxHeight: expanded ? 2000 : 0,
            opacity: expanded ? 1 : 0,
            overflow: "hidden",
            transition: "max-height 0.5s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease",
          }}>
            <div style={{
              padding: "16px 18px", borderRadius: 10,
              background: "rgba(2,6,23,0.5)", border: "1px solid rgba(30,41,59,0.5)",
              marginBottom: 8,
            }}>
              <div style={{ fontSize: 10, color: "#f59e0b", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 10 }}>
                EXECUTIVE BRIEF
              </div>
              <pre style={{
                fontSize: 12, lineHeight: 1.6, color: "#94a3b8", margin: 0,
                whiteSpace: "pre-wrap", wordWrap: "break-word",
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {concept.executive_brief}
              </pre>
            </div>
          </div>
        )}

        {/* Toggle button */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            marginTop: 4, padding: "8px 16px", borderRadius: 8,
            background: expanded ? "rgba(245,158,11,0.08)" : "rgba(51,65,85,0.3)",
            border: expanded ? "1px solid rgba(245,158,11,0.2)" : "1px solid rgba(71,85,105,0.4)",
            color: expanded ? "#fbbf24" : "#94a3b8",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            transition: "all 0.2s",
            display: "flex", alignItems: "center", gap: 6,
            width: "100%", justifyContent: "center",
          }}
          onMouseOver={e => { e.currentTarget.style.background = "rgba(245,158,11,0.12)"; e.currentTarget.style.color = "#fbbf24"; }}
          onMouseOut={e => { e.currentTarget.style.background = expanded ? "rgba(245,158,11,0.08)" : "rgba(51,65,85,0.3)"; e.currentTarget.style.color = expanded ? "#fbbf24" : "#94a3b8"; }}
        >
          {expanded ? "Collapse Brief" : "View Full Product Brief"}
          <svg width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2}
            style={{ transition: "transform 0.3s", transform: expanded ? "rotate(180deg)" : "rotate(0)" }}>
            <path d="M3 4.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   AI INSIGHT SUMMARY
   ════════════════════════════════════════════════════════════════════════════ */
function AIInsightSummary({ concepts }) {
  if (!concepts || concepts.length === 0) return null;

  const top = [...concepts].sort((a, b) => b.opportunity_score - a.opportunity_score)[0];
  const confidence = ((top.opportunity_score + top.brand_fit_score) / 2).toFixed(1);
  const t = tierOf(top.tier);

  /* Confidence bar colour */
  const confNum = parseFloat(confidence);
  const barColor = confNum >= 70 ? "#4ade80" : confNum >= 50 ? "#fbbf24" : "#f87171";

  return (
    <div
      className="dash-card fade-up"
      style={{
        ...cardBase,
        position: "relative",
        overflow: "hidden",
        padding: 0,
        marginBottom: 28,
        borderColor: "rgba(245,158,11,0.18)",
      }}
    >
      {/* ── animated scan-line overlay ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(245,158,11,0.015) 3px, rgba(245,158,11,0.015) 4px)",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: 2,
          background: "linear-gradient(90deg, transparent, #f59e0b, transparent)",
          animation: "lineSlide 6s linear infinite",
        }}
      />

      {/* ── corner glow ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,158,11,0.10), transparent 70%)",
          filter: "blur(30px)",
        }}
      />

      <div style={{ position: "relative", padding: "26px 30px", display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Left: icon + text */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(245,158,11,0.10)",
                border: "1px solid rgba(245,158,11,0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              🧠
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.10em",
                color: "#f59e0b",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              AI INSIGHT SUMMARY
            </span>
          </div>

          <p style={{ fontSize: 14, lineHeight: 1.7, color: "#cbd5e1", margin: 0 }}>
            The AI analysis identified{" "}
            <span style={{ color: "#f1f5f9", fontWeight: 700 }}>{top.product_name}</span>{" "}
            as the strongest opportunity with an opportunity score of{" "}
            <span style={{ color: t.color, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
              {top.opportunity_score.toFixed(1)}
            </span>{" "}
            and a brand alignment score of{" "}
            <span style={{ color: "#60a5fa", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
              {top.brand_fit_score.toFixed(1)}
            </span>.{" "}
            Based on the combined signals, the AI confidence level for this concept is{" "}
            <span style={{ color: barColor, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
              {confidence}%
            </span>.
          </p>
        </div>

        {/* Right: confidence gauge */}
        <div
          style={{
            minWidth: 150,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            paddingTop: 4,
          }}
        >
          <span style={{ fontSize: 10, letterSpacing: "0.08em", color: "#475569", fontWeight: 600 }}>
            AI CONFIDENCE
          </span>
          {/* Ring gauge */}
          <div style={{ position: "relative", width: 72, height: 72 }}>
            <ScoreRing score={confNum} size={72} stroke={6} color={barColor} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 800,
                color: barColor,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <AnimatedNumber value={confNum} decimals={1} />
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.05em",
              padding: "3px 10px",
              borderRadius: 6,
              background: t.bg,
              color: t.color,
              border: `1px solid ${t.border}`,
            }}
          >
            {t.letter}-TIER
          </span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STAT CARD
   ════════════════════════════════════════════════════════════════════════════ */
function StatCard({ label, value, sub, icon, accent = "#f59e0b", decimals = 0 }) {
  return (
    <div className="dash-card" style={{
      ...cardBase,
      padding: "22px 24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background glow */}
      <div style={{
        position: "absolute", top: -30, right: -30, width: 90, height: 90,
        borderRadius: "50%", background: accent, opacity: 0.06, filter: "blur(24px)",
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 10, textTransform: "uppercase" }}>{label}</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#f1f5f9", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.03em", lineHeight: 1 }}>
            <AnimatedNumber value={value} decimals={decimals} />
          </div>
          {sub && <div style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>{sub}</div>}
        </div>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: `${accent}18`,
          border: `1px solid ${accent}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB COMPONENT
   ════════════════════════════════════════════════════════════════════════════ */
function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{
      display: "inline-flex", gap: 2,
      background: "rgba(15,23,42,0.6)", borderRadius: 10,
      padding: 3, border: "1px solid rgba(51,65,85,0.4)",
    }}>
      {tabs.map(tab => {
        const isActive = active === tab.key;
        return (
          <button key={tab.key} onClick={() => onChange(tab.key)} style={{
            padding: "8px 18px", borderRadius: 8,
            fontSize: 13, fontWeight: 500,
            cursor: "pointer", border: "none", outline: "none",
            transition: "all 0.2s",
            background: isActive ? "rgba(245,158,11,0.12)" : "transparent",
            color: isActive ? "#fbbf24" : "#64748b",
            ...(isActive && { boxShadow: "0 0 12px rgba(245,158,11,0.08)" }),
          }}>
            {tab.label}
            {tab.count != null && (
              <span style={{
                marginLeft: 6, fontSize: 10, padding: "2px 6px", borderRadius: 5,
                background: isActive ? "rgba(245,158,11,0.18)" : "rgba(51,65,85,0.4)",
                color: isActive ? "#fbbf24" : "#64748b",
                fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
              }}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   EMPTY STATE
   ════════════════════════════════════════════════════════════════════════════ */
function EmptyState({ title, description }) {
  return (
    <div style={{
      textAlign: "center", padding: "64px 24px",
      ...cardBase,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16, margin: "0 auto 20px",
        background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28,
      }}>
        📊
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: "#cbd5e1", margin: 0 }}>{title}</h3>
      <p style={{ fontSize: 13, color: "#475569", marginTop: 6, maxWidth: 360, marginInline: "auto" }}>{description}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ════════════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [tab, setTab] = useState("overview");
  const [complaints, setComplaints] = useState(null);
  const [opportunities, setOpportunities] = useState(null);
  const [concepts, setConcepts] = useState(null);
  const [loading, setLoading] = useState({ complaints: false, opportunities: false, concepts: false });
  const [errors, setErrors] = useState({});
  const [lastRefresh, setLastRefresh] = useState(null);

  /* Fetch helpers */
  const fetchData = useCallback(async (endpoint, setter, key) => {
    setLoading(prev => ({ ...prev, [key]: true }));
    setErrors(prev => ({ ...prev, [key]: null }));
    try {
      const res = await fetch(`${API}${endpoint}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setter(data);
    } catch (e) {
      setErrors(prev => ({ ...prev, [key]: e.message }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  }, []);

  const refreshAll = useCallback(() => {
    fetchData("/analysis/complaints", setComplaints, "complaints");
    fetchData("/analysis/opportunities", setOpportunities, "opportunities");
    fetchData("/analysis/concepts", setConcepts, "concepts");
    setLastRefresh(new Date());
  }, [fetchData]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  /* Computed stats */
  const totalConcepts = concepts?.length || 0;
  const avgScore = concepts?.length ? concepts.reduce((s, c) => s + c.opportunity_score, 0) / concepts.length : 0;
  const topTierCount = concepts?.filter(c => c.tier === "Tier 1 – Launch Priority" || c.tier === "Tier 2 – Strong Validation Candidate").length || 0;
  const avgFit = concepts?.length ? concepts.reduce((s, c) => s + c.brand_fit_score, 0) / concepts.length : 0;
  const complaintCount = complaints ? Object.keys(complaints).length : 0;
  const oppCount = opportunities?.length || 0;

  const sortedOpportunities = opportunities
    ? [...opportunities].sort((a, b) => b.opportunity_score - a.opportunity_score)
    : [];

  const isLoading = loading.complaints || loading.opportunities || loading.concepts;

  return (
    <>
      <style>{`
        @keyframes shimmer { 0%{background-position:-700px 0}100%{background-position:700px 0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes barGrow { from{width:0} }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }
        .dash-card { transition:transform 0.28s cubic-bezier(0.22,1,0.36,1),box-shadow 0.28s cubic-bezier(0.22,1,0.36,1),border-color 0.2s ease; }
        .dash-card:hover { transform:translateY(-3px); }
        .fade-up { animation:fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }

        /* Background motion */
        @keyframes orbDrift1 { 0%{transform:translate(0,0) scale(1)}50%{transform:translate(60px,-40px) scale(1.15)}100%{transform:translate(0,0) scale(1)} }
        @keyframes orbDrift2 { 0%{transform:translate(0,0) scale(1)}50%{transform:translate(-50px,30px) scale(0.9)}100%{transform:translate(0,0) scale(1)} }
        @keyframes orbDrift3 { 0%{transform:translate(0,0) scale(1)}50%{transform:translate(35px,45px) scale(1.1)}100%{transform:translate(0,0) scale(1)} }
        @keyframes particleFloat { 0%{transform:translateY(0) rotate(0);opacity:0.6}50%{opacity:1}100%{transform:translateY(-120vh) rotate(360deg);opacity:0} }
        @keyframes lineSlide { 0%{transform:translateX(-100%);opacity:0}20%{opacity:0.08}80%{opacity:0.08}100%{transform:translateX(100vw);opacity:0} }
        @keyframes hexPulse { 0%,100%{opacity:0.03;transform:scale(1) rotate(0)}50%{opacity:0.07;transform:scale(1.08) rotate(3deg)} }
      `}</style>

      {/* ═══ BACKGROUND MOTION ELEMENTS ═══════════════════════════ */}
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        {/* Floating orbs */}
        <div style={{
          position: "absolute", top: "10%", left: "8%", width: 220, height: 220, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)",
          animation: "orbDrift1 18s ease-in-out infinite",
          filter: "blur(40px)",
        }} />
        <div style={{
          position: "absolute", top: "55%", right: "5%", width: 280, height: 280, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)",
          animation: "orbDrift2 22s ease-in-out infinite",
          filter: "blur(50px)",
        }} />
        <div style={{
          position: "absolute", bottom: "15%", left: "35%", width: 180, height: 180, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)",
          animation: "orbDrift3 15s ease-in-out infinite",
          filter: "blur(35px)",
        }} />
        <div style={{
          position: "absolute", top: "30%", left: "60%", width: 150, height: 150, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)",
          animation: "orbDrift1 25s ease-in-out infinite reverse",
          filter: "blur(30px)",
        }} />

        {/* Rising particles */}
        {[
          { left: "12%", size: 3, dur: 14, delay: 0, color: "#f59e0b" },
          { left: "28%", size: 2, dur: 18, delay: 3, color: "#60a5fa" },
          { left: "45%", size: 3.5, dur: 16, delay: 7, color: "#8b5cf6" },
          { left: "62%", size: 2, dur: 20, delay: 2, color: "#f59e0b" },
          { left: "78%", size: 2.5, dur: 15, delay: 5, color: "#4ade80" },
          { left: "88%", size: 2, dur: 19, delay: 10, color: "#60a5fa" },
          { left: "5%", size: 3, dur: 22, delay: 8, color: "#fb923c" },
          { left: "52%", size: 1.5, dur: 17, delay: 12, color: "#c084fc" },
        ].map((p, i) => (
          <div key={i} style={{
            position: "absolute", bottom: -10, left: p.left,
            width: p.size, height: p.size, borderRadius: "50%",
            background: p.color, opacity: 0.5,
            animation: `particleFloat ${p.dur}s linear ${p.delay}s infinite`,
          }} />
        ))}

        {/* Horizontal scanning lines */}
        <div style={{
          position: "absolute", top: "25%", left: 0, width: "120px", height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.08), transparent)",
          animation: "lineSlide 12s linear infinite",
        }} />
        <div style={{
          position: "absolute", top: "65%", left: 0, width: "160px", height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.06), transparent)",
          animation: "lineSlide 16s linear 4s infinite",
        }} />

        {/* Hex grid hint */}
        <svg style={{
          position: "absolute", top: "5%", right: "10%", width: 200, height: 200,
          animation: "hexPulse 10s ease-in-out infinite",
        }} viewBox="0 0 100 100" fill="none" stroke="rgba(245,158,11,0.04)" strokeWidth="0.5">
          <polygon points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5" />
          <polygon points="50,20 75,35 75,65 50,80 25,65 25,35" />
          <polygon points="50,35 62.5,42.5 62.5,57.5 50,65 37.5,57.5 37.5,42.5" />
        </svg>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "36px 24px 80px", position: "relative", zIndex: 1 }}>

        {/* ─── Header ───────────────────────────────────────────── */}
        <div className="fade-up" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "#f59e0b", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", fontWeight: 600 }}>INTELLIGENCE HUB</span>
              {isLoading && (
                <div style={{
                  width: 12, height: 12, borderRadius: "50%",
                  border: "2px solid rgba(245,158,11,0.2)", borderTopColor: "#f59e0b",
                  animation: "spin 0.8s linear infinite",
                }} />
              )}
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.03em", margin: 0, lineHeight: 1.1 }}>
              AI Product Inventor
            </h1>
            <p style={{ fontSize: 14, color: "#475569", marginTop: 6 }}>
              Mining consumer signals to invent market-ready product concepts
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {lastRefresh && (
              <span style={{ fontSize: 11, color: "#334155", fontFamily: "'JetBrains Mono', monospace" }}>
                Updated {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            <button onClick={refreshAll} disabled={isLoading} style={{
              padding: "9px 20px", borderRadius: 10,
              background: isLoading ? "rgba(51,65,85,0.3)" : "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.25)",
              color: isLoading ? "#475569" : "#fbbf24",
              fontSize: 13, fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 7,
              transition: "all 0.2s", outline: "none",
            }}
              onMouseOver={e => { if (!isLoading) e.currentTarget.style.background = "rgba(245,158,11,0.18)"; }}
              onMouseOut={e => { e.currentTarget.style.background = isLoading ? "rgba(51,65,85,0.3)" : "rgba(245,158,11,0.1)"; }}
            >
              <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2}
                style={{ animation: isLoading ? "spin 1s linear infinite" : "none" }}>
                <path d="M1 4s1.5-3 6-3 6.5 3.5 6 6.5M13 10s-1.5 3-6 3-6.5-3.5-6-6.5" strokeLinecap="round" />
              </svg>
              {isLoading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* ─── Tabs ─────────────────────────────────────────────── */}
        <div className="fade-up" style={{ marginBottom: 28, animationDelay: "0.05s" }}>
          <Tabs
            active={tab}
            onChange={setTab}
            tabs={[
              { key: "overview", label: "Overview" },
              { key: "complaints", label: "Complaints", count: complaintCount },
              { key: "opportunities", label: "Opportunities", count: oppCount },
              { key: "concepts", label: "Concepts", count: totalConcepts },
            ]}
          />
        </div>

        {/* ─── OVERVIEW TAB ─────────────────────────────────────── */}
        {tab === "overview" && (
          <>
            {/* AI Insight Summary */}
            {!loading.concepts && concepts && concepts.length > 0 && (
              <AIInsightSummary concepts={concepts} />
            )}

            {/* Stat cards */}
            <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 32, animationDelay: "0.1s" }}>
              {loading.concepts ? (
                <>
                  <StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton />
                </>
              ) : (
                <>
                  <StatCard label="Invented Concepts" value={totalConcepts} icon="🧪" sub="PM-ready product briefs" accent="#f59e0b" />
                  <StatCard label="Avg Opp Score" value={avgScore} icon="⚡" sub="Across all themes" accent="#4ade80" decimals={1} />
                  <StatCard label="Launch Priority" value={topTierCount} icon="🎯" sub="Tier 1 & 2 concepts" accent="#60a5fa" />
                  <StatCard label="Avg Brand Fit" value={avgFit} icon="🧬" sub="Brand alignment score" accent="#c084fc" decimals={1} />
                </>
              )}
            </div>

            {/* Two columns: Complaints + Top Opportunities */}
            <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, animationDelay: "0.15s" }}>
              {/* Complaints chart */}
              <div style={{ ...cardBase, padding: "24px 26px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>Complaint Signals</h2>
                    <p style={{ fontSize: 12, color: "#475569", marginTop: 3 }}>Theme intensity from reviews</p>
                  </div>
                  <span style={{
                    fontSize: 10, padding: "4px 10px", borderRadius: 6,
                    background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
                    color: "#f59e0b", fontWeight: 600, letterSpacing: "0.05em",
                  }}>LIVE</span>
                </div>
                {loading.complaints ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={8} />)}
                  </div>
                ) : complaints && Object.keys(complaints).length > 0 ? (
                  <ComplaintChart data={complaints} />
                ) : (
                  <p style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: "32px 0" }}>No complaint data available</p>
                )}
              </div>

              {/* Top opportunities */}
              <div style={{ ...cardBase, padding: "24px 26px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>Top Opportunities</h2>
                    <p style={{ fontSize: 12, color: "#475569", marginTop: 3 }}>Ranked by opportunity score</p>
                  </div>
                  <span style={{
                    fontSize: 10, padding: "4px 10px", borderRadius: 6,
                    background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
                    color: "#4ade80", fontWeight: 600, letterSpacing: "0.05em",
                  }}>SCORED</span>
                </div>
                {loading.opportunities ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[1, 2, 3].map(i => <Skeleton key={i} height={48} radius={10} />)}
                  </div>
                ) : sortedOpportunities.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {sortedOpportunities.slice(0, 4).map((opp, i) => {
                      const t = tierOf(opp.tier);
                      return (
                        <div key={opp.theme} style={{
                          display: "flex", alignItems: "center", gap: 14,
                          padding: "12px 14px", borderRadius: 10,
                          background: "rgba(2,6,23,0.4)", border: "1px solid rgba(30,41,59,0.5)",
                          transition: "all 0.2s",
                          cursor: "pointer",
                        }}
                          onMouseOver={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = t.bg; }}
                          onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(30,41,59,0.5)"; e.currentTarget.style.background = "rgba(2,6,23,0.4)"; }}
                          onClick={() => { setTab("opportunities"); }}
                        >
                          <div style={{
                            width: 28, height: 28, borderRadius: 7,
                            background: t.bg, border: `1px solid ${t.border}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 10, fontWeight: 800, color: t.color,
                          }}>
                            {t.letter}
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>
                              {opp.theme_icon || THEME_ICONS[opp.theme]} {opp.theme_label || THEME_LABELS[opp.theme] || opp.theme}
                            </span>
                          </div>
                          <span style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 13, fontWeight: 700, color: t.color,
                          }}>
                            {opp.opportunity_score.toFixed(1)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: "32px 0" }}>No opportunities computed yet</p>
                )}
              </div>
            </div>

            {/* Concepts preview */}
            {concepts && concepts.length > 0 && (
              <div className="fade-up" style={{ marginTop: 28, animationDelay: "0.2s" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>Latest Product Concepts</h2>
                  <button onClick={() => setTab("concepts")} style={{
                    padding: "6px 14px", borderRadius: 8,
                    background: "rgba(51,65,85,0.3)", border: "1px solid rgba(71,85,105,0.4)",
                    color: "#94a3b8", fontSize: 12, fontWeight: 500, cursor: "pointer",
                    transition: "all 0.2s", outline: "none",
                  }}
                    onMouseOver={e => { e.currentTarget.style.color = "#fbbf24"; e.currentTarget.style.borderColor = "rgba(245,158,11,0.3)"; }}
                    onMouseOut={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "rgba(71,85,105,0.4)"; }}
                  >
                    View all →
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                  {concepts.slice(0, 3).map((c, i) => <ConceptCard key={i} concept={c} index={i} />)}
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── COMPLAINTS TAB ───────────────────────────────────── */}
        {tab === "complaints" && (
          <div className="fade-up" style={{ animationDelay: "0.05s" }}>
            <div style={{ ...cardBase, padding: "28px 30px", maxWidth: 700 }}>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>Consumer Complaint Mining</h2>
                <p style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
                  Cited complaint themes from Amazon, Flipkart, Nykaa reviews and Reddit communities. Each bar shows intensity + evidence count.
                </p>
              </div>
              {loading.complaints ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={10} />)}
                </div>
              ) : complaints && Object.keys(complaints).length > 0 ? (
                <ComplaintChart data={complaints} />
              ) : errors.complaints ? (
                <p style={{ color: "#fca5a5", fontSize: 13 }}>Error: {errors.complaints}</p>
              ) : (
                <EmptyState title="No Complaint Data" description="Upload review data to see complaint analysis." />
              )}
            </div>
          </div>
        )}

        {/* ─── OPPORTUNITIES TAB ────────────────────────────────── */}
        {tab === "opportunities" && (
          <div className="fade-up" style={{ animationDelay: "0.05s" }}>
            {loading.opportunities ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[1, 2, 3, 4].map(i => <Skeleton key={i} height={80} radius={14} />)}
              </div>
            ) : sortedOpportunities.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {sortedOpportunities.map((opp, i) => (
                  <OpportunityCard key={opp.theme} opp={opp} rank={i + 1} />
                ))}
              </div>
            ) : errors.opportunities ? (
              <div style={{ ...cardBase, padding: 32 }}>
                <p style={{ color: "#fca5a5", fontSize: 13 }}>Error loading opportunities: {errors.opportunities}</p>
              </div>
            ) : (
              <EmptyState title="No Opportunities Yet" description="Load market data to compute opportunity scores." />
            )}
          </div>
        )}

        {/* ─── CONCEPTS TAB ─────────────────────────────────────── */}
        {tab === "concepts" && (
          <div className="fade-up" style={{ animationDelay: "0.05s" }}>
            {loading.concepts ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                {[1, 2, 3].map(i => <Skeleton key={i} height={200} radius={14} />)}
              </div>
            ) : concepts && concepts.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                {concepts.map((c, i) => <ConceptCard key={i} concept={c} index={i} />)}
              </div>
            ) : errors.concepts ? (
              <div style={{ ...cardBase, padding: 32 }}>
                <p style={{ color: "#fca5a5", fontSize: 13 }}>Error: {errors.concepts}</p>
              </div>
            ) : (
              <EmptyState title="No Concepts Invented" description="Product concepts are invented from validated consumer signals. Upload data and run analysis first." />
            )}
          </div>
        )}

        {/* ─── Error banner (non-blocking) ──────────────────────── */}
        {Object.entries(errors).some(([, v]) => v) && tab === "overview" && (
          <div className="fade-up" style={{
            marginTop: 28,
            padding: "16px 20px", borderRadius: 12,
            background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <p style={{ color: "#fca5a5", fontSize: 13, fontWeight: 600, margin: 0 }}>Some data failed to load</p>
              <p style={{ color: "#94a3b8", fontSize: 12, margin: 0, marginTop: 2 }}>
                {Object.entries(errors).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(" · ")}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
