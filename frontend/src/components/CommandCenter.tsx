import React, { useState } from 'react';
import { Activity, ShieldAlert, Clock, Users, MapPin, CheckCircle, Phone, ExternalLink, AlertCircle, Check, Loader2, Megaphone } from 'lucide-react';
import LiveMap from './LiveMap';
import { HELPER_CONTACT_NAME, HELPER_PHONE_NUMBER } from '../config';
import { formatIncidentTime } from '../utils/dateFormatter';

export default function CommandCenter() {
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [isNotifying, setIsNotifying] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await fetch('http://localhost:8000/incidents');
        const data = await res.json();
        setIncidents(data);
        // Sync selected incident if updated
        if (selectedIncident) {
          const updated = data.find((inc: any) => inc.id === selectedIncident.id);
          if (updated) setSelectedIncident(updated);
        }
      } catch (err) {
        console.error("Failed to fetch incidents", err);
      }
    };
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 3000);
    return () => clearInterval(interval);
  }, [selectedIncident?.id]);

  const handleNotifyHelper = async (incidentId: string) => {
    setIsNotifying(true);
    setNotificationError(null);
    try {
      const res = await fetch(`http://localhost:8000/incidents/${incidentId}/notify-helper`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Notification failed');
      const data = await res.json();
      
      setSelectedIncident((prev: any) => prev ? { ...prev, notified: true, notified_at: data.notified_at } : null);
      setIncidents((prev: any[]) => prev.map((inc) => inc.id === incidentId ? { ...inc, notified: true, notified_at: data.notified_at } : inc));
    } catch (err) {
      console.error("Failed to notify helper", err);
      setNotificationError("Failed to notify helper");
    } finally {
      setIsNotifying(false);
    }
  };

  const criticalCount = incidents.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length;

  return (
    <div className="h-full grid grid-cols-12 gap-6">
      {/* Active Incidents List */}
      <div className="col-span-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/30">
          <h3 className="font-semibold text-slate-200">Active Incidents</h3>
          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">
            {criticalCount} Critical
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {incidents.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">No active incidents reported.</div>
          ) : (
            incidents.map((incident) => (
              <div 
                key={incident.id}
                onClick={() => { setSelectedIncident(incident); setNotificationError(null); }}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedIncident?.id === incident.id ? 'bg-slate-800 border-blue-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono text-slate-400">{incident.id}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${incident.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : incident.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' : incident.severity === 'LOW' ? 'bg-purple-500/20 text-purple-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {incident.severity}
                  </span>
                </div>
                <h4 className="font-medium text-slate-200 text-sm mb-1">{incident.type}</h4>
                <div className="flex items-center text-xs text-slate-400 gap-1.5">
                  <Clock className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  <span className="truncate">{formatIncidentTime(incident.created_at || incident.time)}</span>
                </div>
                {incident.notified && (
                  <div className="mt-2 text-[10px] font-semibold text-green-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Helper Notified
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Map Area */}
      <div className="col-span-6 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 relative">
        <LiveMap />
      </div>

      {/* Incident Details & Dispatch */}
      <div className="col-span-3 bg-slate-900 border border-slate-800 rounded-xl overflow-y-auto">
        {selectedIncident ? (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className={`w-6 h-6 ${selectedIncident.severity === 'CRITICAL' ? 'text-red-500' : 'text-orange-500'}`} />
              <div>
                <h2 className="text-xl font-bold text-slate-100">{selectedIncident.type}</h2>
                <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>{formatIncidentTime(selectedIncident.created_at || selectedIncident.time)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</label>
              <div className="flex items-center gap-2 text-sm text-slate-300 mt-1 font-mono">
                <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>{selectedIncident.location.lat.toFixed(4)}, {selectedIncident.location.lng.toFixed(4)}</span>
              </div>
              <a
                href={`https://www.google.com/maps?q=${selectedIncident.location.lat},${selectedIncident.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 font-medium underline flex items-center gap-1 mt-1.5"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {selectedIncident.photo_url && (
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attached Media</label>
                <div className="mt-1 overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
                  <img 
                    src={selectedIncident.photo_url} 
                    alt="Incident photo" 
                    className="w-full h-36 object-cover hover:scale-105 transition-transform duration-200"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Incident Details</label>
              <div className="bg-slate-950 border border-blue-500/20 p-3 rounded-lg mt-1 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <p className="text-sm text-blue-200">{selectedIncident.description}</p>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-blue-500/10">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-400">{selectedIncident.reports_count} duplicate reports consolidated</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recommended Resources</label>
              <div className="mt-1 space-y-2">
                <div className="flex justify-between items-center bg-slate-800/50 px-3 py-2 rounded text-sm text-slate-300 border border-slate-700/50">
                  <span>Nearest Response Unit</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              </div>
            </div>

            {/* Helper Contact Card */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Emergency Helper Contact</label>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg mt-1">
                <div className="text-sm font-semibold text-slate-200">{HELPER_CONTACT_NAME}</div>
                <div className="text-xs text-blue-400 font-mono mt-1 flex items-center gap-1.5 font-bold">
                  <Phone className="w-3.5 h-3.5" />
                  <span>📞 {HELPER_PHONE_NUMBER}</span>
                </div>
              </div>
            </div>

            {/* Notify Helper Button & Status */}
            <div className="pt-2 border-t border-slate-800">
              {selectedIncident.notified ? (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-1.5 text-green-400 font-bold text-sm">
                    <Check className="w-4 h-4" />
                    <span>✓ Helper Notified</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Notified at: {formatIncidentTime(selectedIncident.notified_at)}
                  </div>
                </div>
              ) : (
                <div>
                  <button 
                    onClick={() => handleNotifyHelper(selectedIncident.id)}
                    disabled={isNotifying}
                    className={`w-full py-3.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all
                      ${isNotifying ? 'bg-red-600/50 text-red-200 cursor-wait' : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20'}`}
                  >
                    {isNotifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Notifying Helper...</span>
                      </>
                    ) : (
                      <>
                        <Megaphone className="w-4 h-4" />
                        <span>📢 Notify Helper</span>
                      </>
                    )}
                  </button>

                  {notificationError && (
                    <div className="mt-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between text-xs text-red-400">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>⚠ {notificationError}</span>
                      </div>
                      <button 
                        onClick={() => handleNotifyHelper(selectedIncident.id)}
                        className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded font-semibold transition-colors flex-shrink-0"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
            <Activity className="w-12 h-12 mb-3 text-slate-700" />
            <p>Select an incident from the list to view details and coordinate response.</p>
          </div>
        )}
      </div>
    </div>
  );
}

