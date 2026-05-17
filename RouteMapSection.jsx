import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Map, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ROUTE_COLORS = [
  '#00ff9d', '#a855f7', '#3b82f6', '#f59e0b', '#ef4444',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#8b5cf6',
];

const categoryLabels = {
  any_percent: 'Any%',
  full_clear: 'Full Clear',
  no_elevator: 'No Elevator',
  stairs_only: 'Stairs Only',
  freestyle: 'Freestyle',
};

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

function makeIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:10px;height:10px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5)"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}

export default function RouteMapSection({ runs, building }) {
  const runsWithRoutes = runs.filter(r => r.route_waypoints?.length > 1);
  const [hidden, setHidden] = useState({});

  if (runsWithRoutes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Map className="w-8 h-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No routes mapped yet. Runners can add waypoints when submitting a run.</p>
      </div>
    );
  }

  const center = [building.latitude, building.longitude];

  // Compute bounds from all waypoints
  const allPoints = runsWithRoutes.flatMap(r => r.route_waypoints.map(w => [w.lat, w.lng]));
  const bounds = allPoints.length > 0 ? allPoints : [center];

  const toggle = (id) => setHidden(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-sm font-bold tracking-wider text-primary flex items-center gap-2">
        <Map className="w-4 h-4" /> ROUTE MAP
      </h3>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {runsWithRoutes.map((run, idx) => {
          const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];
          const isHidden = hidden[run.id];
          return (
            <button
              key={run.id}
              onClick={() => toggle(run.id)}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs transition-opacity ${isHidden ? 'opacity-40' : 'opacity-100'} border-border bg-card hover:bg-secondary`}
            >
              <span style={{ background: color }} className="w-2.5 h-2.5 rounded-full shrink-0" />
              <span className="font-medium">{run.runner_name}</span>
              <span className="text-muted-foreground">{formatTime(run.time_seconds)}</span>
              {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          );
        })}
      </div>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border border-border" style={{ height: 400 }}>
        <MapContainer
          bounds={bounds}
          boundsOptions={{ padding: [40, 40] }}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Building marker */}
          <Marker position={center}>
            <Popup>
              <strong>{building.name}</strong>
            </Popup>
          </Marker>

          {runsWithRoutes.map((run, idx) => {
            if (hidden[run.id]) return null;
            const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];
            const positions = run.route_waypoints.map(w => [w.lat, w.lng]);
            return (
              <React.Fragment key={run.id}>
                <Polyline positions={positions} pathOptions={{ color, weight: 3, opacity: 0.85 }} />
                {run.route_waypoints.map((wp, wi) => (
                  <Marker key={wi} position={[wp.lat, wp.lng]} icon={makeIcon(color)}>
                    <Popup>
                      <div className="text-xs">
                        <strong>{run.runner_name}</strong><br />
                        {wp.label || `Waypoint ${wi + 1}`}<br />
                        <span className="text-gray-500">{categoryLabels[run.category] || run.category}</span>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
