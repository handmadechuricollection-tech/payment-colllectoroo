import React, { useState } from 'react';
import { api } from '../services/api';
import { Order, AccountProvisioning } from '../types';
import {
  X,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

interface TrackOrderModalProps {
  onClose: () => void;
  onViewSuccess: (orderId: string) => void;
}

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({ onClose, onViewSuccess }) => {
  const [orderQuery, setOrderQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    order: Order;
    provisioning: AccountProvisioning | null;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [verifyTrxInput, setVerifyTrxInput] = useState('');
  const [verifyingSms, setVerifyingSms] = useState(false);
  const [verifySmsError, setVerifySmsError] = useState<string | null>(null);

  const handleVerifyInTrack = async () => {
    if (!result || !verifyTrxInput.trim()) return;
    setVerifyingSms(true);
    setVerifySmsError(null);
    try {
      const res = await api.verifyPaymentSms({
        order_id: result.order.id,
        trx_id: verifyTrxInput.trim().toUpperCase(),
      });
      if (res.success && res.verified) {
        onClose();
        onViewSuccess(result.order.id);
      } else {
        setVerifySmsError('আপনার ট্রানজেকশন আইডি এখনো প্রসেস হয়নি, ৩০ সেকেন্ড পর আবার চেষ্টা করুন বা সঠিক TrxID দিন।');
      }
    } catch (err: any) {
      setVerifySmsError(
        err.message ||
          'আপনার ট্রানজেকশন আইডি এখনো প্রসেস হয়নি, ৩০ সেকেন্ড পর আবার চেষ্টা করুন বা সঠিক TrxID দিন।'
      );
    } finally {
      setVerifyingSms(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderQuery.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await api.getOrder(orderQuery.trim());
      setResult({ order: data.order, provisioning: data.provisioning });
    } catch (err: any) {
      setError(err.message || 'অর্ডারটি খুঁজে পাওয়া যায়নি। অনুগ্রহ করে সঠিক Order ID দিন।');
    } finally {
      setLoading(false);
    }
  };

  const copyCreds = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 sm:p-7 text-left my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-1 mb-5">
          <h3 className="text-xl font-bold text-white tracking-tight">অর্ডার স্ট্যাটাস ট্র্যাক করুন</h3>
          <p className="text-xs text-slate-400">
            আপনার অর্ডার আইডি (যেমন: VLE-2026-XXXXX) লিখে সার্চ করুন।
          </p>
        </div>

        <form onSubmit={handleTrack} className="flex gap-2 mb-6">
          <input
            type="text"
            required
            value={orderQuery}
            onChange={(e) => setOrderQuery(e.target.value)}
            placeholder="VLE-2026-XXXXX"
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span>যাচাই</span>
          </button>
        </form>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[11px] text-slate-400 block">অর্ডার আইডি</span>
                <span className="text-xs font-mono font-bold text-white">{result.order.id}</span>
              </div>
              <div>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-md font-semibold ${
                    result.order.payment_status === 'paid'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : result.order.payment_status === 'failed'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {result.order.payment_status === 'paid'
                    ? 'পরিশোধিত'
                    : result.order.payment_status === 'failed'
                    ? 'ব্যর্থ'
                    : 'অপেক্ষারত'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <div>
                <span className="text-slate-500 block">প্ল্যান:</span>
                <span className="font-semibold text-white">{result.order.plan_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">মূল্য:</span>
                <span className="font-semibold text-emerald-400 tabular-nums">৳{result.order.amount_bdt}</span>
              </div>
              <div>
                <span className="text-slate-500 block">গ্রাহক:</span>
                <span>{result.order.customer_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">তারিখ:</span>
                <span>{new Date(result.order.created_at).toLocaleDateString('bn-BD')}</span>
              </div>
            </div>

            {/* If order is pending, allow direct TrxID verification */}
            {result.order.payment_status !== 'paid' && (
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>পেমেন্ট নিশ্চিত করতে TrxID দিন:</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={verifyTrxInput}
                    onChange={(e) => setVerifyTrxInput(e.target.value.toUpperCase())}
                    placeholder="যেমন: 9K8X7L2M1"
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    disabled={verifyingSms || !verifyTrxInput.trim()}
                    onClick={handleVerifyInTrack}
                    className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1"
                  >
                    {verifyingSms ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    <span>ভেরিফাই</span>
                  </button>
                </div>
                {verifySmsError && (
                  <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg">
                    {verifySmsError}
                  </div>
                )}
              </div>
            )}

            {/* If paid and account is created */}
            {result.order.payment_status === 'paid' && result.provisioning && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>অ্যাকাউন্ট প্রস্তুতকৃত ও সক্রিয়</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs flex justify-between items-center">
                  <div>
                    <span className="text-slate-400 block text-[10px]">ইউজারনেম:</span>
                    <span className="font-mono font-bold text-white">{result.provisioning.username}</span>
                  </div>
                  <button
                    onClick={() => copyCreds(result.provisioning!.username)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onViewSuccess(result.order.id);
                  }}
                  className="w-full mt-2 py-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 text-center flex items-center justify-center gap-1"
                >
                  <span>সম্পূর্ণ অ্যাক্সেস পেজ খুলুন</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
