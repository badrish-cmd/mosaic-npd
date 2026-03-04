import { BrowserRouter, Routes, Route, NavLink, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import Dashboard from "./pages/dashboard";
import Upload from "./pages/upload";
import Login from "./pages/login";
import FormatData from "./pages/format";
import AIScraping from "./pages/scraping";

/* ── Page transition wrapper ────────────────────────────────── */
function PageTransition({ children }) {
  const location = useLocation();
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(false);
    const t = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(t);
  }, [location.pathname]);
  return (
    <div style={{
      opacity: show ? 1 : 0,
      transform: show ? "translateY(0)" : "translateY(10px)",
      transition: "opacity 0.32s cubic-bezier(0.22,1,0.36,1), transform 0.32s cubic-bezier(0.22,1,0.36,1)",
    }}>
      {children}
    </div>
  );
}

/* ── Navbar ──────────────────────────────────────────────────── */
function NavBar({ user, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      borderBottom: `1px solid ${scrolled ? "rgba(51,65,85,0.55)" : "rgba(51,65,85,0.25)"}`,
      background: scrolled ? "rgba(2,6,23,0.96)" : "rgba(2,6,23,0.80)",
      backdropFilter: "blur(16px)",
      transition: "all 0.3s ease",
    }}>
      <div style={{
        maxWidth: 1280, margin: "0 auto", padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", height: 56,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #f59e0b, #f97316)",
            boxShadow: "0 4px 16px rgba(245,158,11,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
            onMouseOver={e => { e.currentTarget.style.transform = "scale(1.1) rotate(-4deg)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(245,158,11,0.5)"; }}
            onMouseOut={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(245,158,11,0.35)"; }}
          >
            <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
              <rect x="2" y="2" width="6" height="6" rx="1.5" fill="#0f172a" />
              <rect x="12" y="2" width="6" height="6" rx="1.5" fill="#0f172a" />
              <rect x="2" y="12" width="6" height="6" rx="1.5" fill="#0f172a" />
              <rect x="12" y="12" width="6" height="6" rx="1.5" fill="#0f172a" opacity="0.5" />
            </svg>
          </div>
          <span style={{ color: "#f8fafc", fontWeight: 700, fontSize: 15, letterSpacing: "-0.02em" }}>
            Mosaic <span style={{ color: "#f59e0b" }}>NPD</span>
          </span>
        </div>

        {/* Nav links */}
        <nav style={{ display: "flex", gap: 4 }}>
          {[
            { to: "/", end: true, label: "Dashboard", icon: <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" /> },
            { to: "/upload", end: false, label: "Upload", icon: <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /> },
            { to: "/format", end: false, label: "Format", icon: <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V7.414A2 2 0 0017.414 6L14 2.586A2 2 0 0012.586 2H4zm2 8a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm0 4a1 1 0 011-1h3a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" /> },
            { to: "/scraping", end: false, label: "AI Scraper", icon: <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /> },
          ].map(({ to, end, label, icon }) => (
            <NavLink key={to} to={to} end={end}
              style={({ isActive }) => ({
                padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                textDecoration: "none", display: "flex", alignItems: "center", gap: 7,
                transition: "all 0.2s ease",
                ...(isActive
                  ? { background: "rgba(245,158,11,0.1)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.2)", boxShadow: "0 0 12px rgba(245,158,11,0.06)" }
                  : { color: "#64748b", border: "1px solid transparent" }),
              })}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">{icon}</svg>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User & status */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#475569", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", display: "block", animation: "liveGlow 2s infinite" }} />
            <span style={{ color: "#4ade80", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em" }}>LIVE</span>
          </div>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "#f59e0b",
                textTransform: "uppercase",
              }}>
                {user.name?.charAt(0) || "U"}
              </div>
              <button onClick={onLogout} style={{
                padding: "5px 12px", borderRadius: 7,
                background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
                color: "#f87171", fontSize: 10, fontWeight: 600, cursor: "pointer",
                letterSpacing: "0.04em", transition: "all 0.2s", outline: "none",
              }}
                onMouseOver={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; }}
                onMouseOut={e => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.15)"; }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* ── Protected Route ─────────────────────────────────────────── */
function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/* ── App Shell ───────────────────────────────────────────────── */
export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("mosaic_user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const handleLogin = useCallback((u) => setUser(u), []);
  const handleLogout = useCallback(() => {
    localStorage.removeItem("mosaic_user");
    setUser(null);
  }, []);

  return (
    <BrowserRouter>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #020617; overflow-x: hidden; }
        @keyframes liveGlow { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{background-position:-700px 0}100%{background-position:700px 0} }
        .fade-up { animation:fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }

        /* Scrollbar */
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(51,65,85,0.5); border-radius:3px; }
        ::-webkit-scrollbar-thumb:hover { background:rgba(71,85,105,0.7); }

        /* Selection */
        ::selection { background:rgba(245,158,11,0.25); color:#fbbf24; }
      `}</style>
      <div style={{ minHeight: "100vh", background: "#020617", color: "#f1f5f9", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
        {/* Background dot grid */}
        <div aria-hidden="true" style={{
          position: "fixed", inset: 0, pointerEvents: "none",
          backgroundImage: "radial-gradient(rgba(148,163,184,0.045) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />
        {/* Amber glow top */}
        <div aria-hidden="true" style={{
          position: "fixed", top: "-160px", left: "20%", width: "800px", height: "600px",
          background: "radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />
        {/* Blue glow bottom-right */}
        <div aria-hidden="true" style={{
          position: "fixed", bottom: "-200px", right: "-100px", width: "600px", height: "500px",
          background: "radial-gradient(ellipse, rgba(59,130,246,0.04) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />

        {user && <NavBar user={user} onLogout={handleLogout} />}

        <main style={{ paddingTop: user ? 56 : 0, position: "relative" }}>
          <Routes>
            <Route path="/login" element={
              user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
            } />
            <Route path="/" element={
              <ProtectedRoute user={user}>
                <PageTransition><Dashboard /></PageTransition>
              </ProtectedRoute>
            } />
            <Route path="/upload" element={
              <ProtectedRoute user={user}>
                <PageTransition><Upload /></PageTransition>
              </ProtectedRoute>
            } />
            <Route path="/format" element={
              <ProtectedRoute user={user}>
                <PageTransition><FormatData /></PageTransition>
              </ProtectedRoute>
            } />
            <Route path="/scraping" element={
              <ProtectedRoute user={user}>
                <PageTransition><AIScraping /></PageTransition>
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}