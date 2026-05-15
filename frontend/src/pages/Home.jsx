import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Scissors, Sparkles, Palette, Heart, Smile, Zap, Store, Loader2, MapPin, Maximize2, Minimize2, SlidersHorizontal, Star, X } from "lucide-react";
import ProviderCard from "../components/ProviderCard";
import API_BASE_URL from '../api/api';

const ProvidersMap = lazy(() => import('../components/ProvidersMap'));

const ICON_MAP = { Scissors, Zap, Sparkles, Palette, Heart, Smile, Store };

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [sortBy, setSortBy]       = useState('distance'); // 'distance' | 'rating' | 'name'
  const [openNow, setOpenNow]     = useState(false);
  const [minRating, setMinRating] = useState(null); // null | 3 | 4

  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [userPosition, setUserPosition] = useState(null);

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

  const fetchProviders = () => {
    setLoading(true);
    setFetchError(false);
    const params = new URLSearchParams();
    if (activeCategory) params.set('category_id', activeCategory);
    if (userPosition) {
      params.set('lat', userPosition[0]);
      params.set('lng', userPosition[1]);
    }
    const url = `${API_BASE_URL}/shop/all${params.toString() ? '?' + params : ''}`;

    fetch(url)
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((data) => {
        setProviders(data.map((pro) => ({
          id: pro.id,
          name: pro.name,
          metier: pro.category_name || pro.description || "Prestataire de services",
          avg_rating:   pro.avg_rating ?? null,
          review_count: pro.review_count ?? 0,
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

  useEffect(fetchProviders, [activeCategory, userPosition]);

  const filteredProviders = useMemo(() => {
    let list = providers.filter(p => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!(p.name.toLowerCase().includes(q) ||
              (p.metier || '').toLowerCase().includes(q) ||
              (p.distance || '').toLowerCase().includes(q))) return false;
      }
      if (openNow) {
        if (p.todayIsClosed) return false;
        if (p.todayOpen && p.todayClose) {
          const now = new Date();
          const nowMin = now.getHours() * 60 + now.getMinutes();
          const [oh, om] = p.todayOpen.split(':').map(Number);
          const [ch, cm] = p.todayClose.split(':').map(Number);
          if (nowMin < oh * 60 + om || nowMin >= ch * 60 + cm) return false;
        }
      }
      if (minRating !== null && (p.avg_rating === null || p.avg_rating < minRating)) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'rating') return (b.avg_rating ?? -1) - (a.avg_rating ?? -1);
      if (sortBy === 'name')   return a.name.localeCompare(b.name, 'fr');
      // distance (default)
      if (a.distance_km !== null && b.distance_km !== null) return a.distance_km - b.distance_km;
      if (a.distance_km === null) return 1;
      if (b.distance_km === null) return -1;
      return 0;
    });
  }, [providers, searchQuery, openNow, minRating, sortBy]);

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

        {/* Filtres */}
        <section className="mb-5 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 mr-1">
            <SlidersHorizontal size={13} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">Trier :</span>
          </div>
          {[
            { key: 'distance', label: '📍 Distance' },
            { key: 'rating',   label: '⭐ Mieux notés' },
            { key: 'name',     label: 'A–Z' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setSortBy(key)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all
                ${sortBy === key
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}>
              {label}
            </button>
          ))}

          <div className="w-px h-4 bg-slate-200 mx-1" />

          <button onClick={() => setOpenNow(v => !v)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5
              ${openNow ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-600'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${openNow ? 'bg-white' : 'bg-emerald-400'}`} />
            Ouvert maintenant
          </button>

          {[3, 4].map(n => (
            <button key={n} onClick={() => setMinRating(minRating === n ? null : n)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1
                ${minRating === n ? 'bg-amber-400 border-amber-400 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-600'}`}>
              {n}+ <Star size={10} className={minRating === n ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'} />
            </button>
          ))}

          {(sortBy !== 'distance' || openNow || minRating !== null) && (
            <button onClick={() => { setSortBy('distance'); setOpenNow(false); setMinRating(null); }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all flex items-center gap-1">
              <X size={11} /> Réinitialiser
            </button>
          )}
        </section>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              {userPosition ? "À proximité" : "Tous les prestataires"}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {loading ? "Chargement..." : `${filteredProviders.length} établissement(s) trouvé(s)`}
              {userPosition && !loading && <span className="ml-2 text-rose-500 font-medium inline-flex items-center gap-1"><MapPin size={11} /> Triés par distance</span>}
            </p>
          </div>
        </div>

        {/* Layout split : liste + carte côte à côte */}
        <section className="mb-16">
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
          ) : (
            <div className={`flex gap-6 ${mapExpanded ? 'flex-col' : 'flex-col lg:flex-row'}`}>

              {/* Liste des prestataires */}
              {!mapExpanded && (
                <div className="flex-1 min-w-0">
                  {filteredProviders.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {filteredProviders.map((provider) => (
                        <ProviderCard key={provider.id} provider={provider} onClick={() => navigate(`/provider/${provider.id}`)} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 text-slate-400 bg-white rounded-[2rem] border border-dashed border-slate-200">
                      <Search size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="font-bold text-slate-600">Aucun prestataire trouvé</p>
                      <button onClick={() => setActiveCategory(null)} className="mt-4 px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:border-rose-300 hover:text-rose-500 transition">Voir tous</button>
                    </div>
                  )}
                </div>
              )}

              {/* Carte */}
              <div className={`relative ${mapExpanded ? 'w-full' : 'lg:w-2/5 w-full'}`}>
                <div
                  style={{ height: mapExpanded ? 600 : 500 }}
                  className="rounded-2xl overflow-hidden shadow-md border border-slate-200 sticky top-20"
                >
                  <Suspense fallback={<div className="flex items-center justify-center h-full bg-slate-100"><Loader2 className="animate-spin text-rose-500" size={32} /></div>}>
                    <ProvidersMap
                      providers={filteredProviders}
                      userPosition={userPosition}
                      onProviderClick={(p) => navigate(`/provider/${p.id}`)}
                    />
                  </Suspense>
                  {/* Bouton agrandir/réduire */}
                  <button
                    onClick={() => setMapExpanded(!mapExpanded)}
                    className="absolute top-3 right-3 z-[1000] bg-white shadow-md border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 flex items-center gap-1.5 hover:bg-slate-50 transition"
                  >
                    {mapExpanded ? <><Minimize2 size={13} /> Réduire</> : <><Maximize2 size={13} /> Agrandir</>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
