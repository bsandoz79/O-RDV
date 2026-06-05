import React from 'react';
import { Navigation, Heart, ChevronRight } from "lucide-react";
import { StarDisplay } from './StarRating';

function toMinutes(str) {
  if (!str) return null;
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
}

function getOpenBadge(todayOpen, todayClose, todayIsClosed) {
  if (todayIsClosed || (!todayOpen && !todayClose))
    return { label: 'Fermé', style: 'bg-red-500/90 text-white' };
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
      className="group flex bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
      style={{ height: '168px' }}
    >
      {/* Image gauche */}
      <div className="relative flex-shrink-0 bg-slate-100" style={{ width: '200px' }}>
        <img
          src={provider.image}
          alt={provider.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />

        {/* Badge ouvert/fermé */}
        <span className={`absolute top-3 left-3 flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm shadow-sm ${openBadge.style}`}>
          <span className={`w-1.5 h-1.5 rounded-full bg-white ${openBadge.label === 'Ouvert' ? 'animate-pulse' : 'opacity-60'}`} />
          {openBadge.label}
        </span>

        {nouveau && (
          <span className="absolute bottom-3 left-3 text-[11px] font-semibold bg-blue-500/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">
            Nouveau
          </span>
        )}
      </div>

      {/* Infos droite */}
      <div className="flex-1 min-w-0 flex flex-col justify-between p-4 pl-5">
        {/* Haut : nom, catégorie, note */}
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-slate-900 text-base leading-tight truncate group-hover:text-rose-500 transition-colors">
              {provider.name}
            </h3>
            {onFavoriteToggle && (
              <button
                onClick={e => { e.stopPropagation(); onFavoriteToggle(provider.id); }}
                className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center hover:scale-110 transition"
                aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <Heart size={13} className={isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'} />
              </button>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-0.5 truncate">{provider.metier}</p>

          <div className="flex items-center gap-1.5 mt-2">
            {hasRating ? (
              <>
                <StarDisplay rating={provider.avg_rating} size={11} />
                <span className="text-xs font-semibold text-slate-700">{provider.avg_rating.toFixed(1)}</span>
                <span className="text-xs text-slate-400">({provider.review_count} avis)</span>
              </>
            ) : (
              <span className="text-xs text-slate-400 italic">Pas encore d'avis</span>
            )}
          </div>
        </div>

        {/* Bas : distance + bouton */}
        <div className="flex items-center justify-between gap-3">
          {provider.distance && (
            <div className="flex items-center gap-1 text-xs text-slate-500 min-w-0">
              <Navigation size={11} className="flex-shrink-0 text-rose-400" />
              <span className="truncate">{provider.distance}</span>
            </div>
          )}
          <button
            onClick={e => { e.stopPropagation(); onClick && onClick(); }}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-rose-500 transition-colors duration-200"
          >
            Prendre RDV <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </article>
  );
}
