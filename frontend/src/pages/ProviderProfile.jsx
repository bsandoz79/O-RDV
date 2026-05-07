import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Phone, Clock, Loader2, CalendarPlus,
  ChevronRight, Scissors, Star, CheckCircle2,
} from 'lucide-react';
import API_BASE_URL from '../api/api';
import BookingModal from '../components/BookingModal';

const DAYS = [
  { key: 'monday',    label: 'Lundi' },
  { key: 'tuesday',   label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday',  label: 'Jeudi' },
  { key: 'friday',    label: 'Vendredi' },
  { key: 'saturday',  label: 'Samedi' },
  { key: 'sunday',    label: 'Dimanche' },
];

function formatDuration(m) {
  if (!m) return '';
  const h = Math.floor(m / 60), min = m % 60;
  if (h > 0 && min > 0) return `${h}h${String(min).padStart(2,'0')}`;
  if (h > 0) return `${h}h`;
  return `${m} min`;
}

function formatPrice(p) {
  return Number(p).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

function getOpenStatus(hours) {
  if (!hours || hours.length === 0) return null;
  const todayKey = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()).toLowerCase();
  const h = hours.find(r => r.day_of_week?.toLowerCase() === todayKey);
  if (!h || h.is_closed) return { open: false, label: 'Fermé aujourd\'hui' };
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const toMin = s => { const parts = String(s||'').substring(0,5).split(':').map(Number); return (parts[0]||0)*60+(parts[1]||0); };
  const o = toMin(h.open_time), c = toMin(h.close_time);
  const close = (o===0 && c===0) ? 1440 : c;
  if (nowMin >= o && nowMin < close) return { open: true, label: `Ouvert · ferme à ${String(h.close_time||'').substring(0,5)}` };
  if (nowMin < o) return { open: false, label: `Ouvre à ${String(h.open_time||'').substring(0,5)}` };
  return { open: false, label: 'Fermé' };
}

export default function ProviderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [preselectedService, setPreselectedService] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/shop/profile/${id}`)
      .then(r => { if (!r.ok) throw new Error('Prestataire introuvable'); return r.json(); })
      .then(d => { setProvider(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [id]);

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin text-rose-500" size={40} /></div>;
  if (error || !provider) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-slate-500">
      <p>{error || 'Introuvable'}</p>
      <button onClick={() => navigate(-1)} className="text-rose-500 text-sm flex items-center gap-1 hover:underline"><ArrowLeft size={14} /> Retour</button>
    </div>
  );

  const imageUrl = provider.image_url
    ? (provider.image_url.startsWith('http') ? provider.image_url : `${API_BASE_URL.replace('/api', '')}${provider.image_url}`)
    : 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=500&fit=crop';

  const status = getOpenStatus(provider.hours);

  return (
    <>
      <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div className="relative h-72 sm:h-96 overflow-hidden bg-slate-200">
          <img src={imageUrl} alt={provider.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

          <button onClick={() => navigate(-1)} className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white text-sm font-medium px-3 py-1.5 rounded-xl border border-white/20 hover:bg-white/30 transition">
            <ArrowLeft size={14} /> Retour
          </button>

          {/* Nom + statut dans le hero */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-2 mb-2">
              {status && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${status.open ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-white'}`}>
                  {status.open ? '● ' : '○ '}{status.label}
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight drop-shadow">{provider.name}</h1>
            {provider.city && (
              <div className="flex items-center gap-1 text-white/80 text-sm mt-1">
                <MapPin size={13} /> {provider.city}
              </div>
            )}
          </div>
        </div>

        {/* ── Contenu ──────────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto px-4 pb-32 -mt-6 relative z-10">

          {/* Card infos + CTA */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-2 flex-1">
                {provider.description && (
                  <p className="text-slate-500 text-sm leading-relaxed">{provider.description}</p>
                )}
                {provider.address && (
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <MapPin size={14} className="text-rose-400 mt-0.5 flex-shrink-0" />
                    <span>{provider.address}{provider.zip_code && `, ${provider.zip_code}`}{provider.city && ` ${provider.city}`}</span>
                  </div>
                )}
                {provider.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={14} className="text-rose-400 flex-shrink-0" />
                    <a href={`tel:${provider.phone}`} className="hover:text-rose-500 transition">{provider.phone}</a>
                  </div>
                )}
              </div>
              <button onClick={() => { setPreselectedService(null); setModalOpen(true); }}
                className="flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-rose-100 transition text-sm whitespace-nowrap">
                <CalendarPlus size={16} /> Prendre rendez-vous
              </button>
            </div>
          </div>

          {/* Layout 2 colonnes : Prestations | Horaires */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* ── Prestations ────────────────────────────── */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Scissors size={18} className="text-rose-400" /> Nos prestations
                </h2>
                {provider.services?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {provider.services.map(s => (
                      <div key={s.id}
                        onClick={() => { setPreselectedService(s); setModalOpen(true); }}
                        className="group flex gap-3 p-3 rounded-xl border border-slate-100 hover:border-rose-300 hover:shadow-md hover:shadow-rose-50 transition cursor-pointer bg-white hover:bg-rose-50/20">
                        {s.image_url ? (
                          <img src={s.image_url} alt={s.label} className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-slate-100 group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-rose-50 to-slate-100 flex items-center justify-center flex-shrink-0">
                            <Scissors size={24} className="text-rose-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            <p className="font-semibold text-slate-800 text-sm leading-tight">{s.label}</p>
                            {s.duration && (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-1">
                                <Clock size={10} /> {formatDuration(s.duration)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-base font-black text-rose-500">{formatPrice(s.price)}</span>
                            <span className="text-xs text-rose-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                              Réserver <ChevronRight size={12} />
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Aucune prestation renseignée.</p>
                )}
              </div>
            </div>

            {/* ── Horaires ───────────────────────────────── */}
            <div className="w-full lg:w-72 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-20">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Clock size={18} className="text-rose-400" /> Horaires
                </h2>
                {provider.hours?.length > 0 ? (
                  <ul className="space-y-1">
                    {DAYS.map(({ key, label }) => {
                      const h = provider.hours.find(r => r.day_of_week?.toLowerCase() === key);
                      const isToday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()).toLowerCase() === key;
                      const closed = !h || h.is_closed;
                      return (
                        <li key={key} className={`flex justify-between items-center text-sm px-3 py-2 rounded-lg ${isToday ? 'bg-rose-50 font-bold' : ''}`}>
                          <span className={isToday ? 'text-rose-600' : 'text-slate-600'}>
                            {isToday && <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 mb-0.5" />}
                            {label}
                          </span>
                          {closed ? (
                            <span className="text-slate-300 text-xs">Fermé</span>
                          ) : (
                            <span className={`text-xs font-medium ${isToday ? 'text-rose-500' : 'text-slate-500'}`}>
                              {String(h.open_time||'').substring(0,5)} – {String(h.close_time||'').substring(0,5)}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400 italic">Non renseignés.</p>
                )}

                {/* CTA secondaire */}
                <button onClick={() => { setPreselectedService(null); setModalOpen(true); }}
                  className="mt-5 w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-md shadow-rose-100">
                  <CheckCircle2 size={15} /> Réserver maintenant
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {modalOpen && (
        <BookingModal provider={provider} preselectedService={preselectedService} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
