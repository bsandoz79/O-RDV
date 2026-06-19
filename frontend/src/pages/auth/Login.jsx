import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Helmet } from "react-helmet-async";
import API_BASE_URL from '../../api/api';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const sessionExpired = searchParams.get('session') === 'expired';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("authChange"));

        const pendingBooking = sessionStorage.getItem('booking_redirect');
        if (pendingBooking && data.user?.role === 'user') {
          const { providerId } = JSON.parse(pendingBooking);
          navigate(`/provider/${providerId}`);
        } else {
          sessionStorage.removeItem('booking_redirect');
          navigate("/");
        }
      } else {
        setError(data.error || "Une erreur est survenue lors de la connexion.");
      }
    } catch (err) {
      setError("Impossible de contacter le serveur. Vérifiez qu'il est bien lancé.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Helmet>
      <title>Connexion — O'RDV</title>
      <meta name="description" content="Connectez-vous à O'RDV pour gérer vos rendez-vous beauté en ligne." />
      <meta name="robots" content="noindex" />
    </Helmet>
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <img src="/logo entier.png" alt="O'RDV" className="mx-auto mb-4" style={{ height: '80px', objectFit: 'contain' }} />
          <h2 className="text-3xl font-black text-slate-900 mb-2 font-display italic">Connexion</h2>
          <p className="text-slate-500 text-sm">Accédez à votre espace O'RDV</p>
        </div>

        <div aria-live="polite" aria-atomic="true">
          {sessionExpired && !error && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-100 text-amber-700 rounded-2xl flex items-center gap-3 text-sm font-medium">
              <AlertCircle size={18} />
              Votre session a expiré. Veuillez vous reconnecter.
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 text-sm font-medium animate-shake">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
        </div>

        <form onSubmit={handleLogin} className="space-y-5" aria-label="Formulaire de connexion">
          <div>
            <label htmlFor="login-email" className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 transition-all text-slate-900"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-semibold text-slate-700 mb-1.5">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 transition-all text-slate-900"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
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

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium">ou</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <a
          href={`${API_BASE_URL}/auth/google`}
          className="w-full flex items-center justify-center gap-3 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Continuer avec Google
        </a>

        <p className="text-center mt-6 text-slate-600 text-sm">
          Nouveau sur la plateforme ?{" "}
          <Link to="/register" className="text-rose-500 font-bold hover:underline">S'inscrire</Link>
        </p>
      </div>
    </div>
    </>
  );
}
