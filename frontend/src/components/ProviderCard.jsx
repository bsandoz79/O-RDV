import React from 'react';
import { MapPin, Heart, Star, CalendarDays } from "lucide-react";
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

const FR_DAYS   = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const FR_MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function getNextAvailability(todayOpen, todayClose, todayIsClosed) {
  const now    = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  if (!todayIsClosed && todayOpen && todayClose) {
    const openMin  = toMinutes(todayOpen);
    const closeMin = (todayOpen === '00:00' && todayClose === '00:00') ? 1440 : toMinutes(todayClose);
    if (nowMin >= openMin && nowMin < closeMin) return `Aujourd'hui · ${todayOpen} – ${todayClose}`;
    if (nowMin < openMin) return `Aujourd'hui à ${todayOpen}`;
  }

  // Cherche le prochain jour ouvrable (lun-sam)
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  while (next.getDay() === 0) next.setDate(next.getDate() + 1);

  return `${FR_DAYS[next.getDay()]} ${next.getDate()} ${FR_MONTHS[next.getMonth()]} ${next.getFullYear()}`;
}

export default function ProviderCard({ provider, onClick, isFavorite = false, onFavoriteToggle }) {
  const openBadge  = getOpenBadge(provider.todayOpen, provider.todayClose, provider.todayIsClosed);
  const nouveau    = isNew(provider.createdAt);
  const hasRating  = provider.avg_rating != null && provider.review_count > 0;
  const nextAvail  = getNextAvailability(provider.todayOpen, provider.todayClose, provider.todayIsClosed);

  // Adresse : address + zip_code + city, sinon distance
  const addressParts = [
    provider.address,
    [provider.zip_code, provider.city].filter(Boolean).join(' '),
  ].filter(Boolean);
  const addressStr = addressParts.length > 0
    ? addressParts.join(', ')
    : (provider.distance || '');

  return (
    <article className="group flex bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">

      {/* ── Image gauche ─────────────────────────────────────────────── */}
      <div className="relative flex-shrink-0 bg-slate-100 overflow-hidden" style={{ width: '230px' }}>
        <img
          src={provider.image}
          alt={provider.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10 pointer-events-none" />

        {/* Badge ouvert/fermé */}
        <span className={`absolute top-3 left-3 flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm ${openBadge.style}`}>
          <span className={`w-1.5 h-1.5 rounded-full bg-white ${openBadge.label === 'Ouvert' ? 'animate-pulse' : 'opacity-60'}`} />
          {openBadge.label}
        </span>

        {/* Favori */}
        {onFavoriteToggle && (
          <button
            onClick={e => { e.stopPropagation(); onFavoriteToggle(provider.id); }}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center hover:scale-110 transition"
            aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart size={13} className={isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'} />
          </button>
        )}

        {/* Badge nouveau */}
        {nouveau && (
          <span className="absolute bottom-3 left-3 text-[11px] font-semibold bg-blue-500/90 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full">
            Nouveau
          </span>
        )}

        {/* Dots carousel (décoratifs) */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
        </div>
      </div>

      {/* ── Contenu droit ────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 justify-between">

        {/* Infos principales */}
        <div className="p-5 pb-4 space-y-2.5">

          {/* Nom */}
          <h3
            onClick={onClick}
            className="text-lg font-bold text-slate-900 group-hover:text-rose-500 transition-colors cursor-pointer leading-tight"
          >
            {provider.name}
          </h3>

          {/* Adresse */}
          {addressStr && (
            <div className="flex items-start gap-1.5">
              <MapPin size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-500 leading-snug">{addressStr}</span>
            </div>
          )}

          {/* Note */}
          {hasRating ? (
            <div className="flex items-center gap-2">
              <StarDisplay rating={provider.avg_rating} size={13} />
              <span className="text-sm font-semibold text-slate-700">{provider.avg_rating.toFixed(1)}</span>
              <span className="text-sm text-slate-400">({provider.review_count} avis)</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">Pas encore d'avis</span>
          )}

          {/* Prochaine disponibilité */}
          <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-3 border border-slate-100">
            <CalendarDays size={16} className="text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prochaine disponibilité</p>
              <p className="text-sm font-semibold text-blue-600 mt-0.5">{nextAvail}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 flex items-center justify-between border-t border-slate-100">
          <button
            onClick={onClick}
            className="text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors underline underline-offset-2"
          >
            Plus d'informations
          </button>
          <button
            onClick={e => { e.stopPropagation(); onClick && onClick(); }}
            className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-rose-500 transition-colors duration-200"
          >
            Prendre RDV
          </button>
        </div>

      </div>
    </article>
  );
}
