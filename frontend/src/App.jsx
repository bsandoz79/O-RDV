import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Navbar, { ScrollToTop } from "./components/Navbar";
import UserDashboard from "./pages/user/UserDashboard";
import BookingPage from "./components/BookingPage";
import ShopSettings from "./pages/pro/ShopSettings";
import ProviderProfile from "./pages/ProviderProfile";
import MentionsLegales from "./pages/legal/MentionsLegales";
import PolitiqueConfidentialite from "./pages/legal/PolitiqueConfidentialite";
import CGU from "./pages/legal/CGU";

// Affiche un message quand l'utilisateur est redirigé depuis une route protégée
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
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || !user) {
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
const AdminPanel = () => <div className="p-10"><h1>🛡️ Administration</h1></div>;

function App() {
  return (
    <Router>
      <Navbar />
      <ScrollToTop />
      <RedirectBanner />
      <Routes>
        {/* --- ROUTES PUBLIQUES --- */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/provider/:id" element={<ProviderProfile />} />
        <Route path="/booking/:providerId" element={<BookingPage />} />

        {/* --- ROUTES UTILISATEUR (Client) --- */}
        <Route
          path="/account"
          element={
            <ProtectedRoute allowedRoles={["user", "pro", "admin"]}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        {/* --- ROUTES PRESTATAIRE (Pro) --- */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["pro", "admin"]}>
              <DashboardPro />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pro/settings"
          element={
            <ProtectedRoute allowedRoles={["pro", "admin"]}>
              <ShopSettings />
            </ProtectedRoute>
          }
        />

        {/* --- ROUTE ADMIN --- */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
        <Route path="/cgu" element={<CGU />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 px-4 text-center mt-auto">
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
