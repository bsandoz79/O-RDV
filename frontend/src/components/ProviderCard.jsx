import React from 'react';
import { Star, ChevronRight, Navigation } from "lucide-react";

// Sous-composant pour les étoiles (interne à ce fichier)
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

// Composant principal exporté
export default function ProviderCard({ provider, onClick }) {
  return (
    <article
      onClick={onClick}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-100 hover:-translate-y-1"
    >
      {/* Image & Badges */}
      <div className="relative h-44 overflow-hidden bg-slate-100">
        <img
          src={provider.image}
          alt={provider.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {provider.badge && (
          <span className="absolute top-3 left-3 text-xs font-semibold bg-white/90 backdrop-blur-sm text-slate-800 px-2.5 py-1 rounded-full shadow-sm">
            {provider.badge}
          </span>
        )}

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

      {/* Détails du prestataire */}
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