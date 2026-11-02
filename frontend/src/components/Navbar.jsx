import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Briefcase, User, LogOut, ShieldCheck, Menu, X } from "lucide-react";

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
  const [menuOpen, setMenuOpen] = useState(false);

  // Ferme le menu mobile à chaque changement de page
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

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

  const isActive = (path) => location.pathname === path;

  return (
    <header className="app-navbar">
      <div className="app-navbar__inner">
        {/* Logo */}
        <Link to="/" className="app-navbar__logo">
          <img src="/logo.png" alt="O'RDV" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          <span className="app-navbar__logo-text">O'RDV</span>
        </Link>

        {/* Liens centraux (desktop) */}
        <nav className="app-navbar__links flex items-center gap-2" aria-label="Navigation principale">

          {user && (
            <Link
              to="/account"
              aria-current={isActive("/account") ? "page" : undefined}
              className={`app-navbar__link flex items-center gap-1.5 ${isActive("/account") ? "app-navbar__link--active" : ""}`}
            >
              <User size={14} aria-hidden="true" />
              Mon Compte
            </Link>
          )}

          {(user?.role === "pro" || user?.role === "admin") && (
            <Link
              to="/pro/settings"
              aria-current={isActive("/pro/settings") ? "page" : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-sm border transition-all ${
                isActive("/pro/settings")
                  ? "bg-rose-500/20 border-rose-500/30 text-rose-300"
                  : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
              }`}
            >
              <Briefcase size={14} aria-hidden="true" />
              Espace Pro
            </Link>
          )}

          {user?.role === "admin" && (
            <Link
              to="/admin"
              aria-current={isActive("/admin") ? "page" : undefined}
              className={`app-navbar__link font-bold text-rose-400 flex items-center gap-1.5 ${isActive("/admin") ? "app-navbar__link--active" : ""}`}
            >
              <ShieldCheck size={14} aria-hidden="true" />
              Admin
            </Link>
          )}
        </nav>

        {/* Boutons d'authentification */}
        <div className="app-navbar__auth">
          {user ? (
            <button
              onClick={handleLogout}
              className="app-navbar__btn-ghost app-navbar__logout flex items-center gap-2 text-rose-400 hover:text-rose-300 transition-all"
            >
              <LogOut size={16} /> Déconnexion
            </button>
          ) : (
            <>
              <Link to="/login" className="app-navbar__btn-ghost">Connexion</Link>
              <Link to="/register" className="app-navbar__btn-cta">S'inscrire</Link>
            </>
          )}

          {/* Burger (mobile, utilisateur connecté) */}
          {user && (
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="app-navbar__burger"
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* Menu déroulant mobile */}
      {user && menuOpen && (
        <nav id="mobile-menu" className="app-navbar__mobile" aria-label="Navigation mobile">
          <Link to="/account" className={`app-navbar__mobile-link ${isActive("/account") ? "app-navbar__mobile-link--active" : ""}`}>
            <User size={16} aria-hidden="true" /> Mon Compte
          </Link>
          {(user.role === "pro" || user.role === "admin") && (
            <Link to="/pro/settings" className={`app-navbar__mobile-link ${isActive("/pro/settings") ? "app-navbar__mobile-link--active" : ""}`}>
              <Briefcase size={16} aria-hidden="true" /> Espace Pro
            </Link>
          )}
          {user.role === "admin" && (
            <Link to="/admin" className={`app-navbar__mobile-link text-rose-400 ${isActive("/admin") ? "app-navbar__mobile-link--active" : ""}`}>
              <ShieldCheck size={16} aria-hidden="true" /> Admin
            </Link>
          )}
          <button onClick={handleLogout} className="app-navbar__mobile-link text-rose-400">
            <LogOut size={16} aria-hidden="true" /> Déconnexion
          </button>
        </nav>
      )}
    </header>
  );
}
