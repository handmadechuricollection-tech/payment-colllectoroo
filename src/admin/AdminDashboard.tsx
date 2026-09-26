import React from 'react';
import { DashboardStats, Order } from '../types';
import {
  ShoppingBag,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  CircleDollarSign,
  Layers,
  UserCheck,
  UserX,
  ArrowRight,
} from 'lucide-react';

interface AdminDashboardProps {
  stats: DashboardStats | null;
  onNavigateToOrders: () => void;
  onSelectOrder: (order: Order) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  onNavigateToOrders,
  onSelectOrder,
}) => {
  if (!stats) {
    return (
      <div className="p-8 text-center text-slate-400">
        ড্যাশবোর্ড তথ্য লোড হচ্ছে...
      </div>
    );
  }

  const statCards = [
    {
      title: 'মোট Orders',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'আজকের Orders',
      value: stats.todayOrders,
      icon: Calendar,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
    },
    {
      title: 'Paid Orders',
      value: stats.paidOrders,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Failed Payments',
      value: stats.failedOrders,
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10 border-red-500/20',
    },
    {
      title: 'মোট Revenue',
      value: `৳${stats.totalRevenueBDT.toLocaleString('bn-BD')}`,
      icon: CircleDollarSign,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      isRevenue: true,
    },
    {
      title: 'Active Plans',
      value: stats.activePlans,
      icon: Layers,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
    },
    {
      title: 'Account Creation Success',
      value: stats.accountSuccess,
      icon: UserCheck,
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/10 border-teal-500/20',
    },
    {
      title: 'Account Creation Failed',
      value: stats.accountFailed,
      icon: UserX,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20',
    },
  ];

  return (
    <div className="space-y-8 text-left">
      {/* Page Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">ড্যাশবোর্ড ওভারভিউ</h2>
        <p className="text-xs text-slate-400">
          অর্ডার পরিসংখ্যান, মোট আয় এবং অ্যাকাউন্ট প্রোভিশনিং-এর সামগ্রিক চিত্র।
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex items-center justify-between shadow-sm hover:border-slate-700 transition-colors"
            >
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-1">{card.title}</span>
                <span className="text-2xl font-extrabold text-white tabular-nums tracking-tight">
                  {card.value}
                </span>
              </div>
              <div className={`p-3 rounded-xl border ${card.bgColor} ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">সাম্প্রতিক অর্ডারসমূহ</h3>
            <p className="text-xs text-slate-400">সর্বশেষ প্রাপ্ত অর্ডার ও পেমেন্ট স্ট্যাটাস</p>
          </div>
          <button
            onClick={onNavigateToOrders}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
          >
            <span>সব দেখুন</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">গ্রাহক</th>
                <th className="py-3 px-4">প্ল্যান</th>
                <th className="py-3 px-4">মূল্য</th>
                <th className="py-3 px-4">পেমেন্ট স্ট্যাটাস</th>
                <th className="py-3 px-4">তারিখ</th>
                <th className="py-3 px-4 text-right">একশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    এখনও কোনো অর্ডার পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">{o.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{o.customer_name}</div>
                      <div className="text-[11px] text-slate-400">{o.customer_contact}</div>
                    </td>
                    <td className="py-3 px-4">{o.plan_name}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-400 tabular-nums">৳{o.amount_bdt}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          o.payment_status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : o.payment_status === 'failed'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {o.payment_status === 'paid'
                          ? 'পরিশোধিত'
                          : o.payment_status === 'failed'
                          ? 'ব্যর্থ'
                          : 'অপেক্ষারত'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(o.created_at).toLocaleTimeString('bn-BD', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectOrder(o)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-medium text-[11px]"
                      >
                        বিস্তারিত
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
