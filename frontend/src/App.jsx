import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

import { useState, useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AuthCallback from "./pages/auth/AuthCallback";
import Navbar, { ScrollToTop } from "./components/Navbar";
import UserDashboard from "./pages/user/UserDashboard";
import BookingPage from "./components/BookingPage";
import ShopSettings from "./pages/pro/ShopSettings";
import ProviderProfile from "./pages/ProviderProfile";
import MentionsLegales from "./pages/legal/MentionsLegales";
import PolitiqueConfidentialite from "./pages/legal/PolitiqueConfidentialite";
import CGU from "./pages/legal/CGU";
import AdminPanel from "./pages/admin/AdminPanel";
import MultiView from "./pages/admin/MultiView";
import NotFound from "./pages/NotFound";

const INACTIVITY_DELAY = 30 * 60 * 1000;

// Détecte le token d'impersonation dans le hash URL (#_t=TOKEN&_u=USER_JSON)
// window.fetch et window.sessionStorage sont ISOLÉS par iframe (contrairement à localStorage).
function applyImpersonationHash() {
  const hash = window.location.hash;
  const tMatch = hash.match(/#_t=([^&]+)/);
  const uMatch = hash.match(/_u=([^&]+)/);
  if (!tMatch) return;

  const impToken = decodeURIComponent(tMatch[1]);
  const impUser  = uMatch ? decodeURIComponent(uMatch[1]) : null;

  // Redéfinit window.localStorage sur CE window uniquement (chaque iframe a son propre window ✓)
  // La redéfinition n'affecte pas les autres iframes ni la fenêtre parente.
  const realLS = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window), 'localStorage')?.get?.call(window) || window.localStorage;
  const virtualLS = {
    getItem(key) {
      if (key === 'token') return impToken;
      if (key === 'user')  return impUser;
      return realLS.getItem(key);
    },
    setItem(key, val) {
      if (key === 'token' || key === 'user') return; // protège le vrai compte
      realLS.setItem(key, val);
    },
    removeItem(key) {
      if (key === 'token' || key === 'user') return;
      realLS.removeItem(key);
    },
    clear() { realLS.clear(); },
    get length() { return realLS.length; },
    key(n) { return realLS.key(n); },
  };
  try {
    Object.defineProperty(window, 'localStorage', { get: () => virtualLS, configurable: true });
  } catch {}

  // Intercepte fetch dans CE window uniquement ✓
  const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const origFetch = window.fetch;
  window.fetch = function(input, init = {}) {
    const url = typeof input === 'string' ? input : (input?.url || '');
    if (url.startsWith(apiBase)) {
      const headers = new Headers(init.headers || {});
      headers.set('Authorization', `Bearer ${impToken}`);
      init = { ...init, headers };
    }
    return origFetch.call(this, input, init);
  };

  window.location.hash = '';
  window.dispatchEvent(new Event('authChange'));
}


function logout() {
  fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  }).catch(() => {});
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('authChange'));
  window.location.href = '/login?session=expired';
}

applyImpersonationHash();

function NavbarConditional() {
  const location = useLocation();
  if (location.pathname === '/admin/multiview') return null;
  return <Navbar />;
}

function SessionGuard() {
  const location = useLocation();
  const timerRef = useRef(null);

  const resetTimer = () => {
    clearTimeout(timerRef.current);
    if (!localStorage.getItem('user')) return;
    timerRef.current = setTimeout(logout, INACTIVITY_DELAY);
  };

  // Ping le backend à chaque navigation pour détecter expiration cookie + ban
  useEffect(() => {
    if (!localStorage.getItem('user')) return;
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/user/me`, {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(d => {
        if (d.banned) {
          sessionStorage.setItem('redirectMsg', `Compte suspendu${d.ban_reason ? ' : ' + d.ban_reason : '.'}`);
          logout();
        }
      })
      .catch(() => {});
  }, [location]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

function RedirectBanner() {
  const [msg, setMsg] = useState(() => {
    const m = sessionStorage.getItem('redirectMsg');
    if (m) sessionStorage.removeItem('redirectMsg');
    return m || '';
  });
  if (!msg) return null;
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 max-w-sm text-center">
      <AlertTriangle size={16} className="flex-shrink-0" />
      <span>{msg}</span>
      <button onClick={() => setMsg('')} className="ml-2 text-amber-500 hover:text-amber-700" aria-label="Fermer">
        <X size={14} />
      </button>
    </div>
  );
}

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem("user") || 'null');

  if (!user) {
    sessionStorage.setItem('redirectMsg', 'Veuillez vous connecter pour accéder à cette page.');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    sessionStorage.setItem('redirectMsg', "Vous n'avez pas accès à cette page.");
    return <Navigate to="/" replace />;
  }

  return children;
};

const DashboardPro = () => <div className="p-10"><h1>🏢 Interface Prestataire</h1></div>;

function App() {
  return (
    <Router>
      <SessionGuard />
      <NavbarConditional />
      <ScrollToTop />
      <RedirectBanner />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/provider/:id" element={<ProviderProfile />} />
        <Route path="/booking/:providerId" element={<BookingPage />} />

        <Route path="/account" element={
          <ProtectedRoute allowedRoles={["user", "pro", "admin"]}>
            <UserDashboard />
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={["pro", "admin"]}>
            <DashboardPro />
          </ProtectedRoute>
        } />

        <Route path="/pro/settings" element={
          <ProtectedRoute allowedRoles={["pro", "admin"]}>
            <ShopSettings />
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminPanel />
          </ProtectedRoute>
        } />
        <Route path="/admin/multiview" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <MultiView />
          </ProtectedRoute>
        } />

        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
        <Route path="/cgu" element={<CGU />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 px-4 text-center">
        <div className="flex flex-wrap justify-center gap-4 mb-2">
          <a href="/mentions-legales" className="hover:text-white transition">Mentions légales</a>
          <a href="/politique-confidentialite" className="hover:text-white transition">Politique de confidentialité</a>
          <a href="/cgu" className="hover:text-white transition">CGU</a>
        </div>
        <p>© {new Date().getFullYear()} O'RDV — Tous droits réservés</p>
      </footer>
    </Router>
  );
}

export default App;
