import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Clock, Loader2, Car, PersonStanding, Bike, MapPin, Search, LocateFixed } from 'lucide-react';

const shopIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
});

const userIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
  className: 'hue-rotate-180',
});

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) map.fitBounds(L.latLngBounds(positions), { padding: [40, 40] });
    else if (positions.length === 1) map.setView(positions[0], 15);
  }, [positions, map]);
  return null;
}

function fmt(seconds) {
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function fmtDist(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

const MODES = [
  { key: 'driving',  label: 'Voiture',  Icon: Car,             osrm: 'driving',  kmh: 50 },
  { key: 'walking',  label: 'À pied',   Icon: PersonStanding,  osrm: 'foot',     kmh: 5  },
  { key: 'cycling',  label: 'Vélo',     Icon: Bike,            osrm: 'bike',     kmh: 15 },
];

export default function ProviderMap({ provider }) {
  const [userPos, setUserPos]         = useState(null);
  const [geoError, setGeoError]      = useState(false);
  const [mode, setMode]               = useState('driving');
  const [routes, setRoutes]           = useState({});
  const [loading, setLoading]         = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [geocoding, setGeocoding]     = useState(false);
  const [geoNotFound, setGeoNotFound] = useState(false);

  const retryGeo = () => {
    setGeoError(false);
    setGeoNotFound(false);
    navigator.geolocation?.getCurrentPosition(
      p => setUserPos([p.coords.latitude, p.coords.longitude]),
      () => setGeoError(true)
    );
  };

  const geocodeManual = async () => {
    if (!manualAddress.trim()) return;
    setGeocoding(true);
    setGeoNotFound(false);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualAddress)}&format=json&limit=1&countrycodes=fr`,
        { headers: { 'User-Agent': 'ORDV-App/1.0' } }
      );
      const data = await res.json();
      if (data.length > 0) {
        setUserPos([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        setGeoError(false);
      } else {
        setGeoNotFound(true);
      }
    } catch {}
    finally { setGeocoding(false); }
  };

  const hasCoords = provider.latitude && provider.longitude;
  const shopPos   = useMemo(
    () => hasCoords ? [provider.latitude, provider.longitude] : null,
    [provider.latitude, provider.longitude]
  );

  useEffect(() => {
    if (!hasCoords) return;
    navigator.geolocation?.getCurrentPosition(
      p => setUserPos([p.coords.latitude, p.coords.longitude]),
      () => setGeoError(true)
    );
  }, [hasCoords]);

  // Calcule les 3 modes dès qu'on a la position
  useEffect(() => {
    if (!userPos || !shopPos) return;
    const [uLat, uLng] = userPos;
    const [sLat, sLng] = shopPos;

    setLoading(true);
    // On appelle OSRM pour la voiture (trace réelle), et on estime pour pied/vélo
    fetch(`https://router.project-osrm.org/route/v1/driving/${uLng},${uLat};${sLng},${sLat}?overview=full&geometries=geojson`)
      .then(r => r.json())
      .then(data => {
        const leg = data.routes?.[0];
        if (!leg) return;
        const coords    = leg.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        const distance  = leg.distance;
        setRoutes({
          driving: { route: coords, duration: leg.duration,                distance },
          walking: { route: coords, duration: (distance / 1000) / 5 * 3600, distance },
          cycling: { route: coords, duration: (distance / 1000) / 15 * 3600, distance },
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userPos, shopPos]);

  const positions = useMemo(
    () => [shopPos, ...(userPos ? [userPos] : [])].filter(Boolean),
    [shopPos, userPos]
  );

  if (!hasCoords) return null;

  const current = routes[mode];

  // Liens de navigation externes
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${provider.latitude},${provider.longitude}`;
  const wazeUrl   = `https://waze.com/ul?ll=${provider.latitude},${provider.longitude}&navigate=yes`;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Navigation size={18} className="text-rose-400" /> Itinéraire
        </h2>
        {/* Boutons navigation externe */}
        <div className="flex gap-2">
          <a href={googleUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded-lg transition">
            <Navigation size={11} /> Google Maps
          </a>
          <a href={wazeUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-cyan-500 hover:bg-cyan-600 px-3 py-1.5 rounded-lg transition">
            <Navigation size={11} /> Waze
          </a>
        </div>
      </div>

      {/* Onglets de mode */}
      <div className="flex gap-2 mb-4">
        {MODES.map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setMode(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition border ${
              mode === key
                ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-rose-300 hover:text-rose-500'
            }`}>
            <Icon size={14} /> {label}
            {routes[key] && (
              <span className={`ml-1 text-xs font-bold ${mode === key ? 'text-rose-100' : 'text-slate-400'}`}>
                {fmt(routes[key].duration)}
              </span>
            )}
          </button>
        ))}
        {loading && <Loader2 size={16} className="animate-spin text-slate-300 self-center ml-1" />}
      </div>

      {/* Panneau alternatif si géoloc refusée */}
      {geoError && !userPos && (
        <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <MapPin size={12} className="text-slate-400" />
            Géolocalisation non disponible. Entrez votre ville pour calculer l'itinéraire.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={manualAddress}
                onChange={e => { setManualAddress(e.target.value); setGeoNotFound(false); }}
                onKeyDown={e => e.key === 'Enter' && geocodeManual()}
                placeholder="Ex : Amiens, Paris 75001…"
                className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-400 bg-white"
              />
            </div>
            <button
              onClick={geocodeManual}
              disabled={geocoding || !manualAddress.trim()}
              className="px-3 py-1.5 bg-rose-500 text-white text-xs font-semibold rounded-lg hover:bg-rose-600 transition disabled:opacity-50 flex items-center gap-1"
            >
              {geocoding ? <Loader2 size={12} className="animate-spin" /> : 'OK'}
            </button>
            <button
              onClick={retryGeo}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:border-rose-300 hover:text-rose-500 transition flex items-center gap-1"
              title="Réessayer la géolocalisation"
            >
              <LocateFixed size={12} />
            </button>
          </div>
          {geoNotFound && <p className="text-xs text-rose-500">Adresse introuvable, essayez avec une ville.</p>}
        </div>
      )}

      {/* Bouton désactiver ma position */}
      {userPos && (
        <div className="mb-3 flex items-center justify-between px-3 py-2 bg-rose-50 rounded-xl border border-rose-100">
          <span className="text-xs text-rose-600 font-medium flex items-center gap-1.5">
            <MapPin size={12} /> Position détectée
          </span>
          <button
            onClick={() => { setUserPos(null); setRoutes({}); setGeoError(true); }}
            className="text-xs text-slate-400 hover:text-rose-500 transition underline"
          >
            Modifier
          </button>
        </div>
      )}

      {/* Info distance + durée sélectionnée */}
      {current && (
        <div className="flex items-center gap-3 mb-3 px-3 py-2 bg-rose-50 rounded-xl border border-rose-100">
          <Clock size={14} className="text-rose-400 flex-shrink-0" />
          <span className="text-sm font-bold text-rose-600">{fmt(current.duration)}</span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-500">{fmtDist(current.distance)}</span>
        </div>
      )}

      {/* Carte */}
      <div style={{ height: 280, borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <MapContainer center={shopPos} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds positions={positions} />
          <Marker position={shopPos} icon={shopIcon}>
            <Popup><strong>{provider.name}</strong>{provider.address && <><br />{provider.address}</>}</Popup>
          </Marker>
          {userPos && <Marker position={userPos} icon={userIcon}><Popup>📍 Votre position</Popup></Marker>}
          {current?.route && <Polyline positions={current.route} color="#f43f5e" weight={4} opacity={0.85} />}
        </MapContainer>
      </div>
    </div>
  );
}
