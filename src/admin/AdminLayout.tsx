import React, { useState, useEffect } from 'react';
import { AdminUser, DashboardStats, Order } from '../types';
import { api, authStorage } from '../services/api';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { AdminOrders } from './AdminOrders';
import { AdminPlans } from './AdminPlans';
import { AdminProvisioning } from './AdminProvisioning';
import { AdminSettings } from './AdminSettings';
import {
  LayoutDashboard,
  ShoppingBag,
  Layers,
  RotateCcw,
  Settings,
  LogOut,
  Play,
  User,
  ShieldCheck,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';

interface AdminLayoutProps {
  onBackToSite: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onBackToSite }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'plans' | 'provisioning' | 'settings'>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Check auth token on mount
  useEffect(() => {
    const token = authStorage.getToken();
    if (!token) {
      setCheckingAuth(false);
      return;
    }

    api.adminMe()
      .then((user) => {
        setAdmin(user);
        loadDashboardStats();
      })
      .catch(() => {
        authStorage.clearToken();
        setAdmin(null);
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  }, []);

  const loadDashboardStats = async () => {
    try {
      const s = await api.getDashboardStats();
      setStats(s);
    } catch (e) {
      console.error('Error fetching dashboard stats:', e);
    }
  };

  const handleLogout = () => {
    api.adminLogout();
    setAdmin(null);
  };

  const handleSelectOrderFromDashboard = (order: Order) => {
    setSelectedOrderForDetail(order);
    setActiveTab('orders');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300">
        <div className="text-center space-y-2">
          <div className="h-6 w-6 border-2 border-emerald-400 border-t-transparent animate-spin rounded-full mx-auto" />
          <p className="text-xs">নিরাপত্তা যাচাই করা হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <AdminLogin
        onLoginSuccess={(user) => {
          setAdmin(user);
          loadDashboardStats();
        }}
      />
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'orders', label: 'অর্ডার ও পেমেন্ট', icon: ShoppingBag },
    { id: 'plans', label: 'প্ল্যানসমূহ', icon: Layers },
    { id: 'provisioning', label: 'অ্যাকাউন্ট তৈরি ইতিহাস', icon: RotateCcw },
    { id: 'settings', label: 'সিস্টেম সেটিংস', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-bold">
            V
          </span>
          <span className="font-bold text-sm text-white">VLE Admin Panel</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-lg text-slate-400 hover:text-white"
        >
          {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileSidebarOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-slate-900/90 border-r border-slate-800 p-5 flex flex-col justify-between shrink-0`}
      >
        <div className="space-y-6 text-left">
          {/* Brand Wordmark */}
          <div className="hidden md:flex items-center gap-2.5 px-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Play className="h-4 w-4 fill-emerald-400" />
            </span>
            <div>
              <div className="font-bold text-sm text-white tracking-wide">VLE Player</div>
              <div className="text-[10px] text-emerald-400 font-medium">অফিসিয়াল এডমিন প্যানেল</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-400 text-slate-950 shadow-sm shadow-emerald-950/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Admin profile & actions */}
        <div className="pt-6 border-t border-slate-800 space-y-3 text-left">
          <div className="flex items-center gap-2.5 px-2">
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
              <User className="h-4 w-4" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{admin.username}</div>
              <div className="text-[10px] text-slate-400 truncate">{admin.email}</div>
            </div>
          </div>

          <div className="space-y-1">
            <button
              onClick={onBackToSite}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>ওয়েবসাইট দেখুন</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>লগআউট</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <AdminDashboard
            stats={stats}
            onNavigateToOrders={() => setActiveTab('orders')}
            onSelectOrder={handleSelectOrderFromDashboard}
          />
        )}
        {activeTab === 'orders' && (
          <AdminOrders
            selectedOrderProp={selectedOrderForDetail}
            onClearSelectedOrderProp={() => setSelectedOrderForDetail(null)}
          />
        )}
        {activeTab === 'plans' && <AdminPlans />}
        {activeTab === 'provisioning' && <AdminProvisioning />}
        {activeTab === 'settings' && <AdminSettings />}
      </main>
    </div>
  );
};
