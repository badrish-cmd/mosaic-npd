import { useState, useCallback } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

/* ── Preset category configs ─────────────────────────────────── */
const CATEGORY_PRESETS = {
  haircare: {
    label: "Haircare",
    keywords: ["hair growth serum", "anti hair fall", "hair oil", "hair thinning solution", "rosemary oil hair", "non greasy hair serum", "biotin hair"],
    subreddits: ["IndianSkincareAddicts", "IndianHairLossRecovery", "malegrooming", "HaircareScience", "tressless"],
  },
  skincare: {
    label: "Skincare",
    keywords: ["vitamin c serum", "sunscreen for oily skin", "niacinamide serum", "retinol cream", "salicylic acid face wash", "moisturizer for acne"],
    subreddits: ["IndianSkincareAddicts", "SkincareAddiction", "AsianBeauty", "30PlusSkinCare"],
  },
  wellness: {
    label: "Wellness & Supplements",
    keywords: ["biotin gummies", "ashwagandha supplement", "protein powder", "multivitamin tablets", "omega 3 capsules", "collagen supplement"],
    subreddits: ["Supplements", "nutrition", "IndianSkincareAddicts", "Fitness"],
  },
  grooming: {
    label: "Men's Grooming",
    keywords: ["beard growth oil", "face wash for men", "anti acne cream men", "dark spot cream men", "body lotion men"],
    subreddits: ["malegrooming", "IndianSkincareAddicts", "beards", "SkincareAddiction"],
  },
  custom: {
    label: "Custom Category",
    keywords: [],
    subreddits: [],
  },
};

const cardBase = {
  background: "rgba(15,23,42,0.65)",
  border: "1px solid rgba(51,65,85,0.5)",
  borderRadius: 14,
  backdropFilter: "blur(12px)",
};

const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 8,
  background: "rgba(2,6,23,0.6)", border: "1.5px solid rgba(51,65,85,0.5)",
  color: "#e2e8f0", fontSize: 13, outline: "none",
  fontFamily: "'DM Sans', sans-serif",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
};

const labelStyle = {
  fontSize: 10, color: "#64748b", fontWeight: 600,
  letterSpacing: "0.06em", textTransform: "uppercase",
  display: "block", marginBottom: 6,
};

export default function AIScraping() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [keywords, setKeywords] = useState("");
  const [subreddits, setSubreddits] = useState("");
  const [scraping, setScraping] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleCategorySelect = useCallback((catKey) => {
    setSelectedCategory(catKey);
    setResult(null);
    setError("");
    setAnalysisResult(null);
    if (catKey !== "custom") {
      const preset = CATEGORY_PRESETS[catKey];
      setKeywords(preset.keywords.join(", "));
      setSubreddits(preset.subreddits.join(", "));
    } else {
      setKeywords("");
      setSubreddits("");
    }
  }, []);

  const handleScrape = useCallback(async () => {
    const cat = selectedCategory === "custom" ? customCategory.trim() : CATEGORY_PRESETS[selectedCategory]?.label;
    if (!cat) { setError("Select a category first"); return; }
    const kws = keywords.split(",").map(k => k.trim()).filter(Boolean);
    if (kws.length === 0) { setError("Add at least one keyword"); return; }
    const subs = subreddits.split(",").map(s => s.trim()).filter(Boolean);

    setError("");
    setScraping(true);
    setResult(null);
    setAnalysisResult(null);

    setProgress({ stage: "Initializing scrapers...", pct: 5 });

    try {
      setProgress({ stage: "Scraping Reddit, Trends, Amazon, Flipkart...", pct: 15 });

      const response = await axios.post(`${API}/scrape/all`, {
        category: cat,
        keywords: kws,
        subreddits: subs.length > 0 ? subs : undefined,
      }, { timeout: 180000 });

      setProgress({ stage: "Complete!", pct: 100 });
      setResult(response.data);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Scraping failed";
      setError(msg);
    } finally {
      setScraping(false);
    }
  }, [selectedCategory, customCategory, keywords, subreddits]);

  const handleRunAnalysis = useCallback(async () => {
    setRunningAnalysis(true);
    setAnalysisResult(null);
    try {
      const resp = await axios.post(`${API}/analysis/run`, {}, { timeout: 60000 });
      setAnalysisResult(resp.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Analysis failed");
    } finally {
      setRunningAnalysis(false);
    }
  }, []);

  const totalScraped = result
    ? (result.reddit_posts || 0) + (result.trends || 0) + (result.reviews || 0) + (result.competition || 0)
    : 0;

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .fade-up { animation:fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .cat-btn { transition:all 0.2s ease; cursor:pointer; }
        .cat-btn:hover { transform:translateY(-2px); border-color:rgba(245,158,11,0.3) !important; }
        .scrape-input:focus { border-color:rgba(245,158,11,0.5) !important; }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* ─── Header ────────────────────────────────────── */}
        <div className="fade-up" style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", borderRadius: 20, marginBottom: 16,
            background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "block" }} />
            <span style={{ fontSize: 11, color: "#22c55e", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, letterSpacing: "0.1em" }}>
              LIVE
            </span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.03em", margin: "0 0 8px" }}>
            Live Data Scraper
          </h1>
          <p style={{ fontSize: 15, color: "#64748b", maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>
            Scrape real consumer data from Reddit, Google Trends, Amazon &amp; Flipkart.
            No sample data — live intelligence from actual sources.
          </p>
        </div>

        {/* ─── Step 1: Category Selection ────────────────── */}
        <div className="fade-up" style={{ animationDelay: "0.05s", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#f59e0b", fontFamily: "'JetBrains Mono', monospace" }}>1</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>Choose Category</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
            {Object.entries(CATEGORY_PRESETS).map(([key, preset]) => (
              <button key={key} className="cat-btn" onClick={() => handleCategorySelect(key)} style={{
                ...cardBase, padding: "14px 16px", textAlign: "center",
                cursor: "pointer",
                borderColor: selectedCategory === key ? "rgba(245,158,11,0.5)" : "rgba(51,65,85,0.5)",
                background: selectedCategory === key ? "rgba(245,158,11,0.08)" : "rgba(15,23,42,0.65)",
              }}>
                <span style={{ fontSize: 22, display: "block", marginBottom: 6 }}>
                  {key === "haircare" ? "💇" : key === "skincare" ? "✨" : key === "wellness" ? "💊" : key === "grooming" ? "🧔" : "🎯"}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: selectedCategory === key ? "#fbbf24" : "#94a3b8" }}>
                  {preset.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ─── Step 2: Keywords & Subreddits ─────────────── */}
        {selectedCategory && (
          <div className="fade-up" style={{ animationDelay: "0.1s", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#f59e0b", fontFamily: "'JetBrains Mono', monospace" }}>2</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>Configure Sources</span>
            </div>
            <div style={{ ...cardBase, padding: "20px 22px" }}>
              {selectedCategory === "custom" && (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Category Name</label>
                  <input className="scrape-input" style={inputStyle} value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="e.g. Baby Care, Fitness Equipment..." />
                </div>
              )}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Search Keywords <span style={{ color: "#475569", fontWeight: 400 }}>(comma-separated)</span></label>
                <textarea className="scrape-input" style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="hair growth serum, anti hair fall, rosemary oil..." />
                <p style={{ fontSize: 10, color: "#475569", margin: "4px 0 0" }}>These keywords are used to search Reddit, Google Trends, and Amazon/Flipkart</p>
              </div>
              <div>
                <label style={labelStyle}>Subreddits <span style={{ color: "#475569", fontWeight: 400 }}>(comma-separated, optional)</span></label>
                <input className="scrape-input" style={inputStyle} value={subreddits} onChange={e => setSubreddits(e.target.value)} placeholder="IndianSkincareAddicts, HaircareScience, malegrooming..." />
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 3: Scrape Button ─────────────────────── */}
        {selectedCategory && (
          <div className="fade-up" style={{ animationDelay: "0.15s", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#f59e0b", fontFamily: "'JetBrains Mono', monospace" }}>3</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>Scrape Live Data</span>
            </div>

            {error && (
              <div style={{ padding: "10px 16px", borderRadius: 8, marginBottom: 14, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13 }}>
                {error}
              </div>
            )}

            <button onClick={handleScrape} disabled={scraping} style={{
              width: "100%", padding: "14px 24px", borderRadius: 12,
              background: scraping ? "rgba(51,65,85,0.4)" : "linear-gradient(135deg, #f59e0b, #f97316)",
              border: "none", color: scraping ? "#64748b" : "#0f172a",
              fontSize: 15, fontWeight: 700, cursor: scraping ? "not-allowed" : "pointer",
              transition: "all 0.2s", position: "relative", overflow: "hidden",
              boxShadow: scraping ? "none" : "0 4px 20px rgba(245,158,11,0.3)",
            }}>
              {scraping ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <span style={{ width: 16, height: 16, border: "2px solid #64748b", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                  Scraping live data...
                </span>
              ) : (
                "🚀 Start Live Scraping"
              )}
            </button>

            {/* Progress */}
            {scraping && progress && (
              <div style={{ ...cardBase, padding: "16px 20px", marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{progress.stage}</span>
                  <span style={{ fontSize: 11, color: "#f59e0b", fontFamily: "'JetBrains Mono', monospace" }}>{progress.pct}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(51,65,85,0.4)", overflow: "hidden" }}>
                  <div style={{
                    width: `${progress.pct}%`, height: "100%", borderRadius: 2,
                    background: "linear-gradient(90deg, #f59e0b, #f97316)",
                    transition: "width 0.5s ease",
                  }} />
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: "#475569", lineHeight: 1.6 }}>
                  <p style={{ margin: 0 }}>Fetching from: Reddit · Google Trends · Amazon.in · Flipkart</p>
                  <p style={{ margin: "2px 0 0", fontStyle: "italic" }}>This may take 30–60 seconds due to polite rate-limiting...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Results ───────────────────────────────────── */}
        {result && (
          <div className="fade-up" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#22c55e" }}>✓ Scraping Complete</span>
            </div>

            <div style={{ ...cardBase, padding: "20px 22px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 18 }}>
                {[
                  { label: "Reddit Posts", value: result.reddit_posts || 0, icon: "💬", color: "#60a5fa" },
                  { label: "Trend Keywords", value: result.trends || 0, icon: "📈", color: "#4ade80" },
                  { label: "Product Reviews", value: result.reviews || 0, icon: "⭐", color: "#f59e0b" },
                  { label: "Competitors", value: result.competition || 0, icon: "🏢", color: "#c084fc" },
                ].map(s => (
                  <div key={s.label} style={{
                    textAlign: "center", padding: "14px 10px", borderRadius: 10,
                    background: `${s.color}08`, border: `1px solid ${s.color}20`,
                  }}>
                    <span style={{ fontSize: 22, display: "block", marginBottom: 6 }}>{s.icon}</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: s.color, display: "block", fontFamily: "'JetBrains Mono', monospace" }}>
                      {s.value}
                    </span>
                    <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>{s.label}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 8, background: "rgba(2,6,23,0.5)", border: "1px solid rgba(51,65,85,0.4)" }}>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  Total: <strong style={{ color: "#f8fafc" }}>{totalScraped}</strong> data points collected from live sources
                </span>
                {result.errors && result.errors.length > 0 && (
                  <span style={{ fontSize: 11, color: "#f97316", marginLeft: "auto" }}>
                    {result.errors.length} source(s) had issues
                  </span>
                )}
              </div>

              {result.errors && result.errors.length > 0 && (
                <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
                  <p style={{ fontSize: 11, color: "#fb923c", margin: 0, fontWeight: 600, marginBottom: 4 }}>Partial errors (data from other sources was still collected):</p>
                  {result.errors.map((e, i) => (
                    <p key={i} style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0", fontFamily: "'JetBrains Mono', monospace" }}>• {e}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Run Analysis Button */}
            {totalScraped > 0 && (
              <div style={{ marginTop: 16 }}>
                <button onClick={handleRunAnalysis} disabled={runningAnalysis} style={{
                  width: "100%", padding: "14px 24px", borderRadius: 12,
                  background: runningAnalysis ? "rgba(51,65,85,0.4)" : "linear-gradient(135deg, #22c55e, #16a34a)",
                  border: "none", color: runningAnalysis ? "#64748b" : "#fff",
                  fontSize: 15, fontWeight: 700, cursor: runningAnalysis ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  boxShadow: runningAnalysis ? "none" : "0 4px 20px rgba(34,197,94,0.25)",
                }}>
                  {runningAnalysis ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                      <span style={{ width: 16, height: 16, border: "2px solid #64748b", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                      Running analysis pipeline...
                    </span>
                  ) : (
                    "🧠 Run Full Analysis Pipeline on Scraped Data"
                  )}
                </button>
                <p style={{ fontSize: 11, color: "#475569", textAlign: "center", marginTop: 6 }}>
                  Extracts complaints → scores opportunities → generates product concepts
                </p>
              </div>
            )}

            {analysisResult && (
              <div style={{ ...cardBase, padding: "16px 20px", marginTop: 14, borderColor: "rgba(34,197,94,0.3)" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#22c55e", margin: "0 0 8px" }}>
                  ✓ Analysis Complete — Go to Dashboard to view results
                </p>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
                  Product concepts have been generated from live scraped data. View the Dashboard for full insights, concept briefs, and opportunity scores.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─── Sources Info ──────────────────────────────── */}
        <div className="fade-up" style={{ animationDelay: "0.25s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase" }}>Data Sources</span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, rgba(51,65,85,0.5), transparent)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { icon: "💬", name: "Reddit", desc: "Public posts from relevant subreddits — consumer discussions, complaints, wishlists", color: "#ff4500" },
              { icon: "📈", name: "Google Trends", desc: "Search volume & growth data for product keywords — real demand signals", color: "#4285f4" },
              { icon: "🛒", name: "Amazon India", desc: "Product listings, ratings, and review signals from India's largest marketplace", color: "#ff9900" },
              { icon: "🛍️", name: "Flipkart", desc: "Product data from India's second-largest e-commerce platform", color: "#2874f0" },
            ].map(src => (
              <div key={src.name} style={{ ...cardBase, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{src.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{src.name}</span>
                </div>
                <p style={{ fontSize: 11, color: "#64748b", margin: 0, lineHeight: 1.5 }}>{src.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
