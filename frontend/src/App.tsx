import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Activity, Map as MapIcon, Users } from 'lucide-react';
import CommandCenter from './components/CommandCenter';
import LiveMap from './components/LiveMap';
import CitizenPortal from './components/CitizenPortal';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import CitizenDashboard from './components/CitizenDashboard';
import { useAuthStore } from './store/useAuthStore';

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { email, role, logout } = useAuthStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!email || role !== 'operator') {
      navigate('/login');
    }
  }, [email, role, navigate]);
  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-red-500" />
          <h1 className="text-xl font-bold tracking-wider">ResQAI</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800/50 text-blue-400 hover:bg-slate-800 transition-colors">
            <Activity className="w-5 h-5" />
            <span>Command Center</span>
          </Link>
          <Link to="/map" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
            <MapIcon className="w-5 h-5" />
            <span>Live Map</span>
          </Link>
          <Link to="/report" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
            <Users className="w-5 h-5" />
            <span>Citizen Portal</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative">
        <header className="h-16 border-b border-slate-800 flex items-center px-6 justify-between bg-slate-900/50 backdrop-blur-md">
          <h2 className="text-lg font-medium">System Dashboard</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 mr-2">{email}</span>
            <button onClick={() => { logout(); navigate('/'); }} className="text-sm text-red-400 hover:text-red-300 mr-4 transition-colors">Logout</button>
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm text-slate-400">System Online</span>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
        <Route path="/report" element={<CitizenPortal />} />
        
        {/* Operator Only Routes */}
        <Route path="/dashboard" element={<DashboardLayout><CommandCenter /></DashboardLayout>} />
        <Route path="/map" element={<DashboardLayout><LiveMap /></DashboardLayout>} />
      </Routes>
    </Router>
  );
}



export default App;
