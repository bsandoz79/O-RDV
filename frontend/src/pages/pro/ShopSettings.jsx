import React, { useState, useRef, useEffect } from 'react';
import {
  Store, Plus, Trash2, Clock, Save, MapPin,
  Building2, Loader2, CheckCircle, Phone,
  Camera, FileText, Hash, X, Calendar, User,
  ChevronRight, Pencil, LayoutDashboard,
  TrendingUp, Users, Euro, ChevronLeft, Ban, Archive,
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
  pending:          { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'En attente' },
  confirmed:        { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Confirmé'   },
  cancelled:        { bg: 'bg-red-100',     text: 'text-red-500',     label: 'Annulé'     },
  cancelled_by_pro: { bg: 'bg-orange-100',  text: 'text-orange-600',  label: 'Refusé'     },
  completed:        { bg: 'bg-slate-100',   text: 'text-slate-500',   label: 'Terminé'    },
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

const ServiceRow = ({ service, index, onChange, onRemove, token }) => {
  const [uploading, setUploading] = React.useState(false);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`${API_BASE_URL}/shop/upload-service-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.url) onChange(index, 'image_url', data.url);
    } catch {}
    setUploading(false);
  };

  return (
    <div className="service-row" style={{ flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
      {/* Photo prestation */}
      <div style={{ width: '72px', flexShrink: 0 }}>
        <label className="field-label">Photo</label>
        <label style={{ cursor: 'pointer', display: 'block', width: '72px', height: '72px', borderRadius: '10px', overflow: 'hidden', border: '2px dashed #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {uploading ? (
            <Loader2 size={20} className="animate-spin text-slate-400" />
          ) : service.image_url ? (
            <img src={service.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Camera size={22} className="text-slate-300" />
          )}
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
        </label>
      </div>
      <div style={{ flex: 1, minWidth: '140px' }}>
        <label className="field-label">Nom du service</label>
        <input className="custom-input" placeholder="Ex: Coupe de cheveux" type="text" value={service.label} onChange={(e) => onChange(index, 'label', e.target.value)} />
      </div>
      <div style={{ width: '90px' }}>
        <label className="field-label">Prix (€)</label>
        <input className="custom-input" placeholder="25" type="number" value={service.price} onChange={(e) => onChange(index, 'price', e.target.value)} />
      </div>
      <div style={{ width: '90px' }}>
        <label className="field-label">Durée (min)</label>
        <input className="custom-input" placeholder="30" type="number" value={service.duration} onChange={(e) => onChange(index, 'duration', e.target.value)} />
      </div>
      <button type="button" className="btn-remove" onClick={() => onRemove(index)}><Trash2 size={17} /></button>
    </div>
  );
};

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


const WEEK_DAYS_EN = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const WEEK_DAYS_FR = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

// ─── Composant Planning Hebdomadaire ──────────────────────────────────────────

function AppointmentPopover({ appt, onClose, onRefuse }) {
  if (!appt) return null;
  const date    = new Date(appt.appointment_date);
  const canRefuse = !['cancelled', 'cancelled_by_pro', 'completed'].includes(appt.status);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(15,23,42,0.25)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-5 w-72 shadow-xl"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
              <Calendar size={13} className="text-rose-500" />
            </div>
            <span className="font-semibold text-slate-900 text-sm">Détail du rendez-vous</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition">
            <X size={14} />
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
            <User size={14} className="text-slate-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Client</p>
              <p className="text-sm font-semibold text-slate-800 truncate">
                {appt.client_first_name || ''} {appt.client_last_name || appt.client_email?.split('@')[0] || '—'}
              </p>
            </div>
          </div>
          {appt.client_phone && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
              <Phone size={14} className="text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Téléphone</p>
                <p className="text-sm font-semibold text-slate-800">{appt.client_phone}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
            <Store size={14} className="text-slate-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Service</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{appt.service_label}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 p-2.5 rounded-xl bg-slate-50">
              <Clock size={14} className="text-slate-400" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Heure</p>
                <p className="text-sm font-semibold text-slate-800">
                  {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            {appt.duration && (
              <div className="flex-1 flex items-center gap-2 p-2.5 rounded-xl bg-slate-50">
                <TrendingUp size={14} className="text-slate-400" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Durée</p>
                  <p className="text-sm font-semibold text-slate-800">{appt.duration} min</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {canRefuse && (
          <button
            onClick={() => { onClose(); onRefuse(appt.id); }}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 hover:border-orange-400 text-sm font-semibold py-2.5 rounded-xl transition"
          >
            <Ban size={14} /> Refuser ce rendez-vous
          </button>
        )}
      </div>
    </div>
  );
}

const SLOT_H = 44; // px par tranche de 30 min

function WeeklyPlanning({ weekAppointments, shopHours, onRefuse }) {
  const [weekOffset,   setWeekOffset]   = useState(0);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const scrollRef = useRef(null);

  const monday    = addDays(getMondayOf(new Date()), weekOffset * 7);
  const weekDates = WEEK_DAYS_EN.map((_, i) => addDays(monday, i));

  // Plage horaire globale
  let globalOpenMin = 9 * 60, globalCloseMin = 19 * 60;
  if (shopHours?.length) {
    const opens  = shopHours.filter(h => !h.is_closed).map(h => { const [hh,mm] = (String(h.open_time||'').substring(0,5)||'09:00').split(':').map(Number); return hh*60+mm; });
    const closes = shopHours.filter(h => !h.is_closed).map(h => { const [hh,mm] = (String(h.close_time||'').substring(0,5)||'18:00').split(':').map(Number); return hh*60+mm; });
    if (opens.length)  globalOpenMin  = Math.min(...opens);
    if (closes.length) globalCloseMin = Math.max(...closes) || 24*60;
  }
  const totalSlots  = Math.ceil((globalCloseMin - globalOpenMin) / 30);
  const totalHeight = totalSlots * SLOT_H;

  // Index RDV par jour
  const apptsByDay = {};
  weekAppointments.forEach(a => {
    const d   = new Date(a.appointment_date);
    const key = `${d.getFullYear()}-${fmt(d.getMonth()+1)}-${fmt(d.getDate())}`;
    if (!apptsByDay[key]) apptsByDay[key] = [];
    apptsByDay[key].push(a);
  });

  const closedDays = new Set((shopHours||[]).filter(h=>h.is_closed).map(h=>h.day_of_week?.toLowerCase()));
  const now        = new Date();
  const todayStr   = `${now.getFullYear()}-${fmt(now.getMonth()+1)}-${fmt(now.getDate())}`;
  const nowMin     = now.getHours() * 60 + now.getMinutes();
  const nowTop     = ((nowMin - globalOpenMin) / 30) * SLOT_H;
  const showNow    = nowMin >= globalOpenMin && nowMin <= globalCloseMin;
  const weekLabel  = `${monday.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})} – ${addDays(monday,6).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}`;

  // Auto-scroll vers l'heure actuelle au montage
  useEffect(() => {
    if (scrollRef.current && weekOffset === 0 && showNow) {
      scrollRef.current.scrollTop = Math.max(0, nowTop - 120);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white rounded-2xl overflow-hidden mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)' }}>

      {/* ── En-tête de la carte ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Calendar size={15} className="text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Planning de la semaine</h3>
            <p className="text-xs text-slate-400">{weekLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setWeekOffset(0)} className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition">
            Aujourd'hui
          </button>
          <button onClick={() => setWeekOffset(o=>o-1)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition text-slate-500"><ChevronLeft size={15}/></button>
          <button onClick={() => setWeekOffset(o=>o+1)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition text-slate-500"><ChevronRight size={15}/></button>
        </div>
      </div>

      {/* ── Grille ──────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: '680px' }}>

          {/* En-têtes jours — hors du scroll pour ne pas bloquer les RDV */}
          <div className="grid bg-white border-b border-slate-100 shadow-sm" style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>
            <div className="py-3 border-r border-slate-100 bg-white" />
            {weekDates.map((date, i) => {
              const ds       = `${date.getFullYear()}-${fmt(date.getMonth()+1)}-${fmt(date.getDate())}`;
              const isToday  = ds === todayStr;
              const isClosed = closedDays.has(WEEK_DAYS_EN[i]);
              return (
                <div key={i} className={`py-2.5 text-center border-l border-slate-100 ${isClosed ? 'bg-slate-50' : 'bg-white'}`}>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider ${isToday ? 'text-blue-500' : isClosed ? 'text-slate-300' : 'text-slate-400'}`}>
                    {WEEK_DAYS_FR[i]}
                  </p>
                  <div className={`w-7 h-7 mx-auto mt-0.5 rounded-full flex items-center justify-center text-sm font-bold ${isToday ? 'bg-blue-500 text-white' : isClosed ? 'text-slate-300' : 'text-slate-700'}`}>
                    {date.getDate()}
                  </div>
                  {isClosed && (
                    <p className="text-[8px] font-bold uppercase tracking-widest text-slate-300 mt-0.5">Fermé</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Corps scrollable — grille des RDV uniquement */}
          <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: '460px' }}>
            <div className="relative grid" style={{ gridTemplateColumns: '52px repeat(7, 1fr)', height: totalHeight }}>

              {/* Axe horaire */}
              <div className="relative border-r border-slate-100">
                {Array.from({ length: totalSlots + 1 }).map((_, slot) => {
                  const m = globalOpenMin + slot * 30;
                  if (m % 60 !== 0) return null;
                  return (
                    <div
                      key={m}
                      className="absolute w-full flex items-center justify-end pr-2.5"
                      style={{ top: slot * SLOT_H - 7, height: 14 }}
                    >
                      <span className="text-[11px] font-medium text-slate-400 tabular-nums">
                        {`${fmt(Math.floor(m/60))}:${fmt(m%60)}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Colonnes jours */}
              {weekDates.map((date, i) => {
                const ds       = `${date.getFullYear()}-${fmt(date.getMonth()+1)}-${fmt(date.getDate())}`;
                const isToday  = ds === todayStr;
                const isClosed = closedDays.has(WEEK_DAYS_EN[i]);
                const dayH     = (shopHours||[]).find(h => h.day_of_week?.toLowerCase() === WEEK_DAYS_EN[i]);
                const dayAppts = apptsByDay[ds] || [];

                // Limites horaires du jour
                let dayOpenMin = globalOpenMin, dayCloseMin = globalCloseMin;
                if (dayH && !dayH.is_closed) {
                  const [oh,om] = (String(dayH.open_time||'').substring(0,5)||'09:00').split(':').map(Number);
                  const [ch,cm] = (String(dayH.close_time||'').substring(0,5)||'18:00').split(':').map(Number);
                  dayOpenMin  = oh*60+om;
                  dayCloseMin = (dayOpenMin===0 && ch*60+cm===0) ? 1440 : ch*60+cm;
                }

                return (
                  <div key={i} className="relative border-l border-slate-100" style={{ overflow: 'visible' }}>

                    {/* Fond hachuré jours fermés */}
                    {isClosed && (
                      <div className="absolute inset-0 z-0" style={{
                        backgroundColor: '#f8fafc',
                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 7px, rgba(148,163,184,0.12) 7px, rgba(148,163,184,0.12) 14px)',
                        pointerEvents: 'none',
                      }} />
                    )}

                    {/* Lignes de grille (30 min) */}
                    {Array.from({ length: totalSlots }).map((_, slot) => {
                      const slotMin     = globalOpenMin + slot * 30;
                      const isHourLine  = slotMin % 60 === 0;
                      const isOutOfHours = !isClosed && (slotMin < dayOpenMin || slotMin >= dayCloseMin);
                      return (
                        <div
                          key={slot}
                          className={`absolute w-full transition-colors ${
                            isHourLine ? 'border-t border-slate-100' : 'border-t border-slate-50'
                          }`}
                          style={{
                            top: slot * SLOT_H,
                            height: SLOT_H,
                            backgroundColor: isOutOfHours ? 'rgba(241,245,249,0.6)' : undefined,
                            zIndex: 1,
                            pointerEvents: 'none',
                          }}
                        />
                      );
                    })}

                    {/* Texte vertical FERMÉ */}
                    {isClosed && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <span
                          className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-300 select-none"
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                        >
                          Fermé
                        </span>
                      </div>
                    )}

                    {/* Ligne de l'heure courante */}
                    {isToday && showNow && !isClosed && (
                      <div
                        className="absolute z-30 w-full flex items-center pointer-events-none"
                        style={{ top: nowTop }}
                      >
                        <div className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" style={{ marginLeft: '-4px' }} />
                        <div className="flex-1 h-px bg-rose-400" style={{ boxShadow: '0 0 4px rgba(244,63,94,0.4)' }} />
                      </div>
                    )}

                    {/* Blocs rendez-vous */}
                    {!isClosed && dayAppts.map(appt => {
                      const d        = new Date(appt.appointment_date);
                      const apptMin  = d.getHours() * 60 + d.getMinutes();
                      const duration = Number(appt.duration) || 30;
                      const topPx    = ((apptMin - globalOpenMin) / 30) * SLOT_H;
                      const heightPx = Math.max((duration / 30) * SLOT_H - 4, SLOT_H - 4);
                      const clientName = (appt.client_first_name || appt.client_last_name)
                        ? `${appt.client_first_name||''} ${appt.client_last_name||''}`.trim()
                        : appt.client_email?.split('@')[0] || '—';

                      const isCancelled = appt.status === 'cancelled';
                      const isCompleted = appt.status === 'completed';

                      const colors = isCancelled
                        ? { bg: '#fff1f2', border: '#f87171', time: '#f87171', name: '#ef4444', service: '#fca5a5', line: 'line-through' }
                        : isCompleted
                        ? { bg: '#f8fafc', border: '#94a3b8', time: '#94a3b8', name: '#64748b', service: '#94a3b8', line: '' }
                        : { bg: '#eff6ff', border: '#3b82f6', time: '#2563eb', name: '#1d4ed8', service: '#60a5fa', line: '' };

                      return (
                        <button
                          key={appt.id}
                          onClick={() => setSelectedAppt(appt)}
                          className="absolute rounded-lg text-left transition-all hover:brightness-95 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                          style={{
                            top: topPx + 2,
                            height: heightPx,
                            left: 3,
                            right: 3,
                            zIndex: 20,
                            backgroundColor: colors.bg,
                            borderLeft: `3px solid ${colors.border}`,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                          }}
                        >
                          <div className="h-full flex flex-col justify-start px-1.5 py-1 overflow-hidden">
                            <span className="text-[10px] font-bold leading-none tabular-nums" style={{ color: colors.time }}>
                              {`${fmt(d.getHours())}:${fmt(d.getMinutes())}`}
                            </span>
                            {heightPx > 26 && (
                              <span className={`text-[10px] font-semibold truncate leading-snug mt-0.5 ${colors.line}`} style={{ color: colors.name }}>
                                {clientName}
                              </span>
                            )}
                            {heightPx > 52 && (
                              <span className="text-[9px] truncate leading-tight mt-0.5 opacity-80" style={{ color: colors.service }}>
                                {appt.service_label}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Légende ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 px-5 py-3 bg-slate-50 border-t border-slate-100">
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Légende</span>
        {[
          { bg: '#eff6ff', border: '#3b82f6', label: 'Réservé'  },
          { bg: '#f8fafc', border: '#94a3b8', label: 'Terminé'  },
          { bg: '#fff1f2', border: '#f87171', label: 'Annulé'   },
        ].map(({ bg, border, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block flex-shrink-0" style={{ backgroundColor: bg, borderLeft: `2px solid ${border}` }} />
            <span className="text-[10px] text-slate-400">{label}</span>
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-px bg-rose-400 inline-block" />
          <span className="text-[10px] text-slate-400">Maintenant</span>
        </span>
        <span className="ml-auto text-[10px] text-slate-400 italic hidden sm:block">Cliquer sur un RDV pour le détail</span>
      </div>

      <AppointmentPopover appt={selectedAppt} onClose={() => setSelectedAppt(null)} onRefuse={onRefuse} />
    </div>
  );
}

// ─── Modal de refus ───────────────────────────────────────────────────────────

function RefusalModal({ onConfirm, onClose }) {
  const [reason,  setReason]  = useState('');
  const [release, setRelease] = useState(true);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-80 shadow-xl"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
              <Ban size={13} className="text-orange-500" />
            </div>
            <span className="font-semibold text-slate-900 text-sm">Refuser le rendez-vous</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition">
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
              Motif du refus <span className="font-normal text-slate-400">(optionnel)</span>
            </label>
            <textarea
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 resize-none"
              rows={3}
              placeholder="Ex : Imprévu personnel, horaire indisponible..."
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer select-none p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
            <input
              type="checkbox"
              checked={release}
              onChange={e => setRelease(e.target.checked)}
              className="mt-0.5 accent-orange-500"
            />
            <div>
              <p className="text-sm font-semibold text-slate-800">Libérer ce créneau</p>
              <p className="text-xs text-slate-400 mt-0.5">Un autre client pourra réserver ce créneau.</p>
            </div>
          </label>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={() => onConfirm(reason.trim(), release)}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2.5 rounded-xl transition"
          >
            Confirmer le refus
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl transition"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Pro ─────────────────────────────────────────────────────────────

function ProDashboard({ shopData, onEditShop }) {
  const token = localStorage.getItem('token');
  const [appointments,     setAppointments]     = useState([]);
  const [newClients,       setNewClients]       = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [showAll,          setShowAll]          = useState(false);
  const [refusalTarget,    setRefusalTarget]    = useState(null);

  const fetchAppointments = (headers) =>
    fetch(`${API_BASE_URL}/user/appointments`, { headers })
      .then(r => r.json())
      .then(all => { setAppointments(Array.isArray(all) ? all : []); });

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetchAppointments(headers),
      fetch(`${API_BASE_URL}/user/new-clients`, { headers }).then(r => r.json()),
    ]).then(([, clients]) => {
      setNewClients(Array.isArray(clients) ? clients : []);
    }).catch(() => {}).finally(() => setLoading(false));

    const interval = setInterval(() => {
      fetchAppointments({ Authorization: `Bearer ${token}` }).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefuseConfirm = async (reason, release) => {
    const id = refusalTarget;
    setRefusalTarget(null);
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    try {
      const res = await fetch(`${API_BASE_URL}/user/appointments/${id}/refuse`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ reason, release }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      fetchAppointments({ Authorization: `Bearer ${token}` }).catch(() => {});
    } catch (err) {
      alert(err.message);
    }
  };

  // ── Calcul des KPIs depuis les données déjà chargées ─────────────────────
  const now       = new Date();
  const nowMs     = now.getTime();
  const thisMonth = now.getMonth();
  const thisYear  = now.getFullYear();
  const in7DaysMs = nowMs + 7 * 24 * 60 * 60 * 1000;

  // CA prévisionnel : mois en cours, non annulé, somme des prix
  const ca_previsionnel = appointments
    .filter(a => {
      const d = new Date(a.appointment_date);
      return a.status !== 'cancelled'
        && d.getMonth()    === thisMonth
        && d.getFullYear() === thisYear;
    })
    .reduce((sum, a) => sum + Number(a.price || 0), 0);

  // RDV à venir : non annulé, entre maintenant et J+7
  const upcoming_7d = appointments.filter(a => {
    const t = new Date(a.appointment_date).getTime();
    return a.status !== 'cancelled' && t >= nowMs && t < in7DaysMs;
  }).length;

  // Nouveaux clients ce mois : clients dont le PREMIER RDV connu est ce mois-ci
  const firstApptByClient = {};
  appointments.forEach(a => {
    const key = a.client_email;
    if (!key) return;
    const t = new Date(a.appointment_date).getTime();
    if (firstApptByClient[key] === undefined || t < firstApptByClient[key]) {
      firstApptByClient[key] = t;
    }
  });
  const new_clients = Object.values(firstApptByClient).filter(t => {
    const d = new Date(t);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  // Taux d'occupation semaine : minutes réservées / minutes totales disponibles
  const weekStart = getMondayOf(new Date());
  const weekEnd   = addDays(weekStart, 7);
  const bookedMinutes = appointments
    .filter(a => {
      const d = new Date(a.appointment_date);
      return !['cancelled', 'cancelled_by_pro'].includes(a.status) && d >= weekStart && d < weekEnd;
    })
    .reduce((sum, a) => sum + Number(a.duration || 30), 0);

  let totalMinutes = 0;
  const parseHHMM = val => {
    const str = String(val || '').substring(0, 5);
    const [hh = 0, mm = 0] = str.split(':').map(Number);
    return hh * 60 + mm;
  };
  (shopData.hours || []).forEach(h => {
    if (h.is_closed) return;
    const openMin  = parseHHMM(h.open_time);
    const closeMin = parseHHMM(h.close_time);
    const effective = (openMin === 0 && closeMin === 0) ? 1440 : closeMin;
    if (effective > openMin) totalMinutes += effective - openMin;
  });
  const occupation_rate = totalMinutes > 0
    ? Math.min(100, Math.round((bookedMinutes / totalMinutes) * 100))
    : 0;

  // ─────────────────────────────────────────────────────────────────────────
  const CANCELLED_STATUSES = ['cancelled', 'cancelled_by_pro'];
  const upcoming  = appointments.filter(a =>
    new Date(a.appointment_date) > now &&
    a.status !== 'completed'
  );
  const displayed = showAll ? upcoming : upcoming.slice(0, 6);
  const history   = [...appointments]
    .filter(a => a.status === 'completed' || CANCELLED_STATUSES.includes(a.status))
    .sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date))
    .slice(0, 30);
  const resolveUrl = (url) => url ? (url.startsWith('http') ? url : `${API_BASE_URL.replace('/api', '')}${url}`) : null;
  const shopImage  = resolveUrl(shopData.image_url);

  const kpis = [
    { icon: Users,      label: 'Nouveaux clients',   value: new_clients,              unit: 'ce mois',         color: '#8b5cf6' },
    { icon: TrendingUp, label: "Taux d'occupation",  value: occupation_rate,           unit: '% cette semaine', color: '#10b981' },
    { icon: Calendar,   label: 'RDV à venir',        value: upcoming_7d,               unit: '7 prochains jours', color: '#f43f5e' },
    { icon: Euro,       label: 'CA prévisionnel',    value: ca_previsionnel.toFixed(2), unit: '€',               color: '#f59e0b' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div className="max-w-6xl mx-auto px-4 space-y-5">

        {/* ── Topbar boutique ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)' }}>
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#f43f5e,#8b5cf6)' }} />
          <div className="flex items-center gap-4 px-6 py-4">
            {shopImage ? (
              <img src={shopImage} alt={shopData.name} className="w-11 h-11 rounded-xl object-cover flex-shrink-0 border border-slate-200" />
            ) : (
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#f43f5e,#8b5cf6)' }}>
                <Store size={20} color="white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 truncate">{shopData.name}</h1>
                <span className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">En ligne</span>
              </div>
              <p className="text-xs text-slate-400 truncate">{shopData.city || ''} · Dashboard Pro</p>
            </div>
            <button
              onClick={onEditShop}
              className="flex-shrink-0 flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-rose-500 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-4 py-2 rounded-xl transition"
            >
              <Pencil size={13} /> Modifier la boutique
            </button>
          </div>
        </div>

        {/* ── KPIs ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(({ icon: Icon, label, value, unit, color }) => (
            <div key={label} className="bg-white rounded-2xl p-5 flex items-center gap-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div className="min-w-0">
                {loading ? (
                  <div className="flex items-center gap-2 h-7">
                    <Loader2 size={16} className="animate-spin" style={{ color }} />
                    <span className="text-xs text-slate-400">Calcul…</span>
                  </div>
                ) : (
                  <p className="text-xl font-black text-slate-900 leading-none">
                    {value}
                    <span className="text-xs font-semibold text-slate-400 ml-1">{unit}</span>
                  </p>
                )}
                <p className="text-xs font-medium mt-1 text-slate-500 truncate">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Planning hebdomadaire ──────────────────────────────────── */}
        {!loading && (
          <WeeklyPlanning weekAppointments={appointments} shopHours={shopData.hours || []} onRefuse={id => setRefusalTarget(id)} />
        )}

        {/* ── Liste des rendez-vous ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-rose-50">
                <Calendar size={14} className="text-rose-500" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">{showAll ? 'Tous les RDV à venir' : 'Prochains rendez-vous'}</h3>
                <p className="text-xs text-slate-400">{upcoming.length} à venir</p>
              </div>
            </div>
            {upcoming.length > 6 && (
              <button
                onClick={() => setShowAll(v=>!v)}
                className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition"
              >
                {showAll ? 'Réduire' : `Voir tout (${upcoming.length})`}
                <ChevronRight size={11} />
              </button>
            )}
          </div>

          <div>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 size={26} className="animate-spin text-rose-500" /></div>
            ) : displayed.length === 0 ? (
              <div className="text-center py-14">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-slate-100">
                  <Calendar size={22} className="text-slate-300" />
                </div>
                <p className="font-semibold text-sm text-slate-500">Aucun rendez-vous à venir</p>
                <p className="text-xs mt-1 text-slate-400">Les nouvelles réservations apparaîtront ici.</p>
              </div>
            ) : (
              displayed.map((appt, idx) => {
                const date   = new Date(appt.appointment_date);
                const isPast = date < now;
                const st     = STATUS_STYLES[appt.status] || STATUS_STYLES.pending;
                return (
                  <div
                    key={appt.id}
                    className={`flex items-center gap-4 px-6 py-4 transition-all hover:bg-slate-50 ${idx > 0 ? 'border-t border-slate-100' : ''}`}
                    style={{ opacity: isPast || CANCELLED_STATUSES.includes(appt.status) ? 0.5 : 1 }}
                  >
                    {/* Bloc date */}
                    <div className="flex-shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center bg-rose-50 border border-rose-100">
                      <span className="text-[8px] font-bold uppercase leading-none text-rose-400">
                        {date.toLocaleDateString('fr-FR', { month: 'short' })}
                      </span>
                      <span className="text-lg font-black leading-tight text-rose-500">{date.getDate()}</span>
                    </div>
                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{appt.service_label}</p>
                      <p className="text-xs flex items-center gap-1 mt-0.5 text-slate-500">
                        <Clock size={10} />
                        {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        {appt.duration ? ` · ${appt.duration} min` : ''}
                      </p>
                      <p className="text-xs flex items-center gap-1 mt-0.5 text-slate-400">
                        <User size={10} />
                        {appt.client_first_name || ''} {appt.client_last_name || appt.client_email || '—'}
                      </p>
                    </div>
                    {/* Statut + prix + action */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                      {appt.price && (
                        <span className="text-xs font-bold text-slate-500">{Number(appt.price).toFixed(2)} €</span>
                      )}
                      {!isPast && !CANCELLED_STATUSES.includes(appt.status) && appt.status !== 'completed' && (
                        <button
                          onClick={() => setRefusalTarget(appt.id)}
                          className="flex items-center gap-1 text-[10px] font-semibold text-orange-500 hover:text-orange-700 border border-orange-200 hover:border-orange-400 px-2 py-1 rounded-lg transition"
                        >
                          <Ban size={10} /> Refuser
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Historique des rendez-vous ────────────────────────────── */}
        {!loading && (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-100">
                <Archive size={14} className="text-slate-500" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Historique</h3>
                <p className="text-xs text-slate-400">{history.length} rendez-vous terminés ou annulés</p>
              </div>
            </div>
            {history.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-slate-100">
                  <Archive size={18} className="text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-500">Aucun historique pour le moment</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: '580px' }}>
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {['Date', 'Client', 'Téléphone', 'Prestation', 'Statut'].map((h, i) => (
                        <th key={h} className={`py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wide ${i === 0 ? 'pl-6 pr-4 text-left' : i === 4 ? 'pr-6 pl-4 text-right' : 'px-4 text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((appt, idx) => {
                      const date = new Date(appt.appointment_date);
                      const st   = STATUS_STYLES[appt.status] || STATUS_STYLES.completed;
                      const initials = (appt.client_first_name?.[0] || appt.client_email?.[0] || '?').toUpperCase();
                      const avatarUrl = appt.client_profile_picture
                        ? resolveUrl(appt.client_profile_picture)
                        : null;
                      return (
                        <tr key={appt.id} className={`hover:bg-slate-50 transition ${idx > 0 ? 'border-t border-slate-100' : ''}`}>
                          <td className="pl-6 pr-4 py-3.5 whitespace-nowrap">
                            <p className="text-sm font-semibold text-slate-800">
                              {date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-xs text-slate-400">
                              {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              {avatarUrl ? (
                                <img src={avatarUrl} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {initials}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 text-sm truncate">
                                  {`${appt.client_first_name || ''} ${appt.client_last_name || appt.client_email?.split('@')[0] || '—'}`.trim()}
                                </p>
                                <p className="text-xs text-slate-400 truncate max-w-[140px]">{appt.client_email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                            {appt.client_phone || <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-slate-600 max-w-[160px] truncate">
                            {appt.service_label}
                          </td>
                          <td className="pr-6 pl-4 py-3.5 text-right">
                            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>
                              {st.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Nouveaux clients du mois ──────────────────────────────── */}
        {!loading && (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-violet-50">
                  <Users size={14} className="text-violet-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Derniers clients inscrits</h3>
                  <p className="text-xs text-slate-400">{newClients.length} nouveau{newClients.length !== 1 ? 'x' : ''} ce mois-ci</p>
                </div>
              </div>
            </div>
            {newClients.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-slate-100">
                  <Users size={18} className="text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-500">Aucun nouveau client ce mois-ci</p>
              </div>
            ) : (
              <div>
                {newClients.map((client, idx) => (
                  <div
                    key={client.id}
                    className={`flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition ${idx > 0 ? 'border-t border-slate-100' : ''}`}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>
                      {(client.first_name?.[0] || client.email?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">
                        {client.first_name || ''} {client.last_name || client.email?.split('@')[0] || '—'}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{client.email}</p>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-shrink-0">
                        <Phone size={11} />
                        {client.phone}
                      </div>
                    )}
                    <span className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100">
                      Nouveau
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {refusalTarget !== null && (
          <RefusalModal
            onConfirm={handleRefuseConfirm}
            onClose={() => setRefusalTarget(null)}
          />
        )}

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
  const [services,      setServices]      = useState([{ label: '', price: '', duration: '', image_url: '' }]);
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
        if (data.image_url) setImagePreview(data.image_url.startsWith('http') ? data.image_url : `${API_BASE_URL.replace('/api', '')}${data.image_url}`);
        if (data.services?.length > 0) {
          setServices(data.services.map(s => ({ label: s.label || '', price: s.price ?? '', duration: s.duration ?? '', image_url: s.image_url || '' })));
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

    // Validation adresse via Nominatim
    if (profile.address && profile.city) {
      const query = [profile.address, profile.zipCode, profile.city].filter(Boolean).join(', ');
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
          { headers: { 'User-Agent': 'ORDV-App/1.0' } }
        );
        const geoData = await geoRes.json();
        if (geoData.length === 0) {
          setLoading(false);
          return setError("Adresse introuvable. Vérifiez que l'adresse existe (rue, code postal, ville).");
        }
      } catch {
        // Si Nominatim inaccessible, on laisse passer
      }
    }
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
        <Loader2 size={32} className="animate-spin text-rose-500" />
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

          {/* Layout split : Catalogue à gauche, Horaires à droite */}
          <div className="flex gap-6 flex-col lg:flex-row items-start">
            <div className="flex-1 min-w-0">
              <SectionCard icon={Store} gradient="linear-gradient(135deg,#f43f5e,#e11d48)" title="Catalogue de prestations">
                {services.map((s, i) => (
                  <ServiceRow key={i} service={s} index={i} token={token} onChange={(idx, field, val) => {
                    const updated = [...services]; updated[idx][field] = val; setServices(updated);
                  }} onRemove={idx => setServices(services.filter((_, k) => k !== idx))} />
                ))}
                <button type="button" className="btn-add" onClick={() => setServices([...services, { label: '', price: '', duration: '', image_url: '' }])}>
                  <Plus size={15} /> Ajouter une prestation
                </button>
              </SectionCard>
            </div>

            <div style={{ width: '100%', maxWidth: '380px' }}>
              <SectionCard icon={Clock} gradient="linear-gradient(135deg,#8b5cf6,#7c3aed)" title="Horaires d'ouverture">
                {Object.keys(hours).map(day => (
                  <HoursRow key={day} day={day} config={hours[day]} onChange={(d, f, v) => setHours(prev => ({ ...prev, [d]: { ...prev[d], [f]: v } }))} />
                ))}
              </SectionCard>
            </div>
          </div>

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
