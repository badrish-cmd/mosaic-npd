import { useState, useEffect } from "react";

/* ══════════════════════════════════════════════════════════════════════
   AI REVIEW SCRAPING — Coming Soon placeholder
   ══════════════════════════════════════════════════════════════════════ */

const PLANNED_FEATURES = [
  {
    icon: "🌐",
    title: "Multi-Platform Scraping",
    desc: "Automatically scrape reviews from Amazon, Sephora, Ulta, Reddit, and 20+ other platforms",
    color: "#60a5fa",
  },
  {
    icon: "🤖",
    title: "AI-Powered Extraction",
    desc: "LLM-driven parsing that understands review context, sentiment, and product attributes automatically",
    color: "#f59e0b",
  },
  {
    icon: "🔄",
    title: "Scheduled Collection",
    desc: "Set up recurring scraping jobs — daily, weekly, or monthly — and auto-feed data into your pipeline",
    color: "#4ade80",
  },
  {
    icon: "🎯",
    title: "Smart Filtering",
    desc: "Target specific brands, categories, keywords, or competitor products with precision filters",
    color: "#c084fc",
  },
  {
    icon: "📊",
    title: "Auto-Format & Upload",
    desc: "Scraped data is automatically formatted and uploaded — no manual CSV conversion needed",
    color: "#fb923c",
  },
  {
    icon: "🔒",
    title: "Ethical & Compliant",
    desc: "Rate-limited, robots.txt-respecting scraping with built-in proxy rotation and CAPTCHA handling",
    color: "#f472b6",
  },
];

const cardBase = {
  background: "rgba(15,23,42,0.65)",
  border: "1px solid rgba(51,65,85,0.5)",
  borderRadius: 14,
  backdropFilter: "blur(12px)",
};

export default function AIScraping() {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setPulse((p) => p + 1), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)} }
        @keyframes pulse-ring { 0%{transform:scale(0.8);opacity:0.6}100%{transform:scale(2.2);opacity:0} }
        @keyframes scan-line { 0%{top:-2px}100%{top:100%} }
        @keyframes shimmer { 0%{background-position:-700px 0}100%{background-position:700px 0} }
        @keyframes orbit { from{transform:rotate(0deg) translateX(120px) rotate(0deg)}to{transform:rotate(360deg) translateX(120px) rotate(-360deg)} }
        @keyframes orbit2 { from{transform:rotate(180deg) translateX(90px) rotate(-180deg)}to{transform:rotate(540deg) translateX(90px) rotate(-540deg)} }
        @keyframes glow-breathe { 0%,100%{box-shadow:0 0 30px rgba(245,158,11,0.15),0 0 60px rgba(245,158,11,0.05)}50%{box-shadow:0 0 50px rgba(245,158,11,0.25),0 0 100px rgba(245,158,11,0.1)} }
        .fade-up { animation:fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .feature-card { transition:all 0.25s ease; cursor:default; }
        .feature-card:hover { transform:translateY(-3px); border-color:rgba(245,158,11,0.25) !important; background:rgba(15,23,42,0.8) !important; }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px", position: "relative" }}>

        {/* ─── Hero Section ─────────────────────────────────── */}
        <div className="fade-up" style={{
          textAlign: "center", marginBottom: 48, position: "relative",
        }}>
          {/* Orbiting elements */}
          <div style={{
            position: "relative", width: 200, height: 200, margin: "0 auto 32px",
          }}>
            {/* Central icon */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 90, height: 90, borderRadius: 22,
              background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.1))",
              border: "1.5px solid rgba(245,158,11,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "glow-breathe 4s ease-in-out infinite, float 6s ease-in-out infinite",
              zIndex: 2,
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" width="42" height="42">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>

            {/* Pulse ring */}
            <div key={`ring-${pulse}`} style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 90, height: 90, borderRadius: 22,
              border: "2px solid rgba(245,158,11,0.3)",
              animation: "pulse-ring 3s ease-out infinite",
            }} />

            {/* Orbiting dot 1 */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              width: 10, height: 10, marginLeft: -5, marginTop: -5,
              animation: "orbit 8s linear infinite",
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: "#60a5fa", boxShadow: "0 0 12px rgba(96,165,250,0.5)",
              }} />
            </div>

            {/* Orbiting dot 2 */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              width: 8, height: 8, marginLeft: -4, marginTop: -4,
              animation: "orbit2 6s linear infinite",
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "#4ade80", boxShadow: "0 0 10px rgba(74,222,128,0.5)",
              }} />
            </div>
          </div>

          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", borderRadius: 20, marginBottom: 18,
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.2)",
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#f59e0b", display: "block",
              animation: "liveGlow 2s infinite",
            }} />
            <span style={{
              fontSize: 11, color: "#f59e0b",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600, letterSpacing: "0.1em",
            }}>
              IN DEVELOPMENT
            </span>
          </div>

          <h1 style={{
            fontSize: 34, fontWeight: 800, color: "#f8fafc",
            letterSpacing: "-0.03em", margin: "0 0 8px", lineHeight: 1.15,
          }}>
            AI Review Scraping
          </h1>
          <p style={{
            fontSize: 16, color: "#64748b", maxWidth: 520,
            margin: "0 auto", lineHeight: 1.6,
          }}>
            Intelligent, automated review collection powered by AI.
            Scrape, parse, and format data from any platform — hands-free.
          </p>
        </div>

        {/* ─── Planned Features Grid ────────────────────────── */}
        <div className="fade-up" style={{ animationDelay: "0.08s" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 18,
          }}>
            <span style={{
              fontSize: 11, color: "#64748b", letterSpacing: "0.08em",
              fontWeight: 600, textTransform: "uppercase",
            }}>
              Planned Capabilities
            </span>
            <div style={{
              flex: 1, height: 1,
              background: "linear-gradient(to right, rgba(51,65,85,0.5), transparent)",
            }} />
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 14,
            marginBottom: 36,
          }}>
            {PLANNED_FEATURES.map((feat, i) => (
              <div
                key={feat.title}
                className="feature-card fade-up"
                style={{
                  ...cardBase, padding: "22px 20px",
                  animationDelay: `${0.1 + i * 0.04}s`,
                  position: "relative", overflow: "hidden",
                }}
              >
                {/* Scan line effect */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0,
                  height: 1, background: `linear-gradient(to right, transparent, ${feat.color}30, transparent)`,
                  animation: `scan-line 4s linear ${i * 0.5}s infinite`,
                  opacity: 0.6,
                }} />

                <div style={{
                  width: 40, height: 40, borderRadius: 10, marginBottom: 14,
                  background: `${feat.color}10`,
                  border: `1px solid ${feat.color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20,
                }}>
                  {feat.icon}
                </div>
                <h3 style={{
                  fontSize: 14, fontWeight: 700, color: "#e2e8f0",
                  marginBottom: 6,
                }}>
                  {feat.title}
                </h3>
                <p style={{
                  fontSize: 12, color: "#64748b", lineHeight: 1.55, margin: 0,
                }}>
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Mockup Preview ───────────────────────────────── */}
        <div className="fade-up" style={{ animationDelay: "0.28s" }}>
          <div style={{
            ...cardBase, padding: 0, overflow: "hidden",
            position: "relative",
          }}>
            {/* Header bar */}
            <div style={{
              padding: "16px 24px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              borderBottom: "1px solid rgba(51,65,85,0.4)",
              background: "rgba(2,6,23,0.5)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "rgba(245,158,11,0.1)",
                  border: "1px solid rgba(245,158,11,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15,
                }}>🔍</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", margin: 0 }}>
                    Scraping Job Preview
                  </p>
                  <p style={{ fontSize: 10, color: "#475569", margin: 0, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                    What the interface will look like
                  </p>
                </div>
              </div>
              <span style={{
                fontSize: 10, padding: "4px 10px", borderRadius: 6,
                background: "rgba(51,65,85,0.4)", border: "1px solid rgba(71,85,105,0.4)",
                color: "#64748b", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
              }}>
                PREVIEW
              </span>
            </div>

            {/* Faux form */}
            <div style={{ padding: "22px 24px" }}>
              {/* Row 1: Platform + keyword */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 10, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                    Platform
                  </label>
                  <div style={{
                    padding: "10px 14px", borderRadius: 8,
                    background: "rgba(2,6,23,0.6)", border: "1.5px solid rgba(51,65,85,0.5)",
                    color: "#475569", fontSize: 13,
                  }}>
                    Amazon, Sephora, Reddit...
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                    Search Keywords
                  </label>
                  <div style={{
                    padding: "10px 14px", borderRadius: 8,
                    background: "rgba(2,6,23,0.6)", border: "1.5px solid rgba(51,65,85,0.5)",
                    color: "#475569", fontSize: 13,
                  }}>
                    e.g. "vitamin C serum"
                  </div>
                </div>
              </div>

              {/* Row 2: Brand + category */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 10, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                    Brand Filter
                  </label>
                  <div style={{
                    padding: "10px 14px", borderRadius: 8,
                    background: "rgba(2,6,23,0.6)", border: "1.5px solid rgba(51,65,85,0.5)",
                    color: "#475569", fontSize: 13,
                  }}>
                    Any brand
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                    Max Reviews
                  </label>
                  <div style={{
                    padding: "10px 14px", borderRadius: 8,
                    background: "rgba(2,6,23,0.6)", border: "1.5px solid rgba(51,65,85,0.5)",
                    color: "#475569", fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    500
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                    Schedule
                  </label>
                  <div style={{
                    padding: "10px 14px", borderRadius: 8,
                    background: "rgba(2,6,23,0.6)", border: "1.5px solid rgba(51,65,85,0.5)",
                    color: "#475569", fontSize: 13,
                  }}>
                    Weekly
                  </div>
                </div>
              </div>

              {/* Faux button */}
              <div style={{
                padding: "12px 24px", borderRadius: 10, textAlign: "center",
                background: "rgba(51,65,85,0.3)", border: "1px solid rgba(71,85,105,0.4)",
                color: "#475569", fontSize: 14, fontWeight: 600,
                cursor: "not-allowed",
              }}>
                🚀 Start Scraping — Coming Soon
              </div>
            </div>

            {/* Glass overlay */}
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(2,6,23,0.25)",
              backdropFilter: "blur(1px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              pointerEvents: "none",
            }}>
              <div style={{
                padding: "14px 28px", borderRadius: 12,
                background: "rgba(15,23,42,0.9)",
                border: "1px solid rgba(245,158,11,0.25)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}>
                <span style={{
                  fontSize: 13, fontWeight: 700, color: "#f59e0b",
                  letterSpacing: "0.06em",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  🔒 COMING SOON
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Timeline ─────────────────────────────────────── */}
        <div className="fade-up" style={{ marginTop: 36, animationDelay: "0.35s" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 18,
          }}>
            <span style={{
              fontSize: 11, color: "#64748b", letterSpacing: "0.08em",
              fontWeight: 600, textTransform: "uppercase",
            }}>
              Development Roadmap
            </span>
            <div style={{
              flex: 1, height: 1,
              background: "linear-gradient(to right, rgba(51,65,85,0.5), transparent)",
            }} />
          </div>

          <div style={{ ...cardBase, padding: "24px 28px" }}>
            {[
              { phase: "Phase 1", title: "Core Scraping Engine", status: "planned", desc: "Build the multi-platform scraping infrastructure with rate limiting and proxy support", color: "#60a5fa" },
              { phase: "Phase 2", title: "AI Parsing Layer", status: "planned", desc: "Integrate LLM-powered extraction for automated review parsing and sentiment detection", color: "#f59e0b" },
              { phase: "Phase 3", title: "Scheduling & Automation", status: "planned", desc: "Add recurring job scheduling, webhook triggers, and auto-upload pipeline", color: "#4ade80" },
              { phase: "Phase 4", title: "Dashboard & Analytics", status: "planned", desc: "Live scraping metrics, collection history, and data quality monitoring", color: "#c084fc" },
            ].map((item, i) => (
              <div key={item.phase} style={{
                display: "flex", gap: 18, alignItems: "flex-start",
                paddingBottom: i < 3 ? 20 : 0,
                marginBottom: i < 3 ? 20 : 0,
                borderBottom: i < 3 ? "1px solid rgba(30,41,59,0.5)" : "none",
              }}>
                {/* Phase badge */}
                <div style={{
                  minWidth: 80, padding: "6px 0", textAlign: "center",
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: item.color, letterSpacing: "0.08em",
                  }}>
                    {item.phase}
                  </span>
                  <div style={{
                    marginTop: 6, padding: "3px 10px", borderRadius: 5,
                    background: "rgba(51,65,85,0.3)",
                    border: "1px solid rgba(71,85,105,0.3)",
                    fontSize: 9, color: "#64748b", fontWeight: 600,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: "0.06em", textTransform: "uppercase",
                  }}>
                    {item.status}
                  </div>
                </div>
                {/* Content */}
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", margin: 0, marginBottom: 4 }}>
                    {item.title}
                  </h4>
                  <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Notify CTA ───────────────────────────────────── */}
        <div className="fade-up" style={{
          marginTop: 32, textAlign: "center", animationDelay: "0.4s",
        }}>
          <p style={{ fontSize: 13, color: "#475569", marginBottom: 12 }}>
            This feature is under active development. Stay tuned for updates.
          </p>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "10px 20px", borderRadius: 10,
            background: "rgba(15,23,42,0.65)",
            border: "1px solid rgba(51,65,85,0.5)",
            fontSize: 12, color: "#64748b",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            <span style={{ color: "#f59e0b" }}>⚡</span>
            Estimated availability: Q3 2026
          </div>
        </div>
      </div>
    </>
  );
}
