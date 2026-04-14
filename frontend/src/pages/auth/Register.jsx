import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Store, ArrowRight, AlertCircle } from "lucide-react";
import API_BASE_URL from "../../api/api";

export default function Register() {
  // États pour la sélection du type de compte
  const [isPro, setIsPro] = useState(false);
  
  // États pour les données du formulaire
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // On détermine le rôle à envoyer au backend
    const role = isPro ? "pro" : "user";

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email, 
          password: password, 
          role: role 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // 🔥 L'AUTO-LOGIN ICI
        // On sauvegarde le token et les infos de l'utilisateur dans le navigateur
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // On déclenche un événement pour que la Navbar comprenne qu'on est connecté
        window.dispatchEvent(new Event("storage")); 

        // Redirection en fonction du rôle
        if (isPro) {
            navigate("/dashboard"); // Le Pro va sur son tableau de bord
        } else {
            navigate("/"); // Le Client va sur l'accueil
        }
      } else {
        // Erreur renvoyée par le backend (ex: email déjà pris)
        setError(data.error || "Une erreur est survenue lors de l'inscription.");
      }
    } catch (err) {
      setError("Le serveur est injoignable. Vérifiez que votre backend est lancé.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-900 mb-2 italic uppercase">Créer un compte</h2>
          <p className="text-slate-500 text-sm font-medium">Rejoignez la communauté O'RDV</p>
        </div>

        {/* Affichage des erreurs si besoin */}
        {error && (
          <div className="mb-6 p-3 bg-rose-50 text-rose-600 rounded-xl flex items-center gap-2 text-sm font-bold border border-rose-100">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {/* Sélecteur de type de compte (Boutons Alternatifs) */}
        <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
          <button 
            type="button"
            onClick={() => setIsPro(false)}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${!isPro ? "bg-white text-rose-500 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Client
          </button>
          <button 
            type="button"
            onClick={() => setIsPro(true)}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${isPro ? "bg-white text-rose-500 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Prestataire
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          
          {/* Champ Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="email" 
              placeholder="Adresse email" 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-sm transition-all" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Affichage conditionnel : Nom d'établissement si c'est un PRO */}
          {isPro && (
            <div className="relative animate-in fade-in duration-300">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Nom de l'établissement" 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-sm" 
                required 
              />
            </div>
          )}

          {/* Champ Mot de passe */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="password" 
              placeholder="Mot de passe" 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-sm transition-all" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Bouton de validation */}
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-4 bg-rose-500 text-white font-black rounded-xl hover:bg-rose-600 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest shadow-lg shadow-rose-100 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? "Création en cours..." : (isPro ? "Démarrer mon activité" : "M'inscrire gratuitement")} 
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="text-center mt-8 text-slate-600 text-sm">
          Déjà inscrit ? <Link to="/login" className="text-rose-500 font-bold hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}