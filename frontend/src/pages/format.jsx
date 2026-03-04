import { useState, useRef, useCallback, useMemo } from "react";

/* ══════════════════════════════════════════════════════════════════════
   CONFIG
   ══════════════════════════════════════════════════════════════════════ */
const DATA_TYPES = [
  { key: "reviews",     label: "Reviews",     icon: "⭐", color: "#f59e0b" },
  { key: "reddit",      label: "Reddit",      icon: "💬", color: "#4ade80" },
  { key: "trends",      label: "Trends",      icon: "📈", color: "#60a5fa" },
  { key: "competition", label: "Competition", icon: "🏢", color: "#c084fc" },
  { key: "cumulative",  label: "Cumulative",  icon: "📦", color: "#fb923c" },
];

const REQUIRED_COLS = {
  reviews:     ["product_name", "brand", "category", "review_text", "rating", "source"],
  reddit:      ["subreddit", "title", "post_text", "upvotes", "keyword_detected"],
  trends:      ["keyword", "search_volume", "growth_percent", "timeframe"],
  competition: ["product_name", "brand", "category", "format", "price", "ingredient_focus"],
  cumulative:  ["data_type", "product_name", "brand", "category", "review_text", "rating", "source", "subreddit", "title", "post_text", "upvotes", "keyword_detected", "keyword", "search_volume", "growth_percent", "timeframe", "format", "price", "ingredient_focus"],
};

const COL_HINTS = {
  data_type:        "Row type: reviews / reddit / trends / competition",
  product_name:     "Name of the product",
  brand:            "Brand / manufacturer",
  category:         "Product category",
  review_text:      "Full review content",
  rating:           "Numeric rating (1-5)",
  source:           "Where the review came from",
  subreddit:        "Subreddit name",
  title:            "Post title",
  post_text:        "Post body text",
  upvotes:          "Number of upvotes",
  keyword_detected: "Detected keyword tag",
  keyword:          "Search keyword",
  search_volume:    "Monthly search volume",
  growth_percent:   "Growth % over timeframe",
  timeframe:        "Period (e.g. 12m)",
  format:           "Product format (Serum, Oil…)",
  price:            "Price in local currency",
  ingredient_focus: "Key ingredient",
};

const cardBase = {
  background: "rgba(15,23,42,0.65)",
  border: "1px solid rgba(51,65,85,0.5)",
  borderRadius: 14,
  backdropFilter: "blur(12px)",
};

/* ══════════════════════════════════════════════════════════════════════
   CSV PARSER — handles quoted fields with commas
   ══════════════════════════════════════════════════════════════════════ */
function parseCSV(text) {
  const lines = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "\n" && !inQuotes) {
      if (current.endsWith("\r")) current = current.slice(0, -1);
      if (current.trim()) lines.push(splitRow(current));
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(splitRow(current));
  return lines;
}

function splitRow(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

/* ══════════════════════════════════════════════════════════════════════
   GENERATE DOWNLOADABLE CSV
   ══════════════════════════════════════════════════════════════════════ */
function generateCSV(headers, rows) {
  const escape = (v) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? '"' + s.replace(/"/g, '""') + '"'
      : s;
  };
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(headers.map((_, i) => escape(row[i] ?? "")).join(","));
  }
  return lines.join("\n");
}

function downloadFile(content, filename) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════════════════════════════════════
   AUTO-MAP — guess which source column matches a target column
   ══════════════════════════════════════════════════════════════════════ */
function autoMap(sourceHeaders, targetCols) {
  const mapping = {};
  for (const target of targetCols) {
    // exact match (case-insensitive)
    const exact = sourceHeaders.find(
      (h) => h.toLowerCase().trim() === target.toLowerCase()
    );
    if (exact) { mapping[target] = exact; continue; }

    // fuzzy: check if column contains the target words
    const words = target.split("_");
    const fuzzy = sourceHeaders.find((h) => {
      const hl = h.toLowerCase();
      return words.every((w) => hl.includes(w));
    });
    if (fuzzy) { mapping[target] = fuzzy; continue; }

    // partial: any overlap
    const partial = sourceHeaders.find((h) => {
      const hl = h.toLowerCase();
      return words.some((w) => w.length > 2 && hl.includes(w));
    });
    if (partial && !Object.values(mapping).includes(partial)) {
      mapping[target] = partial;
    }
  }
  return mapping;
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════ */
export default function FormatData() {
  const [selectedType, setSelectedType] = useState("reviews");
  const [rawFile, setRawFile] = useState(null);
  const [sourceHeaders, setSourceHeaders] = useState([]);
  const [sourceRows, setSourceRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const [step, setStep] = useState(1); // 1=upload, 2=map, 3=preview
  const fileRef = useRef(null);

  const targetCols = REQUIRED_COLS[selectedType] || [];
  const currentType = DATA_TYPES.find((t) => t.key === selectedType);

  /* ── Handle file ─────────────────────────────────────────── */
  const handleFile = useCallback(
    (f) => {
      if (!f) return;
      setRawFile(f);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const parsed = parseCSV(text);
        if (parsed.length < 2) return;
        const headers = parsed[0];
        const rows = parsed.slice(1);
        setSourceHeaders(headers);
        setSourceRows(rows);
        const auto = autoMap(headers, REQUIRED_COLS[selectedType]);
        setMapping(auto);
        setStep(2);
      };
      reader.readAsText(f);
    },
    [selectedType]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      handleFile(e.dataTransfer.files?.[0]);
    },
    [handleFile]
  );

  const reset = () => {
    setRawFile(null);
    setSourceHeaders([]);
    setSourceRows([]);
    setMapping({});
    setStep(1);
    if (fileRef.current) fileRef.current.value = "";
  };

  /* ── Build mapped data ───────────────────────────────────── */
  const mappedRows = useMemo(() => {
    if (!sourceRows.length) return [];
    return sourceRows.map((row) =>
      targetCols.map((col) => {
        const srcCol = mapping[col];
        if (!srcCol) return "";
        const idx = sourceHeaders.indexOf(srcCol);
        return idx >= 0 ? (row[idx] ?? "") : "";
      })
    );
  }, [sourceRows, sourceHeaders, mapping, targetCols]);

  const mappedCount = Object.keys(mapping).length;
  const totalRequired = targetCols.length;

  /* ── Download ────────────────────────────────────────────── */
  const handleDownload = () => {
    const csv = generateCSV(targetCols, mappedRows);
    downloadFile(csv, `${selectedType}_formatted.csv`);
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes scaleIn { from{transform:scale(0.95);opacity:0}to{transform:scale(1);opacity:1} }
        @keyframes glow { 0%,100%{box-shadow:0 0 8px rgba(245,158,11,0.15)}50%{box-shadow:0 0 24px rgba(245,158,11,0.3)} }
        .fade-up { animation:fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .fmt-select { transition:all 0.2s ease; cursor:pointer; outline:none; }
        .fmt-select:hover { border-color:rgba(245,158,11,0.4) !important; background:rgba(245,158,11,0.06) !important; }
        .fmt-btn { transition:all 0.22s ease; cursor:pointer; outline:none; }
        .fmt-btn:hover { transform:translateY(-1px); }
        .fmt-row:hover { background:rgba(245,158,11,0.04) !important; }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* ─── Header ────────────────────────────────────────── */}
        <div className="fade-up" style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{
              fontSize: 11, color: "#f59e0b",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.1em", fontWeight: 600,
            }}>
              DATA FORMATTER
            </span>
          </div>
          <h1 style={{
            fontSize: 30, fontWeight: 800, color: "#f8fafc",
            letterSpacing: "-0.03em", margin: 0, lineHeight: 1.1,
          }}>
            Convert & Format Data
          </h1>
          <p style={{ fontSize: 14, color: "#475569", marginTop: 6 }}>
            Upload any CSV file, map your columns to the required format, preview, and download — ready for upload
          </p>
        </div>

        {/* ─── Step indicator ────────────────────────────────── */}
        <div className="fade-up" style={{ marginBottom: 28, animationDelay: "0.03s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {[
              { n: 1, label: "Upload File" },
              { n: 2, label: "Map Columns" },
              { n: 3, label: "Preview & Download" },
            ].map((s, i) => {
              const active = step >= s.n;
              const current = step === s.n;
              return (
                <div key={s.n} style={{ display: "flex", alignItems: "center" }}>
                  {i > 0 && (
                    <div style={{
                      width: 40, height: 2, borderRadius: 1,
                      background: step > s.n - 1 ? currentType.color : "rgba(51,65,85,0.4)",
                      transition: "background 0.3s",
                    }} />
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                      background: active ? `${currentType.color}18` : "rgba(30,41,59,0.5)",
                      border: `1.5px solid ${active ? `${currentType.color}50` : "rgba(51,65,85,0.5)"}`,
                      color: active ? currentType.color : "#475569",
                      boxShadow: current ? `0 0 12px ${currentType.color}20` : "none",
                      transition: "all 0.3s",
                    }}>
                      {step > s.n ? "✓" : s.n}
                    </div>
                    <span style={{
                      fontSize: 12, fontWeight: current ? 600 : 500,
                      color: active ? "#cbd5e1" : "#475569",
                      transition: "color 0.3s",
                    }}>
                      {s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── STEP 1: Select type & upload ──────────────────── */}
        {step === 1 && (
          <div className="fade-up" style={{ animationDelay: "0.06s" }}>
            {/* Data type selector */}
            <div style={{ marginBottom: 22 }}>
              <p style={{
                fontSize: 11, color: "#64748b", letterSpacing: "0.08em",
                fontWeight: 600, marginBottom: 10, textTransform: "uppercase",
              }}>
                Target Format
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
                {DATA_TYPES.map((type) => {
                  const active = selectedType === type.key;
                  return (
                    <button
                      key={type.key}
                      className="fmt-btn"
                      onClick={() => { setSelectedType(type.key); reset(); }}
                      style={{
                        padding: "16px 14px", borderRadius: 12, textAlign: "center",
                        background: active ? `${type.color}12` : "rgba(15,23,42,0.5)",
                        border: `1.5px solid ${active ? `${type.color}50` : "rgba(51,65,85,0.4)"}`,
                        boxShadow: active ? `0 0 20px ${type.color}15` : "none",
                      }}
                    >
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{type.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: active ? type.color : "#94a3b8" }}>
                        {type.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Required columns preview */}
            <div style={{ ...cardBase, padding: "18px 22px", marginBottom: 22 }}>
              <p style={{
                fontSize: 11, color: "#64748b", letterSpacing: "0.08em",
                fontWeight: 600, marginBottom: 10, textTransform: "uppercase",
              }}>
                Required columns for {currentType.label}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {targetCols.map((col) => (
                  <span key={col} title={COL_HINTS[col]} style={{
                    padding: "5px 12px", borderRadius: 7, fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
                    background: `${currentType.color}10`,
                    border: `1px solid ${currentType.color}28`,
                    color: currentType.color,
                    cursor: "help",
                  }}>
                    {col}
                  </span>
                ))}
              </div>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                ...cardBase, padding: "52px 32px", textAlign: "center",
                cursor: "pointer", position: "relative",
                borderStyle: "dashed", borderWidth: 2,
                borderColor: dragOver ? currentType.color : "rgba(51,65,85,0.6)",
                background: dragOver ? `${currentType.color}08` : "rgba(15,23,42,0.5)",
                transition: "all 0.25s ease",
                boxShadow: dragOver ? `0 0 0 4px ${currentType.color}10` : "none",
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={(e) => handleFile(e.target.files?.[0])}
                style={{ display: "none" }}
              />
              <div style={{
                width: 64, height: 64, borderRadius: 16, margin: "0 auto 20px",
                background: `${currentType.color}10`,
                border: `1px solid ${currentType.color}25`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.3s",
                ...(dragOver && { transform: "scale(1.1)", animation: "glow 1.5s ease infinite" }),
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={currentType.color} strokeWidth="1.5" width="30" height="30">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
                </svg>
              </div>
              <p style={{ color: "#cbd5e1", fontWeight: 600, fontSize: 16, marginBottom: 6 }}>
                {dragOver ? "Release to upload" : "Drop your CSV file here"}
              </p>
              <p style={{ color: "#475569", fontSize: 13 }}>
                or <span style={{ color: currentType.color, textDecoration: "underline" }}>browse to select</span>
              </p>
              <p style={{ color: "#334155", fontSize: 11, marginTop: 16, fontFamily: "'JetBrains Mono', monospace" }}>
                Any CSV format accepted — you'll map columns in the next step
              </p>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Column mapping ────────────────────────── */}
        {step === 2 && (
          <div className="fade-up" style={{ animationDelay: "0.06s" }}>
            {/* File info bar */}
            <div style={{
              ...cardBase, padding: "14px 20px", marginBottom: 22,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: `${currentType.color}10`,
                  border: `1px solid ${currentType.color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16,
                }}>
                  📄
                </div>
                <div>
                  <p style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600, margin: 0 }}>
                    {rawFile?.name}
                  </p>
                  <p style={{ color: "#475569", fontSize: 11, margin: 0, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                    {sourceHeaders.length} columns · {sourceRows.length} rows
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={reset} className="fmt-btn" style={{
                  padding: "7px 16px", borderRadius: 8,
                  background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
                  color: "#f87171", fontSize: 12, fontWeight: 500,
                }}>
                  Change File
                </button>
              </div>
            </div>

            {/* Mapping progress */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  Columns mapped: <span style={{ color: currentType.color, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{mappedCount}/{totalRequired}</span>
                </span>
                {mappedCount === totalRequired && (
                  <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600 }}>✓ All mapped</span>
                )}
              </div>
              <div style={{ height: 4, background: "rgba(30,41,59,0.6)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 2,
                  width: `${(mappedCount / totalRequired) * 100}%`,
                  background: mappedCount === totalRequired ? "#4ade80" : currentType.color,
                  transition: "width 0.3s ease, background 0.3s",
                }} />
              </div>
            </div>

            {/* Mapping table */}
            <div style={{ ...cardBase, padding: 0, overflow: "hidden", marginBottom: 22 }}>
              {/* Header */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 40px 1fr auto",
                padding: "12px 20px", gap: 12, alignItems: "center",
                background: "rgba(2,6,23,0.5)",
                borderBottom: "1px solid rgba(51,65,85,0.4)",
              }}>
                <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Required Column
                </span>
                <span />
                <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Your Column
                </span>
                <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Preview
                </span>
              </div>

              {/* Rows */}
              {targetCols.map((col) => {
                const mapped = mapping[col];
                const srcIdx = mapped ? sourceHeaders.indexOf(mapped) : -1;
                const preview = srcIdx >= 0 && sourceRows[0] ? sourceRows[0][srcIdx] : "";
                return (
                  <div
                    key={col}
                    className="fmt-row"
                    style={{
                      display: "grid", gridTemplateColumns: "1fr 40px 1fr auto",
                      padding: "12px 20px", gap: 12, alignItems: "center",
                      borderBottom: "1px solid rgba(30,41,59,0.4)",
                      transition: "background 0.15s",
                    }}
                  >
                    {/* Target column */}
                    <div>
                      <span style={{
                        fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 600, color: currentType.color,
                      }}>
                        {col}
                      </span>
                      <p style={{ fontSize: 10, color: "#475569", margin: 0, marginTop: 2 }}>
                        {COL_HINTS[col]}
                      </p>
                    </div>

                    {/* Arrow */}
                    <div style={{ textAlign: "center", color: mapped ? "#4ade80" : "#334155", fontSize: 14 }}>
                      ←
                    </div>

                    {/* Source column selector */}
                    <select
                      className="fmt-select"
                      value={mapped || ""}
                      onChange={(e) => {
                        setMapping((prev) => {
                          const next = { ...prev };
                          if (e.target.value) next[col] = e.target.value;
                          else delete next[col];
                          return next;
                        });
                      }}
                      style={{
                        width: "100%", padding: "8px 12px", borderRadius: 8,
                        fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
                        color: mapped ? "#e2e8f0" : "#64748b",
                        background: "rgba(2,6,23,0.6)",
                        border: `1.5px solid ${mapped ? "rgba(74,222,128,0.3)" : "rgba(51,65,85,0.5)"}`,
                        appearance: "auto",
                      }}
                    >
                      <option value="">— skip / not mapped —</option>
                      {sourceHeaders.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>

                    {/* Preview value */}
                    <div style={{
                      minWidth: 120, maxWidth: 180,
                      fontSize: 12, color: "#94a3b8",
                      fontFamily: "'JetBrains Mono', monospace",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      padding: "6px 10px", borderRadius: 6,
                      background: preview ? "rgba(2,6,23,0.5)" : "transparent",
                    }}>
                      {preview || <span style={{ color: "#334155", fontStyle: "italic" }}>empty</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={reset} className="fmt-btn" style={{
                padding: "11px 22px", borderRadius: 10,
                background: "rgba(51,65,85,0.3)", border: "1px solid rgba(71,85,105,0.4)",
                color: "#94a3b8", fontSize: 13, fontWeight: 500,
              }}>
                Start Over
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={mappedCount === 0}
                className="fmt-btn"
                style={{
                  padding: "11px 28px", borderRadius: 10, border: "none",
                  background: mappedCount > 0
                    ? `linear-gradient(135deg, ${currentType.color}, ${currentType.color}cc)`
                    : "rgba(51,65,85,0.4)",
                  color: mappedCount > 0 ? "#0f172a" : "#64748b",
                  fontSize: 14, fontWeight: 700,
                  boxShadow: mappedCount > 0 ? `0 4px 24px ${currentType.color}35` : "none",
                  cursor: mappedCount > 0 ? "pointer" : "not-allowed",
                }}
              >
                Preview Result →
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: Preview & Download ────────────────────── */}
        {step === 3 && (
          <div className="fade-up" style={{ animationDelay: "0.06s" }}>
            {/* Summary bar */}
            <div style={{
              ...cardBase, padding: "16px 22px", marginBottom: 22,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "rgba(74,222,128,0.1)",
                  border: "1px solid rgba(74,222,128,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20,
                }}>
                  ✅
                </div>
                <div>
                  <p style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 700, margin: 0 }}>
                    Data formatted successfully
                  </p>
                  <p style={{ color: "#475569", fontSize: 12, margin: 0, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                    {mappedRows.length} rows · {targetCols.length} columns · {currentType.label} format
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setStep(2)} className="fmt-btn" style={{
                  padding: "8px 18px", borderRadius: 8,
                  background: "rgba(51,65,85,0.3)", border: "1px solid rgba(71,85,105,0.4)",
                  color: "#94a3b8", fontSize: 12, fontWeight: 500,
                }}>
                  ← Edit Mapping
                </button>
              </div>
            </div>

            {/* Preview table */}
            <div style={{ ...cardBase, padding: 0, overflow: "hidden", marginBottom: 22 }}>
              <div style={{
                padding: "14px 20px", borderBottom: "1px solid rgba(51,65,85,0.4)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>
                  Preview (first {Math.min(mappedRows.length, 8)} rows)
                </span>
                <span style={{
                  fontSize: 10, padding: "3px 8px", borderRadius: 5,
                  background: `${currentType.color}12`, color: currentType.color,
                  fontWeight: 600, border: `1px solid ${currentType.color}30`,
                }}>
                  {currentType.label.toUpperCase()} FORMAT
                </span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{
                  width: "100%", borderCollapse: "collapse",
                  fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
                }}>
                  <thead>
                    <tr>
                      <th style={{
                        padding: "10px 16px", textAlign: "left",
                        color: "#64748b", fontWeight: 700, fontSize: 10,
                        letterSpacing: "0.06em", borderBottom: "1px solid rgba(30,41,59,0.6)",
                        background: "rgba(2,6,23,0.4)", position: "sticky", left: 0,
                        whiteSpace: "nowrap",
                      }}>
                        #
                      </th>
                      {targetCols.map((col) => (
                        <th key={col} style={{
                          padding: "10px 16px", textAlign: "left",
                          color: currentType.color, fontWeight: 600, fontSize: 11,
                          borderBottom: "1px solid rgba(30,41,59,0.6)",
                          background: "rgba(2,6,23,0.4)",
                          whiteSpace: "nowrap",
                        }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mappedRows.slice(0, 8).map((row, ri) => (
                      <tr key={ri} className="fmt-row" style={{ borderBottom: "1px solid rgba(30,41,59,0.3)" }}>
                        <td style={{
                          padding: "9px 16px", color: "#334155",
                          position: "sticky", left: 0,
                          background: "rgba(15,23,42,0.65)",
                        }}>
                          {ri + 1}
                        </td>
                        {row.map((cell, ci) => (
                          <td key={ci} style={{
                            padding: "9px 16px", color: cell ? "#cbd5e1" : "#334155",
                            maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis",
                            whiteSpace: "nowrap", fontStyle: cell ? "normal" : "italic",
                          }}>
                            {cell || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {mappedRows.length > 8 && (
                <div style={{
                  padding: "10px 20px", textAlign: "center",
                  borderTop: "1px solid rgba(30,41,59,0.4)",
                  color: "#475569", fontSize: 12,
                }}>
                  …and {mappedRows.length - 8} more rows
                </div>
              )}
            </div>

            {/* Download + Navigate to upload */}
            <div style={{
              display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center",
            }}>
              <button onClick={handleDownload} className="fmt-btn" style={{
                padding: "14px 32px", borderRadius: 12, border: "none",
                background: `linear-gradient(135deg, ${currentType.color}, ${currentType.color}cc)`,
                color: "#0f172a", fontSize: 14, fontWeight: 700,
                boxShadow: `0 4px 24px ${currentType.color}40`,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download {currentType.label} CSV
              </button>
              <a href="/upload" className="fmt-btn" style={{
                padding: "14px 28px", borderRadius: 12, textDecoration: "none",
                background: "rgba(51,65,85,0.3)", border: "1px solid rgba(71,85,105,0.4)",
                color: "#94a3b8", fontSize: 14, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                Go to Upload →
              </a>
              <button onClick={reset} className="fmt-btn" style={{
                padding: "14px 24px", borderRadius: 12,
                background: "rgba(30,41,59,0.4)", border: "1px solid rgba(51,65,85,0.5)",
                color: "#64748b", fontSize: 13, fontWeight: 500,
              }}>
                Format Another
              </button>
            </div>
          </div>
        )}

        {/* ─── How it works ──────────────────────────────────── */}
        {step === 1 && (
          <div className="fade-up" style={{ marginTop: 32, animationDelay: "0.12s" }}>
            <div style={{ ...cardBase, padding: "24px 28px" }}>
              <p style={{
                fontSize: 11, color: "#64748b", letterSpacing: "0.08em",
                fontWeight: 600, marginBottom: 16, textTransform: "uppercase",
              }}>
                How it works
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                {[
                  { icon: "📄", title: "Upload any CSV", desc: "Drop your file in any format — Excel exports, database dumps, API exports" },
                  { icon: "🔗", title: "Map columns", desc: "Visually match your columns to the required format. Auto-detection included" },
                  { icon: "📥", title: "Download & upload", desc: "Get a perfectly formatted CSV ready to use in the Upload section" },
                ].map((item) => (
                  <div key={item.title} style={{
                    padding: "18px 16px", borderRadius: 10,
                    background: "rgba(2,6,23,0.4)", border: "1px solid rgba(30,41,59,0.5)",
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 10 }}>{item.icon}</div>
                    <p style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600, margin: 0 }}>{item.title}</p>
                    <p style={{ color: "#475569", fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
