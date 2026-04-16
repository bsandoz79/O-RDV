import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Navbar, { ScrollToTop } from "./components/Navbar";
import UserDashboard from "./pages/user/UserDashboard";
import BookingPage from "./components/BookingPage";
import ShopSettings from "./pages/pro/ShopSettings";
import ProviderProfile from "./pages/ProviderProfile";

// --- COMPOSANT DE SÉCURITÉ (PROTECTED ROUTE) ---
// Ce composant bloque l'accès aux pages si l'utilisateur n'a pas le bon rôle
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || !user) {
    // Non connecté -> Direction Login
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Connecté mais pas le bon rôle -> Direction Accueil
    return <Navigate to="/" replace />;
  }

  return children;
};

// Petits composants temporaires pour les routes non encore créées
const DashboardPro = () => <div className="p-10"><h1>🏢 Interface Prestataire</h1></div>;
const AdminPanel = () => <div className="p-10"><h1>🛡️ Administration</h1></div>;

function App() {
  return (
    <Router>
      <Navbar />
      <ScrollToTop />
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

        {/* Redirection automatique si la page n'existe pas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;