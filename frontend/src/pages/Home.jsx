import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Scissors, Sparkles, Palette, Heart, Smile, Zap, Store, Loader2, MapPin, List, Map } from "lucide-react";
import ProviderCard from "../components/ProviderCard";
import API_BASE_URL from '../api/api';

const ProvidersMap = lazy(() => import('../components/ProvidersMap'));

const ICON_MAP = { Scissors, Zap, Sparkles, Palette, Heart, Smile, Store };

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'

  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [userPosition, setUserPosition] = useState(null);

  // Géolocalisation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPosition([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/shop/categories`)
      .then((res) => res.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  const [cityFilter, setCityFilter] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setCityFilter(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchProviders = () => {
    setLoading(true);
    setFetchError(false);
    const params = new URLSearchParams();
    if (activeCategory) params.set('category_id', activeCategory);
    if (cityFilter)     params.set('city', cityFilter);
    if (userPosition) {
      params.set('lat', userPosition[0]);
      params.set('lng', userPosition[1]);
    }
    const url = `${API_BASE_URL}/shop/all${params.toString() ? '?' + params : ''}`;

    fetch(url)
      .then((res) => { if (!res.ok) throw new Error('Erreur serveur'); return res.json(); })
      .then((data) => {
        setProviders(data.map((pro) => ({
          id: pro.id,
          name: pro.name,
          metier: pro.category_name || pro.description || "Prestataire de services",
          note: 5.0,
          avis: 12,
          distance: pro.distance_km !== null ? `${pro.distance_km} km` : (pro.city || ''),
          image: pro.image_url
            ? (pro.image_url.startsWith('http') ? pro.image_url : `${API_BASE_URL.replace('/api', '')}${pro.image_url}`)
            : "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=280&fit=crop",
          latitude:      pro.latitude,
          longitude:     pro.longitude,
          distance_km:   pro.distance_km,
          category_name: pro.category_name,
          createdAt:     pro.created_at,
          todayOpen:     pro.today_open,
          todayClose:    pro.today_close,
          todayIsClosed: pro.today_is_closed,
        })));
        setLoading(false);
      })
      .catch(() => { setFetchError(true); setLoading(false); });
  };

  useEffect(fetchProviders, [activeCategory, cityFilter, userPosition]);

  const filteredProviders = providers.filter((p) =>
    !searchQuery ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.metier || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#fafafa" }}>
      {/* Hero */}
      <section className="hero-bg relative overflow-hidden px-4 pt-16 pb-20 text-white">
        <div className="hero-orb absolute -top-16 -right-16 w-96 h-96 rounded-full pointer-events-none" />
        <div className="hero-orb-2 absolute -bottom-12 -left-12 w-72 h-72 rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-4">
            Votre{" "}
            <span style={{ background: "linear-gradient(90deg, #f43f5e, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              beauté
            </span>
            ,<br />à portée de main.
          </h1>
          <p className="text-slate-300 text-base sm:text-lg mb-10 max-w-md mx-auto leading-relaxed">
            {userPosition ? "Prestataires triés par proximité." : "Découvrez nos prestataires partout en France."}
          </p>
          <div className="search-glow relative flex items-center bg-white rounded-2xl overflow-hidden transition-all duration-300 max-w-lg mx-auto" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
            <Search size={18} className="absolute left-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Nom, ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-4 text-slate-800 text-sm placeholder:text-slate-400 bg-transparent outline-none"
            />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 mt-10">
        {/* Catégories */}
        {categories.length > 0 && (
          <section className="mb-8">
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              <button onClick={() => setActiveCategory(null)} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${activeCategory === null ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200" : "bg-white border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-500"}`}>Tous</button>
              {categories.map((cat) => {
                const Icon = ICON_MAP[cat.icon] || Store;
                return (
                  <button key={cat.id} onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${activeCategory === cat.id ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200" : "bg-white border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-500"}`}>
                    <Icon size={15} />{cat.name}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Header liste + toggle vue */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900">
                {userPosition ? "À proximité" : "Tous les prestataires"}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {loading ? "Chargement..." : `${filteredProviders.length} établissement(s) trouvé(s)`}
                {userPosition && !loading && <span className="ml-2 text-rose-500 font-medium flex items-center gap-1 inline-flex"><MapPin size={11} /> Triés par distance</span>}
              </p>
            </div>
            {/* Toggle liste / carte */}
            <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
              <button onClick={() => setViewMode('list')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <List size={15} /> Liste
              </button>
              <button onClick={() => setViewMode('map')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'map' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <Map size={15} /> Carte
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-20 text-slate-400">
              <Loader2 size={40} className="animate-spin mb-4 text-rose-500" />
              <p className="font-medium">Récupération des données...</p>
            </div>
          ) : fetchError ? (
            <div className="text-center py-20 text-slate-400 bg-white rounded-[2rem] border border-dashed border-slate-200">
              <p className="font-bold text-slate-600">Impossible de charger les prestataires</p>
              <button onClick={fetchProviders} className="mt-4 px-5 py-2.5 bg-rose-500 text-white text-sm font-semibold rounded-xl hover:bg-rose-600 transition">Réessayer</button>
            </div>
          ) : viewMode === 'map' ? (
            <div style={{ height: 500 }} className="rounded-2xl overflow-hidden shadow-md border border-slate-200">
              <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-rose-500" size={32} /></div>}>
                <ProvidersMap
                  providers={filteredProviders}
                  userPosition={userPosition}
                  onProviderClick={(p) => navigate(`/provider/${p.id}`)}
                />
              </Suspense>
            </div>
          ) : filteredProviders.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredProviders.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} onClick={() => navigate(`/provider/${provider.id}`)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 bg-white rounded-[2rem] border border-dashed border-slate-200">
              <Search size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold text-slate-600">Aucun prestataire trouvé</p>
              <button onClick={() => { setActiveCategory(null); }} className="mt-4 px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:border-rose-300 hover:text-rose-500 transition">Voir tous</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
