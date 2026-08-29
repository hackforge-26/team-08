import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// A custom pulsing icon for critical incidents
const criticalIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div class="w-4 h-4 bg-red-500 rounded-full animate-ping absolute"></div><div class="w-4 h-4 bg-red-600 rounded-full relative border-2 border-white"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// A custom icon for complaints
const complaintIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div class="w-4 h-4 bg-purple-500 rounded-full relative border-2 border-white shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13);
  }, [center, map]);
  return null;
}

export default function LiveMap() {
  const [position, setPosition] = React.useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [incidents, setIncidents] = React.useState<any[]>([]);
  const [disasterAlerts, setDisasterAlerts] = React.useState<any[]>([]);
  const defaultCenter: [number, number] = [40.7128, -74.0060]; // New York fallback

  React.useEffect(() => {
    // Fetch live incidents & disaster alerts
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8000/incidents');
        const data = await res.json();
        setIncidents(data);
      } catch (err) {
        console.error("Failed to fetch incidents", err);
      }

      try {
        const alertRes = await fetch('http://localhost:8000/disaster-alerts');
        if (alertRes.ok) {
          const alertData = await alertRes.json();
          setDisasterAlerts(alertData);
        }
      } catch (err) {
        console.warn("Failed to fetch disaster alerts", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
          setIsLoading(false);
        },
        (err) => {
          console.error("Error getting location:", err);
          setPosition(defaultCenter);
          setIsLoading(false);
        },
        { timeout: 5000 }
      );
    } else {
      setPosition(defaultCenter);
      setIsLoading(false);
    }
    
    return () => clearInterval(interval);
  }, []);

  // Custom blue dot for user's current location
  const userLocationIcon = new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div class="w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)] border-2 border-white"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  if (isLoading) {
    return (
      <div className="w-full h-full min-h-[400px] rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Acquiring satellite lock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative z-0" style={{ height: '100%' }}>
      <MapContainer 
        center={position || defaultCenter} 
        zoom={13} 
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
        className="bg-slate-900"
        zoomControl={false}
      >
        <ChangeView center={position || defaultCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />
        
        {/* User's Current Location */}
        {position && (
          <Marker position={position} icon={userLocationIcon}>
            <Popup className="custom-popup">
              <div className="p-1 font-bold text-slate-800">Your Current Location</div>
            </Popup>
          </Marker>
        )}

        {/* Disaster Early-Warning Risk Overlays */}
        {disasterAlerts.map((alert) => (
          <Circle
            key={alert.id}
            center={[alert.lat, alert.lng]}
            radius={alert.radius_km * 1000}
            pathOptions={{
              color: alert.risk_level === 'CRITICAL' ? '#ef4444' : '#f59e0b',
              fillColor: alert.risk_level === 'CRITICAL' ? '#ef4444' : '#f59e0b',
              fillOpacity: 0.15,
              weight: 2,
              dashArray: '6, 6'
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1 text-slate-900">
                <div className="font-bold text-amber-600 flex items-center gap-1 mb-1">
                  <span>⚠️ AI EARLY WARNING</span>
                </div>
                <div className="font-bold">{alert.type} ({alert.risk_level} RISK)</div>
                <div className="text-xs text-slate-600 mt-1">Area: {alert.area}</div>
                <div className="text-xs text-slate-600">Confidence: {alert.confidence}</div>
              </div>
            </Popup>
          </Circle>
        ))}

        {incidents.map((incident) => (
          <Marker 
            key={incident.id} 
            position={[incident.location.lat, incident.location.lng]} 
            icon={(incident.ai_priority || incident.severity) === 'CRITICAL' || (incident.ai_priority || incident.severity) === 'HIGH' ? criticalIcon : complaintIcon}
          >
            <Popup className="custom-popup">
              <div className="p-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${(incident.ai_priority || incident.severity) === 'CRITICAL' ? 'bg-red-500/20 text-red-500' : 'bg-purple-500/20 text-purple-600'}`}>
                    {incident.ai_priority || incident.severity}
                  </span>
                  <span className="text-slate-900 font-bold">{incident.type}</span>
                </div>
                <p className="text-sm text-slate-700 mb-2">{incident.description}</p>
                <div className="text-xs text-slate-500">Consolidated Reports: {incident.reports_count}</div>
              </div>
            </Popup>
          </Marker>
        ))}

      </MapContainer>
    </div>
  );
}

