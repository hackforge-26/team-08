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

// A custom pulsing icon for critical citizen incidents
const criticalIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div class="w-4 h-4 bg-red-500 rounded-full animate-ping absolute"></div><div class="w-4 h-4 bg-red-600 rounded-full relative border-2 border-white"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// A custom icon for standard citizen incidents
const complaintIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div class="w-4 h-4 bg-purple-500 rounded-full relative border-2 border-white shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// Custom icons for official IMD weather alert markers
const imdRedIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div class="w-5 h-5 bg-red-600 rounded-full animate-ping absolute opacity-75"></div><div class="w-5 h-5 bg-red-600 rounded-full relative border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-lg">⚡</div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const imdOrangeIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div class="w-5 h-5 bg-orange-500 rounded-full relative border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-lg">⚡</div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const imdYellowIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div class="w-5 h-5 bg-yellow-500 rounded-full relative border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-900 shadow-lg">⚡</div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
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
  const [imdAlerts, setImdAlerts] = React.useState<any[]>([]);
  const [imdError, setImdError] = React.useState<boolean>(false);
  const [lastImdSync, setLastImdSync] = React.useState<string | null>(null);

  const defaultCenter: [number, number] = [13.0447, 74.9785]; // India coastal regional center fallback

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8000/incidents');
        if (res.ok) {
          const data = await res.json();
          setIncidents(data);
        }
      } catch (err) {
        console.error("Failed to fetch incidents", err);
      }

      try {
        const alertRes = await fetch('http://localhost:8000/imd-alerts');
        if (alertRes.ok) {
          const alertData = await alertRes.json();
          setImdAlerts(alertData);
          setImdError(false);
          setLastImdSync(new Date().toLocaleTimeString());
        } else {
          setImdError(true);
        }
      } catch (err) {
        console.warn("Failed to fetch IMD alerts", err);
        setImdError(true);
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

  const userLocationIcon = new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div class="w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)] border-2 border-white"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  const getImdColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'red': return '#ef4444';
      case 'orange': return '#f97316';
      case 'yellow': return '#eab308';
      default: return '#22c55e';
    }
  };

  const getImdIcon = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'red': return imdRedIcon;
      case 'orange': return imdOrangeIcon;
      default: return imdYellowIcon;
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full min-h-[400px] rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Acquiring satellite lock & IMD feeds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative z-0" style={{ height: '100%' }}>
      {/* IMD Data Status Badge */}
      <div className="absolute top-3 right-3 z-[1000] bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-300 shadow-xl flex items-center gap-2">
        {imdError ? (
          <span className="text-amber-400 font-bold flex items-center gap-1">
            ⚠️ IMD alerts temporarily unavailable
          </span>
        ) : (
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            ⚡ India Meteorological Dept (IMD) Live Feed {lastImdSync && `(${lastImdSync})`}
          </span>
        )}
      </div>

      <MapContainer 
        center={position || defaultCenter} 
        zoom={12} 
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

        {/* Official India Meteorological Department (IMD) Alerts & Overlays */}
        {imdAlerts.map((alert) => {
          const color = getImdColor(alert.color_level);
          return (
            <React.Fragment key={alert.id}>
              <Circle
                center={[alert.lat, alert.lng]}
                radius={alert.radius_km * 1000}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.18,
                  weight: 2,
                  dashArray: '6, 6'
                }}
              />
              <Marker
                position={[alert.lat, alert.lng]}
                icon={getImdIcon(alert.color_level)}
              >
                <Popup className="custom-popup">
                  <div className="p-2 text-slate-900 space-y-1.5 min-w-[220px]">
                    <div className="flex items-center justify-between border-b pb-1">
                      <span className="font-bold text-xs uppercase text-slate-700">⚡ IMD ALERT</span>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: color }}>
                        {alert.color_level} Warning
                      </span>
                    </div>
                    <div className="font-bold text-sm text-slate-900">{alert.type}</div>
                    <div className="text-xs text-slate-600"><strong>Area:</strong> {alert.affected_area}</div>
                    <div className="text-xs text-slate-600"><strong>Issued:</strong> {alert.issue_time}</div>
                    <div className="text-xs text-slate-600"><strong>Valid Until:</strong> {alert.valid_until}</div>
                    <div className="text-xs text-slate-700 bg-slate-100 p-1.5 rounded border border-slate-200">
                      <strong>Public Action:</strong> {alert.recommended_action}
                    </div>
                    <div className="text-[10px] text-slate-500 pt-1 flex items-center justify-between border-t">
                      <span>Source: IMD</span>
                      <a href="https://mausam.imd.gov.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold">
                        mausam.imd.gov.in
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* Citizen Reported Incidents */}
        {incidents.map((incident) => (
          <Marker 
            key={incident.id} 
            position={[incident.location.lat, incident.location.lng]} 
            icon={(incident.ai_priority || incident.severity) === 'CRITICAL' || (incident.ai_priority || incident.severity) === 'HIGH' ? criticalIcon : complaintIcon}
          >
            <Popup className="custom-popup">
              <div className="p-1 text-slate-900">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                    CITIZEN REPORT
                  </span>
                  <span className="font-bold text-xs">{incident.id}</span>
                </div>
                <div className="font-bold text-sm mb-1">{incident.type}</div>
                <p className="text-xs text-slate-700 mb-1">{incident.description}</p>
                {incident.reporter_phone && (
                  <div className="text-xs text-slate-600 font-mono">📱 Contact: {incident.reporter_phone}</div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-slate-950/90 backdrop-blur-md border border-slate-800 p-3 rounded-xl text-xs space-y-2 text-slate-300 shadow-2xl">
        <div className="font-bold text-slate-100 uppercase tracking-wider text-[10px] border-b border-slate-800 pb-1 mb-1">
          Map Legend
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-600 border border-white"></div>
          <span>Citizen Emergency Incident</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 text-[8px] flex items-center justify-center font-bold text-white">⚡</div>
          <span>IMD Red Alert (Extremely Severe)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500 text-[8px] flex items-center justify-center font-bold text-white">⚡</div>
          <span>IMD Orange Alert (Be Prepared)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500 text-[8px] flex items-center justify-center font-bold text-slate-900">⚡</div>
          <span>IMD Yellow Alert (Watch)</span>
        </div>
      </div>
    </div>
  );
}


