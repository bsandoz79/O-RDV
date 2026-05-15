import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Store, Calendar, Star, ShieldBan, Trash2,
  Search, RefreshCw, AlertTriangle, CheckCircle2, X, Crown,
  BadgeCheck, EyeOff, Eye, MessageSquareWarning, ExternalLink,
} from 'lucide-react';
import API_BASE_URL from '../../api/api';

const ROLE_STYLES = {
  admin: 'bg-purple-100 text-purple-700',
  pro:   'bg-blue-100 text-blue-700',
  user:  'bg-slate-100 text-slate-600',
};

const ROLE_LABELS = { admin: 'Admin', pro: 'Pro', user: 'Client' };

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '20' }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900">{value ?? '—'}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [tab, setTab]       = useState('users'); // 'users' | 'shops'
  const [users, setUsers]   = useState([]);
  const [shops, setShops]   = useState([]);
  const [stats, setStats]   = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [banModal, setBanModal]   = useState(null);
  const [banReason, setBanReason] = useState('');
  const [noteModal, setNoteModal] = useState(null); // { shop, note }
  const [msg, setMsg] = useState(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [uRes, sRes, pRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/users`, { headers }),
        fetch(`${API_BASE_URL}/admin/stats`, { headers }),
        fetch(`${API_BASE_URL}/admin/providers`, { headers }),
      ]);
      const [u, s, p] = await Promise.all([uRes.json(), sRes.json(), pRes.json()]);
      if (Array.isArray(u)) setUsers(prev => prev.length === u.length && prev.every((x, i) => x.id === u[i].id && x.is_banned === u[i].is_banned) ? prev : u);
      if (Array.isArray(p)) setShops(prev => prev.length === p.length && prev.every((x, i) => x.id === p[i].id && x.is_visible === p[i].is_visible && x.is_certified === p[i].is_certified) ? prev : p);
      setStats(s);
    } catch {}
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBan = async () => {
    const u = banModal;
    setBanModal(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${u.id}/ban`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ ban_reason: banReason || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg({ type: 'success', text: data.is_banned ? `${u.email} suspendu.` : `${u.email} réactivé.` });
      load(true);
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    }
    setBanReason('');
    setTimeout(() => setMsg(null), 4000);
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Supprimer définitivement ${u.email} ?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${u.id}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg({ type: 'success', text: `Compte ${u.email} supprimé.` });
      load(true);
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    }
    setTimeout(() => setMsg(null), 4000);
  };

  const handleShop = async (shopId, patch) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/providers/${shopId}`, {
        method: 'PATCH', headers, body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const label = patch.is_certified !== undefined
        ? (patch.is_certified ? 'Boutique certifiée ✓' : 'Certification retirée')
        : patch.is_visible !== undefined
        ? (patch.is_visible ? 'Boutique visible sur l\'accueil' : 'Boutique masquée de l\'accueil')
        : 'Avertissement envoyé';
      setMsg({ type: 'success', text: label });
      load(true);
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    }
    setNoteModal(null);
    setTimeout(() => setMsg(null), 4000);
  };

  const filtered = users.filter(u =>
    !search ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.first_name + ' ' + u.last_name).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12 px-4" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Crown size={22} className="text-purple-500" /> Administration
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Supervision et gestion des comptes</p>
          </div>
          <button onClick={() => load()} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 border border-slate-200 px-3 py-1.5 rounded-xl transition">
            <RefreshCw size={14} /> Actualiser
          </button>
        </div>

        {/* Message */}
        {msg && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {msg.text}
            <button onClick={() => setMsg(null)} className="ml-auto"><X size={14} /></button>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard icon={Users}   label="Utilisateurs"    value={stats.users}        color="#8b5cf6" />
            <StatCard icon={Users}   label="Nouveaux/jour"   value={stats.newToday}     color="#10b981" />
            <StatCard icon={Store}   label="Prestataires"    value={stats.providers}    color="#f43f5e" />
            <StatCard icon={Calendar} label="Rendez-vous"    value={stats.appointments} color="#f59e0b" />
            <StatCard icon={Star}    label="Avis"            value={stats.reviews}      color="#06b6d4" />
            <StatCard icon={ShieldBan} label="Suspendus"     value={stats.banned}       color="#ef4444" />
          </div>
        )}

        {/* Onglets */}
        <div className="flex gap-2 bg-white border border-slate-200 rounded-xl p-1 w-fit">
          {[{ key: 'users', icon: Users, label: 'Utilisateurs' }, { key: 'shops', icon: Store, label: 'Boutiques' }].map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => { setTab(key); setSearch(''); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === key ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Recherche */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'users' ? 'Rechercher par email ou nom...' : 'Rechercher une boutique...'}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>

        {/* Table boutiques */}
        {tab === 'shops' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400 text-sm">Chargement...</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Boutique</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Propriétaire</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Statut</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {shops.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.city?.toLowerCase().includes(search.toLowerCase())).map(s => (
                    <tr key={s.id} className={`hover:bg-slate-50 transition ${!s.is_visible ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => navigate(`/provider/${s.id}`)} className="font-semibold text-slate-800 hover:text-purple-600 flex items-center gap-1 transition">
                            {s.name} <ExternalLink size={11} className="opacity-50" />
                          </button>
                          {s.is_certified && <BadgeCheck size={14} className="text-blue-500 flex-shrink-0" title="Certifié" />}
                        </div>
                        <p className="text-xs text-slate-400">{s.category?.name || '—'} · {s.city || '—'}</p>
                        {s.admin_note && <p className="text-xs text-orange-500 mt-0.5 italic">⚠ {s.admin_note}</p>}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-xs text-slate-500">
                        {[s.user?.first_name, s.user?.last_name].filter(Boolean).join(' ') || s.user?.email || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full w-fit ${s.is_visible ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                            {s.is_visible ? 'Visible' : 'Masquée'}
                          </span>
                          {s.is_certified && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full w-fit bg-blue-100 text-blue-600">Certifiée</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button onClick={() => handleShop(s.id, { is_certified: !s.is_certified })}
                            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg border transition ${s.is_certified ? 'border-slate-200 text-slate-500 hover:bg-slate-50' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}>
                            <BadgeCheck size={11} /> {s.is_certified ? 'Décertifier' : 'Certifier'}
                          </button>
                          <button onClick={() => setNoteModal({ shop: s, note: s.admin_note || '' })}
                            className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 transition">
                            <MessageSquareWarning size={11} /> Avertir
                          </button>
                          <button onClick={() => handleShop(s.id, { is_visible: !s.is_visible })}
                            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg border transition ${s.is_visible ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>
                            {s.is_visible ? <><EyeOff size={11} /> Masquer</> : <><Eye size={11} /> Rendre visible</>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Table users */}
        {tab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-sm">Chargement...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Utilisateur</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rôle</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">RDV</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Inscription</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Statut</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(u => (
                  <tr key={u.id} className={`hover:bg-slate-50 transition ${u.is_banned ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 truncate max-w-[200px]">
                        {[u.first_name, u.last_name].filter(Boolean).join(' ') || <span className="text-slate-400 italic">Sans nom</span>}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{u.email}</p>
                      {u.provider && <p className="text-xs text-blue-500 mt-0.5">🏪 {u.provider.name}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${ROLE_STYLES[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-slate-600">{u._count?.appointments ?? 0}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-400">
                      {new Date(u.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      {u.is_banned ? (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-600">Suspendu</span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600">Actif</span>
                      )}
                      {u.ban_reason && <p className="text-xs text-red-400 mt-0.5 italic">{u.ban_reason}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setBanModal(u); setBanReason(''); }}
                          className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition ${u.is_banned ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' : 'border-orange-200 text-orange-600 hover:bg-orange-50'}`}
                        >
                          <ShieldBan size={11} /> {u.is_banned ? 'Réactiver' : 'Suspendre'}
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition"
                        >
                          <Trash2 size={11} /> Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-center py-10 text-slate-400 text-sm">Aucun utilisateur trouvé.</p>
          )}
        </div>
        )}

      </div>

      {/* Modal ban */}
      {banModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h2 className="font-black text-slate-900 text-lg mb-1">
              {banModal.is_banned ? 'Réactiver le compte' : 'Suspendre le compte'}
            </h2>
            <p className="text-sm text-slate-500 mb-4">{banModal.email}</p>
            {!banModal.is_banned && (
              <textarea
                value={banReason} onChange={e => setBanReason(e.target.value)}
                placeholder="Motif de la suspension (optionnel)..."
                rows={3}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-orange-300 resize-none mb-4"
              />
            )}
            <div className="flex gap-3">
              <button onClick={() => setBanModal(null)} className="flex-1 py-2 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition">Annuler</button>
              <button onClick={handleBan} className={`flex-1 py-2 text-white text-sm font-semibold rounded-xl transition ${banModal.is_banned ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-orange-500 hover:bg-orange-600'}`}>
                {banModal.is_banned ? 'Réactiver' : 'Suspendre'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal avertissement boutique */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h2 className="font-black text-slate-900 text-lg mb-1">Avertissement</h2>
            <p className="text-sm text-slate-500 mb-4">{noteModal.shop.name}</p>
            <textarea
              value={noteModal.note}
              onChange={e => setNoteModal(n => ({ ...n, note: e.target.value }))}
              placeholder="Décrivez le problème à corriger (ex: photo non conforme, adresse incorrecte)..."
              rows={4}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-orange-300 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setNoteModal(null)} className="flex-1 py-2 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition">Annuler</button>
              <button onClick={() => handleShop(noteModal.shop.id, { admin_note: noteModal.note })}
                className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition">
                Envoyer l'avertissement
              </button>
            </div>
            {noteModal.note && (
              <button onClick={() => handleShop(noteModal.shop.id, { admin_note: '' })}
                className="w-full mt-2 py-1.5 text-xs text-slate-400 hover:text-red-500 transition">
                Effacer l'avertissement existant
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
