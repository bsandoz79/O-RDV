import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
// On importe nos composants depuis le dossier components
import Navbar, { ScrollToTop } from "./components/Navbar";

const DashboardPro = () => <div className="p-10"><h1>🏢 Interface Prestataire</h1></div>;
const AdminPanel = () => <div className="p-10"><h1>🛡️ Administration</h1></div>;

function App() {
  return (
    <Router>
      <Navbar />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<DashboardPro />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;