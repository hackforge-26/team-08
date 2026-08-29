import { Link } from 'react-router-dom';
import { ShieldAlert, Activity, Users, ArrowRight, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 overflow-auto flex flex-col">
      {/* Navbar */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-red-500" />
          <h1 className="text-2xl font-bold tracking-wider">ResQAI</h1>
        </div>
        <nav className="flex gap-6">
          <Link to="/report" className="text-slate-300 hover:text-white font-medium">Report Incident</Link>
          <Link to="/login" className="text-slate-300 hover:text-white font-medium">Operator Login</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-8">
          <Zap className="w-4 h-4" />
          <span className="text-sm font-semibold tracking-wide uppercase">Next-Gen Emergency Response</span>
        </div>
        
        <h2 className="text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          Intelligent <span className="text-red-500">Emergency</span> <br/>
          Intelligence & Coordination
        </h2>
        
        <p className="text-xl text-slate-400 mb-12 max-w-3xl leading-relaxed">
          ResQAI transforms fragmented citizen reports into prioritized, location-aware, 
          and actionable response tasks using AI-driven severity analysis and resource matching.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          <Link to="/report" className="group flex flex-col items-center p-8 bg-slate-900 border border-slate-800 hover:border-red-500/50 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/20">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Citizen Portal</h3>
            <p className="text-slate-400 text-sm mb-6">Report emergencies, hazards, and complaints with media and precise location.</p>
            <div className="mt-auto flex items-center gap-2 text-red-400 font-medium">
              Submit Report <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link to="/login" className="group flex flex-col items-center p-8 bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/20">
            <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Activity className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Command Center</h3>
            <p className="text-slate-400 text-sm mb-6">Live AI dashboard for operators to monitor incidents, dispatch teams, and coordinate.</p>
            <div className="mt-auto flex items-center gap-2 text-blue-400 font-medium">
              Operator Login <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
