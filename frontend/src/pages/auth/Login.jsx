import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import API_BASE_URL from '../../api/api';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // Pour afficher les erreurs du serveur
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Appel à ton API Node.js (Port 5000) 
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("Données reçues du serveur :", data);

      if (response.ok) {
        // 2. Succès : On stocke le Token JWT et les infos utilisateur 
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        window.dispatchEvent(new Event("authChange")); // Pour synchroniser l'état d'auth dans toute l'app

        // 3. Redirection dynamique selon le rôle stocké en base [cite: 12, 13, 17]
        const role = data.user.role;
        if (role === "admin") {
          navigate("/admin");
        } else if (role === "pro") {
          navigate("/dashboard");
        } else {
          navigate("/account"); // Dossier user
        }
      } else {
        // Erreur : Identifiants incorrects ou erreur serveur
        setError(data.error || "Une erreur est survenue lors de la connexion.");
      }
    } catch (err) {
      setError("Impossible de contacter le serveur. Vérifiez qu'il est bien lancé.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-900 mb-2 font-display italic">Connexion</h2>
          <p className="text-slate-500 text-sm">Accédez à votre espace O'RDV</p>
        </div>

        {/* Affichage des erreurs si l'auth échoue */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 text-sm font-medium animate-shake">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 italic">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 transition-all text-slate-900"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 italic">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 transition-all text-slate-900"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-4 bg-rose-500 text-white font-black rounded-xl hover:bg-rose-600 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? "Vérification..." : "Se connecter"} <ArrowRight size={18} />
          </button>
        </form>

        <p className="text-center mt-8 text-slate-600 text-sm">
          Nouveau sur la plateforme ?{" "}
          <Link to="/register" className="text-rose-500 font-bold hover:underline">S'inscrire</Link>
        </p>
      </div>
    </div>
  );
}