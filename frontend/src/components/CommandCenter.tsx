import React, { useState } from 'react';
import { Activity, ShieldAlert, Zap, Clock, Users, MapPin, CheckCircle } from 'lucide-react';
import LiveMap from './LiveMap';

export default function CommandCenter() {
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await fetch('http://localhost:8000/incidents');
        const data = await res.json();
        setIncidents(data);
      } catch (err) {
        console.error("Failed to fetch incidents", err);
      }
    };
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full grid grid-cols-12 gap-6">
      {/* Active Incidents List */}
      <div className="col-span-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/30">
          <h3 className="font-semibold text-slate-200">Active Incidents</h3>
          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">3 Critical</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {incidents.map((incident) => (
            <div 
              key={incident.id}
              onClick={() => setSelectedIncident(incident)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedIncident?.id === incident.id ? 'bg-slate-800 border-blue-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono text-slate-400">{incident.id}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${incident.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : incident.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' : incident.severity === 'LOW' ? 'bg-purple-500/20 text-purple-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {incident.severity}
                </span>
              </div>
              <h4 className="font-medium text-slate-200 text-sm mb-1">{incident.type}</h4>
              <div className="flex items-center text-xs text-slate-500 gap-1">
                <Clock className="w-3 h-3" /> {incident.time}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Map Area */}
      <div className="col-span-6 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 relative">
        <LiveMap />
        
        {/* RAG Assistant Overlay mockup */}
        <div className="absolute bottom-4 left-4 right-4 bg-slate-950/90 backdrop-blur border border-slate-800 rounded-lg p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <h4 className="font-semibold text-sm text-slate-200">AI Protocol Assistant</h4>
            </div>
            <span className="text-xs text-slate-500">Ask a question...</span>
          </div>
          <div className="h-10 bg-slate-900 border border-slate-700 rounded-md px-3 flex items-center text-slate-400 text-sm">
            "What is the recommended response protocol for a chemical spill?"
          </div>
        </div>
      </div>

      {/* Incident Details & Dispatch */}
      <div className="col-span-3 bg-slate-900 border border-slate-800 rounded-xl overflow-y-auto">
        {selectedIncident ? (
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className={`w-6 h-6 ${selectedIncident.severity === 'CRITICAL' ? 'text-red-500' : 'text-orange-500'}`} />
              <h2 className="text-xl font-bold text-slate-100">{selectedIncident.type}</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</label>
                <div className="flex items-center gap-2 text-sm text-slate-300 mt-1">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  {selectedIncident.location.lat.toFixed(4)}, {selectedIncident.location.lng.toFixed(4)}
                </div>
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
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Intelligence</label>
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

              <div className="pt-4 border-t border-slate-800">
                <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors">
                  <Zap className="w-4 h-4" />
                  Confirm & Dispatch All
                </button>
              </div>
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
