import React from 'react';
import { LayoutDashboard, MapPin, Users, Mail, Settings, BrainCircuit, FileText, Target } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'campaigns', label: 'Campaigns', icon: Target },
  { id: 'lead-search', label: 'Lead Search', icon: MapPin },
  { id: 'leads', label: 'Leads Manager', icon: Users },
  { id: 'templates', label: 'Email Templates', icon: FileText },
  { id: 'outreach', label: 'Outreach', icon: Mail },
  { id: 'strategy', label: 'AI Strategist', icon: BrainCircuit },
  { id: 'settings', label: 'Settings', icon: Settings },
];
    { id: 'users', label: 'Users', icon: Users },

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  return (
    <div className="w-64 bg-slate-900 text-slate-100 h-screen flex flex-col fixed left-0 top-0 border-r border-slate-800">
      <div className="p-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span className="bg-blue-600 text-white p-1 rounded">LE</span>
          LocalLead Engine
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentPage === item.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-400 uppercase font-bold mb-1">Status</p>
          <div className="flex items-center gap-2 text-sm text-green-400">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            System Online
          </div>
        </div>
      </div>
    </div>
  );
};
