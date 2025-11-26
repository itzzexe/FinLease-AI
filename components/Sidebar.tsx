import React from 'react';
import { LayoutDashboard, FileText, Calculator, PieChart, Settings, Building2 } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leases', label: 'Lease Portfolio', icon: FileText },
    { id: 'accounting', label: 'Accounting Entries', icon: Calculator },
    { id: 'reports', label: 'Reports & Analytics', icon: PieChart },
    { id: 'admin', label: 'Entity Settings', icon: Building2 },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold">F</span>
          </div>
          FinLease AI
        </h1>
        <p className="text-xs text-slate-400 mt-1">Enterprise Edition</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={() => setActiveTab('admin')} 
          className={`w-full flex items-center gap-3 px-4 py-2 cursor-pointer rounded-lg transition-colors ${activeTab === 'admin' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <Settings size={20} />
          <span>System Config</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;