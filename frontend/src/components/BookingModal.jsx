import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, CalendarDays, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import API_BASE_URL from '../api/api';

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

// Format YYYY-MM-DD
function toDateString(date) {
  return date.toISOString().split('T')[0];
}

export default function BookingModal({ provider, preselectedService, onClose }) {
  const navigate = useNavigate();

  // ─── États ──────────────────────────────────────────────────────────
  const [step, setStep] = useState('calendar'); // 'calendar' | 'slots' | 'confirm' | 'done'

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedService, setSelectedService] = useState(preselectedService || null);

  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [closedDay, setClosedDay] = useState(false);

  // Jours fermés pour le mois affiché (noms des jours récurrents)
  const [closedDayNames, setClosedDayNames] = useState(new Set());
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState(null);

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

  // ─── Charger les créneaux quand une date est sélectionnée ───────────
  const fetchSlots = useCallback(async (date) => {
    setLoadingSlots(true);
    setSlots([]);
    setClosedDay(false);
    try {
      const res = await fetch(
        `${API_BASE_URL}/appointments/availability/${provider.id}/${toDateString(date)}`
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
  }, [provider.id]);

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
      onClose();
      navigate('/login');
      return;
    }

    if (!selectedService) {
      setError('Veuillez sélectionner une prestation.');
      return;
    }

    setBooking(true);
    setError(null);

    const dateStr = toDateString(selectedDate);
    const payload = {
      client_id: user.id,
      provider_id: provider.id,
      service_id: selectedService.id,
      appointment_date: `${dateStr} ${selectedTime}:00`,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/appointments/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
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
              <button
                onClick={onClose}
                className="mt-4 bg-rose-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-rose-600 transition"
              >
                Fermer
              </button>
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
                <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
                  {slots.map(({ time, available }) => (
                    <button
                      key={time}
                      disabled={!available}
                      onClick={() => available && handleTimeClick(time)}
                      className={`
                        flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition
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

              {error && (
                <p className="text-xs text-red-500 mb-3 text-center">{error}</p>
              )}

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
