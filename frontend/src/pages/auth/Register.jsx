import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Store, ArrowRight } from "lucide-react";

export default function Register() {
  const [isPro, setIsPro] = useState(false);
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    // Simulation : redirection vers le dashboard si c'est un pro, sinon accueil
    isPro ? navigate("/dashboard") : navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-900 mb-2">Créer un compte</h2>
          <p className="text-slate-500 text-sm">Rejoignez la communauté O'RDV</p>
        </div>

        {/* Sélecteur de type de compte */}
        <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
          <button 
            onClick={() => setIsPro(false)}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${!isPro ? "bg-white text-rose-500 shadow-sm" : "text-slate-500"}`}
          >
            Client
          </button>
          <button 
            onClick={() => setIsPro(true)}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${isPro ? "bg-white text-rose-500 shadow-sm" : "text-slate-500"}`}
          >
            Prestataire
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Nom complet" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-sm" required />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="email" placeholder="Adresse email" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-sm" required />
          </div>

          {isPro && (
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Nom de l'établissement" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-sm" required />
            </div>
          )}

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="password" placeholder="Mot de passe" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-sm" required />
          </div>

          <button type="submit" className="w-full py-4 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-all flex items-center justify-center gap-2 text-sm">
            {isPro ? "Démarrer mon activité" : "M'inscrire gratuitement"} <ArrowRight size={18} />
          </button>
        </form>

        <p className="text-center mt-8 text-slate-600 text-sm">
          Déjà inscrit ? <Link to="/login" className="text-rose-500 font-bold hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}