import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Star,
  Scissors,
  Sparkles,
  Palette,
  Heart,
  Smile,
  Zap,
  ChevronRight,
  Navigation,
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "coiffeur", label: "Coiffeur", icon: Scissors },
  { id: "barbier", label: "Barbier", icon: Zap },
  { id: "beaute", label: "Institut beauté", icon: Sparkles },
  { id: "tatoueur", label: "Tatoueur", icon: Palette },
  { id: "nail-art", label: "Nail Art", icon: Heart },
  { id: "spa", label: "Spa & Bien-être", icon: Smile },
];

const PROVIDERS = [
  {
    id: 1,
    name: "Studio Lumière",
    metier: "Coiffeur",
    note: 4.9,
    avis: 128,
    distance: "0.4 km",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=280&fit=crop",
    badge: "Top noté",
    disponible: true,
  },
  {
    id: 2,
    name: "Le Barbier du Marais",
    metier: "Barbier",
    note: 4.7,
    avis: 93,
    distance: "0.9 km",
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=280&fit=crop",
    badge: null,
    disponible: true,
  },
  {
    id: 3,
    name: "Atelier Iris",
    metier: "Institut de beauté",
    note: 4.8,
    avis: 211,
    distance: "1.2 km",
    image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=280&fit=crop",
    badge: "Nouveau",
    disponible: false,
  },
  {
    id: 4,
    name: "Ink & Soul",
    metier: "Tatoueur",
    note: 5.0,
    avis: 57,
    distance: "1.8 km",
    image: "https://images.unsplash.com/photo-1543889066-b4bc7cd89f7f?w=400&h=280&fit=crop",
    badge: "Top noté",
    disponible: true,
  },
  {
    id: 5,
    name: "Nail Republic",
    metier: "Nail Art",
    note: 4.6,
    avis: 174,
    distance: "2.1 km",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=280&fit=crop",
    badge: null,
    disponible: true,
  },
  {
    id: 6,
    name: "Zen Garden Spa",
    metier: "Spa & Bien-être",
    note: 4.9,
    avis: 302,
    distance: "2.4 km",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=280&fit=crop",
    badge: null,
    disponible: false,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function StarRating({ note }) {
  const full = Math.floor(note);
  const hasHalf = note % 1 >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={12}
          className={
            i < full
              ? "text-amber-400 fill-amber-400"
              : hasHalf && i === full
              ? "text-amber-400 fill-amber-200"
              : "text-slate-300 fill-slate-200"
          }
        />
      ))}
    </span>
  );
}

function ProviderCard({ provider, onClick }) {
  return (
    <article
      onClick={onClick}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-100 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-slate-100">
        <img
          src={provider.image}
          alt={provider.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Badge */}
        {provider.badge && (
          <span className="absolute top-3 left-3 text-xs font-semibold bg-white/90 backdrop-blur-sm text-slate-800 px-2.5 py-1 rounded-full shadow-sm">
            {provider.badge}
          </span>
        )}

        {/* Disponibilité */}
        <span
          className={`absolute top-3 right-3 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm ${
            provider.disponible
              ? "bg-emerald-500/90 text-white"
              : "bg-slate-600/80 text-white"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              provider.disponible ? "bg-white animate-pulse" : "bg-slate-400"
            }`}
          />
          {provider.disponible ? "Disponible" : "Complet"}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-slate-900 text-sm leading-tight group-hover:text-rose-500 transition-colors">
            {provider.name}
          </h3>
          <ChevronRight
            size={16}
            className="flex-shrink-0 text-slate-300 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all mt-0.5"
          />
        </div>

        <p className="text-xs text-slate-500 mb-2.5">{provider.metier}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <StarRating note={provider.note} />
            <span className="text-xs font-semibold text-slate-700">
              {provider.note.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400">({provider.avis})</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Navigation size={11} className="text-rose-400" />
            {provider.distance}
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);

  const filteredProviders = PROVIDERS.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.metier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !activeCategory ||
      p.metier.toLowerCase().includes(
        CATEGORIES.find((c) => c.id === activeCategory)?.label.toLowerCase().split(" ")[0] || ""
      );
    return matchesSearch && matchesCategory;
  });

  return (
    <div
      className="min-h-screen"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#fafafa" }}
    >
      {/* ── Hero Section ──────────────────────────────────────────────────────── */}
      <section className="hero-bg relative overflow-hidden px-4 pt-16 pb-20 text-white">
        {/* Decorative orbs */}
        <div className="hero-orb absolute -top-16 -right-16 w-96 h-96 rounded-full pointer-events-none" />
        <div className="hero-orb-2 absolute -bottom-12 -left-12 w-72 h-72 rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          {/* Eyebrow */}
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-rose-300 mb-4">
            Services de proximité
          </p>

          {/* Title */}
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

          {/* Subtitle */}
          <p className="text-slate-300 text-base sm:text-lg mb-10 max-w-md mx-auto leading-relaxed">
            Réservez en quelques secondes chez les meilleurs artisans près de chez vous.
          </p>

          {/* Search bar */}
          <div
            className="search-glow relative flex items-center bg-white rounded-2xl overflow-hidden transition-all duration-300 max-w-lg mx-auto"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}
          >
            <Search size={18} className="absolute left-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Coiffeur, barbier, spa… ou une ville"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-4 text-slate-800 text-sm placeholder:text-slate-400 bg-transparent outline-none"
            />
            <button
              className="flex-shrink-0 mr-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #f43f5e, #e11d48)" }}
            >
              Rechercher
            </button>
          </div>

          {/* Location hint */}
          <div className="flex items-center justify-center gap-1.5 mt-4 text-slate-400 text-xs">
            <MapPin size={12} className="text-rose-400" />
            <span>Autour de Paris, Île-de-France</span>
          </div>
        </div>
      </section>

      {/* ── Content Area ─────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 -mt-0">
        {/* ── Category Filters ─────────────────────────────────────────────── */}
        <section className="mb-8">
          <div
            className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
            style={{ scrollbarWidth: "none" }}
          >
            {CATEGORIES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveCategory(activeCategory === id ? null : id)}
                className={`category-btn flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                  activeCategory === id
                    ? "active"
                    : "bg-white border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-500"
                }`}
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
              >
                <Icon
                  size={15}
                  className={activeCategory === id ? "text-white" : "text-slate-400"}
                />
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* ── Nearby Section ───────────────────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900">
                À proximité
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {filteredProviders.length} établissement
                {filteredProviders.length > 1 ? "s" : ""} trouvé
                {filteredProviders.length > 1 ? "s" : ""}
              </p>
            </div>
            <button className="text-sm font-medium text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors">
              Voir tout <ChevronRight size={15} />
            </button>
          </div>

          {filteredProviders.length > 0 ? (
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
            <div className="text-center py-20 text-slate-400">
              <Search size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Aucun résultat trouvé</p>
              <p className="text-sm mt-1">Essayez un autre terme ou retirez les filtres.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}