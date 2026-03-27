import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Briefcase } from "lucide-react"; 

export function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="scroll-top-btn"
      style={{
        opacity: show ? 1 : 0,
        pointerEvents: show ? "auto" : "none",
        transform: show ? "scale(1) translateY(0)" : "scale(0.8) translateY(8px)",
      }}
      aria-label="Remonter en haut"
    >
      ↑
    </button>
  );
}

export default function Navbar() {
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  // ─── SIMULATION D'AUTHENTIFICATION ─────────────────────────────────────────
  // Plus tard, cette information viendra de ton "Context" React après vérification du token JWT
  const isAdmin = false; // Mets sur 'true' pour voir le bouton Admin apparaître !
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      setVisible(current < lastScrollY.current || current < 60);
      lastScrollY.current = current;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="app-navbar"
      style={{
        transform: visible ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(-110%)",
        opacity: visible ? 1 : 0,
      }}
    >
      <div className="app-navbar__inner">
        {/* Logo */}
        <Link to="/" className="app-navbar__logo">
          <span className="app-navbar__logo-icon">✦</span>
          <span className="app-navbar__logo-text">O'RDV</span>
        </Link>

        {/* Liens de navigation centraux */}
        <nav className="app-navbar__links flex items-center gap-4">
          
          {/* Le bouton Espace Pro mis en avant (Style Badge Lumineux) */}
          <Link
            to="/dashboard"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-sm transition-all duration-300 border ${
              location.pathname === "/dashboard"
                ? "bg-rose-500/20 border-rose-500/30 text-rose-300"
                : "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
            }`}
          >
            <Briefcase size={14} className={location.pathname === "/dashboard" ? "text-rose-400" : "text-slate-300"} />
            Espace Pro
          </Link>

          {/* Le lien Admin n'existe dans le HTML QUE si isAdmin est true */}
          {isAdmin && (
            <Link
              to="/admin"
              className={`text-sm font-bold transition-colors ${
                location.pathname === "/admin" 
                ? "text-rose-400" 
                : "text-rose-500/60 hover:text-rose-400"
              }`}
            >
              Panel Admin
            </Link>
          )}
        </nav>

        {/* Boutons d'authentification */}
        <div className="app-navbar__auth">
          <Link
            to="/login"
            className={`app-navbar__btn-ghost ${location.pathname === "/login" ? "app-navbar__btn-ghost--active" : ""}`}
          >
            Connexion
          </Link>
          <Link to="/register" className="app-navbar__btn-cta">
            S'inscrire
          </Link>
        </div>
      </div>
    </header>
  );
}