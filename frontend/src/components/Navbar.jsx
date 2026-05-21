import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Briefcase, User, LogOut, ShieldCheck } from "lucide-react"; 

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
  const navigate = useNavigate();

  // ─── ÉTAT D'AUTHENTIFICATION RÉACTIF ──────────────────────────────────────
  // On initialise l'état directement en lisant le localStorage
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const syncAuth = () => {
      const saved = localStorage.getItem("user");
      setUser(saved ? JSON.parse(saved) : null);
    };

    // Écoute l'événement personnalisé déclenché par Login.jsx
    window.addEventListener("authChange", syncAuth);
    // Écoute les changements provenant d'autres onglets
    window.addEventListener("storage", syncAuth);
    
    // Force la synchronisation à chaque changement de route
    syncAuth();

    return () => {
      window.removeEventListener("authChange", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, [location]); 

  const handleLogout = () => {
    localStorage.clear();
    // On informe immédiatement les autres composants du changement
    window.dispatchEvent(new Event("authChange"));
    setUser(null);
    navigate("/");
  };
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <header className="app-navbar">
      <div className="app-navbar__inner">
        {/* Logo */}
        <Link to="/" className="app-navbar__logo">
          <img src="/logo.png" alt="O'RDV" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          <span className="app-navbar__logo-text">O'RDV</span>
        </Link>

        {/* Liens centraux */}
        <nav className="app-navbar__links flex items-center gap-2">
          
          {user && (
            <Link
              to="/account"
              className={`app-navbar__link flex items-center gap-1.5 ${location.pathname === "/account" ? "app-navbar__link--active" : ""}`}
            >
              <User size={14} />
              Mon Compte
            </Link>
          )}

          {(user?.role === "pro" || user?.role === "admin") && (
            <Link
              to="/pro/settings"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-sm border transition-all ${
                location.pathname === "/pro/settings"
                  ? "bg-rose-500/20 border-rose-500/30 text-rose-300"
                  : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
              }`}
            >
              <Briefcase size={14} />
              Espace Pro
            </Link>
          )}

          {user?.role === "admin" && (
            <Link
              to="/admin"
              className={`app-navbar__link font-bold text-rose-400 flex items-center gap-1.5 ${location.pathname === "/admin" ? "app-navbar__link--active" : ""}`}
            >
              <ShieldCheck size={14} />
              Admin
            </Link>
          )}
        </nav>

        {/* Boutons d'authentification */}
        <div className="app-navbar__auth">
          {user ? (
            <button 
              onClick={handleLogout}
              className="app-navbar__btn-ghost flex items-center gap-2 text-rose-400 hover:text-rose-300 transition-all"
            >
              <LogOut size={16} /> Déconnexion
            </button>
          ) : (
            <>
              <Link to="/login" className="app-navbar__btn-ghost">Connexion</Link>
              <Link to="/register" className="app-navbar__btn-cta">S'inscrire</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}