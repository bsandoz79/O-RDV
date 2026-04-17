import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Mail, Lock, Save, KeyRound, Calendar, Clock,
  MapPin, ChevronDown, ChevronUp, CheckCircle2, AlertCircle,
  Loader2, Pencil, X, Store, Scissors, Ban, Phone, Search,
} from 'lucide-react';
import API_BASE_URL from '../../api/api';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function isPast(dateStr) { return new Date(dateStr) < new Date(); }

const STATUS_STYLES = {
  pending:   'bg-amber-100 text-amber-600',
  confirmed: 'bg-emerald-100 text-emerald-600',
  cancelled: 'bg-red-100 text-red-500',
  completed: 'bg-slate-100 text-slate-500',
};
const STATUS_LABELS = {
  pending: 'En attente', confirmed: 'Confirmé',
  cancelled: 'Annulé',   completed: 'Terminé',
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

function AppointmentCard({ appt, role, onCancel }) {
  const past = isPast(appt.appointment_date);
  const cancellable = !past && appt.status !== 'cancelled' && appt.status !== 'completed';
  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${past || appt.status === 'cancelled' ? 'border-slate-100 opacity-60' : 'border-slate-200 hover:border-rose-200 hover:bg-rose-50/20'}`}>
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

  const [userInfo, setUserInfo]     = useState(null);
  const [editMode, setEditMode]     = useState(false);
  const [editForm, setEditForm]     = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm]   = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwMsg, setPwMsg]     = useState({ type: '', text: '' });
  const [savingPw, setSavingPw] = useState(false);

  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [showAll, setShowAll]           = useState(false);
  const [apptMsg, setApptMsg]           = useState({ type: '', text: '' });

  useEffect(() => {
    fetch(`${API_BASE_URL}/user/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setUserInfo(data);
        setEditForm({ first_name: data.first_name || '', last_name: data.last_name || '', email: data.email || '', phone: data.phone || '' });
      }).catch(() => {});
  }, []);

  const loadAppointments = () => {
    setLoadingAppts(true);
    fetch(`${API_BASE_URL}/user/appointments`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setAppointments(Array.isArray(data) ? data : []); setLoadingAppts(false); })
      .catch(() => setLoadingAppts(false));
  };
  useEffect(loadAppointments, []);

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

  const handleCancel = async (id) => {
    if (!window.confirm('Confirmer l\'annulation de ce rendez-vous ?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/user/appointments/${id}/cancel`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setApptMsg({ type: 'success', text: data.message });
      loadAppointments();
    } catch (err) { setApptMsg({ type: 'error', text: err.message }); }
  };

  const displayedAppts = showAll ? appointments : appointments.slice(0, 3);
  const initials = `${userInfo?.first_name?.[0] || ''}${userInfo?.last_name?.[0] || ''}`.toUpperCase() || userInfo?.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* En-tête */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-violet-500 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-rose-200">
            {initials}
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
            {[
              { key: 'current_password', label: 'Mot de passe actuel',   placeholder: '••••••••' },
              { key: 'new_password',     label: 'Nouveau mot de passe',   placeholder: '6 caractères minimum' },
              { key: 'confirm',          label: 'Confirmer',              placeholder: 'Répétez le nouveau mot de passe' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">{label}</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="password" placeholder={placeholder} value={pwForm[key]}
                    onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-rose-400" />
                </div>
              </div>
            ))}
            <button onClick={handlePasswordSave} disabled={savingPw}
              className="flex items-center gap-2 bg-slate-900 hover:bg-rose-600 disabled:bg-slate-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition">
              {savingPw ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />} Mettre à jour
            </button>
          </div>
        </SectionCard>

        {/* Horaires (pro uniquement) */}
        {role === 'pro' && (
          <SectionCard icon={Clock} color="text-purple-600" title="Mes horaires d'ouverture">
            <HoursEditor token={token} />
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
                  <AppointmentCard key={appt.id} appt={appt} role={role} onCancel={handleCancel} />
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
    </div>
  );
}
