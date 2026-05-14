import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Clock, Loader2, Car, PersonStanding, Bike } from 'lucide-react';

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
  const [userPos, setUserPos]     = useState(null);
  const [geoError, setGeoError]  = useState(false);
  const [mode, setMode]           = useState('driving');
  const [routes, setRoutes]       = useState({});   // { driving: {route, duration, distance}, ... }
  const [loading, setLoading]     = useState(false);

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

  if (!hasCoords) return null;

  const current    = routes[mode];
  const positions  = useMemo(
    () => [shopPos, ...(userPos ? [userPos] : [])].filter(Boolean),
    [shopPos, userPos]
  );

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

      {/* Info distance + durée sélectionnée */}
      {current && (
        <div className="flex items-center gap-3 mb-3 px-3 py-2 bg-rose-50 rounded-xl border border-rose-100">
          <Clock size={14} className="text-rose-400 flex-shrink-0" />
          <span className="text-sm font-bold text-rose-600">{fmt(current.duration)}</span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-500">{fmtDist(current.distance)}</span>
          {geoError && <span className="text-xs text-slate-400 ml-auto">Activez la géolocalisation</span>}
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
