import React from 'react';
import { ChevronRight, Navigation, Heart } from "lucide-react";
import { StarDisplay } from './StarRating';

function toMinutes(str) {
  if (!str) return null;
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
}

function getOpenBadge(todayOpen, todayClose, todayIsClosed) {
  if (todayIsClosed || (!todayOpen && !todayClose)) {
    return { label: 'Fermé', style: 'bg-red-500/90 text-white' };
  }
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const openMin  = toMinutes(todayOpen);
  const closeMin = (todayOpen === '00:00' && todayClose === '00:00') ? 1440 : toMinutes(todayClose);
  if (openMin === null || closeMin === null) return { label: 'Fermé', style: 'bg-red-500/90 text-white' };
  if (nowMin >= openMin && nowMin < closeMin) return { label: 'Ouvert', style: 'bg-emerald-500/90 text-white' };
  if (nowMin < openMin && openMin - nowMin <= 30) return { label: 'Ouvre bientôt', style: 'bg-orange-400/90 text-white' };
  return { label: 'Fermé', style: 'bg-red-500/90 text-white' };
}

function isNew(createdAt) {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < 30 * 24 * 60 * 60 * 1000;
}

export default function ProviderCard({ provider, onClick, isFavorite = false, onFavoriteToggle }) {
  const openBadge = getOpenBadge(provider.todayOpen, provider.todayClose, provider.todayIsClosed);
  const nouveau   = isNew(provider.createdAt);
  const hasRating = provider.avg_rating != null && provider.review_count > 0;

  return (
    <article
      onClick={onClick}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-100 hover:-translate-y-1"
    >
      <div className="relative h-44 overflow-hidden bg-slate-100">
        <img src={provider.image} alt={provider.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        {nouveau && (
          <span className="absolute top-3 left-3 text-xs font-semibold bg-blue-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full shadow-sm">
            Nouveau
          </span>
        )}
        {onFavoriteToggle && (
          <button
            onClick={e => { e.stopPropagation(); onFavoriteToggle(provider.id); }}
            className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center transition hover:scale-110"
            aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart size={15} className={isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'} />
          </button>
        )}
        <span className={`absolute top-3 right-3 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm ${openBadge.style}`}>
          <span className={`w-1.5 h-1.5 rounded-full bg-white ${openBadge.label === 'Ouvert' ? 'animate-pulse' : 'opacity-60'}`} />
          {openBadge.label}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-slate-900 text-sm leading-tight group-hover:text-rose-500 transition-colors">
            {provider.name}
          </h3>
          <ChevronRight size={16} className="flex-shrink-0 text-slate-300 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all mt-0.5" />
        </div>

        <p className="text-xs text-slate-500 mb-2.5">{provider.metier}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {hasRating ? (
              <>
                <StarDisplay rating={provider.avg_rating} size={12} />
                <span className="text-xs font-semibold text-slate-700">{provider.avg_rating.toFixed(1)}</span>
                <span className="text-xs text-slate-400">({provider.review_count})</span>
              </>
            ) : (
              <span className="text-xs text-slate-400 italic">Pas encore d'avis</span>
            )}
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
