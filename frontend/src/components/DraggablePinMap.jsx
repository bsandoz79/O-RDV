import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

const pinIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClickHandler({ onMove }) {
  useMapEvents({ click: (e) => onMove(e.latlng) });
  return null;
}

function Recenter({ center }) {
  const map = useMap();
  const prev = useRef(null);
  useEffect(() => {
    if (center && JSON.stringify(center) !== JSON.stringify(prev.current)) {
      map.setView(center, 16);
      prev.current = center;
    }
  }, [center, map]);
  return null;
}

export default function DraggablePinMap({ coords, onChange }) {
  const center = coords ? [coords.lat, coords.lng] : [46.603, 1.888];
  const zoom   = coords ? 16 : 6;

  return (
    <div style={{ height: 260, borderRadius: 12, overflow: 'hidden', border: '1.5px solid #e2e8f0', marginTop: 8 }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter center={coords ? [coords.lat, coords.lng] : null} />
        <ClickHandler onMove={(ll) => onChange({ lat: ll.lat, lng: ll.lng })} />
        {coords && (
          <Marker
            position={[coords.lat, coords.lng]}
            icon={pinIcon}
            draggable
            eventHandlers={{ dragend: (e) => onChange({ lat: e.target.getLatLng().lat, lng: e.target.getLatLng().lng }) }}
          />
        )}
      </MapContainer>
      <p className="text-xs text-slate-400 text-center py-1.5 bg-slate-50">
        Cliquez sur la carte ou glissez le pin pour ajuster la position exacte
      </p>
    </div>
  );
}
