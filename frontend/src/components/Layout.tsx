import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { 
  BarChart3, 
  CreditCard, 
  FileText, 
  Settings as SettingsIcon, 
  Code2, 
  ChevronRight,
  ShieldCheck,
  Zap,
  RotateCcw
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

const SidebarLink = ({ to, icon: Icon, children }: { to: string, icon: any, children: React.ReactNode }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => cn(
      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors mb-1",
      isActive 
        ? "bg-primary text-primary-foreground shadow-sm" 
        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
    )}
  >
    <Icon size={18} />
    {children}
  </NavLink>
);

const Layout = () => {
  return (
    <div className="flex h-screen bg-[#fcfcfd]">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white flex flex-col">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
              <Zap size={20} fill="currentColor" />
            </div>
            <span>NovaPay</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 mt-2">
          <div className="mb-6">
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Main</h3>
            <SidebarLink to="/" icon={BarChart3}>Dashboard</SidebarLink>
            <SidebarLink to="/payments" icon={CreditCard}>Payments</SidebarLink>
            <SidebarLink to="/refunds" icon={RotateCcw}>Refunds</SidebarLink>
          </div>

          <div className="mb-6">
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Configure</h3>
            <SidebarLink to="/developers" icon={Code2}>Developers</SidebarLink>
            <SidebarLink to="/settings" icon={SettingsIcon}>Settings</SidebarLink>
          </div>
        </nav>

        <div className="p-4 border-t mt-auto">
          <div className="bg-secondary/50 rounded-lg p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
              DM
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">Demo Merchant</p>
              <p className="text-xs text-muted-foreground truncate">demo@novapay.io</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b bg-white flex items-center justify-between px-8">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 uppercase tracking-wide">
            <ShieldCheck size={14} />
            Test Mode
          </div>
          
          <div className="flex items-center gap-4">
            <button className="text-sm text-muted-foreground hover:text-foreground">Support</button>
            <div className="h-4 w-px bg-border mx-2" />
            <button className="text-sm font-medium">Docs</button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
