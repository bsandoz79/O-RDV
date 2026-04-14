import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Navbar, { ScrollToTop } from "./components/Navbar";
import UserDashboard from "./pages/user/UserDashboard";
import BookingPage from "./components/BookingPage"; // Assure-toi du chemin (components ou pages)
import ShopSettings from "./pages/pro/ShopSettings";

// Petits composants temporaires pour les routes non encore créées
const DashboardPro = () => <div className="p-10"><h1>🏢 Interface Prestataire</h1></div>;
const AdminPanel = () => <div className="p-10"><h1>🛡️ Administration</h1></div>;

function App() {
  return (
    <Router>
      <Navbar />
      <ScrollToTop />
      <Routes>
        {/* Routes Publiques */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Route de Réservation (avec l'ID dynamique indispensable) */}
        <Route path="/booking/:providerId" element={<BookingPage />} />

        {/* Routes Utilisateur */}
        <Route path="/account" element={<UserDashboard />} />
        
        {/* Routes Prestataire (Pro) */}
        <Route path="/dashboard" element={<DashboardPro />} />
        <Route path="/pro/settings" element={<ShopSettings />} />
        
        {/* Route Admin */}
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;