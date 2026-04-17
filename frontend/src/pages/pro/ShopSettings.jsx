import React, { useState, useRef, useEffect } from 'react';
import {
  Store, Plus, Trash2, Clock, Save, MapPin,
  Building2, Loader2, CheckCircle, Phone,
  Camera, FileText, Hash, X, Calendar, User,
  ChevronRight, Pencil, LayoutDashboard, Ban,
  TrendingUp, Users,
} from 'lucide-react';
import API_BASE_URL from "../../api/api";
import './ShopSettings.css';

const DAY_LABELS = {
  monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi',
  thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche',
};

const INITIAL_HOURS = {
  monday:    { open: '09:00', close: '18:00', closed: false },
  tuesday:   { open: '09:00', close: '18:00', closed: false },
  wednesday: { open: '09:00', close: '18:00', closed: false },
  thursday:  { open: '09:00', close: '18:00', closed: false },
  friday:    { open: '09:00', close: '18:00', closed: false },
  saturday:  { open: '10:00', close: '17:00', closed: false },
  sunday:    { open: '00:00', close: '00:00', closed: true  },
};

const STATUS_STYLES = {
  pending:   { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'En attente' },
  confirmed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Confirmé'   },
  cancelled: { bg: 'bg-red-100',     text: 'text-red-500',     label: 'Annulé'     },
  completed: { bg: 'bg-slate-100',   text: 'text-slate-500',   label: 'Terminé'    },
};

// ─── Sous-composants formulaire ────────────────────────────────────────────────

const Field = ({ label, icon: Icon, placeholder, ...props }) => (
  <div>
    <label className="field-label">{label}</label>
    <div className="input-wrapper">
      {Icon && <Icon size={14} className="input-icon" />}
      <input className="custom-input" placeholder={placeholder} style={Icon ? { paddingLeft: '2.25rem' } : {}} {...props} />
    </div>
  </div>
);

const TextareaField = ({ label, icon: Icon, placeholder, ...props }) => (
  <div>
    <label className="field-label">{label}</label>
    <div className="input-wrapper">
      {Icon && <Icon size={14} className="input-icon textarea-icon" />}
      <textarea className="custom-input custom-textarea" placeholder={placeholder} style={Icon ? { paddingLeft: '2.25rem' } : {}} {...props} />
    </div>
  </div>
);

const ImageUploader = ({ preview, onFileChange, onRemove }) => {
  const inputRef = useRef(null);
  return (
    <div className={`image-upload-zone ${preview ? 'has-preview' : ''}`} onClick={() => !preview && inputRef.current.click()}>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
      {preview ? (
        <div className="image-preview-wrapper">
          <img src={preview} alt="Aperçu" className="image-preview" />
          <button type="button" className="image-remove-btn" onClick={(e) => { e.stopPropagation(); onRemove(); }}><X size={14} /></button>
          <div className="image-preview-overlay" onClick={() => inputRef.current.click()}><Camera size={20} /><span>Changer</span></div>
        </div>
      ) : (
        <div className="image-placeholder">
          <Camera size={28} className="image-placeholder-icon" />
          <span className="image-placeholder-label">Photo de l'établissement</span>
        </div>
      )}
    </div>
  );
};

const SectionCard = ({ icon: Icon, gradient, title, children }) => (
  <div className="section-card">
    <div className="card-header">
      <div style={{ padding: '8px', borderRadius: '10px', background: gradient, display: 'inline-flex' }}>
        <Icon size={18} color="white" />
      </div>
      <h3 className="card-title">{title}</h3>
    </div>
    {children}
  </div>
);

const ServiceRow = ({ service, index, onChange, onRemove }) => (
  <div className="service-row">
    <div style={{ flex: 1, minWidth: '160px' }}>
      <label className="field-label">Nom du service</label>
      <input className="custom-input" placeholder="Ex: Coupe de cheveux" type="text" value={service.label} onChange={(e) => onChange(index, 'label', e.target.value)} />
    </div>
    <div style={{ width: '100px' }}>
      <label className="field-label">Prix (€)</label>
      <input className="custom-input" placeholder="25" type="number" value={service.price} onChange={(e) => onChange(index, 'price', e.target.value)} />
    </div>
    <div style={{ width: '100px' }}>
      <label className="field-label">Durée (min)</label>
      <input className="custom-input" placeholder="30" type="number" value={service.duration} onChange={(e) => onChange(index, 'duration', e.target.value)} />
    </div>
    <button type="button" className="btn-remove" onClick={() => onRemove(index)}><Trash2 size={17} /></button>
  </div>
);

const HoursRow = ({ day, config, onChange }) => (
  <div className={`hours-row${config.closed ? ' hours-row--closed' : ''}`}>
    <span className="day-label">{DAY_LABELS[day]}</span>
    <div className="hours-controls">
      <input type="time" className="custom-input time-input" value={config.open} disabled={config.closed} onChange={(e) => onChange(day, 'open', e.target.value)} />
      <span className="hours-separator">→</span>
      <input type="time" className="custom-input time-input" value={config.close} disabled={config.closed} onChange={(e) => onChange(day, 'close', e.target.value)} />
      <label className="closed-toggle">
        <input type="checkbox" checked={config.closed} onChange={() => onChange(day, 'closed', !config.closed)} />
        <span className="closed-label">Fermé</span>
      </label>
    </div>
  </div>
);

// ─── Dashboard Pro ─────────────────────────────────────────────────────────────

function ProDashboard({ shopData, onEditShop }) {
  const token = localStorage.getItem('token');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/user/appointments`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setAppointments(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const now = new Date();
  const upcoming = appointments.filter(a => new Date(a.appointment_date) >= now && a.status !== 'cancelled');
  const past     = appointments.filter(a => new Date(a.appointment_date) <  now || a.status === 'cancelled');
  const displayed = showAll ? appointments : upcoming.slice(0, 5);

  const shopImage = shopData.image_url
    ? `${API_BASE_URL.replace('/api', '')}${shopData.image_url}`
    : null;

  return (
    <div className="shop-settings-page">
      <div className="shop-container">

        {/* En-tête boutique */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
          <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg,#f43f5e,#8b5cf6)' }} />
          <div className="flex items-center gap-4 px-6 py-5">
            {shopImage ? (
              <img src={shopImage} alt={shopData.name} className="w-16 h-16 rounded-xl object-cover border border-slate-100" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-rose-500 to-violet-500 flex items-center justify-center">
                <Store size={28} color="white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-slate-900 truncate">{shopData.name}</h1>
              <p className="text-sm text-slate-400 truncate">{shopData.city || ''}</p>
            </div>
            <button
              onClick={onEditShop}
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-rose-500 border border-slate-200 hover:border-rose-300 px-4 py-2 rounded-xl transition"
            >
              <Pencil size={14} /> Modifier la boutique
            </button>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: Calendar,    color: 'text-rose-500',    bg: 'bg-rose-50',    label: 'À venir',  value: upcoming.length },
            { icon: Users,       color: 'text-violet-500',  bg: 'bg-violet-50',  label: 'Total RDV', value: appointments.length },
            { icon: TrendingUp,  color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Terminés', value: past.filter(a => a.status === 'completed').length },
          ].map(({ icon: Icon, color, bg, label, value }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-2xl font-black text-slate-900">{value}</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Liste des rendez-vous */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg,#f43f5e,#e11d48)' }}>
                <Calendar size={16} color="white" />
              </div>
              <h3 className="font-bold text-slate-800">
                {showAll ? 'Tous les rendez-vous' : 'Prochains rendez-vous'}
              </h3>
            </div>
            {appointments.length > 0 && (
              <button
                onClick={() => setShowAll(v => !v)}
                className="text-xs font-semibold text-rose-500 hover:text-rose-700 flex items-center gap-1 transition"
              >
                {showAll ? 'Voir à venir' : `Voir tout (${appointments.length})`}
                <ChevronRight size={13} />
              </button>
            )}
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 size={28} className="animate-spin text-rose-400" />
              </div>
            ) : displayed.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Calendar size={36} className="mx-auto mb-3 opacity-30" />
                <p className="font-semibold text-slate-500">Aucun rendez-vous à venir</p>
                <p className="text-xs mt-1">Les nouvelles réservations apparaîtront ici.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayed.map(appt => {
                  const date     = new Date(appt.appointment_date);
                  const isPast   = date < now;
                  const st       = STATUS_STYLES[appt.status] || STATUS_STYLES.pending;
                  return (
                    <div
                      key={appt.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        isPast || appt.status === 'cancelled'
                          ? 'border-slate-100 opacity-55'
                          : 'border-slate-200 hover:border-rose-200 hover:bg-rose-50/20'
                      }`}
                    >
                      {/* Date bloc */}
                      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-rose-50 border border-rose-100 flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold text-rose-400 uppercase">
                          {date.toLocaleDateString('fr-FR', { month: 'short' })}
                        </span>
                        <span className="text-2xl font-black text-rose-500 leading-none">
                          {date.getDate()}
                        </span>
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 truncate">{appt.service_label}</p>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Clock size={11} />
                          {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          {appt.duration ? ` · ${appt.duration} min` : ''}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <User size={11} />
                          {appt.client_first_name || ''} {appt.client_last_name || appt.client_email || '—'}
                        </p>
                      </div>

                      {/* Statut + prix */}
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>
                          {st.label}
                        </span>
                        {appt.price && (
                          <span className="text-xs font-bold text-slate-600">
                            {Number(appt.price).toFixed(2)} €
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Composant principal ───────────────────────────────────────────────────────

export default function ShopSettings() {
  const [categories,    setCategories]    = useState([]);
  const [profile,       setProfile]       = useState({ name: '', description: '', address: '', zipCode: '', city: '', phone: '', categoryId: '' });
  const [imageFile,     setImageFile]     = useState(null);
  const [imagePreview,  setImagePreview]  = useState(null);
  const [services,      setServices]      = useState([{ label: '', price: '', duration: '' }]);
  const [hours,         setHours]         = useState(INITIAL_HOURS);
  const [loading,       setLoading]       = useState(false);
  const [success,       setSuccess]       = useState(false);
  const [error,         setError]         = useState('');

  // ─── État de bascule ──────────────────────────────────────────────────────
  const [checkingShop, setCheckingShop] = useState(true); // chargement initial
  const [hasShop,      setHasShop]      = useState(false);
  const [shopData,     setShopData]     = useState(null);
  const [view,         setView]         = useState('dashboard'); // 'dashboard' | 'form'
  const [user,         setUser]         = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/shop/categories`)
      .then(r => r.json()).then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) { setCheckingShop(false); return; }
    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);

    const token = localStorage.getItem('token');
    fetch(`${API_BASE_URL}/shop/info/${parsedUser.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.status === 404) {
          // Pas de boutique → afficher le formulaire de création
          setHasShop(false);
          setView('form');
          setCheckingShop(false);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (!data) return;
        // Boutique existante → pré-remplir et afficher le dashboard
        setHasShop(true);
        setShopData(data);
        setView('dashboard');
        setCheckingShop(false);

        setProfile({
          name:        data.name        || '',
          description: data.description || '',
          address:     data.address     || '',
          zipCode:     data.zip_code    || '',
          city:        data.city        || '',
          phone:       data.phone       || '',
          categoryId:  data.category_id ? String(data.category_id) : '',
        });
        if (data.image_url) setImagePreview(`${API_BASE_URL.replace('/api', '')}${data.image_url}`);
        if (data.services?.length > 0) {
          setServices(data.services.map(s => ({ label: s.label || '', price: s.price ?? '', duration: s.duration ?? '' })));
        }
        if (data.hours?.length > 0) {
          const loaded = { ...INITIAL_HOURS };
          data.hours.forEach(h => {
            const day = h.day_of_week?.toLowerCase();
            if (day && loaded[day] !== undefined) {
              loaded[day] = {
                open:   h.open_time  ? String(h.open_time).substring(0, 5)  : '09:00',
                close:  h.close_time ? String(h.close_time).substring(0, 5) : '18:00',
                closed: !!h.is_closed,
              };
            }
          });
          setHours(loaded);
        }
      })
      .catch(() => { setHasShop(false); setView('form'); setCheckingShop(false); });
  }, []);

  const setField = (key) => (e) => setProfile(p => ({ ...p, [key]: e.target.value }));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return setError("Session expirée.");
    setLoading(true); setError('');
    try {
      const formData = new FormData();
      if (imageFile) formData.append('image', imageFile);
      formData.append('profile',   JSON.stringify(profile));
      formData.append('services',  JSON.stringify(services));
      formData.append('hours',     JSON.stringify(Object.keys(hours).map(day => ({ day_of_week: day, ...hours[day] }))));

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/shop/setup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `Erreur serveur (${res.status}).`); }

      setSuccess(true);
      // Après sauvegarde → basculer vers le dashboard
      setTimeout(() => {
        setShopData({ ...shopData, ...profile, name: profile.name });
        setHasShop(true);
        setView('dashboard');
        setSuccess(false);
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Chargement initial ────────────────────────────────────────────────────
  if (checkingShop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 size={36} className="animate-spin text-rose-400" />
      </div>
    );
  }

  // ─── Dashboard pro ─────────────────────────────────────────────────────────
  if (hasShop && view === 'dashboard') {
    return <ProDashboard shopData={shopData} onEditShop={() => setView('form')} />;
  }

  // ─── Formulaire création / modification ────────────────────────────────────
  return (
    <div className="shop-settings-page">
      <div className="shop-container">
        <header className="shop-header">
          {hasShop ? (
            <div className="flex items-center justify-between">
              <div>
                <h1>Modifier ma boutique</h1>
                <p>Mettez à jour votre profil, catalogue et disponibilités.</p>
              </div>
              <button
                onClick={() => setView('dashboard')}
                className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-rose-500 border border-slate-200 hover:border-rose-300 px-4 py-2 rounded-xl transition"
              >
                <LayoutDashboard size={14} /> Mon dashboard
              </button>
            </div>
          ) : (
            <>
              <h1>Configuration Boutique</h1>
              <p>Gérez votre profil, votre catalogue et vos disponibilités.</p>
            </>
          )}
        </header>

        <form onSubmit={handleSubmit} className="shop-form">
          <SectionCard icon={Building2} gradient="linear-gradient(135deg,#f59e0b,#d97706)" title="Profil Établissement">
            <ImageUploader preview={imagePreview} onFileChange={handleFileChange} onRemove={() => { setImageFile(null); setImagePreview(null); }} />
            <div className="profile-grid">
              <div className="col-full"><Field label="Nom" icon={Building2} placeholder="Ex: Salon O'RDV" value={profile.name} onChange={setField('name')} required /></div>
              <div className="col-full">
                <label className="field-label">Catégorie</label>
                <div className="input-wrapper">
                  <select className="custom-input" value={profile.categoryId} onChange={setField('categoryId')}>
                    <option value="">-- Choisir une catégorie --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="col-full"><TextareaField label="Description" icon={FileText} placeholder="Ex: Spécialiste barbe et soins visage..." value={profile.description} onChange={setField('description')} /></div>
              <div className="col-full"><Field label="Adresse" icon={MapPin} placeholder="Ex: 15 rue de la Paix" value={profile.address} onChange={setField('address')} required /></div>
              <Field label="Code Postal" icon={Hash} placeholder="80000" value={profile.zipCode} onChange={setField('zipCode')} />
              <Field label="Ville" placeholder="Amiens" value={profile.city} onChange={setField('city')} required />
              <Field label="Téléphone" icon={Phone} placeholder="06 00 00 00 00" value={profile.phone} onChange={setField('phone')} />
            </div>
          </SectionCard>

          <SectionCard icon={Store} gradient="linear-gradient(135deg,#f43f5e,#e11d48)" title="Catalogue">
            {services.map((s, i) => (
              <ServiceRow key={i} service={s} index={i} onChange={(idx, field, val) => {
                const updated = [...services]; updated[idx][field] = val; setServices(updated);
              }} onRemove={idx => setServices(services.filter((_, k) => k !== idx))} />
            ))}
            <button type="button" className="btn-add" onClick={() => setServices([...services, { label: '', price: '', duration: '' }])}>
              <Plus size={15} /> Ajouter une prestation
            </button>
          </SectionCard>

          <SectionCard icon={Clock} gradient="linear-gradient(135deg,#8b5cf6,#7c3aed)" title="Horaires d'ouverture">
            {Object.keys(hours).map(day => (
              <HoursRow key={day} day={day} config={hours[day]} onChange={(d, f, v) => setHours(prev => ({ ...prev, [d]: { ...prev[d], [f]: v } }))} />
            ))}
          </SectionCard>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className={`btn-submit${success ? ' success' : ''}`} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : success ? <CheckCircle /> : <Save />}
            {loading ? " Enregistrement..." : success ? " Sauvegardé !" : " Enregistrer"}
          </button>
        </form>
      </div>
    </div>
  );
}
