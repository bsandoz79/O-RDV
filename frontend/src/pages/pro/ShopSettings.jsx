import React, { useState, useRef, useEffect } from 'react';
import {
  Store, Plus, Trash2, Clock, Save, MapPin,
  Building2, Loader2, CheckCircle, Phone,
  Camera, FileText, Hash, X, Calendar, User,
  ChevronRight, Pencil, LayoutDashboard, Ban,
  TrendingUp, Users, Euro, ChevronLeft, ChevronDown, ChevronUp,
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

// ─── Helpers planning ─────────────────────────────────────────────────────────

// Lundi de la semaine contenant `date`
function getMondayOf(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=dim
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function fmt(n) { return String(n).padStart(2, '0'); }

// Génère les créneaux de 30 min entre openMin et closeMin
function buildSlots(openMin, closeMin) {
  const slots = [];
  for (let m = openMin; m < closeMin; m += 30) slots.push(m);
  return slots;
}

const WEEK_DAYS_EN = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const WEEK_DAYS_FR = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

// ─── Composant Planning Hebdomadaire ──────────────────────────────────────────

function WeeklyPlanning({ weekAppointments, shopHours }) {
  const [weekOffset, setWeekOffset] = useState(0);

  const monday    = addDays(getMondayOf(new Date()), weekOffset * 7);
  const weekDates = WEEK_DAYS_EN.map((_, i) => addDays(monday, i));

  // Plage horaire globale depuis business_hours
  let globalOpenMin = 9 * 60, globalCloseMin = 19 * 60;
  if (shopHours?.length) {
    const opens  = shopHours.filter(h => !h.is_closed).map(h => { const [hh,mm] = (String(h.open_time||'').substring(0,5)||'09:00').split(':').map(Number); return hh*60+mm; });
    const closes = shopHours.filter(h => !h.is_closed).map(h => { const [hh,mm] = (String(h.close_time||'').substring(0,5)||'18:00').split(':').map(Number); return hh*60+mm; });
    if (opens.length)  globalOpenMin  = Math.min(...opens);
    if (closes.length) globalCloseMin = Math.max(...closes) || 24*60;
  }
  const timeSlots = buildSlots(globalOpenMin, globalCloseMin);

  // Index RDV
  const apptIndex = {};
  weekAppointments.forEach(a => {
    const d = new Date(a.appointment_date);
    apptIndex[`${d.getFullYear()}-${fmt(d.getMonth()+1)}-${fmt(d.getDate())} ${fmt(d.getHours())}:${fmt(d.getMinutes())}`] = a;
  });

  const closedDays = new Set((shopHours||[]).filter(h=>h.is_closed).map(h=>h.day_of_week?.toLowerCase()));
  const todayStr   = `${new Date().getFullYear()}-${fmt(new Date().getMonth()+1)}-${fmt(new Date().getDate())}`;
  const weekLabel  = `${monday.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})} – ${addDays(monday,6).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}`;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Calendar size={15} className="text-violet-300" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Planning de la semaine</h3>
            <p className="text-xs text-slate-400">{weekLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setWeekOffset(0)} className="text-xs font-semibold text-violet-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition">
            Aujourd'hui
          </button>
          <button onClick={() => setWeekOffset(o=>o-1)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-slate-300"><ChevronLeft size={15}/></button>
          <button onClick={() => setWeekOffset(o=>o+1)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-slate-300"><ChevronRight size={15}/></button>
        </div>
      </div>

      {/* Grille */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: '680px' }}>

          {/* En-têtes jours */}
          <div className="grid bg-gray-50 border-b border-gray-100" style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>
            <div className="py-3 border-r border-gray-100" />
            {weekDates.map((date, i) => {
              const ds       = `${date.getFullYear()}-${fmt(date.getMonth()+1)}-${fmt(date.getDate())}`;
              const isToday  = ds === todayStr;
              const isClosed = closedDays.has(WEEK_DAYS_EN[i]);
              return (
                <div key={i} className={`py-3 text-center border-l border-gray-100 ${isClosed ? 'opacity-40' : ''}`}>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider ${isToday ? 'text-violet-600' : 'text-gray-400'}`}>{WEEK_DAYS_FR[i]}</p>
                  <div className={`w-7 h-7 mx-auto mt-0.5 rounded-full flex items-center justify-center text-sm font-bold ${isToday ? 'bg-violet-600 text-white shadow-md shadow-violet-200' : 'text-gray-600'}`}>
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lignes créneaux */}
          <div className="max-h-[380px] overflow-y-auto">
            {timeSlots.map(slotMin => {
              const slotLabel = `${fmt(Math.floor(slotMin/60))}:${fmt(slotMin%60)}`;
              const isHour    = slotMin % 60 === 0;
              return (
                <div key={slotMin} className={`grid ${isHour ? 'border-t border-gray-100' : ''}`} style={{ gridTemplateColumns: '52px repeat(7, 1fr)', minHeight: '36px' }}>
                  {/* Label heure */}
                  <div className={`flex items-center justify-end pr-3 border-r border-gray-100 ${isHour ? 'text-gray-400 text-[11px] font-medium' : 'text-gray-200 text-[10px]'}`}>
                    {isHour ? slotLabel : ''}
                  </div>
                  {/* Cases */}
                  {weekDates.map((date, i) => {
                    const ds       = `${date.getFullYear()}-${fmt(date.getMonth()+1)}-${fmt(date.getDate())}`;
                    const appt     = apptIndex[`${ds} ${slotLabel}`];
                    const isClosed = closedDays.has(WEEK_DAYS_EN[i]);
                    const dayH     = (shopHours||[]).find(h=>h.day_of_week?.toLowerCase()===WEEK_DAYS_EN[i]);
                    let inRange    = true;
                    if (dayH && !dayH.is_closed) {
                      const [oh,om] = (String(dayH.open_time||'').substring(0,5)||'09:00').split(':').map(Number);
                      const [ch,cm] = (String(dayH.close_time||'').substring(0,5)||'18:00').split(':').map(Number);
                      const oMin = oh*60+om, cMin = (oMin===0 && ch*60+cm===0) ? 1440 : ch*60+cm;
                      inRange = slotMin >= oMin && slotMin < cMin;
                    }
                    const out = isClosed || !inRange;
                    return (
                      <div key={i} className={`border-l border-gray-100 px-1 py-0.5 flex items-center ${out ? 'bg-gray-50' : 'bg-white hover:bg-gray-50/50'} transition`}>
                        {appt && !out && (
                          <div className={`w-full rounded-md px-2 py-1 text-[10px] font-semibold leading-tight truncate ${
                            appt.status === 'cancelled' ? 'bg-red-50 text-red-400 line-through border border-red-100'
                            : appt.status === 'completed' ? 'bg-gray-100 text-gray-400 border border-gray-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {appt.client_first_name || appt.client_last_name
                              ? `${appt.client_first_name||''} ${appt.client_last_name||''}`.trim()
                              : appt.client_email?.split('@')[0] || '—'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-5 px-5 py-3 bg-gray-50 border-t border-gray-100">
        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Légende</span>
        {[
          { cls: 'bg-blue-50 border border-blue-200',  label: 'Réservé'  },
          { cls: 'bg-gray-100 border border-gray-200', label: 'Fermé'    },
          { cls: 'bg-red-50 border border-red-100',    label: 'Annulé'   },
        ].map(({ cls, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-sm inline-block ${cls}`} />
            <span className="text-[10px] text-gray-400">{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard Pro ─────────────────────────────────────────────────────────────

function ProDashboard({ shopData, onEditShop }) {
  const token = localStorage.getItem('token');
  const [appointments,     setAppointments]     = useState([]);
  const [weekAppointments, setWeekAppointments] = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [showAll,          setShowAll]          = useState(false);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API_BASE_URL}/user/appointments`,        { headers }).then(r=>r.json()),
      fetch(`${API_BASE_URL}/user/appointments?week=1`, { headers }).then(r=>r.json()),
    ]).then(([all, week]) => {
      setAppointments(Array.isArray(all)  ? all  : []);
      setWeekAppointments(Array.isArray(week) ? week : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const now      = new Date();
  const todayStr = `${now.getFullYear()}-${fmt(now.getMonth()+1)}-${fmt(now.getDate())}`;
  const upcoming = appointments.filter(a => new Date(a.appointment_date) >= now && a.status !== 'cancelled');
  const displayed = showAll ? appointments : upcoming.slice(0, 6);

  const caTotal = appointments.filter(a=>a.status!=='cancelled').reduce((s,a)=>s+Number(a.price||0),0);
  const caToday = appointments.filter(a => {
    if (a.status==='cancelled') return false;
    const d = new Date(a.appointment_date);
    return `${d.getFullYear()}-${fmt(d.getMonth()+1)}-${fmt(d.getDate())}` === todayStr;
  }).reduce((s,a)=>s+Number(a.price||0),0);

  const shopImage = shopData.image_url ? `${API_BASE_URL.replace('/api','')}${shopData.image_url}` : null;

  const kpis = [
    { icon: Calendar,   label: 'RDV à venir',       value: upcoming.length,        unit: 'RDV', accent: 'border-blue-400',    iconBg: 'bg-blue-50',    iconColor: 'text-blue-500'    },
    { icon: Users,      label: 'Total réservations', value: appointments.length,    unit: 'RDV', accent: 'border-violet-400',  iconBg: 'bg-violet-50',  iconColor: 'text-violet-500'  },
    { icon: TrendingUp, label: 'CA prévisionnel',    value: caTotal.toFixed(2),     unit: '€',   accent: 'border-emerald-400', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
    { icon: Euro,       label: "CA aujourd'hui",     value: caToday.toFixed(2),     unit: '€',   accent: 'border-amber-400',   iconBg: 'bg-amber-50',   iconColor: 'text-amber-500'   },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div className="max-w-6xl mx-auto px-4 space-y-6">

        {/* ── Topbar boutique ─────────────────────────────────────────── */}
        <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg">
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#f43f5e,#8b5cf6,#3b82f6)' }} />
          <div className="flex items-center gap-4 px-6 py-4">
            {shopImage ? (
              <img src={shopImage} alt={shopData.name} className="w-12 h-12 rounded-xl object-cover border-2 border-white/10 flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                <Store size={22} color="white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white truncate">{shopData.name}</h1>
                <span className="flex-shrink-0 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">En ligne</span>
              </div>
              <p className="text-xs text-slate-400 truncate">{shopData.city || ''} · Dashboard Pro</p>
            </div>
            <button
              onClick={onEditShop}
              className="flex-shrink-0 flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition"
            >
              <Pencil size={13} /> Modifier la boutique
            </button>
          </div>
        </div>

        {/* ── KPIs ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(({ icon: Icon, label, value, unit, accent, iconBg, iconColor }) => (
            <div key={label} className={`bg-white rounded-2xl shadow-sm border-l-4 ${accent} p-5 flex items-center gap-4`}>
              <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} className={iconColor} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-black text-gray-900 leading-none">{value} <span className="text-sm font-semibold text-gray-400">{unit}</span></p>
                <p className="text-xs text-gray-500 font-medium mt-1 truncate">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Planning hebdomadaire ───────────────────────────────────── */}
        {!loading && (
          <WeeklyPlanning weekAppointments={weekAppointments} shopHours={shopData.hours || []} />
        )}

        {/* ── Liste des rendez-vous ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header section */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                <Calendar size={15} className="text-rose-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">{showAll ? 'Tous les rendez-vous' : 'Prochains rendez-vous'}</h3>
                <p className="text-xs text-gray-400">{upcoming.length} à venir · {appointments.length} au total</p>
              </div>
            </div>
            {appointments.length > 0 && (
              <button onClick={() => setShowAll(v=>!v)} className="text-xs font-semibold text-rose-500 hover:text-rose-700 flex items-center gap-1 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition">
                {showAll ? 'Voir à venir' : `Tout voir (${appointments.length})`}
                <ChevronRight size={12} />
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-rose-400" /></div>
            ) : displayed.length === 0 ? (
              <div className="text-center py-14 text-gray-400">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Calendar size={24} className="opacity-40" />
                </div>
                <p className="font-semibold text-gray-500 text-sm">Aucun rendez-vous à venir</p>
                <p className="text-xs mt-1 text-gray-400">Les nouvelles réservations apparaîtront ici.</p>
              </div>
            ) : (
              <>
                {displayed.map(appt => {
                  const date   = new Date(appt.appointment_date);
                  const isPast = date < now;
                  const st     = STATUS_STYLES[appt.status] || STATUS_STYLES.pending;
                  return (
                    <div key={appt.id} className={`flex items-center gap-4 px-6 py-4 transition-all ${isPast || appt.status==='cancelled' ? 'opacity-50' : 'hover:bg-gray-50/60'}`}>
                      {/* Bloc date */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex flex-col items-center justify-center">
                        <span className="text-[9px] font-bold text-rose-400 uppercase leading-none">
                          {date.toLocaleDateString('fr-FR',{month:'short'})}
                        </span>
                        <span className="text-xl font-black text-rose-500 leading-tight">{date.getDate()}</span>
                      </div>
                      {/* Infos principales */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{appt.service_label}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock size={10} className="text-gray-400" />
                          {date.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
                          {appt.duration ? ` · ${appt.duration} min` : ''}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <User size={10} />
                          {appt.client_first_name||''} {appt.client_last_name||appt.client_email||'—'}
                        </p>
                      </div>
                      {/* Statut + prix */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>
                          {st.label}
                        </span>
                        {appt.price && (
                          <span className="text-xs font-bold text-gray-600">{Number(appt.price).toFixed(2)} €</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
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
      setShopData({ ...shopData, ...profile, name: profile.name });
      setHasShop(true);
      setView('dashboard');
      setTimeout(() => setSuccess(false), 100);
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
