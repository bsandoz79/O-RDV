import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Simulation de la logique de rôle (en attendant le Backend Node/MySQL)
    if (email.includes("admin")) {
      navigate("/admin");
    } else if (email.includes("pro")) {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-900 mb-2">Connexion</h2>
          <p className="text-slate-500 text-sm">Accédez à votre espace O'RDV</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="votre@email.com"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="w-full py-4 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-all flex items-center justify-center gap-2 text-sm">
            Se connecter <ArrowRight size={18} />
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