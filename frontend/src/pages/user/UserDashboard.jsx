import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Mail, Lock, Save, KeyRound, Calendar, Clock,
  MapPin, ChevronDown, ChevronUp, CheckCircle2, AlertCircle,
  Loader2, Pencil, X, Store, Scissors, Ban, Phone, Search, Camera, Heart,
} from 'lucide-react';
import API_BASE_URL from '../../api/api';
import { buildGoogleCalendarUrl } from '../../utils/googleCalendar';
import { StarPicker, StarDisplay } from '../../components/StarRating';
import PasswordStrength, { getPasswordScore } from '../../components/PasswordStrength';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function isPast(dateStr) { return new Date(dateStr) < new Date(); }

const STATUS_STYLES = {
  pending:          'bg-amber-100 text-amber-600',
  confirmed:        'bg-emerald-100 text-emerald-600',
  cancelled:        'bg-red-100 text-red-500',
  cancelled_by_pro: 'bg-orange-100 text-orange-600',
  completed:        'bg-slate-100 text-slate-500',
};
const STATUS_LABELS = {
  pending:          'En attente',
  confirmed:        'Confirmé',
  cancelled:        'Annulé',
  cancelled_by_pro: 'Refusé',
  completed:        'Terminé',
};

const DAY_LABELS = {
  monday:'Lundi', tuesday:'Mardi', wednesday:'Mercredi',
  thursday:'Jeudi', friday:'Vendredi', saturday:'Samedi', sunday:'Dimanche',
};
const DAY_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

// ─── Sous-composants ────────────────────────────────────────────────────────

function Alert({ type, message, onClose }) {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl text-sm mb-4 ${isError ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
      {isError ? <AlertCircle size={16} className="mt-0.5 flex-shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />}
      <span className="flex-1">{message}</span>
      <button onClick={onClose}><X size={14} /></button>
    </div>
  );
}

function SectionCard({ icon: Icon, color, title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className={`flex items-center gap-3 px-6 py-4 border-b border-slate-100 ${color}`}>
        <Icon size={18} /><h3 className="font-bold text-base">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function AppointmentCard({ appt, role, onCancel, token, onReviewed }) {
  const past = isPast(appt.appointment_date);
  const isRefused = appt.status === 'cancelled_by_pro';
  const cancellable = !past && appt.status !== 'cancelled' && appt.status !== 'completed' && !isRefused;
  const showReviewForm    = role !== 'pro' && appt.status === 'completed' && !Number(appt.has_review);
  const showReviewSummary = role !== 'pro' && appt.status === 'completed' && Number(appt.has_review) > 0;
  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${past || appt.status === 'cancelled' || isRefused ? 'border-slate-100 opacity-70' : 'border-slate-200 hover:border-rose-200 hover:bg-rose-50/20'}`}>
      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-rose-50 border border-rose-100 flex flex-col items-center justify-center">
        <span className="text-[10px] font-bold text-rose-400 uppercase">
          {new Date(appt.appointment_date).toLocaleDateString('fr-FR', { month: 'short' })}
        </span>
        <span className="text-2xl font-black text-rose-500 leading-none">
          {new Date(appt.appointment_date).getDate()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-800 truncate">{appt.service_label}</p>
        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
          <Clock size={11} /> {formatTime(appt.appointment_date)} · {appt.duration} min
        </p>
        {role === 'pro' ? (
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <User size={11} /> {appt.client_first_name || ''} {appt.client_last_name || appt.client_email}
          </p>
        ) : (
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <Store size={11} /> {appt.provider_name}
            {appt.provider_city && <><MapPin size={11} className="ml-1" />{appt.provider_city}</>}
          </p>
        )}
        {isRefused && appt.refusal_reason && (
          <p className="text-xs mt-1.5 px-2 py-1 rounded-lg bg-orange-50 text-orange-600 border border-orange-100">
            Motif : {appt.refusal_reason}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${STATUS_STYLES[appt.status] || STATUS_STYLES.pending}`}>
          {STATUS_LABELS[appt.status] || appt.status}
        </span>
        {role !== 'pro' && cancellable && (
          <button
            onClick={() => onCancel(appt.id)}
            className="flex items-center gap-1 text-[10px] font-semibold text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-2 py-1 rounded-lg transition"
          >
            <Ban size={10} /> Annuler
          </button>
        )}
        {role !== 'pro' && !past && appt.status !== 'cancelled' && appt.status !== 'cancelled_by_pro' && (
          <a
            href={buildGoogleCalendarUrl({
              title: `${appt.provider_name} — ${appt.service_label}`,
              description: `Prestation : ${appt.service_label}\nDurée : ${appt.duration} min\nPrix : ${appt.price} €\n\nRéservé via O'RDV`,
              startDate: appt.appointment_date,
              durationMinutes: appt.duration,
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] font-semibold text-blue-500 hover:text-blue-700 border border-blue-200 hover:border-blue-400 px-2 py-1 rounded-lg transition"
          >
            <Calendar size={10} /> Google Agenda
          </a>
        )}
      </div>
      {showReviewSummary && (
        <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
          <StarDisplay rating={Number(appt.review_rating)} size={13} />
          {appt.review_comment && <p className="text-xs text-slate-600 leading-relaxed">{appt.review_comment}</p>}
          {!appt.review_comment && <p className="text-xs text-slate-400 italic">Avis publié</p>}
        </div>
      )}
      {showReviewForm && (
        <div className="col-span-full w-full mt-1">
          <ReviewForm appt={appt} token={token} onSubmitted={onReviewed} />
        </div>
      )}
    </div>
  );
}

// ─── Formulaire d'avis ──────────────────────────────────────────────────────

const REVIEW_SUB_CATS = [
  { key: 'accueil',  label: 'Accueil' },
  { key: 'proprete', label: 'Propreté' },
  { key: 'ambiance', label: 'Cadre & Ambiance' },
  { key: 'qualite',  label: 'Qualité de la prestation' },
];

function ReviewForm({ appt, token, onSubmitted }) {
  const [rating, setRating]       = useState(0);
  const [subRatings, setSubRatings] = useState({});
  const [comment, setComment]     = useState('');
  const [status, setStatus]       = useState('idle');

  const submit = async () => {
    if (!rating) return;
    setStatus('loading');
    try {
      const res = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          appointment_id:  appt.id,
          rating,
          comment,
          rating_accueil:  subRatings.accueil  || null,
          rating_proprete: subRatings.proprete || null,
          rating_ambiance: subRatings.ambiance || null,
          rating_qualite:  subRatings.qualite  || null,
        }),
      });
      if (res.ok) { setStatus('done'); onSubmitted?.(); }
      else setStatus('error');
    } catch { setStatus('error'); }
  };

  if (status === 'done') return (
    <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600 font-semibold">
      <CheckCircle2 size={13} /> Avis publié — merci !
    </div>
  );

  return (
    <div className="mt-3 p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-3">
      <p className="text-xs font-semibold text-slate-700">Comment s'est passé ce RDV ?</p>

      {/* Note globale */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 w-36 flex-shrink-0">Note globale</span>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      {/* Sous-catégories */}
      {rating > 0 && REVIEW_SUB_CATS.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-2">
          <span className="text-xs text-slate-500 w-36 flex-shrink-0">{label}</span>
          <StarPicker value={subRatings[key] || 0} onChange={v => setSubRatings(p => ({ ...p, [key]: v }))} />
        </div>
      ))}

      {status === 'error' && <p className="text-xs text-red-500">Une erreur est survenue, réessayez.</p>}

      {rating > 0 && (
        <>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Commentaire optionnel..."
            rows={2}
            className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:ring-1 focus:ring-amber-400 resize-none"
          />
          <button onClick={submit} disabled={status === 'loading'}
            className="flex items-center gap-1.5 text-xs font-bold bg-violet-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg transition">
            {status === 'loading' ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
            Publier mon avis
          </button>
        </>
      )}
    </div>
  );
}

// ─── Modal annulation ────────────────────────────────────────────────────────

function CancelModal({ appt, onConfirm, onClose, loading }) {
  if (!appt) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <Ban size={20} className="text-red-500" />
          </div>
          <div>
            <h2 className="font-black text-slate-800 text-lg leading-tight">Annuler ce RDV ?</h2>
            <p className="text-xs text-slate-400">Cette action est irréversible</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 mb-5 space-y-1.5">
          <p className="text-sm font-bold text-slate-800">{appt.service_label}</p>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Store size={11} /> {appt.provider_name}
          </p>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Calendar size={11} />
            {new Date(appt.appointment_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            {' à '}{new Date(appt.appointment_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Clock size={11} /> {appt.duration} min · {appt.price} €
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Garder le RDV
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-bold transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal notification refus ───────────────────────────────────────────────

function RefusalNotificationModal({ refusals, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={22} className="text-orange-500" />
          </div>
          <div>
            <h2 className="font-black text-slate-800 text-lg leading-tight">
              {refusals.length > 1 ? 'Rendez-vous refusés' : 'Rendez-vous refusé'}
            </h2>
            <p className="text-xs text-slate-400">
              {refusals.length > 1 ? `${refusals.length} notifications non lues` : '1 notification non lue'}
            </p>
          </div>
        </div>
        <div className="space-y-3 mb-5 max-h-72 overflow-y-auto pr-1">
          {refusals.map(appt => (
            <div key={appt.id} className="p-4 rounded-xl bg-orange-50 border border-orange-100">
              <div className="flex items-center gap-2 mb-1">
                <Store size={13} className="text-orange-500 flex-shrink-0" />
                <span className="font-bold text-sm text-slate-800">{appt.provider_name}</span>
              </div>
              <p className="text-xs text-slate-500 mb-2">
                {new Date(appt.appointment_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                {' · '}{formatTime(appt.appointment_date)}
                {' · '}{appt.service_label}
              </p>
              {appt.refusal_reason ? (
                <p className="text-xs px-3 py-2 rounded-lg bg-white border border-orange-100 text-orange-700">
                  <span className="font-semibold">Motif : </span>{appt.refusal_reason}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic">Aucun motif renseigné.</p>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl transition text-sm"
        >
          J'ai compris
        </button>
      </div>
    </div>
  );
}

// ─── Éditeur horaires (pro) ──────────────────────────────────────────────────

function HoursEditor({ token }) {
  const [hours, setHours] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    fetch(`${API_BASE_URL}/shop/info/${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const map = {};
        (data.hours || []).forEach(h => {
          const day = h.day_of_week?.toLowerCase();
          if (day) map[day] = {
            open:   h.open_time  ? String(h.open_time).substring(0, 5)  : '09:00',
            close:  h.close_time ? String(h.close_time).substring(0, 5) : '18:00',
            closed: !!h.is_closed,
          };
        });
        // Remplir les jours manquants
        DAY_ORDER.forEach(d => { if (!map[d]) map[d] = { open: '09:00', close: '18:00', closed: false }; });
        setHours(map);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (day, field, val) =>
    setHours(h => ({ ...h, [day]: { ...h[day], [field]: val } }));

  const handleSave = async () => {
    setSaving(true);
    setMsg({ type: '', text: '' });
    const hoursArray = DAY_ORDER.map(day => ({ day_of_week: day, ...hours[day] }));
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    try {
      const formData = new FormData();
      formData.append('profile', JSON.stringify({ name: '', description: '', address: '', zipCode: '', city: '', phone: '' }));
      formData.append('hours', JSON.stringify(hoursArray));
      formData.append('services', JSON.stringify([]));
      const res = await fetch(`${API_BASE_URL}/shop/setup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg({ type: 'success', text: 'Horaires mis à jour !' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-6"><Loader2 size={24} className="animate-spin text-rose-400" /></div>;

  return (
    <div className="space-y-3">
      <Alert type={msg.type} message={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      {DAY_ORDER.map(day => (
        <div key={day} className={`flex items-center gap-3 py-2 px-3 rounded-xl ${hours[day]?.closed ? 'opacity-50 bg-slate-50' : 'bg-white border border-slate-100'}`}>
          <span className="w-24 text-sm font-semibold text-slate-600">{DAY_LABELS[day]}</span>
          <input type="time" disabled={hours[day]?.closed} value={hours[day]?.open || '09:00'}
            onChange={e => handleChange(day, 'open', e.target.value)}
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-rose-400 disabled:bg-slate-100" />
          <span className="text-slate-400 text-sm">→</span>
          <input type="time" disabled={hours[day]?.closed} value={hours[day]?.close || '18:00'}
            onChange={e => handleChange(day, 'close', e.target.value)}
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-rose-400 disabled:bg-slate-100" />
          <label className="flex items-center gap-1.5 ml-auto text-xs text-slate-500 cursor-pointer select-none">
            <input type="checkbox" checked={hours[day]?.closed || false}
              onChange={() => handleChange(day, 'closed', !hours[day]?.closed)}
              className="accent-rose-500" />
            Fermé
          </label>
        </div>
      ))}
      <button onClick={handleSave} disabled={saving}
        className="mt-2 flex items-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition">
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Enregistrer les horaires
      </button>
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function UserDashboard() {
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const role = storedUser.role;

  const avatarInputRef = React.useRef(null);

  const [userInfo, setUserInfo]     = useState(null);
  const [editMode, setEditMode]     = useState(false);
  const [editForm, setEditForm]     = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [pwForm, setPwForm]   = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwMsg, setPwMsg]     = useState({ type: '', text: '' });
  const [savingPw, setSavingPw] = useState(false);

  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [showAll, setShowAll]           = useState(false);
  const [apptMsg, setApptMsg]           = useState({ type: '', text: '' });
  const [unreadRefusals, setUnreadRefusals] = useState([]);
  const [cancelTarget, setCancelTarget]     = useState(null);
  const [favorites, setFavorites]           = useState([]); // appointment à annuler
  const [cancelling, setCancelling]         = useState(false);

  useEffect(() => {
    if (role === 'user') {
      fetch(`${API_BASE_URL}/favorites`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then(setFavorites)
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/user/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setUserInfo(data);
        setEditForm({ first_name: data.first_name || '', last_name: data.last_name || '', email: data.email || '', phone: data.phone || '' });
      }).catch(() => {});
  }, []);

  const loadAppointments = (silent = false) => {
    if (!silent) setLoadingAppts(true);
    fetch(`${API_BASE_URL}/user/appointments`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        // Ne re-rend que si les données ont vraiment changé
        setAppointments(prev => {
          if (JSON.stringify(prev) === JSON.stringify(list)) return prev;
          return list;
        });
        if (role !== 'pro') {
          setUnreadRefusals(list.filter(a => a.status === 'cancelled_by_pro' && a.is_read === 0));
        }
        if (!silent) setLoadingAppts(false);
      })
      .catch(() => { if (!silent) setLoadingAppts(false); });
  };
  useEffect(() => {
    loadAppointments();
    // Auto-refresh uniquement pour le pro (nouveaux RDV entrants)
    if (role === 'pro' || role === 'admin') {
      const interval = setInterval(() => loadAppointments(true), 5000);
      return () => clearInterval(interval);
    }
  }, []);

  const handleProfileSave = async () => {
    setSavingProfile(true); setProfileMsg({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE_URL}/user/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const updatedUser = { ...storedUser, ...editForm };
      setUserInfo(u => ({ ...u, ...editForm }));
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setEditMode(false);
      setProfileMsg({ type: 'success', text: data.message });
    } catch (err) { setProfileMsg({ type: 'error', text: err.message }); }
    finally { setSavingProfile(false); }
  };

  const handlePasswordSave = async () => {
    if (pwForm.new_password !== pwForm.confirm)
      return setPwMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
    if (getPasswordScore(pwForm.new_password) < 2)
      return setPwMsg({ type: 'error', text: 'Mot de passe trop faible. Utilisez au moins 8 caractères avec une majuscule et un chiffre.' });
    setSavingPw(true); setPwMsg({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE_URL}/user/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: pwForm.current_password, new_password: pwForm.new_password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPwMsg({ type: 'success', text: data.message });
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) { setPwMsg({ type: 'error', text: err.message }); }
    finally { setSavingPw(false); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await fetch(`${API_BASE_URL}/user/profile-picture`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur upload');
      setUserInfo(u => ({ ...u, profile_picture: data.profile_picture }));
      setProfileMsg({ type: 'success', text: 'Photo de profil mise à jour !' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message });
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handleMarkRefusalsRead = async () => {
    await Promise.all(
      unreadRefusals.map(appt =>
        fetch(`${API_BASE_URL}/user/appointments/${appt.id}/mark-read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        })
      )
    );
    setUnreadRefusals([]);
    setAppointments(prev => prev.map(a =>
      unreadRefusals.some(r => r.id === a.id) ? { ...a, is_read: 1 } : a
    ));
  };

  const handleCancel = (id) => {
    const appt = appointments.find(a => a.id === id);
    if (appt) setCancelTarget(appt);
  };

  const doCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await fetch(`${API_BASE_URL}/user/appointments/${cancelTarget.id}/cancel`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCancelTarget(null);
      setApptMsg({ type: 'success', text: 'Rendez-vous annulé.' });
      loadAppointments();
    } catch (err) {
      setApptMsg({ type: 'error', text: err.message });
    } finally {
      setCancelling(false);
    }
  };

  const displayedAppts = showAll ? appointments : appointments.slice(0, 3);
  const initials = `${userInfo?.first_name?.[0] || ''}${userInfo?.last_name?.[0] || ''}`.toUpperCase() || userInfo?.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* En-tête */}
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
            {userInfo?.profile_picture ? (
              <img
                src={userInfo.profile_picture.startsWith('http') ? userInfo.profile_picture : `${API_BASE_URL.replace('/api', '')}${userInfo.profile_picture}`}
                alt="Avatar"
                className="w-14 h-14 rounded-2xl object-cover shadow-lg border-2 border-white"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-violet-500 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-rose-200">
                {initials}
              </div>
            )}
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center hover:bg-rose-50 transition"
              title="Changer la photo"
            >
              {avatarUploading
                ? <Loader2 size={11} className="animate-spin text-rose-400" />
                : <Camera size={11} className="text-slate-500" />}
            </button>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              {userInfo?.first_name ? `${userInfo.first_name} ${userInfo.last_name || ''}` : userInfo?.email || 'Mon compte'}
            </h1>
            <p className="text-sm text-slate-400 capitalize">
              {role === 'pro' ? 'Prestataire' : role === 'admin' ? 'Administrateur' : 'Client'}
            </p>
          </div>
        </div>

        {/* Profil */}
        <SectionCard icon={User} color="text-violet-600" title="Informations personnelles">
          <Alert type={profileMsg.type} message={profileMsg.text} onClose={() => setProfileMsg({ type: '', text: '' })} />
          {editMode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Prénom</label>
                  <input className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400"
                    value={editForm.first_name} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} placeholder="Prénom" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Nom</label>
                  <input className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400"
                    value={editForm.last_name} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Nom" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Email</label>
                <input type="email" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400"
                  value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">
                  Téléphone <span className="font-normal text-slate-400">(optionnel — pour les rappels SMS)</span>
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="tel" placeholder="06 12 34 56 78"
                    className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-rose-400"
                    value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={handleProfileSave} disabled={savingProfile}
                  className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition">
                  {savingProfile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Enregistrer
                </button>
                <button onClick={() => setEditMode(false)}
                  className="text-sm text-slate-400 hover:text-slate-600 px-4 py-2.5 rounded-xl border border-slate-200 transition">Annuler</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User size={15} className="text-slate-400" />
                <span className="text-slate-700 font-medium">
                  {userInfo?.first_name || userInfo?.last_name
                    ? `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim()
                    : <span className="text-slate-400 italic">Nom non renseigné</span>}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail size={15} className="text-slate-400" />
                <span className="text-slate-700">{userInfo?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone size={15} className="text-slate-400" />
                <span className={userInfo?.phone ? 'text-slate-700' : 'text-slate-400 italic'}>
                  {userInfo?.phone || 'Téléphone non renseigné'}
                </span>
              </div>
              <button onClick={() => setEditMode(true)}
                className="mt-3 flex items-center gap-2 text-sm font-semibold text-rose-500 hover:text-rose-600 border border-rose-200 hover:border-rose-300 px-4 py-2 rounded-xl transition">
                <Pencil size={13} /> Modifier
              </button>
            </div>
          )}
        </SectionCard>

        {/* Mot de passe */}
        <SectionCard icon={KeyRound} color="text-amber-600" title="Changer le mot de passe">
          <Alert type={pwMsg.type} message={pwMsg.text} onClose={() => setPwMsg({ type: '', text: '' })} />
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Mot de passe actuel</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" placeholder="••••••••" value={pwForm.current_password}
                  onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-rose-400" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Nouveau mot de passe</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" placeholder="8 caractères minimum" value={pwForm.new_password}
                  onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-rose-400" />
              </div>
              <PasswordStrength password={pwForm.new_password} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Confirmer</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" placeholder="Répétez le nouveau mot de passe" value={pwForm.confirm}
                  onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-rose-400" />
              </div>
            </div>
            <button onClick={handlePasswordSave} disabled={savingPw}
              className="flex items-center gap-2 bg-violet-600 hover:bg-rose-500 disabled:bg-slate-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition">
              {savingPw ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />} Mettre à jour
            </button>
          </div>
        </SectionCard>

        {/* Suppression de compte (RGPD) */}
        <SectionCard icon={X} color="text-red-500" title="Zone de danger">
          <p className="text-sm text-slate-500 mb-4">
            La suppression de votre compte est <strong>définitive et irréversible</strong>.
            Toutes vos données personnelles et votre historique de rendez-vous seront effacés conformément au RGPD.
          </p>
          <button
            onClick={async () => {
              if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible.')) return;
              try {
                const res = await fetch(`${API_BASE_URL}/user/account`, {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                  localStorage.clear();
                  window.dispatchEvent(new Event('authChange'));
                  window.location.href = '/';
                } else {
                  const d = await res.json();
                  alert(d.error || 'Erreur lors de la suppression.');
                }
              } catch { alert('Erreur réseau.'); }
            }}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-500 hover:text-white text-red-600 border border-red-200 hover:border-red-500 text-sm font-semibold px-5 py-2.5 rounded-xl transition"
          >
            <X size={14} /> Supprimer mon compte définitivement
          </button>
        </SectionCard>

        {/* Horaires (pro uniquement) */}
        {role === 'pro' && (
          <SectionCard icon={Clock} color="text-purple-600" title="Mes horaires d'ouverture">
            <HoursEditor token={token} />
          </SectionCard>
        )}

        {/* Favoris (client uniquement) */}
        {role === 'user' && (
          <SectionCard icon={Heart} color="text-rose-500" title="Mes prestataires favoris">
            {favorites.length === 0 ? (
              <div className="text-center py-6">
                <Heart size={28} className="mx-auto mb-2 text-slate-200" />
                <p className="text-sm text-slate-400">Aucun favori pour le moment.</p>
                <p className="text-xs text-slate-400 mt-1">Clique sur le ❤️ d'une fiche prestataire pour l'ajouter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {favorites.map(p => (
                  <Link key={p.id} to={`/provider/${p.id}`} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50/30 transition group">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                      {p.image_url
                        ? <img src={p.image_url.startsWith('http') ? p.image_url : `${API_BASE_URL.replace('/api','')}${p.image_url}`} alt={p.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-rose-100 flex items-center justify-center"><Store size={18} className="text-rose-300" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-800 truncate group-hover:text-rose-500 transition">{p.name}</p>
                      <p className="text-xs text-slate-400 truncate">{p.category_name || ''}{p.city ? ` · ${p.city}` : ''}</p>
                    </div>
                    <button
                      onClick={async e => {
                        e.preventDefault();
                        await fetch(`${API_BASE_URL}/favorites/${p.id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                        setFavorites(prev => prev.filter(f => f.id !== p.id));
                      }}
                      className="flex-shrink-0 text-rose-400 hover:text-slate-300 transition"
                      title="Retirer des favoris"
                    >
                      <Heart size={15} className="fill-rose-400" />
                    </button>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {/* Rendez-vous */}
        <SectionCard
          icon={role === 'pro' ? Scissors : Calendar}
          color={role === 'pro' ? 'text-rose-600' : 'text-blue-600'}
          title={role === 'pro' ? 'Mes prochains clients' : 'Mes réservations'}
        >
          <Alert type={apptMsg.type} message={apptMsg.text} onClose={() => setApptMsg({ type: '', text: '' })} />
          {loadingAppts ? (
            <div className="flex justify-center py-8"><Loader2 size={28} className="animate-spin text-rose-400" /></div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8">
              <Search size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 font-semibold text-sm mb-1">Aucun rendez-vous pour le moment.</p>
              {role !== 'pro' && (
                <>
                  <p className="text-slate-400 text-xs mb-4">Trouvez un prestataire et réservez en quelques clics.</p>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
                  >
                    <Search size={14} /> Trouver un prestataire
                  </Link>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {displayedAppts.map(appt => (
                  <AppointmentCard key={appt.id} appt={appt} role={role} onCancel={handleCancel} token={token} onReviewed={loadAppointments} />
                ))}
              </div>
              {appointments.length > 3 && (
                <button onClick={() => setShowAll(v => !v)}
                  className="mt-4 w-full flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-rose-500 border border-slate-200 hover:border-rose-200 py-2.5 rounded-xl transition">
                  {showAll
                    ? <><ChevronUp size={15} /> Réduire</>
                    : <><ChevronDown size={15} /> Voir tout ({appointments.length} rendez-vous)</>}
                </button>
              )}
            </>
          )}
        </SectionCard>

      </div>

      {role !== 'pro' && unreadRefusals.length > 0 && (
        <RefusalNotificationModal refusals={unreadRefusals} onClose={handleMarkRefusalsRead} />
      )}
      <CancelModal
        appt={cancelTarget}
        onConfirm={doCancel}
        onClose={() => setCancelTarget(null)}
        loading={cancelling}
      />
    </div>
  );
}
