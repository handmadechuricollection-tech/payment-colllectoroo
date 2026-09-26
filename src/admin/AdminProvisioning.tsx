import React, { useState, useEffect } from 'react';
import { AccountProvisioning } from '../types';
import { api } from '../services/api';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
  User,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const AdminProvisioning: React.FC = () => {
  const [provisionings, setProvisionings] = useState<AccountProvisioning[]>([]);
  const [loading, setLoading] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminProvisionings();
      setProvisionings(data);
    } catch (err) {
      console.error('Fetch provisioning error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRetry = async (item: AccountProvisioning) => {
    setRetryingId(item.id);
    setAlertMsg(null);
    try {
      const res = await api.retryProvisioning(item.id);
      setAlertMsg({ text: res.result.message || 'রিট্রাই সফল হয়েছে।' });
      fetchHistory();
    } catch (err: any) {
      setAlertMsg({ text: err.message || 'রিট্রাই ব্যর্থ হয়েছে।', isError: true });
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            অ্যাকাউন্ট তৈরি ইতিহাস (VLE Provisioning)
          </h2>
          <p className="text-xs text-slate-400">
            স্বয়ংক্রিয় VLE অ্যাকাউন্ট জেনারেশন ও এক্সটার্নাল এপিআই রিট্রাই ড্যাশবোর্ড।
          </p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>রিফ্রেশ</span>
        </button>
      </div>

      {/* Alert */}
      {alertMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            alertMsg.isError
              ? 'border-red-500/30 bg-red-500/10 text-red-300'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          }`}
        >
          {alertMsg.isError ? (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Provisionings Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 font-semibold text-[11px] uppercase">
              <tr>
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">ইউজারনেম</th>
                <th className="py-3.5 px-4">প্ল্যান</th>
                <th className="py-3.5 px-4">অ্যাকাউন্ট স্ট্যাটাস</th>
                <th className="py-3.5 px-4">তৈরির সময়</th>
                <th className="py-3.5 px-4">রিট্রাই কাউন্ট</th>
                <th className="py-3.5 px-4 text-right">একশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    <span>লোড হচ্ছে...</span>
                  </td>
                </tr>
              ) : provisionings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    এখনও কোনো অ্যাকাউন্ট তৈরি করা হয়নি।
                  </td>
                </tr>
              ) : (
                provisionings.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {item.order_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-semibold text-emerald-400">
                          {item.username}
                        </div>
                        <div className="text-[10px] text-slate-400">{item.customer_name}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-200">{item.plan_name}</span>
                        <span className="text-[10px] text-slate-500 block">
                          {item.duration_days} দিন
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            item.account_status === 'account_created'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : item.account_status === 'account_failed'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {item.account_status === 'account_created'
                            ? 'সফল (Created)'
                            : item.account_status === 'account_failed'
                            ? 'ব্যর্থ (Failed)'
                            : 'প্রস্তুত হচ্ছে (Creating)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {new Date(item.created_at).toLocaleDateString('bn-BD', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono">
                        {item.retry_count || 0} বার
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              setExpandedId(expandedId === item.id ? null : item.id)
                            }
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="লগ দেখুন"
                          >
                            {expandedId === item.id ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleRetry(item)}
                            disabled={retryingId === item.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium text-[11px] flex items-center gap-1 transition-colors disabled:opacity-50"
                          >
                            {retryingId === item.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3.5 w-3.5" />
                            )}
                            <span>রিট্রাই</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable VLE Response Log Box */}
                    {expandedId === item.id && (
                      <tr className="bg-slate-950/80">
                        <td colSpan={7} className="p-4 border-t border-slate-800/80 text-xs">
                          <div className="space-y-2">
                            <div className="font-semibold text-slate-300">
                              VLE API রেসপন্স ও ক্রেডেনশিয়াল বিস্তারিত:
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                                <div><span className="text-slate-500">ইউজারনেম:</span> {item.username}</div>
                                <div><span className="text-slate-500">পাসওয়ার্ড:</span> {item.password_preview || '••••••••'}</div>
                                <div>
                                  <span className="text-slate-500">মেয়াদ শুরু:</span>{' '}
                                  {item.subscription_start ? new Date(item.subscription_start).toLocaleString('bn-BD') : '—'}
                                </div>
                                <div>
                                  <span className="text-slate-500">মেয়াদ শেষ:</span>{' '}
                                  {item.subscription_end ? new Date(item.subscription_end).toLocaleString('bn-BD') : '—'}
                                </div>
                              </div>
                              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 overflow-x-auto">
                                <div className="text-[10px] text-slate-500 mb-1 font-mono">VLE Response JSON:</div>
                                <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap">
                                  {JSON.stringify(item.vle_response, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
