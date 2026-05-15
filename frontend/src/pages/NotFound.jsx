import { useNavigate } from 'react-router-dom';
import { Home, Search, Scissors } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#fafafa' }}
    >
      {/* Icône déco */}
      <div className="w-24 h-24 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-8 shadow-sm">
        <Scissors size={40} className="text-rose-400" />
      </div>

      {/* 404 */}
      <h1
        className="font-black leading-none mb-3 select-none"
        style={{
          fontSize: 'clamp(6rem, 20vw, 10rem)',
          background: 'linear-gradient(135deg, #f43f5e, #c084fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        404
      </h1>

      <h2 className="text-2xl font-bold text-slate-800 mb-2">Page introuvable</h2>
      <p className="text-slate-500 text-sm max-w-xs mb-10 leading-relaxed">
        Cette page n'existe pas ou a été déplacée. Retournez à l'accueil pour trouver votre prochain rendez-vous.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold px-6 py-3 rounded-2xl transition shadow-lg shadow-rose-200"
        >
          <Home size={16} /> Retour à l'accueil
        </button>
        <button
          onClick={() => navigate('/?search=1')}
          className="flex items-center gap-2 border border-slate-200 hover:border-rose-300 hover:text-rose-500 text-slate-600 font-semibold px-6 py-3 rounded-2xl transition bg-white"
        >
          <Search size={16} /> Chercher un prestataire
        </button>
      </div>
    </div>
  );
}
