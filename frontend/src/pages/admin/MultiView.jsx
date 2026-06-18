import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, User, Store, Crown, Loader2, AlertCircle } from 'lucide-react';
import API_BASE_URL from '../../api/api';

const appOrigin = window.location.origin;

const PANELS = [
  { key: 'client', label: 'Vue Client',       icon: User,  color: 'blue',   roleFilter: ['user'] },
  { key: 'pro',    label: 'Vue Prestataire',   icon: Store, color: 'rose',   roleFilter: ['pro'] },
  { key: 'admin',  label: 'Vue Admin',         icon: Crown, color: 'purple', roleFilter: ['admin'] },
];

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   select: 'border-blue-200' },
  rose:   { bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-700',   select: 'border-rose-200' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', select: 'border-purple-200' },
};

function IframePanel({ panel, users }) {
  const { key, label, icon: Icon, color, roleFilter } = panel;
  const c = COLOR_MAP[color];
  const iframeRef = useRef(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [iframeSrc, setIframeSrc] = useState('');

  const filtered = users.filter(u => roleFilter.includes(u.role));

  const loadUser = async (userId) => {
    if (!userId) { setIframeSrc(''); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/impersonate/${userId}`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const userJson = encodeURIComponent(JSON.stringify(data.user));
      const tokenEnc = encodeURIComponent(data.token);
      setIframeSrc(`${appOrigin}/#_t=${tokenEnc}&_u=${userJson}`);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const refresh = () => { if (iframeSrc && iframeRef.current) iframeRef.current.src = iframeSrc; };

  return (
    <div className={`flex flex-col border-r last:border-r-0 border-slate-200`} style={{ minHeight: 0 }}>
      {/* Header panneau */}
      <div className={`flex items-center gap-2 px-3 py-2 ${c.bg} border-b ${c.border} flex-shrink-0`}>
        <Icon size={15} className={c.text} />
        <span className={`text-xs font-bold ${c.text}`}>{label}</span>
        <select
          value={selectedUser}
          onChange={e => { setSelectedUser(e.target.value); loadUser(e.target.value); }}
          className={`ml-auto text-xs border ${c.select} rounded-lg px-2 py-1 bg-white outline-none max-w-[160px]`}
        >
          <option value="">— Choisir —</option>
          {filtered.map(u => (
            <option key={u.id} value={u.id}>
              {[u.first_name, u.last_name].filter(Boolean).join(' ') || u.email}
            </option>
          ))}
        </select>
        {iframeSrc && (
          <button onClick={refresh} className="ml-1 text-slate-400 hover:text-slate-700 transition">
            <RefreshCw size={13} />
          </button>
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <Loader2 size={28} className="animate-spin text-slate-400" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 gap-2">
            <AlertCircle size={24} className="text-red-400" />
            <p className="text-xs text-red-500 text-center px-4">{error}</p>
          </div>
        )}
        {!selectedUser && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
            <p className="text-xs text-slate-400 text-center px-6">
              Sélectionne un compte<br />pour le visualiser ici
            </p>
          </div>
        )}
        {iframeSrc && !loading && (
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            className="w-full h-full border-0"
            title={`panel-${key}`}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        )}
      </div>

      {/* Footer info */}
      {selectedUser && !error && (
        <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50 flex-shrink-0">
          <p className="text-[10px] text-slate-400">
            Session impersonation 30 min · {filtered.find(u => u.id === Number(selectedUser))?.email || ''}
          </p>
        </div>
      )}
    </div>
  );
}

export default function MultiView() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/admin/users`, { credentials: 'include', headers: { 'Content-Type': 'application/json' } })
      .then(r => {
        if (!r.ok) throw new Error(`Erreur ${r.status} — backend non déployé ?`);
        return r.json();
      })
      .then(u => { if (Array.isArray(u)) setUsers(u); })
      .catch(e => console.error('[MultiView]', e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-screen flex flex-col bg-slate-900" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-700 flex-shrink-0">
        <button onClick={() => navigate('/admin')} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition text-sm">
          <ArrowLeft size={14} /> Admin
        </button>
        <span className="text-slate-600">|</span>
        <span className="font-bold text-white text-sm">Vue multi-comptes temps réel</span>
        <span className="ml-3 text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
          Sessions isolées • Tokens 30 min • Sandbox
        </span>
      </div>

      {/* 3 panneaux iframes */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-slate-400" />
        </div>
      ) : users.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <AlertCircle size={32} className="text-red-400" />
          <p className="text-slate-400 text-sm">Impossible de charger les comptes.</p>
          <p className="text-slate-500 text-xs">Le backend Railway doit être déployé avec les routes admin.</p>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-3 overflow-hidden">
          {PANELS.map(panel => (
            <IframePanel key={panel.key} panel={panel} users={users} />
          ))}
        </div>
      )}
    </div>
  );
}
