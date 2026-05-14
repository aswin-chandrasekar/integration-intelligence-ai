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
  User,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface TopNavProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ theme, toggleTheme }) => {
  return (
    <header className="flex justify-between items-center px-8 h-16 w-full sticky top-0 z-50 bg-app-surface border-b border-app-border transition-colors">
      <div className="flex items-center gap-12">
        <span className="text-xl font-black tracking-tighter text-app-text border-r border-app-border pr-8">
          Integration Intelligence AI
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center bg-app-bg border border-app-border px-3 py-1.5 rounded-lg w-64 group focus-within:border-app-brand transition-all">
          <SearchIcon className="text-app-text-muted w-4 h-4" />
          <input 
            className="bg-transparent border-none focus:ring-0 text-sm w-full px-2 placeholder:text-app-text-muted/60 text-app-text outline-none" 
            placeholder="Search resources..." 
            type="text"
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={toggleTheme}
            className="p-2 hover:bg-app-surface-hover rounded-full transition-colors text-app-text-muted"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button className="p-2 hover:bg-app-surface-hover rounded-full transition-colors text-app-text-muted">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-app-surface-hover rounded-full transition-colors text-app-text-muted">
            <Settings className="w-5 h-5" />
          </button>
        </div>
        <div className="w-9 h-9 rounded-full overflow-hidden border border-app-border bg-app-surface-hover flex items-center justify-center">
          <User className="text-app-text-muted w-5 h-5" />
        </div>
      </div>
    </header>
  );
};

interface SidebarProps {
  currentView: 'dashboard' | 'insights' | 'help';
  activeSection: string;
  onViewChange: (view: 'dashboard' | 'insights' | 'help') => void;
  onSectionClick: (id: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  activeSection, 
  onViewChange, 
  onSectionClick,
  isCollapsed,
  setIsCollapsed
}) => {
  return (
    <aside className={`hidden lg:flex flex-col fixed left-0 top-16 h-[calc(100vh-64px)] py-6 bg-app-bg border-r border-app-border transition-all duration-300 overflow-x-hidden z-40 ${isCollapsed ? 'w-20' : 'w-72'}`}>
      <div className={`mb-10 flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-6'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 min-w-[36px] bg-app-brand rounded-xl flex items-center justify-center text-white">
            <Database className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <p className="font-black leading-none text-sm tracking-tight text-app-text truncate">Enterprise Admin</p>
              <p className="text-[10px] text-app-text-muted uppercase font-black tracking-widest mt-1 truncate">Standard Edition</p>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <button 
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-lg bg-app-surface hover:bg-app-surface-hover border border-app-border text-app-text-muted hover:text-app-brand cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {isCollapsed && (
        <div className="flex justify-center mb-6">
          <button 
            onClick={() => setIsCollapsed(false)}
            className="p-1.5 rounded-lg bg-app-surface hover:bg-app-surface-hover border border-app-border text-app-text-muted hover:text-app-brand cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <nav className={`flex-1 space-y-1 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        <NavItem 
          icon={<LayoutDashboard />} 
          label="Dashboard" 
          active={currentView === 'dashboard' && activeSection === 'scan-section'} 
          onClick={() => onSectionClick('scan-section')}
          isCollapsed={isCollapsed}
        />
        <NavItem 
          icon={<Network />} 
          label="Graph View" 
          active={currentView === 'dashboard' && activeSection === 'graph-section'}
          onClick={() => onSectionClick('graph-section')} 
          isCollapsed={isCollapsed}
        />
        <NavItem 
          icon={<Database />} 
          label="Integration Catalog" 
          active={currentView === 'dashboard' && activeSection === 'catalog-section'}
          onClick={() => onSectionClick('catalog-section')} 
          isCollapsed={isCollapsed}
        />
        <NavItem 
          icon={<BrainCircuit />} 
          label="AI Insights" 
          active={currentView === 'insights'}
          onClick={() => onViewChange('insights')}
          isCollapsed={isCollapsed}
        />
        <NavItem 
          icon={<HelpCircle />} 
          label="Help Centre" 
          active={currentView === 'help'}
          onClick={() => onViewChange('help')}
          isCollapsed={isCollapsed}
        />
      </nav>

      <div className={`mt-auto ${isCollapsed ? 'px-2' : 'px-4'}`}>
        <button className={`w-full flex items-center justify-center bg-app-brand text-white rounded-xl font-bold text-sm hover:bg-app-brand-hover transition-all shadow-lg shadow-app-brand/20 active:scale-95 cursor-pointer ${isCollapsed ? 'p-3' : 'py-3 px-4 gap-2'}`}>
          <Plus className="w-4 h-4 min-w-[16px]" />
          {!isCollapsed && <span>New Integration</span>}
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
  isCollapsed?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick, isCollapsed }) => (
  <button 
    onClick={onClick}
    title={isCollapsed ? label : undefined}
    className={`w-full flex items-center transition-all text-left cursor-pointer overflow-hidden ${isCollapsed ? 'justify-center p-3 rounded-xl' : 'gap-3 px-4 py-3 rounded-lg'} ${
      active 
        ? 'bg-app-surface text-app-brand shadow-sm border border-app-border font-bold' 
        : 'text-app-text-muted hover:bg-app-surface-hover border border-transparent font-medium'
    }`}
  >
    {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5 min-w-[20px]' })}
    {!isCollapsed && <span className="text-sm truncate">{label}</span>}
  </button>
);
