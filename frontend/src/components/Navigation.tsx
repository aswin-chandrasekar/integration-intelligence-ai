import React from 'react';
import { 
  LayoutDashboard, 
  Scan, 
  Network, 
  Database, 
  BrainCircuit, 
  Plus,
  Settings,
  HelpCircle,
  Bell,
  Search as SearchIcon,
  User
} from 'lucide-react';

export const TopNav: React.FC = () => {
  return (
    <header className="flex justify-between items-center px-8 h-16 w-full sticky top-0 z-50 bg-[#1c1917] border-b border-stone-800">
      <div className="flex items-center gap-12">
        <span className="text-xl font-black tracking-tighter text-white border-r border-stone-800 pr-8">
          Integration Intelligence AI
        </span>
        <nav className="hidden md:flex gap-8 items-center h-16">
          <a className="text-[#d97706] font-bold border-b-2 border-[#d97706] h-full flex items-center px-1" href="#">Dashboard</a>
        </nav>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center bg-stone-950 border border-stone-800 px-3 py-1.5 rounded-lg w-64 group focus-within:border-[#d97706] transition-all">
          <SearchIcon className="text-stone-500 w-4 h-4" />
          <input 
            className="bg-transparent border-none focus:ring-0 text-sm w-full px-2 placeholder:text-stone-600 text-stone-200" 
            placeholder="Search resources..." 
            type="text"
          />
        </div>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-stone-800 rounded-full transition-colors text-stone-400">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-stone-800 rounded-full transition-colors text-stone-400">
            <Settings className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-stone-800 rounded-full transition-colors text-stone-400">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-800 bg-stone-800 flex items-center justify-center">
          <User className="text-stone-400 w-5 h-5" />
        </div>
      </div>
    </header>
  );
};

interface SidebarProps {
  currentView: 'dashboard' | 'insights';
  onViewChange: (view: 'dashboard' | 'insights') => void;
  onSectionClick: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onSectionClick }) => {
  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-16 h-[calc(100vh-64px)] py-6 bg-[#0c0a09] w-72 border-r border-stone-800">
      <div className="px-8 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#d97706] rounded-xl flex items-center justify-center text-white">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[#d97706] font-black leading-none text-sm tracking-tight text-white">Enterprise Admin</p>
            <p className="text-[10px] text-stone-500 uppercase font-black tracking-widest mt-1">Standard Edition</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <NavItem 
          icon={<LayoutDashboard />} 
          label="Dashboard" 
          active={currentView === 'dashboard'} 
          onClick={() => onSectionClick('scan-section')}
        />
        <NavItem icon={<Network />} label="Graph View" onClick={() => onSectionClick('graph-section')} />
        <NavItem icon={<Database />} label="Integration Catalog" onClick={() => onSectionClick('catalog-section')} />
        <NavItem 
          icon={<BrainCircuit />} 
          label="AI Insights" 
          active={currentView === 'insights'}
          onClick={() => onViewChange('insights')}
        />
      </nav>

      <div className="mt-auto px-6">
        <button className="w-full flex items-center justify-center gap-2 bg-[#d97706] text-white py-3 rounded-xl font-bold text-sm hover:bg-amber-700 transition-all shadow-lg shadow-amber-900/20 active:scale-95">
          <Plus className="w-4 h-4" />
          New Integration
        </button>
      </div>
    </aside>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
      active 
        ? 'bg-[#1c1917] text-[#d97706] shadow-sm border border-stone-800 font-bold' 
        : 'text-stone-500 hover:bg-stone-900 font-medium'
    }`}
  >
    {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5' })}
    <span className="text-sm">{label}</span>
  </button>
);
