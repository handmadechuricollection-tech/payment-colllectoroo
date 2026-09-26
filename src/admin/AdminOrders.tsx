import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { api } from '../services/api';
import {
  Search,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Plus,
  Loader2,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface AdminOrdersProps {
  selectedOrderProp?: Order | null;
  onClearSelectedOrderProp?: () => void;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({
  selectedOrderProp,
  onClearSelectedOrderProp,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Selected Order for Detail Modal
  const [detailOrder, setDetailOrder] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let startDate: string | undefined;
      let endDate: string | undefined;

      const now = new Date();
      if (dateFilter === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      } else if (dateFilter === 'yesterday') {
        const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        startDate = new Date(y.getFullYear(), y.getMonth(), y.getDate()).toISOString();
        endDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59).toISOString();
      } else if (dateFilter === '7days') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (dateFilter === '30days') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (dateFilter === 'custom' && customStart) {
        startDate = new Date(customStart).toISOString();
        if (customEnd) endDate = new Date(customEnd + 'T23:59:59').toISOString();
      }

      const res = await api.getAdminOrders({
        status: statusFilter,
        search,
        startDate,
        endDate,
        page,
        limit: 12,
      });

      setOrders(res.orders);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, dateFilter, customStart, customEnd]);

  useEffect(() => {
    if (selectedOrderProp) {
      openOrderDetails(selectedOrderProp.id);
    }
  }, [selectedOrderProp]);

  const openOrderDetails = async (orderId: string) => {
    setDetailLoading(true);
    try {
      const res = await api.getAdminOrderDetails(orderId);
      setDetailOrder(res);
    } catch (err: any) {
      alert(err.message || 'অর্ডার বিবরণ লোড করা যায়নি');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !detailOrder) return;
    setAddingNote(true);
    try {
      await api.addAdminNote(detailOrder.order.id, newNote.trim());
      setNewNote('');
      // Refresh details
      const refreshed = await api.getAdminOrderDetails(detailOrder.order.id);
      setDetailOrder(refreshed);
    } catch (err: any) {
      alert(err.message || 'নোট যোগ করা যায়নি');
    } finally {
      setAddingNote(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            অর্ডার ও পেমেন্ট হিস্ট্রি
          </h2>
          <p className="text-xs text-slate-400">
            মোট অর্ডার: <span className="font-semibold text-emerald-400 tabular-nums">{total}</span> টি
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search box */}
          <form onSubmit={handleSearchSubmit} className="md:col-span-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Order ID, নাম, মোবাইল বা Payment ID..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
            >
              খুঁজুন
            </button>
          </form>

          {/* Status filter tabs */}
          <div className="md:col-span-4 flex items-center gap-1 overflow-x-auto p-1 bg-slate-950 rounded-xl border border-slate-800">
            {[
              { id: 'all', label: 'সকল' },
              { id: 'paid', label: 'পরিশোধিত' },
              { id: 'pending', label: 'পেন্ডিং' },
              { id: 'failed', label: 'ব্যর্থ' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Date range filter */}
          <div className="md:col-span-4 flex items-center gap-2">
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">সব সময়</option>
              <option value="today">আজকের অর্ডার</option>
              <option value="yesterday">গতকাল</option>
              <option value="7days">গত ৭ দিন</option>
              <option value="30days">গত ৩০ দিন</option>
              <option value="custom">কাস্টম তারিখ</option>
            </select>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {dateFilter === 'custom' && (
          <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400">তারিখ শুরু:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-white"
            />
            <span className="text-slate-400">শেষ:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-white"
            />
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 font-semibold text-[11px] uppercase">
              <tr>
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">গ্রাহক</th>
                <th className="py-3.5 px-4">প্ল্যান</th>
                <th className="py-3.5 px-4">মূল্য</th>
                <th className="py-3.5 px-4">পেমেন্ট স্ট্যাটাস</th>
                <th className="py-3.5 px-4">পেমেন্ট মেথড</th>
                <th className="py-3.5 px-4">তারিখ</th>
                <th className="py-3.5 px-4 text-right">একশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    <span>লোড হচ্ছে...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    কোনো অর্ডার পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">{o.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{o.customer_name}</div>
                      <div className="text-[11px] text-slate-400">{o.customer_contact}</div>
                      {o.preferred_username && (
                        <div className="text-[10px] text-emerald-400 font-mono">
                          @{o.preferred_username}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-200">{o.plan_name}</span>
                      <span className="text-[10px] text-slate-400 block">{o.duration_days} দিন</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400 tabular-nums">
                      ৳{o.amount_bdt}
                    </td>
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4 text-slate-300">
                      {o.payment_method || '—'}
                      {o.payment_id && (
                        <span className="text-[10px] text-slate-500 block font-mono">
                          {o.payment_id}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(o.created_at).toLocaleDateString('bn-BD', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      <span className="block text-[10px] text-slate-500">
                        {new Date(o.created_at).toLocaleTimeString('bn-BD', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openOrderDetails(o.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors inline-flex items-center gap-1 text-[11px] font-medium"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>বিস্তারিত</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            পৃষ্ঠা <span className="font-semibold text-white">{page}</span> / {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Order Details Drawer / Modal */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 sm:p-8 text-left my-8 space-y-6">
            <button
              onClick={() => {
                setDetailOrder(null);
                if (onClearSelectedOrderProp) onClearSelectedOrderProp();
              }}
              className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="border-b border-slate-800 pb-4">
              <div className="text-xs font-semibold text-emerald-400">অর্ডার বিস্তারিত তথ্য</div>
              <h3 className="text-xl font-bold text-white font-mono">{detailOrder.order.id}</h3>
              <div className="text-xs text-slate-400">
                অভ্যন্তরীণ UUID: <span className="font-mono">{detailOrder.order.order_uuid}</span>
              </div>
            </div>

            {/* Two column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1.5">
                <div className="font-bold text-white mb-1">গ্রাহকের তথ্য</div>
                <div><span className="text-slate-400">নাম:</span> {detailOrder.order.customer_name}</div>
                <div><span className="text-slate-400">যোগাযোগ:</span> {detailOrder.order.customer_contact}</div>
                <div>
                  <span className="text-slate-400">পছন্দের ইউজারনেম:</span>{' '}
                  {detailOrder.order.preferred_username || '—'}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1.5">
                <div className="font-bold text-white mb-1">প্যাকেজ ও পেমেন্ট</div>
                <div><span className="text-slate-400">প্ল্যান:</span> {detailOrder.order.plan_name}</div>
                <div>
                  <span className="text-slate-400">মূল্য:</span>{' '}
                  <span className="font-bold text-emerald-400 tabular-nums">
                    ৳{detailOrder.order.amount_bdt} BDT
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">পেমেন্ট মেথড:</span>{' '}
                  {detailOrder.order.payment_method || '—'}
                </div>
                <div>
                  <span className="text-slate-400">পেমেন্ট ট্রানজ্যাকশন ID:</span>{' '}
                  <span className="font-mono text-slate-200">
                    {detailOrder.order.payment_id || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* VLE Account Provisioning Status */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2 text-xs">
              <div className="font-bold text-white flex items-center justify-between">
                <span>VLE একাউন্ট প্রোভিশনিং স্ট্যাটাস</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    detailOrder.provisioning?.account_status === 'account_created'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : detailOrder.provisioning?.account_status === 'account_failed'
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}
                >
                  {detailOrder.provisioning?.account_status || 'account_pending'}
                </span>
              </div>

              {detailOrder.provisioning ? (
                <div className="space-y-1 text-slate-300">
                  <div>
                    <span className="text-slate-400">জেনারেটেড ইউজারনেম:</span>{' '}
                    <span className="font-mono font-bold text-emerald-400">
                      {detailOrder.provisioning.username}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">পাসওয়ার্ড:</span>{' '}
                    <span className="font-mono font-bold text-slate-200">
                      {detailOrder.provisioning.password_preview || '••••••••'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">মেয়াদ শেষ:</span>{' '}
                    {detailOrder.provisioning.subscription_end
                      ? new Date(detailOrder.provisioning.subscription_end).toLocaleDateString('bn-BD')
                      : '—'}
                  </div>
                </div>
              ) : (
                <div className="text-slate-500">পেমেন্ট সম্পন্ন হলে একাউন্ট প্রোভিশনিং সক্রিয় হবে।</div>
              )}
            </div>

            {/* Internal Admin Notes */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-emerald-400" />
                <span>অভ্যন্তরীণ এডমিন নোট</span>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {detailOrder.notes.length === 0 ? (
                  <div className="text-xs text-slate-500 italic">কোনো এডমিন নোট যুক্ত করা হয়নি।</div>
                ) : (
                  detailOrder.notes.map((n: any) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                    >
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-semibold text-slate-300">{n.admin_username}</span>
                        <span>{new Date(n.created_at).toLocaleString('bn-BD')}</span>
                      </div>
                      <div className="text-slate-200">{n.note}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="অর্ডার সম্পর্কে অভ্যন্তরীণ নোট লিখুন..."
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={addingNote || !newNote.trim()}
                  className="px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>নোট সেভ</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
