import { useState, useRef, useCallback } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const UPLOAD_STATES = {
  IDLE: "idle",
  UPLOADING: "uploading",
  SUCCESS: "success",
  ERROR: "error",
};

const DATA_TYPES = [
  { key: "reviews", label: "Reviews", icon: "⭐", desc: "Customer product reviews with ratings", endpoint: "/upload/reviews", color: "#f59e0b" },
  { key: "reddit", label: "Reddit", icon: "💬", desc: "Reddit posts and discussion data", endpoint: "/upload/reddit", color: "#4ade80" },
  { key: "trends", label: "Trends", icon: "📈", desc: "Google Trends search volume data", endpoint: "/upload/trends", color: "#60a5fa" },
  { key: "competition", label: "Competition", icon: "🏢", desc: "Competitor product catalog data", endpoint: "/upload/competition", color: "#c084fc" },
  { key: "cumulative", label: "All-in-One", icon: "📦", desc: "Combined file with all data types", endpoint: "/upload/cumulative", color: "#fb923c" },
];

const EXPECTED_COLS = {
  reviews: ["product_name", "brand", "category", "review_text", "rating", "source"],
  reddit: ["subreddit", "title", "post_text", "upvotes", "keyword_detected"],
  trends: ["keyword", "search_volume", "growth_percent", "timeframe"],
  competition: ["product_name", "brand", "category", "format", "price", "ingredient_focus"],
  cumulative: ["data_type", "product_name", "brand", "category", "review_text", "rating", "source", "subreddit", "title", "post_text", "upvotes", "keyword_detected", "keyword", "search_volume", "growth_percent", "timeframe", "format", "price", "ingredient_focus"],
};

const cardBase = {
  background: "rgba(15,23,42,0.65)",
  border: "1px solid rgba(51,65,85,0.5)",
  borderRadius: 14,
  backdropFilter: "blur(12px)",
};

/* Particle burst on success */
function SuccessParticles({ count = 20 }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 300,
    y: -(Math.random() * 200 + 40),
    rot: Math.random() * 360,
    size: 4 + Math.random() * 4,
    dur: 0.8 + Math.random() * 0.6,
    delay: Math.random() * 0.2,
    color: ["#f59e0b", "#fbbf24", "#4ade80", "#60a5fa", "#c084fc"][Math.floor(Math.random() * 5)],
  }));

  return (
    <div style={{ position: "absolute", top: "50%", left: "50%", pointerEvents: "none", zIndex: 10 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute",
          width: p.size, height: p.size, borderRadius: "50%",
          background: p.color,
          animation: `particleFly ${p.dur}s cubic-bezier(0.22,1,0.36,1) ${p.delay}s both`,
          "--px": `${p.x}px`, "--py": `${p.y}px`, "--pr": `${p.rot}deg`,
        }} />
      ))}
    </div>
  );
}

export default function Upload() {
  const [state, setState] = useState(UPLOAD_STATES.IDLE);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [successData, setSuccessData] = useState(null);
  const [selectedType, setSelectedType] = useState("reviews");
  const [uploadHistory, setUploadHistory] = useState([]);
  const fileInputRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setErrorMsg("Only CSV files are accepted.");
      setState(UPLOAD_STATES.ERROR);
      return;
    }
    setFile(f);
    setState(UPLOAD_STATES.IDLE);
    setErrorMsg("");
    setSuccessData(null);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleUpload = async () => {
    if (!file) return;
    setState(UPLOAD_STATES.UPLOADING);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    const type = DATA_TYPES.find(t => t.key === selectedType);
    const endpoint = type?.endpoint || "/upload/reviews";

    const interval = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 15, 88));
    }, 180);

    try {
      const res = await fetch(`${API}${endpoint}`, { method: "POST", body: formData });
      clearInterval(interval);
      setProgress(100);

      if (!res.ok) {
        const errText = await res.text().catch(() => `HTTP ${res.status}`);
        throw new Error(errText || `Server error: ${res.status}`);
      }

      const data = await res.json().catch(() => ({}));
      setSuccessData(data);
      setState(UPLOAD_STATES.SUCCESS);
      setUploadHistory(prev => [
        { name: file.name, type: selectedType, time: new Date(), size: file.size },
        ...prev.slice(0, 4),
      ]);
    } catch (err) {
      clearInterval(interval);
      setErrorMsg(err.message);
      setState(UPLOAD_STATES.ERROR);
    }
  };

  const reset = () => {
    setFile(null);
    setState(UPLOAD_STATES.IDLE);
    setProgress(0);
    setErrorMsg("");
    setSuccessData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploading = state === UPLOAD_STATES.UPLOADING;
  const currentType = DATA_TYPES.find(t => t.key === selectedType);
  const cols = EXPECTED_COLS[selectedType] || [];

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes checkDraw { from{stroke-dashoffset:24}to{stroke-dashoffset:0} }
        @keyframes particleFly { 0%{transform:translate(0,0) rotate(0) scale(1);opacity:1} 100%{transform:translate(var(--px),var(--py)) rotate(var(--pr)) scale(0);opacity:0} }
        @keyframes scaleIn { from{transform:scale(0.9);opacity:0}to{transform:scale(1);opacity:1} }
        @keyframes glow { 0%,100%{box-shadow:0 0 8px rgba(245,158,11,0.15)}50%{box-shadow:0 0 24px rgba(245,158,11,0.3)} }
        .fade-up { animation:fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .upload-type-btn { transition:all 0.22s ease; cursor:pointer; outline:none; }
        .upload-type-btn:hover { transform:translateY(-2px); }
      `}</style>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "#f59e0b", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", fontWeight: 600 }}>DATA INGESTION</span>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.03em", margin: 0, lineHeight: 1.1 }}>
            Upload Market Data
          </h1>
          <p style={{ fontSize: 14, color: "#475569", marginTop: 6 }}>
            Feed your analysis pipeline with structured CSV data from multiple sources
          </p>
        </div>

        {/* Data Type Selector */}
        <div className="fade-up" style={{ marginBottom: 24, animationDelay: "0.05s" }}>
          <p style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 10, textTransform: "uppercase" }}>Select Data Source</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
            {DATA_TYPES.map(type => {
              const active = selectedType === type.key;
              return (
                <button key={type.key} className="upload-type-btn"
                  onClick={() => { setSelectedType(type.key); reset(); }}
                  style={{
                    padding: "16px 14px",
                    borderRadius: 12,
                    background: active ? `${type.color}12` : "rgba(15,23,42,0.5)",
                    border: `1.5px solid ${active ? `${type.color}50` : "rgba(51,65,85,0.4)"}`,
                    boxShadow: active ? `0 0 20px ${type.color}15` : "none",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{type.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: active ? type.color : "#94a3b8" }}>{type.label}</div>
                  <div style={{ fontSize: 10, color: "#475569", marginTop: 3, lineHeight: 1.3 }}>{type.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Drop Zone */}
        <div className="fade-up" style={{ animationDelay: "0.1s" }}>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !file && !uploading && fileInputRef.current?.click()}
            style={{
              borderRadius: 14, padding: "52px 32px", textAlign: "center",
              cursor: file ? "default" : "pointer",
              position: "relative", overflow: "hidden",
              border: `2px dashed ${dragOver ? currentType.color : file ? "rgba(34,197,94,0.35)" : "rgba(51,65,85,0.6)"}`,
              background: dragOver
                ? `${currentType.color}08`
                : file
                  ? "rgba(34,197,94,0.03)"
                  : "rgba(15,23,42,0.5)",
              transition: "all 0.25s ease",
              boxShadow: dragOver ? `0 0 0 4px ${currentType.color}10, inset 0 0 40px ${currentType.color}05` : "none",
            }}
          >
            <input ref={fileInputRef} type="file" accept=".csv"
              onChange={e => handleFile(e.target.files?.[0])}
              style={{ display: "none" }} disabled={uploading}
            />

            {state === UPLOAD_STATES.SUCCESS && <SuccessParticles />}

            {!file ? (
              <>
                <div style={{
                  width: 64, height: 64, borderRadius: 16, margin: "0 auto 20px",
                  background: `${currentType.color}10`, border: `1px solid ${currentType.color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.3s",
                  ...(dragOver && { transform: "scale(1.1)", animation: "glow 1.5s ease infinite" }),
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={currentType.color} strokeWidth="1.5" width="30" height="30">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                </div>
                <p style={{ color: "#cbd5e1", fontWeight: 600, fontSize: 16, marginBottom: 6 }}>
                  {dragOver ? "Release to upload" : `Drop your ${currentType.label} CSV here`}
                </p>
                <p style={{ color: "#475569", fontSize: 13 }}>
                  or <span style={{ color: currentType.color, textDecoration: "underline", cursor: "pointer" }}>browse to select</span>
                </p>
                <p style={{ color: "#334155", fontSize: 11, marginTop: 16, fontFamily: "'JetBrains Mono', monospace" }}>
                  Accepted: .csv · UTF-8 · Max 50MB
                </p>
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
                {state === UPLOAD_STATES.SUCCESS ? (
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    animation: "scaleIn 0.4s cubic-bezier(0.22,1,0.36,1) both",
                  }}>
                    <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
                      <path d="M5 13l4 4L19 7" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        strokeDasharray="24" style={{ animation: "checkDraw 0.5s ease 0.2s both" }} />
                    </svg>
                  </div>
                ) : (
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.5" width="24" height="24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                )}
                <div style={{ textAlign: "left" }}>
                  <p style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 15, margin: 0 }}>{file.name}</p>
                  <p style={{ color: "#64748b", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", marginTop: 3 }}>
                    {(file.size / 1024).toFixed(1)} KB · {currentType.label} data
                  </p>
                </div>
                {!uploading && state !== UPLOAD_STATES.SUCCESS && (
                  <button onClick={e => { e.stopPropagation(); reset(); }} style={{
                    padding: "6px 14px", borderRadius: 8, cursor: "pointer",
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                    color: "#fca5a5", fontSize: 12, fontWeight: 500, outline: "none",
                    transition: "all 0.2s",
                  }}
                    onMouseOver={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
                    onMouseOut={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="fade-up" style={{ marginTop: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#94a3b8", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  border: "2px solid rgba(245,158,11,0.2)", borderTopColor: "#f59e0b",
                  animation: "spin 0.8s linear infinite",
                }} />
                Uploading to pipeline…
              </span>
              <span style={{ color: currentType.color, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                {Math.round(progress)}%
              </span>
            </div>
            <div style={{ height: 6, background: "rgba(30,41,59,0.6)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                background: `linear-gradient(90deg, ${currentType.color}, ${currentType.color}cc)`,
                borderRadius: 3, width: `${progress}%`,
                boxShadow: `0 0 12px ${currentType.color}50`,
                transition: "width 0.25s ease",
              }} />
            </div>
          </div>
        )}

        {/* Upload Button */}
        {file && state !== UPLOAD_STATES.SUCCESS && (
          <button onClick={handleUpload} disabled={uploading} className="fade-up" style={{
            width: "100%", marginTop: 18, padding: "14px 24px",
            borderRadius: 12, cursor: uploading ? "not-allowed" : "pointer",
            background: uploading ? "rgba(51,65,85,0.4)" : `linear-gradient(135deg, ${currentType.color}, ${currentType.color}cc)`,
            border: "none",
            color: uploading ? "#64748b" : "#0f172a",
            fontSize: 14, fontWeight: 700, letterSpacing: "0.01em",
            boxShadow: uploading ? "none" : `0 4px 24px ${currentType.color}40`,
            transition: "all 0.25s ease", outline: "none",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            animationDelay: "0.15s",
          }}>
            {uploading ? (
              <>
                <div style={{
                  width: 14, height: 14,
                  border: "2px solid rgba(100,116,139,0.3)", borderTopColor: "#64748b",
                  borderRadius: "50%", animation: "spin 0.8s linear infinite",
                }} />
                Processing…
              </>
            ) : (
              <>
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                Upload {currentType.label} Data
              </>
            )}
          </button>
        )}

        {/* Success State */}
        {state === UPLOAD_STATES.SUCCESS && (
          <div className="fade-up" style={{
            marginTop: 20, padding: "24px 28px", borderRadius: 14,
            background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)",
            position: "relative",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg viewBox="0 0 20 20" fill="#4ade80" width="20" height="20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: "#4ade80", fontWeight: 700, fontSize: 16, margin: 0 }}>Upload Successful</p>
                <p style={{ color: "#94a3b8", fontSize: 13, margin: 0, marginTop: 4 }}>
                  <span style={{ color: "#cbd5e1", fontWeight: 600 }}>{file?.name}</span> has been ingested into the {currentType.label} pipeline.
                </p>
                {successData?.message && (
                  <p style={{ color: "#64748b", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", marginTop: 8,
                    padding: "8px 12px", background: "rgba(2,6,23,0.4)", borderRadius: 8, display: "inline-block" }}>
                    {successData.message}
                  </p>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button onClick={reset} style={{
                padding: "9px 20px", borderRadius: 10, cursor: "pointer",
                background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
                color: "#4ade80", fontSize: 13, fontWeight: 600, outline: "none",
                transition: "all 0.2s",
              }}
                onMouseOver={e => { e.currentTarget.style.background = "rgba(34,197,94,0.15)"; }}
                onMouseOut={e => { e.currentTarget.style.background = "rgba(34,197,94,0.08)"; }}
              >
                Upload Another
              </button>
              <a href="/" style={{
                padding: "9px 20px", borderRadius: 10, cursor: "pointer",
                background: "rgba(51,65,85,0.3)", border: "1px solid rgba(71,85,105,0.4)",
                color: "#94a3b8", fontSize: 13, fontWeight: 500, textDecoration: "none",
                transition: "all 0.2s", display: "inline-flex", alignItems: "center", gap: 6,
              }}>
                View Dashboard →
              </a>
            </div>
          </div>
        )}

        {/* Error State */}
        {state === UPLOAD_STATES.ERROR && (
          <div className="fade-up" style={{
            marginTop: 18, padding: "20px 24px", borderRadius: 14,
            background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>❌</span>
              <div>
                <p style={{ color: "#fca5a5", fontWeight: 600, fontSize: 14, margin: 0 }}>
                  {errorMsg.includes("CSV") ? "Invalid File Type" : "Upload Failed"}
                </p>
                <p style={{ color: "#94a3b8", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>{errorMsg}</p>
              </div>
            </div>
            <button onClick={reset} style={{
              marginTop: 14, padding: "7px 16px", borderRadius: 8, cursor: "pointer",
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              color: "#fca5a5", fontSize: 12, fontWeight: 500, outline: "none",
              transition: "all 0.2s",
            }}>
              Try Again
            </button>
          </div>
        )}

        {/* Expected Format */}
        <div className="fade-up" style={{ marginTop: 32, animationDelay: "0.2s" }}>
          <div style={{ ...cardBase, padding: "22px 26px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <p style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.08em", fontWeight: 600, margin: 0, textTransform: "uppercase" }}>
                Expected CSV Format — {currentType.label}
              </p>
              <span style={{
                fontSize: 10, padding: "3px 8px", borderRadius: 5,
                background: `${currentType.color}12`, color: currentType.color,
                fontWeight: 600, border: `1px solid ${currentType.color}30`,
              }}>
                {cols.length} columns
              </span>
            </div>
            <div style={{
              padding: "14px 18px", borderRadius: 10,
              background: "rgba(2,6,23,0.6)", border: "1px solid rgba(30,41,59,0.6)",
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#94a3b8", lineHeight: 1.8,
              overflowX: "auto",
            }}>
              {cols.map((col, i) => (
                <span key={col}>
                  <span style={{ color: currentType.color }}>{col}</span>
                  {i < cols.length - 1 && <span style={{ color: "#334155" }}>, </span>}
                </span>
              ))}
            </div>
            <p style={{ color: "#334155", fontSize: 11, marginTop: 10 }}>
              Headers must be present · UTF-8 encoding · Comma-separated
            </p>
          </div>
        </div>

        {/* Upload History */}
        {uploadHistory.length > 0 && (
          <div className="fade-up" style={{ marginTop: 24, animationDelay: "0.25s" }}>
            <div style={{ ...cardBase, padding: "22px 26px" }}>
              <p style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 14, textTransform: "uppercase" }}>
                Recent Uploads
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {uploadHistory.map((h, i) => {
                  const t = DATA_TYPES.find(dt => dt.key === h.type);
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 14px", borderRadius: 10,
                      background: "rgba(2,6,23,0.4)", border: "1px solid rgba(30,41,59,0.5)",
                    }}>
                      <span style={{ fontSize: 16 }}>{t?.icon || "📄"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</p>
                        <p style={{ fontSize: 11, color: "#475569", margin: 0, marginTop: 2 }}>
                          {t?.label} · {(h.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} />
                        <span style={{ fontSize: 11, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>
                          {h.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}