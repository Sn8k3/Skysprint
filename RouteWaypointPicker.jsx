import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ClickHandler({ onAdd }) {
  useMapEvents({ click: (e) => onAdd(e.latlng) });
  return null;
}

export default function RouteWaypointPicker({ center, waypoints, onChange }) {
  const [pendingLabel, setPendingLabel] = useState('');

  const handleAdd = ({ lat, lng }) => {
    onChange([...waypoints, { lat, lng, label: pendingLabel || `Stop ${waypoints.length + 1}` }]);
    setPendingLabel('');
  };

  const handleRemove = (idx) => onChange(waypoints.filter((_, i) => i !== idx));

  const positions = waypoints.map(w => [w.lat, w.lng]);

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        <Input
          placeholder="Label for next waypoint (optional)"
          value={pendingLabel}
          onChange={e => setPendingLabel(e.target.value)}
          className="text-xs h-8"
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">then click map</span>
      </div>

      <div className="rounded-lg overflow-hidden border border-border" style={{ height: 240 }}>
        <MapContainer center={center} zoom={16} style={{ width: '100%', height: '100%' }} scrollWheelZoom={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onAdd={handleAdd} />
          {waypoints.map((wp, i) => (
            <Marker key={i} position={[wp.lat, wp.lng]} />
          ))}
          {positions.length > 1 && (
            <Polyline positions={positions} pathOptions={{ color: '#00ff9d', weight: 3 }} />
          )}
        </MapContainer>
      </div>

      {waypoints.length > 0 && (
        <div className="space-y-1 max-h-28 overflow-y-auto">
          {waypoints.map((wp, i) => (
            <div key={i} className="flex items-center gap-2 text-xs px-2 py-1 rounded bg-secondary/40">
              <MapPin className="w-3 h-3 text-primary shrink-0" />
              <span className="flex-1 truncate">{wp.label}</span>
              <span className="text-muted-foreground">{wp.lat.toFixed(4)}, {wp.lng.toFixed(4)}</span>
              <button type="button" onClick={() => handleRemove(i)}><Trash2 className="w-3 h-3 text-destructive" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
