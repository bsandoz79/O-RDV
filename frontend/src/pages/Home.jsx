import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Scissors, Sparkles, Palette, Heart, Smile, Zap, Store, Loader2 } from "lucide-react";
import ProviderCard from "../components/ProviderCard";
import API_BASE_URL from '../api/api';

// Mapping icône par nom (correspond à la colonne `icon` en DB)
const ICON_MAP = { Scissors, Zap, Sparkles, Palette, Heart, Smile, Store };

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(null); // id numérique

  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ─── Charger les catégories ────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE_URL}/shop/categories`)
      .then((res) => res.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  // ─── Charger les prestataires (re-fetch si filtre change) ──────
  // Filtre ville envoyé au backend avec debounce 400ms
  const [cityFilter, setCityFilter] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setCityFilter(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory) params.set('category_id', activeCategory);
    if (cityFilter)     params.set('city', cityFilter);
    const url = `${API_BASE_URL}/shop/all${params.toString() ? '?' + params : ''}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setProviders(data.map((pro) => ({
          id: pro.id,
          name: pro.name,
          metier: pro.category_name || pro.description || "Prestataire de services",
          note: 5.0,
          avis: 12,
          distance: pro.city || "Amiens",
          image: pro.image_url
            ? `${API_BASE_URL.replace('/api', '')}${pro.image_url}`
            : "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=280&fit=crop",
          createdAt:     pro.created_at,
          todayOpen:     pro.today_open,
          todayClose:    pro.today_close,
          todayIsClosed: pro.today_is_closed,
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeCategory, cityFilter]);

  // Filtrage nom local (ville déjà filtrée côté backend)
  const filteredProviders = providers.filter((p) =>
    !searchQuery ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.distance.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="min-h-screen"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#fafafa" }}
    >
      {/* Hero Section */}
      <section className="hero-bg relative overflow-hidden px-4 pt-16 pb-20 text-white">
        <div className="hero-orb absolute -top-16 -right-16 w-96 h-96 rounded-full pointer-events-none" />
        <div className="hero-orb-2 absolute -bottom-12 -left-12 w-72 h-72 rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-4">
            Votre{" "}
            <span
              className="relative inline-block"
              style={{
                background: "linear-gradient(90deg, #f43f5e, #c084fc)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              beauté
            </span>
            ,<br />à portée de main.
          </h1>

          <p className="text-slate-300 text-base sm:text-lg mb-10 max-w-md mx-auto leading-relaxed">
            Découvrez nos prestataires à Amiens et partout ailleurs.
          </p>

          {/* Barre de Recherche */}
          <div
            className="search-glow relative flex items-center bg-white rounded-2xl overflow-hidden transition-all duration-300 max-w-lg mx-auto"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}
          >
            <Search size={18} className="absolute left-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Nom, ville (ex: Amiens)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-4 text-slate-800 text-sm placeholder:text-slate-400 bg-transparent outline-none"
            />
          </div>
        </div>
      </section>

      {/* Zone de Contenu */}
      <div className="max-w-5xl mx-auto px-4 mt-10">
        
        {/* Catégories */}
        {categories.length > 0 && (
          <section className="mb-8">
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {/* Bouton "Tous" */}
              <button
                onClick={() => setActiveCategory(null)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                  activeCategory === null
                    ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200"
                    : "bg-white border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-500"
                }`}
              >
                Tous
              </button>

              {categories.map((cat) => {
                const Icon = ICON_MAP[cat.icon] || Store;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                      activeCategory === cat.id
                        ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200"
                        : "bg-white border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-500"
                    }`}
                  >
                    <Icon size={15} />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Liste des Prestataires */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900">À proximité</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {loading ? "Chargement..." : `${filteredProviders.length} établissement(s) trouvé(s)`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-20 text-slate-400">
              <Loader2 size={40} className="animate-spin mb-4 text-rose-500" />
              <p className="font-medium">Récupération des données...</p>
            </div>
          ) : filteredProviders.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProviders.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onClick={() => navigate(`/provider/${provider.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 bg-white rounded-[2rem] border border-dashed border-slate-200">
              <Search size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold text-slate-600">Aucun prestataire trouvé</p>
              <p className="text-sm mt-1">Vérifiez que votre serveur Backend est lancé et que la BD contient des données.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}