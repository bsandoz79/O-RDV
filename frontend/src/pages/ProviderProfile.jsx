import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  Loader2,
  CalendarPlus,
  ChevronRight,
} from 'lucide-react';
import API_BASE_URL from '../api/api';
import BookingModal from '../components/BookingModal';

// Clés en anglais (valeurs stockées en DB), labels en français pour l'affichage
const DAYS = [
  { key: 'monday',    label: 'Lundi' },
  { key: 'tuesday',   label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday',  label: 'Jeudi' },
  { key: 'friday',    label: 'Vendredi' },
  { key: 'saturday',  label: 'Samedi' },
  { key: 'sunday',    label: 'Dimanche' },
];

function formatDuration(minutes) {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h${String(m).padStart(2, '0')}`;
  if (h > 0) return `${h}h`;
  return `${m} min`;
}

function formatPrice(price) {
  return Number(price).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
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
      .then((res) => {
        if (!res.ok) throw new Error('Prestataire introuvable');
        return res.json();
      })
      .then((data) => {
        setProvider(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-rose-500" size={40} />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-slate-500 gap-4">
        <p className="text-lg font-medium">{error || 'Prestataire introuvable'}</p>
        <Link to="/" className="text-rose-500 hover:underline text-sm flex items-center gap-1">
          <ArrowLeft size={14} /> Retour à l'accueil
        </Link>
      </div>
    );
  }

  const imageUrl = provider.image_url
    ? `${API_BASE_URL.replace('/api', '')}${provider.image_url}`
    : 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=400&fit=crop';

  const handleReserve = (service) => {
    setPreselectedService(service);
    setModalOpen(true);
  };

  const handleGlobalReserve = () => {
    setPreselectedService(null);
    setModalOpen(true);
  };

  return (
    <>
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Hero Image */}
      <div className="relative h-56 sm:h-72 overflow-hidden bg-slate-200">
        <img
          src={imageUrl}
          alt={provider.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Bouton retour */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm text-slate-700 text-sm font-medium px-3 py-2 rounded-xl shadow hover:bg-white transition"
        >
          <ArrowLeft size={15} /> Retour
        </button>
      </div>

      {/* Contenu principal */}
      <div className="max-w-3xl mx-auto px-4 pb-20">
        {/* Card en-tête */}
        <div className="bg-white rounded-2xl shadow-sm -mt-10 relative z-10 p-6 mb-4">
          <h1 className="text-2xl font-bold text-slate-900">{provider.name}</h1>
          {provider.description && (
            <p className="text-slate-500 text-sm mt-1">{provider.description}</p>
          )}

          <div className="mt-4 space-y-2">
            {provider.address && (
              <div className="flex items-start gap-2 text-sm text-slate-600">
                <MapPin size={15} className="text-rose-400 mt-0.5 flex-shrink-0" />
                <span>
                  {provider.address}
                  {provider.zip_code && `, ${provider.zip_code}`}
                  {provider.city && ` ${provider.city}`}
                </span>
              </div>
            )}
            {provider.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone size={15} className="text-rose-400 flex-shrink-0" />
                <a href={`tel:${provider.phone}`} className="hover:text-rose-500 transition">
                  {provider.phone}
                </a>
              </div>
            )}
          </div>

          {/* CTA global */}
          <button
            onClick={handleGlobalReserve}
            className="mt-5 w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold px-6 py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-rose-100"
          >
            <CalendarPlus size={16} />
            Prendre rendez-vous
          </button>
        </div>

        {/* Section Services */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Prestations</h2>

          {provider.services && provider.services.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {provider.services.map((service) => (
                <li key={service.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{service.label}</p>
                    {service.duration && (
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-400">
                        <Clock size={11} />
                        {formatDuration(service.duration)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-bold text-slate-900">
                      {formatPrice(service.price)}
                    </span>
                    <button
                      onClick={() => handleReserve(service)}
                      className="flex items-center gap-1 text-xs font-semibold text-rose-500 border border-rose-200 bg-rose-50 hover:bg-rose-500 hover:text-white px-3 py-1.5 rounded-lg transition"
                    >
                      Réserver <ChevronRight size={12} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400 italic">Aucune prestation renseignée.</p>
          )}
        </div>

        {/* Section Horaires */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Horaires d'ouverture</h2>

          {provider.hours && provider.hours.length > 0 ? (
            <ul className="space-y-2">
              {DAYS.map(({ key, label }) => {
                const h = provider.hours.find(
                  (row) => row.day_of_week?.toLowerCase() === key
                );
                const isToday =
                  new Intl.DateTimeFormat('en-US', { weekday: 'long' })
                    .format(new Date())
                    .toLowerCase() === key;

                return (
                  <li
                    key={key}
                    className={`flex justify-between text-sm px-3 py-2 rounded-lg ${
                      isToday ? 'bg-rose-50 font-semibold text-rose-600' : 'text-slate-600'
                    }`}
                  >
                    <span>{label}</span>
                    {!h || h.is_closed ? (
                      <span className={isToday ? 'text-rose-400' : 'text-slate-400'}>Fermé</span>
                    ) : (
                      <span>
                        {h.open_time?.substring(0, 5)} – {h.close_time?.substring(0, 5)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-slate-400 italic">Horaires non renseignés.</p>
          )}
        </div>
      </div>
    </div>

    {modalOpen && (
      <BookingModal
        provider={provider}
        preselectedService={preselectedService}
        onClose={() => setModalOpen(false)}
      />
    )}
  </>
  );
}
