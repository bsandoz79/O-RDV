import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import des composants et pages avec extensions obligatoires (.jsx)
import Home from './pages/Home.jsx';
import ProviderProfile from './pages/ProviderProfile.jsx';
import Booking from './pages/Booking.jsx';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Route pour la page d'accueil */}
          <Route path="/" element={<Home />} />
          
          {/* Route pour le profil d'un prestataire */}
          <Route path="/provider/:id" element={<ProviderProfile />} />
          
          {/* Route pour la prise de rendez-vous */}
          <Route path="/booking/:id" element={<Booking />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;