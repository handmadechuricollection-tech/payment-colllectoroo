import React, { useState } from 'react';
import { Order } from '../types';
import { api } from '../services/api';
import { ShieldCheck, Loader2, AlertCircle, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';

interface PaymentSimulatorModalProps {
  order: Order;
  paymentSession: {
    payment_id: string;
    amount: number;
    currency: string;
    gateway_type: string;
  };
  onClose: () => void;
  onPaymentSuccess: (orderId: string) => void;
  onPaymentFailed: (errorMsg: string) => void;
}

export const PaymentSimulatorModal: React.FC<PaymentSimulatorModalProps> = ({
  order,
  paymentSession,
  onClose,
  onPaymentSuccess,
  onPaymentFailed,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'card'>('bkash');
  const [accountNumber, setAccountNumber] = useState('01700-000000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSimulatePayment = async (action: 'success' | 'failed') => {
    setLoading(true);
    setError(null);

    try {
      const methodName =
        selectedMethod === 'bkash'
          ? 'bKash (Sandbox)'
          : selectedMethod === 'nagad'
          ? 'Nagad (Sandbox)'
          : selectedMethod === 'rocket'
          ? 'Rocket (Sandbox)'
          : 'Visa/MasterCard (Sandbox)';

      // Dispatches request to trigger server-side HMAC signed webhook verification!
      const res: any = await api.simulateSandboxCallback({
        order_id: order.id,
        payment_id: paymentSession.payment_id,
        action,
        payment_method: methodName,
      });

      if (action === 'success') {
        // Poll status to ensure order is marked PAID by server
        const statusRes = await api.getPaymentStatus(order.id);
        if (statusRes.payment_status === 'paid') {
          onPaymentSuccess(order.id);
        } else {
          // Retry poll once
          setTimeout(async () => {
            const finalCheck = await api.getPaymentStatus(order.id);
            if (finalCheck.payment_status === 'paid') {
              onPaymentSuccess(order.id);
            } else {
              setError('পেমেন্ট সার্ভারে যাচাইকরণ প্রক্রিয়ায় রয়েছে।');
            }
          }, 1000);
        }
      } else {
        onPaymentFailed('পেমেন্ট বাতিল বা ব্যর্থ হয়েছে। আপনি পুনরায় চেষ্টা করতে পারেন।');
      }
    } catch (err: any) {
      console.error('Payment simulator callback error:', err);
      setError(err.message || 'পেমেন্ট গেটওয়ে যাচাইয়ে ত্রুটি হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 sm:p-7 text-left my-8">
        {/* Top Sandbox Notice */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              নিরাপদ পেমেন্ট গেটওয়ে পোর্টাল
            </span>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>ফিরে যান</span>
          </button>
        </div>

        {/* Amount & Order Header */}
        <div className="text-center py-5 border-b border-slate-800/80">
          <span className="text-xs text-slate-400 block mb-1">মোট প্রদেয় অর্থ</span>
          <div className="text-3xl font-extrabold text-white tabular-nums tracking-tight">
            ৳{paymentSession.amount} <span className="text-xs font-normal text-slate-400">BDT</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            অর্ডার নং: <span className="font-mono text-slate-200">{order.id}</span>
          </div>
          <div className="text-xs text-slate-400">গ্রাহক: {order.customer_name}</div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Payment Methods Tabs */}
        <div className="mt-5 space-y-4">
          <span className="text-xs font-semibold text-slate-300 block">পেমেন্ট মাধ্যম বেছে নিন:</span>
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setSelectedMethod('bkash')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                selectedMethod === 'bkash'
                  ? 'border-pink-500 bg-pink-500/10 text-pink-400 shadow-sm'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="font-bold">বিকাশ</span>
              <span className="text-[10px] opacity-80">bKash</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('nagad')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                selectedMethod === 'nagad'
                  ? 'border-orange-500 bg-orange-500/10 text-orange-400 shadow-sm'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="font-bold">নগদ</span>
              <span className="text-[10px] opacity-80">Nagad</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('rocket')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                selectedMethod === 'rocket'
                  ? 'border-purple-500 bg-purple-500/10 text-purple-400 shadow-sm'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="font-bold">রকেট</span>
              <span className="text-[10px] opacity-80">Rocket</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('card')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                selectedMethod === 'card'
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-sm'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="font-bold">কার্ড</span>
              <span className="text-[10px] opacity-80">Card</span>
            </button>
          </div>

          {/* Account number / simulation field */}
          <div className="pt-2">
            <label className="block text-xs text-slate-400 mb-1">
              {selectedMethod === 'card' ? 'কার্ড নম্বর' : `${selectedMethod.toUpperCase()} একাউন্ট নম্বর`}
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Technical Note on Webhook Architecture */}
          <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-2.5 text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>সার্ভার-সাইড Webhook এনক্রিপশন ও ভেরিফিকেশন</span>
            </div>
            <div>
              পেমেন্ট নিশ্চিত করলে গেটওয়ে সরাসরি আমাদের ব্যাকএন্ড Webhook-এ HMAC-SHA256 সিগনেচার পাঠাবে। সার্ভার কর্তৃক ভেরিফাই হলে স্বয়ংক্রিয়ভাবে অ্যাকাউন্ট ডেলিভারি হবে।
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 space-y-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSimulatePayment('success')}
              className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>পেমেন্ট ও Webhook যাচাই করা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>পেমেন্ট নিশ্চিত করুন (৳{paymentSession.amount})</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleSimulatePayment('failed')}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1.5"
            >
              <XCircle className="h-4 w-4" />
              <span>পেমেন্ট বাতিল বা ব্যর্থ টেস্ট করুন</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
