import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Navbar, { ScrollToTop } from "./components/Navbar";
import UserDashboard from "./pages/user/UserDashboard";
import BookingForm from './components/BookingForm';

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
        <Route path="/account" element={<UserDashboard />} />
        <Route path="/booking" element={<BookingForm />} />
        
      </Routes>
    </Router>
  );
}

export default App;