import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix icônes Leaflet avec webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: 'hue-rotate-180',
});

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 13);
  }, [center, map]);
  return null;
}

export default function ProvidersMap({ providers, userPosition, onProviderClick }) {
  const defaultCenter = userPosition || [46.603354, 1.888334]; // centre France
  const zoom = userPosition ? 13 : 6;

  const mappable = providers.filter(p => p.latitude && p.longitude);

  return (
    <MapContainer
      center={defaultCenter}
      zoom={zoom}
      style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {userPosition && (
        <>
          <RecenterMap center={userPosition} />
          <Marker position={userPosition} icon={userIcon}>
            <Popup>📍 Votre position</Popup>
          </Marker>
        </>
      )}
      {mappable.map(p => (
        <Marker
          key={p.id}
          position={[p.latitude, p.longitude]}
          eventHandlers={{ click: () => onProviderClick && onProviderClick(p) }}
        >
          <Popup>
            <div style={{ minWidth: 150 }}>
              <strong>{p.name}</strong><br />
              <span style={{ fontSize: 12, color: '#888' }}>{p.category_name}</span><br />
              {p.city && <span style={{ fontSize: 12 }}>📍 {p.city}</span>}
              {p.distance_km !== null && (
                <><br /><span style={{ fontSize: 12, color: '#e11d48' }}>🚶 {p.distance_km} km</span></>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
