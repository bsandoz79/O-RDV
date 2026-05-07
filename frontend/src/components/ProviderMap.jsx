import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Clock, Loader2 } from 'lucide-react';

const shopIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const userIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: 'hue-rotate-[200deg] saturate-200',
});

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(L.latLngBounds(positions), { padding: [40, 40] });
    } else if (positions.length === 1) {
      map.setView(positions[0], 15);
    }
  }, [positions, map]);
  return null;
}

function formatDuration(seconds) {
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export default function ProviderMap({ provider }) {
  const [userPos, setUserPos]   = useState(null);
  const [route, setRoute]       = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [geoError, setGeoError] = useState(false);

  const hasCoords = provider.latitude && provider.longitude;
  const shopPos = hasCoords ? [provider.latitude, provider.longitude] : null;

  // Géolocalisation utilisateur
  useEffect(() => {
    if (!hasCoords) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
        () => setGeoError(true)
      );
    } else {
      setGeoError(true);
    }
  }, [hasCoords]);

  // Calcul d'itinéraire via OSRM
  useEffect(() => {
    if (!userPos || !shopPos) return;
    setLoadingRoute(true);
    const [uLat, uLng] = userPos;
    const [sLat, sLng] = shopPos;
    fetch(
      `https://router.project-osrm.org/route/v1/driving/${uLng},${uLat};${sLng},${sLat}?overview=full&geometries=geojson`
    )
      .then(r => r.json())
      .then(data => {
        const leg = data.routes?.[0];
        if (!leg) return;
        const coords = leg.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        setRoute(coords);
        setRouteInfo({ duration: leg.duration, distance: leg.distance });
      })
      .catch(() => {})
      .finally(() => setLoadingRoute(false));
  }, [userPos, shopPos]);

  if (!hasCoords) return null;

  const positions = [shopPos, ...(userPos ? [userPos] : [])];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Navigation size={18} className="text-rose-400" /> Localisation
        </h2>
        {loadingRoute && <span className="flex items-center gap-1.5 text-xs text-slate-400"><Loader2 size={12} className="animate-spin" /> Calcul de l'itinéraire...</span>}
        {routeInfo && !loadingRoute && (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-sm font-semibold text-rose-500">
              <Clock size={14} /> {formatDuration(routeInfo.duration)}
            </span>
            <span className="text-xs text-slate-400">{formatDistance(routeInfo.distance)}</span>
          </div>
        )}
        {geoError && !routeInfo && (
          <span className="text-xs text-slate-400">Activez la géolocalisation pour voir l'itinéraire</span>
        )}
      </div>

      <div style={{ height: 300, borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <MapContainer
          center={shopPos}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds positions={positions} />

          {/* Marker boutique */}
          <Marker position={shopPos} icon={shopIcon}>
            <Popup><strong>{provider.name}</strong>{provider.address && <><br />{provider.address}</>}</Popup>
          </Marker>

          {/* Marker utilisateur */}
          {userPos && (
            <Marker position={userPos} icon={userIcon}>
              <Popup>📍 Votre position</Popup>
            </Marker>
          )}

          {/* Tracé itinéraire */}
          {route && (
            <Polyline
              positions={route}
              color="#f43f5e"
              weight={4}
              opacity={0.85}
            />
          )}
        </MapContainer>
      </div>

      {routeInfo && (
        <p className="text-xs text-slate-400 text-center mt-2">
          Itinéraire en voiture · {formatDistance(routeInfo.distance)} · {formatDuration(routeInfo.duration)} estimé
        </p>
      )}
    </div>
  );
}
