import React, { useState, useEffect } from 'react';
import {
  User, Mail, Lock, Save, KeyRound, Calendar, Clock,
  MapPin, ChevronDown, ChevronUp, CheckCircle2, AlertCircle,
  Loader2, Pencil, X, Store, Scissors,
} from 'lucide-react';
import API_BASE_URL from '../../api/api';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function isPast(dateStr) {
  return new Date(dateStr) < new Date();
}

const STATUS_STYLES = {
  pending:   'bg-amber-100 text-amber-600',
  confirmed: 'bg-emerald-100 text-emerald-600',
  cancelled: 'bg-red-100 text-red-500',
  completed: 'bg-slate-100 text-slate-500',
};
const STATUS_LABELS = {
  pending: 'En attente', confirmed: 'Confirmé',
  cancelled: 'Annulé', completed: 'Terminé',
};

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
        <Icon size={18} />
        <h3 className="font-bold text-base">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function AppointmentCard({ appt, role }) {
  const past = isPast(appt.appointment_date);
  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${past ? 'border-slate-100 opacity-60' : 'border-slate-200 hover:border-rose-200 hover:bg-rose-50/20'}`}>
      {/* Mini calendrier */}
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
            <User size={11} />
            {appt.client_first_name || ''} {appt.client_last_name || appt.client_email}
          </p>
        ) : (
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <Store size={11} /> {appt.provider_name}
            {appt.provider_city && <><MapPin size={11} className="ml-1" />{appt.provider_city}</>}
          </p>
        )}
      </div>

      <span className={`flex-shrink-0 text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${STATUS_STYLES[appt.status] || STATUS_STYLES.pending}`}>
        {STATUS_LABELS[appt.status] || appt.status}
      </span>
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function UserDashboard() {
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const role = storedUser.role;

  // Profil
  const [userInfo, setUserInfo] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '' });
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Mot de passe
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });
  const [savingPw, setSavingPw] = useState(false);

  // Rendez-vous
  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // ─── Chargement ──────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE_URL}/user/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setUserInfo(data);
        setEditForm({ first_name: data.first_name || '', last_name: data.last_name || '', email: data.email || '' });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/user/appointments`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setAppointments(Array.isArray(data) ? data : []); setLoadingAppts(false); })
      .catch(() => setLoadingAppts(false));
  }, []);

  // ─── Handlers ────────────────────────────────────────────────────
  const handleProfileSave = async () => {
    setSavingProfile(true);
    setProfileMsg({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE_URL}/user/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUserInfo(u => ({ ...u, ...editForm }));
      setEditMode(false);
      setProfileMsg({ type: 'success', text: data.message });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async () => {
    if (pwForm.new_password !== pwForm.confirm)
      return setPwMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
    setSavingPw(true);
    setPwMsg({ type: '', text: '' });
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
    } catch (err) {
      setPwMsg({ type: 'error', text: err.message });
    } finally {
      setSavingPw(false);
    }
  };

  const displayedAppts = showAll ? appointments : appointments.slice(0, 3);
  const initials = `${userInfo?.first_name?.[0] || ''}${userInfo?.last_name?.[0] || ''}`.toUpperCase() || userInfo?.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── En-tête ── */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-violet-500 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-rose-200">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              {userInfo?.first_name ? `${userInfo.first_name} ${userInfo.last_name || ''}` : userInfo?.email || 'Mon compte'}
            </h1>
            <p className="text-sm text-slate-400 capitalize">{role === 'pro' ? 'Prestataire' : role === 'admin' ? 'Administrateur' : 'Client'}</p>
          </div>
        </div>

        {/* ── Profil ── */}
        <SectionCard icon={User} color="text-violet-600" title="Informations personnelles">
          <Alert type={profileMsg.type} message={profileMsg.text} onClose={() => setProfileMsg({ type: '', text: '' })} />

          {editMode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Prénom</label>
                  <input className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400" value={editForm.first_name} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} placeholder="Prénom" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Nom</label>
                  <input className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400" value={editForm.last_name} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Nom" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Email</label>
                <input type="email" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={handleProfileSave} disabled={savingProfile} className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition">
                  {savingProfile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Enregistrer
                </button>
                <button onClick={() => setEditMode(false)} className="text-sm text-slate-400 hover:text-slate-600 px-4 py-2.5 rounded-xl border border-slate-200 transition">Annuler</button>
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
              <button onClick={() => setEditMode(true)} className="mt-3 flex items-center gap-2 text-sm font-semibold text-rose-500 hover:text-rose-600 border border-rose-200 hover:border-rose-300 px-4 py-2 rounded-xl transition">
                <Pencil size={13} /> Modifier
              </button>
            </div>
          )}
        </SectionCard>

        {/* ── Mot de passe ── */}
        <SectionCard icon={KeyRound} color="text-amber-600" title="Changer le mot de passe">
          <Alert type={pwMsg.type} message={pwMsg.text} onClose={() => setPwMsg({ type: '', text: '' })} />
          <div className="space-y-4">
            {[
              { key: 'current_password', label: 'Mot de passe actuel', placeholder: '••••••••' },
              { key: 'new_password',     label: 'Nouveau mot de passe', placeholder: '6 caractères minimum' },
              { key: 'confirm',          label: 'Confirmer',            placeholder: 'Répétez le nouveau mot de passe' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">{label}</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="password" placeholder={placeholder} value={pwForm[key]} onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))} className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-rose-400" />
                </div>
              </div>
            ))}
            <button onClick={handlePasswordSave} disabled={savingPw} className="flex items-center gap-2 bg-slate-900 hover:bg-rose-600 disabled:bg-slate-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition">
              {savingPw ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />} Mettre à jour
            </button>
          </div>
        </SectionCard>

        {/* ── Rendez-vous ── */}
        <SectionCard
          icon={role === 'pro' ? Scissors : Calendar}
          color={role === 'pro' ? 'text-rose-600' : 'text-blue-600'}
          title={role === 'pro' ? 'Mes prochains rendez-vous' : 'Mes réservations'}
        >
          {loadingAppts ? (
            <div className="flex justify-center py-8">
              <Loader2 size={28} className="animate-spin text-rose-400" />
            </div>
          ) : appointments.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-6">Aucun rendez-vous pour le moment.</p>
          ) : (
            <>
              <div className="space-y-3">
                {displayedAppts.map(appt => (
                  <AppointmentCard key={appt.id} appt={appt} role={role} />
                ))}
              </div>

              {appointments.length > 3 && (
                <button
                  onClick={() => setShowAll(v => !v)}
                  className="mt-4 w-full flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-rose-500 border border-slate-200 hover:border-rose-200 py-2.5 rounded-xl transition"
                >
                  {showAll ? <><ChevronUp size={15} /> Réduire</> : <><ChevronDown size={15} /> Voir tout ({appointments.length} rendez-vous)</>}
                </button>
              )}
            </>
          )}
        </SectionCard>

      </div>
    </div>
  );
}
