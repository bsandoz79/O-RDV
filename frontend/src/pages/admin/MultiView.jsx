import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, User, Store, Crown, Calendar, Clock, CheckCircle2, AlertCircle, Ban } from 'lucide-react';
import API_BASE_URL from '../../api/api';

const token = localStorage.getItem('token');
const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

const STATUS_STYLES = {
  pending:          'bg-amber-100 text-amber-600',
  confirmed:        'bg-emerald-100 text-emerald-600',
  cancelled:        'bg-red-100 text-red-500',
  cancelled_by_pro: 'bg-orange-100 text-orange-600',
  completed:        'bg-slate-100 text-slate-500',
};
const STATUS_LABELS = {
  pending: 'En attente', confirmed: 'Confirmé', cancelled: 'Annulé',
  cancelled_by_pro: 'Refusé', completed: 'Terminé',
};

function fmt(d) { return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }

// ── Panel client ──────────────────────────────────────────────────────────────
function ClientPanel({ users }) {
  const clients = users.filter(u => u.role === 'user');
  const [selected, setSelected] = useState('');
  const [appts, setAppts] = useState([]);
  const [profile, setProfile] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!selected) return;
    const [aRes, uRes] = await Promise.all([
      fetch(`${API_BASE_URL}/admin/users/${selected}/appointments`, { headers: h }),
      fetch(`${API_BASE_URL}/admin/users`, { headers: h }),
    ]);
    const a = await aRes.json();
    const u = await uRes.json();
    if (Array.isArray(a)) setAppts(a);
    if (Array.isArray(u)) setProfile(u.find(x => x.id === Number(selected)));
  }, [selected]);

  useEffect(() => { load(); const t = setInterval(() => load(true), 5000); return () => clearInterval(t); }, [load]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-3 border-b border-slate-100 bg-blue-50">
        <User size={16} className="text-blue-500" />
        <span className="text-sm font-bold text-blue-700">Vue Client</span>
        <select value={selected} onChange={e => setSelected(e.target.value)}
          className="ml-auto text-xs border border-blue-200 rounded-lg px-2 py-1 bg-white outline-none">
          <option value="">-- Choisir un client --</option>
          {clients.map(u => <option key={u.id} value={u.id}>{u.first_name || u.email} {u.last_name || ''}</option>)}
        </select>
      </div>
      {selected && profile && (
        <div className="p-3 border-b border-slate-100 text-xs text-slate-500 flex items-center gap-3">
          <span className="font-semibold text-slate-800">{[profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email}</span>
          {profile.is_banned && <span className="px-2 py-0.5 bg-red-100 text-red-600 font-bold rounded-full">SUSPENDU</span>}
          <span className="ml-auto text-slate-400">Inscrit le {new Date(profile.created_at).toLocaleDateString('fr-FR')}</span>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {!selected && <p className="text-center text-slate-400 text-sm pt-8">Sélectionne un client</p>}
        {appts.length === 0 && selected && <p className="text-center text-slate-400 text-sm pt-8">Aucun rendez-vous</p>}
        {appts.map(a => (
          <div key={a.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-semibold text-slate-800 truncate">{a.service_label}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLES[a.status]}`}>{STATUS_LABELS[a.status]}</span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1"><Clock size={10} /> {fmt(a.appointment_date)}</p>
            <p className="text-xs text-slate-400">{a.provider_name} · {a.price} €</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Panel pro ─────────────────────────────────────────────────────────────────
function ProPanel({ providers }) {
  const [selected, setSelected] = useState('');
  const [appts, setAppts] = useState([]);
  const [shop, setShop] = useState(null);

  const load = useCallback(async () => {
    if (!selected) return;
    const [aRes, sRes] = await Promise.all([
      fetch(`${API_BASE_URL}/admin/providers/${selected}/appointments`, { headers: h }),
      fetch(`${API_BASE_URL}/shop/profile/${selected}`),
    ]);
    const a = await aRes.json();
    const s = await sRes.json();
    if (Array.isArray(a)) setAppts(a);
    setShop(s);
  }, [selected]);

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [load]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-3 border-b border-slate-100 bg-rose-50">
        <Store size={16} className="text-rose-500" />
        <span className="text-sm font-bold text-rose-700">Vue Prestataire</span>
        <select value={selected} onChange={e => setSelected(e.target.value)}
          className="ml-auto text-xs border border-rose-200 rounded-lg px-2 py-1 bg-white outline-none">
          <option value="">-- Choisir une boutique --</option>
          {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      {shop && (
        <div className="p-3 border-b border-slate-100 text-xs flex items-center gap-2">
          {shop.image_url && <img src={shop.image_url} alt="" className="w-7 h-7 rounded-lg object-cover" />}
          <span className="font-semibold text-slate-800">{shop.name}</span>
          {shop.is_certified && <span className="text-blue-500 font-bold">✓ Certifié</span>}
          {!shop.is_visible && <span className="px-2 py-0.5 bg-red-100 text-red-600 font-bold rounded-full text-[10px]">MASQUÉ</span>}
          {shop.admin_note && <span className="text-orange-500 text-[10px] italic">⚠ {shop.admin_note}</span>}
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {!selected && <p className="text-center text-slate-400 text-sm pt-8">Sélectionne une boutique</p>}
        {appts.length === 0 && selected && <p className="text-center text-slate-400 text-sm pt-8">Aucun rendez-vous</p>}
        {appts.map(a => (
          <div key={a.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-semibold text-slate-800 truncate">{a.service_label}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLES[a.status]}`}>{STATUS_LABELS[a.status]}</span>
            </div>
            <p className="text-xs text-slate-500"><User size={10} className="inline mr-1" />{a.client_first_name || ''} {a.client_last_name || a.client_email}</p>
            <p className="text-xs text-slate-400"><Clock size={10} className="inline mr-1" />{fmt(a.appointment_date)} · {a.price} €</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Panel admin ───────────────────────────────────────────────────────────────
function AdminStatsPanel({ stats, users, providers }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-3 border-b border-slate-100 bg-purple-50">
        <Crown size={16} className="text-purple-500" />
        <span className="text-sm font-bold text-purple-700">Vue Admin</span>
        <span className="ml-auto text-xs text-purple-400">Temps réel</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          {stats && [
            { label: 'Utilisateurs', value: stats.users, color: 'bg-purple-50 text-purple-700' },
            { label: 'Prestataires', value: stats.providers, color: 'bg-rose-50 text-rose-700' },
            { label: 'RDV total', value: stats.appointments, color: 'bg-amber-50 text-amber-700' },
            { label: 'Suspendus', value: stats.banned, color: stats.banned > 0 ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`${color} rounded-xl p-3 text-center`}>
              <p className="text-2xl font-black">{value ?? '—'}</p>
              <p className="text-xs font-medium">{label}</p>
            </div>
          ))}
        </div>
        {/* Derniers inscrits */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Derniers comptes</p>
          <div className="space-y-1.5">
            {users.slice(0, 8).map(u => (
              <div key={u.id} className="flex items-center gap-2 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${u.role === 'admin' ? 'bg-purple-500' : u.role === 'pro' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                <span className="flex-1 truncate text-slate-700">{u.email}</span>
                {u.is_banned && <Ban size={10} className="text-red-500 flex-shrink-0" />}
                <span className="text-slate-400 flex-shrink-0">{new Date(u.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Boutiques masquées */}
        {providers.filter(p => !p.is_visible).length > 0 && (
          <div>
            <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-2">⚠ Boutiques masquées</p>
            {providers.filter(p => !p.is_visible).map(p => (
              <div key={p.id} className="text-xs text-red-600 bg-red-50 rounded-lg px-2 py-1 mb-1">{p.name}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function MultiView() {
  const navigate = useNavigate();
  const [users, setUsers]       = useState([]);
  const [providers, setProviders] = useState([]);
  const [stats, setStats]       = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async (silent = false) => {
    try {
      const [uRes, pRes, sRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/users`, { headers: h }),
        fetch(`${API_BASE_URL}/admin/providers`, { headers: h }),
        fetch(`${API_BASE_URL}/admin/stats`, { headers: h }),
      ]);
      const [u, p, s] = await Promise.all([uRes.json(), pRes.json(), sRes.json()]);
      if (Array.isArray(u)) setUsers(u);
      if (Array.isArray(p)) setProviders(p);
      setStats(s);
      if (!silent) setLastRefresh(new Date());
    } catch {}
  }, []);

  useEffect(() => { load(); const t = setInterval(() => load(true), 5000); return () => clearInterval(t); }, [load]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate('/admin')} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition text-sm">
          <ArrowLeft size={15} /> Admin
        </button>
        <span className="text-slate-600">|</span>
        <span className="font-bold text-sm">Vue multi-comptes</span>
        <span className="ml-auto text-xs text-slate-500 flex items-center gap-1">
          <RefreshCw size={11} className="animate-spin" style={{ animationDuration: '3s' }} />
          Actualisé à {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>

      {/* 3 panneaux */}
      <div className="flex-1 grid grid-cols-3 gap-0 overflow-hidden" style={{ minHeight: 0 }}>
        {/* Client */}
        <div className="border-r border-slate-200 bg-white overflow-hidden flex flex-col">
          <ClientPanel users={users} />
        </div>
        {/* Pro */}
        <div className="border-r border-slate-200 bg-white overflow-hidden flex flex-col">
          <ProPanel providers={providers} />
        </div>
        {/* Admin */}
        <div className="bg-white overflow-hidden flex flex-col">
          <AdminStatsPanel stats={stats} users={users} providers={providers} />
        </div>
      </div>
    </div>
  );
}
