import { useState } from "react";

const cardBase = {
  background: "rgba(15,23,42,0.65)",
  border: "1px solid rgba(51,65,85,0.5)",
  borderRadius: 14,
  backdropFilter: "blur(12px)",
};

/* ══════════════════════════════════════════════════════════════════════
   FLOATING ORB – decorative animated background orb
   ══════════════════════════════════════════════════════════════════════ */
function FloatingOrb({ size, color, top, left, delay, duration }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}30, ${color}05)`,
        border: `1px solid ${color}15`,
        top,
        left,
        filter: "blur(2px)",
        animation: `orbFloat ${duration}s ease-in-out ${delay}s infinite alternate`,
        pointerEvents: "none",
      }}
    />
  );
}

/* ══════════════════════════════════════════════════════════════════════
   LOGIN PAGE
   ══════════════════════════════════════════════════════════════════════ */
export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusField, setFocusField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    // Simulate auth delay
    await new Promise((r) => setTimeout(r, 1200));

    // Store session
    const user = { email: email.trim(), name: email.split("@")[0], loginAt: new Date().toISOString() };
    localStorage.setItem("mosaic_user", JSON.stringify(user));
    setLoading(false);
    onLogin(user);
  };

  const inputStyle = (field) => ({
    width: "100%",
    padding: "13px 16px 13px 44px",
    borderRadius: 10,
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    color: "#f1f5f9",
    background: "rgba(2,6,23,0.6)",
    border: `1.5px solid ${
      focusField === field
        ? "rgba(245,158,11,0.5)"
        : "rgba(51,65,85,0.5)"
    }`,
    boxShadow:
      focusField === field
        ? "0 0 0 3px rgba(245,158,11,0.08), 0 0 20px rgba(245,158,11,0.06)"
        : "none",
    outline: "none",
    transition: "all 0.25s ease",
  });

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes orbFloat {
          0% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          100% { transform: translate(30px, -20px) scale(1.1); opacity: 0.8; }
        }
        @keyframes gridPulse {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.06; }
        }
        @keyframes logoSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes borderGlow {
          0%, 100% { border-color: rgba(245,158,11,0.15); }
          50% { border-color: rgba(245,158,11,0.35); }
        }
        .login-field:hover { border-color: rgba(100,116,139,0.6) !important; }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#020617",
          fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
          position: "relative",
          overflow: "hidden",
          padding: "24px",
        }}
      >
        {/* BG dot grid */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(rgba(148,163,184,0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            animation: "gridPulse 6s ease infinite",
            pointerEvents: "none",
          }}
        />

        {/* Ambient orbs */}
        <FloatingOrb size={180} color="#f59e0b" top="-40px" left="15%" delay={0} duration={8} />
        <FloatingOrb size={120} color="#3b82f6" top="60%" left="75%" delay={2} duration={10} />
        <FloatingOrb size={90} color="#8b5cf6" top="30%" left="5%" delay={1} duration={7} />
        <FloatingOrb size={140} color="#f59e0b" top="75%" left="40%" delay={3} duration={9} />

        {/* Amber radial glow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-200px",
            left: "50%",
            transform: "translateX(-50%)",
            width: 900,
            height: 700,
            background:
              "radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 55%)",
            pointerEvents: "none",
          }}
        />

        {/* Login card */}
        <div
          style={{
            ...cardBase,
            width: "100%",
            maxWidth: 420,
            padding: "48px 40px",
            position: "relative",
            animation: "fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both",
            boxShadow: "0 20px 80px rgba(0,0,0,0.4), 0 0 60px rgba(245,158,11,0.04)",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 36,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "linear-gradient(135deg, #f59e0b, #f97316)",
                boxShadow: "0 8px 32px rgba(245,158,11,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 18,
              }}
            >
              <svg viewBox="0 0 20 20" fill="none" width="22" height="22">
                <rect x="2" y="2" width="6" height="6" rx="1.5" fill="#0f172a" />
                <rect x="12" y="2" width="6" height="6" rx="1.5" fill="#0f172a" />
                <rect x="2" y="12" width="6" height="6" rx="1.5" fill="#0f172a" />
                <rect x="12" y="12" width="6" height="6" rx="1.5" fill="#0f172a" opacity="0.5" />
              </svg>
            </div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "#f8fafc",
                margin: 0,
                letterSpacing: "-0.03em",
              }}
            >
              Mosaic <span style={{ color: "#f59e0b" }}>NPD</span>
            </h1>
            <p
              style={{
                fontSize: 13,
                color: "#475569",
                marginTop: 6,
                textAlign: "center",
              }}
            >
              Sign in to the AI Product Inventor
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 10,
                animation: "fadeUp 0.3s both",
              }}
            >
              <span style={{ fontSize: 14 }}>⚠️</span>
              <span style={{ color: "#fca5a5", fontSize: 13, fontWeight: 500 }}>
                {error}
              </span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#64748b",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color:
                      focusField === "email" ? "#f59e0b" : "#475569",
                    transition: "color 0.2s",
                    zIndex: 1,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                </div>
                <input
                  className="login-field"
                  type="email"
                  placeholder="analyst@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusField("email")}
                  onBlur={() => setFocusField(null)}
                  style={inputStyle("email")}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 26 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#64748b",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color:
                      focusField === "password" ? "#f59e0b" : "#475569",
                    transition: "color 0.2s",
                    zIndex: 1,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                </div>
                <input
                  className="login-field"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusField("password")}
                  onBlur={() => setFocusField(null)}
                  style={inputStyle("password")}
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Sign in button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px 24px",
                borderRadius: 12,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                background: loading
                  ? "rgba(51,65,85,0.5)"
                  : "linear-gradient(135deg, #f59e0b, #f97316)",
                color: loading ? "#64748b" : "#0f172a",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "0.01em",
                boxShadow: loading
                  ? "none"
                  : "0 4px 24px rgba(245,158,11,0.35)",
                transition: "all 0.25s ease",
                outline: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.boxShadow =
                    "0 6px 32px rgba(245,158,11,0.5)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = loading
                  ? "none"
                  : "0 4px 24px rgba(245,158,11,0.35)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      border: "2px solid rgba(100,116,139,0.3)",
                      borderTopColor: "#64748b",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  Signing in…
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                    />
                  </svg>
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div
            style={{
              marginTop: 28,
              textAlign: "center",
              borderTop: "1px solid rgba(51,65,85,0.3)",
              paddingTop: 20,
            }}
          >
            <p style={{ color: "#334155", fontSize: 11, lineHeight: 1.5 }}>
              AI Product Inventor — Mosaic NPD
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
