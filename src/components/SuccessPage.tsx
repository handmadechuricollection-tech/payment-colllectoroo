import React, { useEffect, useState, useRef } from 'react';
import { Order, AccountProvisioning } from '../types';
import { api } from '../services/api';
import {
  CheckCircle2,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Clock,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface SuccessPageProps {
  orderId: string;
  onBackToHome: () => void;
}

export const SuccessPage: React.FC<SuccessPageProps> = ({ orderId, onBackToHome }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [provisioning, setProvisioning] = useState<AccountProvisioning | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vleLoginUrl, setVleLoginUrl] = useState('https://vleplayer.com/login');

  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const pollIntervalRef = useRef<any>(null);

  const fetchOrderData = async () => {
    try {
      const data = await api.getOrder(orderId);
      setOrder(data.order);
      setProvisioning(data.provisioning);
      return data;
    } catch (err: any) {
      console.error('Fetch order error:', err);
      setError(err.message || 'অর্ডারের তথ্য লোড করা যায়নি');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load public settings for VLE Login URL
    api.getPublicSettings().then((settings) => {
      if (settings.vle_player_url) {
        setVleLoginUrl(settings.vle_player_url);
      }
    }).catch(() => {});

    // Initial fetch
    fetchOrderData();

    // Start polling if provisioning is still pending or creating
    pollIntervalRef.current = setInterval(async () => {
      const data = await fetchOrderData();
      if (
        data?.provisioning &&
        (data.provisioning.account_status === 'account_created' ||
          data.provisioning.account_status === 'account_failed')
      ) {
        clearInterval(pollIntervalRef.current);
      }
    }, 2000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [orderId]);

  const copyToClipboard = (text: string, type: 'user' | 'pass') => {
    navigator.clipboard.writeText(text);
    if (type === 'user') {
      setCopiedUser(true);
      setTimeout(() => setCopiedUser(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-left">
      {/* Back button */}
      <button
        onClick={onBackToHome}
        className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>মূল পাতায় ফিরে যান</span>
      </button>

      {/* Main Success Container */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 sm:p-10 space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-2 border-b border-slate-800 pb-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            পেমেন্ট সফল হয়েছে! 🎉
          </h1>
          <p className="text-sm text-emerald-400 font-medium">
            আপনার পেমেন্ট সফলভাবে যাচাই করা হয়েছে।
          </p>
          <div className="text-xs text-slate-400">
            অর্ডার নং: <span className="font-mono text-slate-200">{orderId}</span>
          </div>
        </div>

        {/* Loading state while checking */}
        {loading && (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mx-auto" />
            <p className="text-sm text-slate-300">অর্ডার ভেরিফিকেশন তথ্য যাচাই করা হচ্ছে...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
            <div>
              <div className="font-semibold">ত্রুটি ঘটেছে</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* Account Provisioning Lifecycle States */}
        {!loading && order && (
          <div className="space-y-6">
            {/* 1. Account Creating Loading UI */}
            {(!provisioning ||
              provisioning.account_status === 'account_pending' ||
              provisioning.account_status === 'account_creating') && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-6 text-center space-y-4">
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
                    <ShieldCheck className="h-4 w-4 text-emerald-300 absolute inset-0 m-auto" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">আপনার অ্যাকাউন্ট প্রস্তুত করা হচ্ছে...</h3>
                  <p className="text-xs text-slate-300">
                    দয়া করে কিছুক্ষণ অপেক্ষা করুন। আমাদের সুরক্ষিত অটোমেশন সিস্টেম আপনার সাবস্ক্রিপশন প্রস্তুত করছে।
                  </p>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  <span>সাধারণত ৫ থেকে ১৫ সেকেন্ড সময় লাগে</span>
                </div>
              </div>
            )}

            {/* 2. Account Created Success Card with Credentials */}
            {provisioning && provisioning.account_status === 'account_created' && (
              <div className="space-y-6">
                <div className="rounded-xl border border-emerald-500/40 bg-slate-950 p-6 space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      <h3 className="text-base font-bold text-white">
                        আপনার VLE Player অ্যাকাউন্ট তৈরি হয়েছে
                      </h3>
                    </div>
                    <span className="text-xs text-emerald-400 font-semibold px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                      সক্রিয়
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    নিচের ক্রেডেনশিয়াল ব্যবহার করে VLE Player-এ সরাসরি লগইন করুন। এই তথ্যটি আপনার ব্যক্তিগত ব্রাউজারে সুরক্ষিত রাখুন।
                  </p>

                  {/* Credentials Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Username */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        ইউজারনেম (Username)
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm sm:text-base font-mono font-bold text-white tracking-wide">
                          {provisioning.username}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(provisioning.username, 'user')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="কপি করুন"
                        >
                          {copiedUser ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Password */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        পাসওয়ার্ড (Password)
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm sm:text-base font-mono font-bold text-white tracking-wide">
                          {showPassword
                            ? provisioning.password || (provisioning as any).password_preview
                            : '••••••••••••'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(
                                provisioning.password || (provisioning as any).password_preview || '',
                                'pass'
                              )
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="কপি করুন"
                          >
                            {copiedPass ? (
                              <Check className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  {provisioning.subscription_end && (
                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span>সাবস্ক্রিপশন মেয়াদ: {order.duration_days} দিন</span>
                      <span>
                        মেয়াদ শেষ: {new Date(provisioning.subscription_end).toLocaleDateString('bn-BD')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Primary VLE Login Action Button */}
                <div className="pt-2">
                  <a
                    href={vleLoginUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 px-6 rounded-xl text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/50"
                  >
                    <span>VLE Player-এ লগইন করুন</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <p className="text-[11px] text-center text-slate-500 mt-2">
                    * নিরাপত্তার স্বার্থে ইউজারনেম এবং পাসওয়ার্ড কোনো URL প্যারামিটারে পাঠানো হয় না।
                  </p>
                </div>
              </div>
            )}

            {/* 3. Account Failed State */}
            {provisioning && provisioning.account_status === 'account_failed' && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">
                      পেমেন্ট সফল হয়েছে। আপনার অ্যাকাউন্ট প্রস্তুত করা হচ্ছে।
                    </h4>
                    <p className="text-xs text-amber-200/90 leading-relaxed">
                      ভিএলই প্লেয়ারের সাথে সংযোগ স্থাপনে সাময়িক বিলম্ব হচ্ছে। আমাদের সিস্টেম স্বয়ংক্রিয়ভাবে পুনরায় চেষ্টা করছে।
                      আপনার অর্ডার নম্বরটি সংরক্ষিত আছে। আপনি কিছুক্ষণ পর অর্ডার ট্র্যাকিং থেকে বা সহায়তায় যোগাযোগ করে তাৎক্ষণিক সহায়তা পাবেন।
                    </p>
                  </div>
                </div>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={fetchOrderData}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>পুনরায় চেক করুন</span>
                  </button>
                </div>
              </div>
            )}

            {/* Order Summary & Customer Details */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2 text-xs text-slate-300">
              <div className="text-xs font-semibold text-white mb-2 pb-1 border-b border-slate-800">
                অর্ডার বিস্তারিত
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">প্ল্যান:</span>
                <span className="font-semibold text-white">{order.plan_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">পরিশোধিত অর্থ:</span>
                <span className="font-semibold text-emerald-400 tabular-nums">৳{order.amount_bdt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">গ্রাহকের নাম:</span>
                <span>{order.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">যোগাযোগ:</span>
                <span>{order.customer_contact}</span>
              </div>
              {order.payment_method && (
                <div className="flex justify-between">
                  <span className="text-slate-400">পেমেন্ট মাধ্যম:</span>
                  <span>{order.payment_method}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
