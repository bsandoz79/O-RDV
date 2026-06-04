import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, CalendarDays, Clock, CheckCircle2, Loader2, Bell, Lock } from 'lucide-react';
import API_BASE_URL from '../api/api';
import { buildGoogleCalendarUrl } from '../utils/googleCalendar';

const MONTHS_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
];
const DAYS_FR_SHORT = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

// Retourne true si la date est dans le passé (avant aujourd'hui)
function isPast(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

// Retourne le nom du jour en anglais minuscule (correspond à la valeur en DB)
function getDayName(date) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date).toLowerCase();
}

// Format YYYY-MM-DD en heure locale (évite le décalage UTC)
function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function BookingModal({ provider, preselectedService, onClose, initialDate, initialTime }) {
  const navigate = useNavigate();

  // ─── États ──────────────────────────────────────────────────────────
  const isRestored = !!(preselectedService && initialDate && initialTime);
  const [step, setStep] = useState(isRestored ? 'confirm' : 'calendar'); // 'calendar' | 'slots' | 'confirm' | 'done' | 'auth_required'

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const [selectedDate, setSelectedDate] = useState(() => {
    if (initialDate) {
      const [y, m, d] = initialDate.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return null;
  });
  const [selectedTime, setSelectedTime] = useState(initialTime || null);
  const [selectedService, setSelectedService] = useState(preselectedService || null);
  const [countdown, setCountdown] = useState(3);

  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [closedDay, setClosedDay] = useState(false);

  // Jours fermés pour le mois affiché (noms des jours récurrents)
  const [closedDayNames, setClosedDayNames] = useState(new Set());
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState(null);

  // ─── SMS reminder — pré-rempli depuis le profil utilisateur ────────
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [phone, setPhone] = useState(storedUser.phone || '');
  const [smsConsent, setSmsConsent] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // ─── Charger les jours fermés du prestataire ────────────────────────
  useEffect(() => {
    if (!provider?.hours) return;
    const closed = new Set(
      provider.hours
        .filter(h => h.is_closed)
        .map(h => h.day_of_week.toLowerCase())
    );
    setClosedDayNames(closed);
  }, [provider]);

  // ─── Compte à rebours avant redirection vers login ──────────────────
  useEffect(() => {
    if (step !== 'auth_required') return;
    let count = 3;
    setCountdown(3);
    const interval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        navigate('/login');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Charger les créneaux quand une date est sélectionnée ───────────
  const fetchSlots = useCallback(async (date) => {
    setLoadingSlots(true);
    setSlots([]);
    setClosedDay(false);
    const duration = selectedService?.duration || 30;
    try {
      const res = await fetch(
        `${API_BASE_URL}/appointments/availability/${provider.id}/${toDateString(date)}?duration=${duration}`
      );
      const data = await res.json();
      if (data.closed) {
        setClosedDay(true);
      } else {
        setSlots(data.slots ?? []);
      }
    } catch {
      setError('Impossible de charger les créneaux.');
    } finally {
      setLoadingSlots(false);
    }
  }, [provider.id, selectedService]);

  const handleDayClick = (date) => {
    if (isPast(date) || closedDayNames.has(getDayName(date))) return;
    setSelectedDate(date);
    setSelectedTime(null);
    fetchSlots(date);
    setStep('slots');
  };

  const handleTimeClick = (time) => {
    setSelectedTime(time);
    setStep('confirm');
  };

  // ─── Confirmation / Envoi ────────────────────────────────────────────
  const handleConfirm = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!user || !token) {
      sessionStorage.setItem('booking_redirect', JSON.stringify({
        providerId: provider.id,
        serviceId: selectedService?.id,
        date: selectedDate ? toDateString(selectedDate) : null,
        time: selectedTime,
      }));
      setStep('auth_required');
      return;
    }

    if (!selectedService) {
      setError('Veuillez sélectionner une prestation.');
      return;
    }

    setBooking(true);
    setError(null);

    // Validation téléphone uniquement si renseigné
    if (phone && !/^(\+?\d[\s\-.]?){7,15}$/.test(phone.trim())) {
      setPhoneError('Format invalide (ex : 06 12 34 56 78)');
      setBooking(false);
      return;
    }
    setPhoneError('');

    const dateStr = toDateString(selectedDate);
    const payload = {
      provider_id: provider.id,
      service_id: selectedService.id,
      appointment_date: `${dateStr} ${selectedTime}:00`,
      phone: phone.trim() || null,
      send_sms_reminder: smsConsent && phone.trim() ? true : false,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Si un numéro a été saisi, on le sauvegarde dans le profil utilisateur
        if (phone.trim()) {
          // On récupère d'abord le profil complet pour ne pas écraser first_name / last_name
          fetch(`${API_BASE_URL}/user/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(profile => {
              const payload = {
                first_name: profile.first_name || null,
                last_name:  profile.last_name  || null,
                email:      profile.email,
                phone:      phone.trim(),
              };
              fetch(`${API_BASE_URL}/user/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
              }).catch(() => {});
              // Mettre à jour le localStorage avec le numéro
              const stored = JSON.parse(localStorage.getItem('user') || '{}');
              localStorage.setItem('user', JSON.stringify({ ...stored, phone: phone.trim() }));
            }).catch(() => {});
        }
        setStep('done');
      } else {
        const data = await res.json();
        setError(data.error || 'Erreur lors de la réservation.');
      }
    } catch {
      setError('Erreur réseau.');
    } finally {
      setBooking(false);
    }
  };

  // ─── Construction du calendrier ──────────────────────────────────────
  function buildCalendarDays() {
    const firstDay = new Date(viewYear, viewMonth, 1);
    // Lundi = 0 dans notre grille
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(viewYear, viewMonth, d));
    }
    return cells;
  }

  const calendarDays = buildCalendarDays();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Réservation</p>
            <h2 className="text-base font-bold text-slate-900">{provider.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition text-slate-500">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* ÉTAPE — AUTH REQUIRED */}
          {step === 'auth_required' && (
            <div className="flex flex-col items-center text-center py-6 gap-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
                <Lock size={30} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Connexion requise</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                  Pour confirmer votre réservation, vous devez être connecté à votre compte O'RDV.
                </p>
              </div>
              <p className="text-xs text-slate-400">
                Redirection automatique dans{' '}
                <span className="font-bold text-rose-500">{countdown}</span>{' '}
                seconde{countdown > 1 ? 's' : ''}…
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 rounded-xl transition"
              >
                Se connecter maintenant
              </button>
              <button
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-slate-600 transition"
              >
                Annuler la réservation
              </button>
            </div>
          )}

          {/* ÉTAPE — DONE */}
          {step === 'done' && (
            <div className="flex flex-col items-center text-center py-6 gap-3">
              <CheckCircle2 size={52} className="text-emerald-500" />
              <h3 className="text-xl font-bold text-slate-800">Réservation confirmée !</h3>
              <p className="text-sm text-slate-500">
                {selectedService?.label} — le{' '}
                {selectedDate?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}{' '}
                à {selectedTime}
              </p>

              <p className="text-xs text-slate-400 mt-1">Ajouter à votre agenda :</p>
              <div className="flex gap-2">
                <a
                  href={buildGoogleCalendarUrl({
                    title: `${provider.name} — ${selectedService?.label}`,
                    description: `Prestation : ${selectedService?.label}\nDurée : ${selectedService?.duration} min\nPrix : ${selectedService?.price} €\n\nRéservé via O'RDV`,
                    startDate: (() => {
                      const d = new Date(selectedDate);
                      const [h, m] = selectedTime.split(':');
                      d.setHours(Number(h), Number(m), 0, 0);
                      return d.toISOString();
                    })(),
                    durationMinutes: selectedService?.duration || 30,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-xl transition"
                >
                  <CalendarDays size={15} /> Google Agenda
                </a>
                <button
                  onClick={onClose}
                  className="bg-slate-100 text-slate-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-slate-200 transition"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}

          {/* ÉTAPE — CALENDRIER */}
          {step === 'calendar' && (
            <>
              {/* Sélection service si non pré-sélectionné */}
              {!preselectedService && provider.services?.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Prestation</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {provider.services.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedService(s)}
                        className={`w-full text-left flex justify-between items-center px-3 py-2.5 rounded-xl border text-sm transition ${
                          selectedService?.id === s.id
                            ? 'border-rose-400 bg-rose-50 text-rose-700 font-semibold'
                            : 'border-slate-200 hover:border-rose-200 text-slate-700'
                        }`}
                      >
                        <span>{s.label}</span>
                        <span className="text-xs text-slate-400">{Number(s.price).toFixed(2)} €</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mini calendrier */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-semibold text-slate-800 capitalize">
                  {MONTHS_FR[viewMonth]} {viewYear}
                </span>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition">
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-7 mb-2">
                {DAYS_FR_SHORT.map(d => (
                  <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-1">
                {calendarDays.map((date, i) => {
                  if (!date) return <div key={`empty-${i}`} />;
                  const past = isPast(date);
                  const closed = closedDayNames.has(getDayName(date));
                  const disabled = past || closed;
                  const isSelected = selectedDate && toDateString(date) === toDateString(selectedDate);

                  return (
                    <button
                      key={i}
                      onClick={() => !disabled && handleDayClick(date)}
                      disabled={disabled}
                      className={`
                        mx-auto w-9 h-9 rounded-xl text-sm font-medium transition
                        ${isSelected ? 'bg-rose-500 text-white shadow-md' : ''}
                        ${!disabled && !isSelected ? 'hover:bg-rose-50 hover:text-rose-600 text-slate-700' : ''}
                        ${disabled ? 'text-slate-300 cursor-not-allowed' : ''}
                      `}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* ÉTAPE — CRÉNEAUX */}
          {step === 'slots' && (
            <>
              <button
                onClick={() => setStep('calendar')}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-4 transition"
              >
                <ChevronLeft size={13} /> Changer de date
              </button>

              <div className="flex items-center gap-2 mb-4 text-sm font-medium text-slate-700">
                <CalendarDays size={15} className="text-rose-400" />
                {selectedDate?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>

              {loadingSlots ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={28} className="animate-spin text-rose-400" />
                </div>
              ) : closedDay ? (
                <p className="text-center text-slate-400 text-sm py-8">Établissement fermé ce jour-là.</p>
              ) : slots.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">Aucun créneau disponible.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                  {slots.map(({ time, available }) => (
                    <button
                      key={time}
                      disabled={!available}
                      onClick={() => available && handleTimeClick(time)}
                      className={`
                        flex items-center justify-center gap-1 min-h-[44px] rounded-xl text-xs font-semibold transition
                        ${available
                          ? 'bg-slate-50 border border-slate-200 text-slate-700 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600'
                          : 'bg-slate-100 text-slate-300 cursor-not-allowed line-through'}
                      `}
                    >
                      <Clock size={10} className={available ? 'text-rose-400' : 'text-slate-300'} />
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ÉTAPE — CONFIRMATION */}
          {step === 'confirm' && (
            <>
              <button
                onClick={() => setStep('slots')}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-4 transition"
              >
                <ChevronLeft size={13} /> Changer l'heure
              </button>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-3 mb-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Établissement</span>
                  <span className="font-semibold text-slate-800">{provider.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Prestation</span>
                  <span className="font-semibold text-slate-800">{selectedService?.label ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date</span>
                  <span className="font-semibold text-slate-800">
                    {selectedDate?.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Heure</span>
                  <span className="font-semibold text-slate-800">{selectedTime}</span>
                </div>
                {selectedService?.price && (
                  <div className="flex justify-between border-t border-slate-200 pt-3">
                    <span className="text-slate-500">Prix</span>
                    <span className="font-bold text-rose-500">
                      {Number(selectedService.price).toFixed(2)} €
                    </span>
                  </div>
                )}
              </div>

              {/* Bloc SMS rappel (optionnel, RGPD) */}
              <div className="mb-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Bell size={14} className="text-rose-400 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">Rappel par SMS</span>
                  <span className="ml-auto text-[10px] text-slate-400 font-medium bg-white border border-slate-200 rounded-full px-2 py-0.5">Optionnel</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                  Recevez un rappel par SMS 24h avant votre rendez-vous pour ne rien oublier.
                </p>
                <div className="relative mb-1">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (phoneError) setPhoneError('');
                    }}
                    placeholder="06 12 34 56 78"
                    className={`w-full text-sm px-3 py-2.5 rounded-xl border outline-none transition
                      ${phoneError
                        ? 'border-red-300 bg-red-50 text-red-700 placeholder:text-red-300'
                        : 'border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-rose-300'
                      }`}
                  />
                </div>
                {phoneError && (
                  <p className="text-[11px] text-red-500 mb-2">{phoneError}</p>
                )}
                {phone.trim() && !phoneError && (
                  <label className="flex items-start gap-2 cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={smsConsent}
                      onChange={(e) => setSmsConsent(e.target.checked)}
                      className="mt-0.5 accent-rose-500 flex-shrink-0"
                    />
                    <span className="text-[11px] text-slate-500 leading-relaxed">
                      J'accepte de recevoir un SMS de rappel pour ce rendez-vous.
                    </span>
                  </label>
                )}
              </div>

              <div aria-live="polite" aria-atomic="true">
                {error && (
                  <p className="text-xs text-red-500 mb-3 text-center">{error}</p>
                )}
              </div>

              <button
                onClick={handleConfirm}
                disabled={booking}
                className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                {booking ? <Loader2 size={16} className="animate-spin" /> : null}
                {booking ? 'Confirmation...' : 'Confirmer le rendez-vous'}
              </button>

              <p className="text-xs text-center text-slate-400 mt-3">
                Vous devez être connecté pour confirmer.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
