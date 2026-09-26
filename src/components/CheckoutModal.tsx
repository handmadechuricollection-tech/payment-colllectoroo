import React, { useState } from 'react';
import { Plan, Order, SiteSettings } from '../types';
import { api } from '../services/api';
import {
  X,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  User,
  Phone,
  AtSign,
  Copy,
  Check,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Send,
} from 'lucide-react';

interface CheckoutModalProps {
  plan: Plan | null;
  settings?: SiteSettings | null;
  onClose: () => void;
  onPaymentSuccess: (orderId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  plan,
  settings,
  onClose,
  onPaymentSuccess,
}) => {
  // Step state: 1 = Customer Info, 2 = Payment & TrxID Verification
  const [step, setStep] = useState<1 | 2>(1);

  // Form values
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [preferredUsername, setPreferredUsername] = useState('');
  const [selectedGateway, setSelectedGateway] = useState<'BKASH' | 'NAGAD' | 'ROCKET'>('BKASH');
  const [trxId, setTrxId] = useState('');

  // Execution states
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedNumber, setCopiedNumber] = useState(false);

  if (!plan) return null;

  // Active payment numbers from settings with fallbacks
  const bkashNumber = settings?.bkash_number || '01923361996';
  const nagadNumber = settings?.nagad_number || '01341723065';
  const rocketNumber = settings?.rocket_number || '01341723065';

  const currentNumber =
    selectedGateway === 'BKASH'
      ? bkashNumber
      : selectedGateway === 'NAGAD'
      ? nagadNumber
      : rocketNumber;

  const currentGatewayName =
    selectedGateway === 'BKASH'
      ? 'বিকাশ (bKash)'
      : selectedGateway === 'NAGAD'
      ? 'নগদ (Nagad)'
      : 'রকেট (Rocket)';

  const telegramSupportUrl = settings?.telegram_support_link
    ? settings.telegram_support_link.startsWith('http')
      ? settings.telegram_support_link
      : `https://t.me/${settings.telegram_support_link.replace('@', '')}`
    : 'https://t.me/admin_support';

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(currentNumber.replace(/[^0-9]/g, ''));
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  // Step 1: Create Order on Backend
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError('অনুগ্রহ করে আপনার নাম লিখুন।');
      return;
    }

    if (!customerContact.trim() || customerContact.trim().length < 6) {
      setError('অনুগ্রহ করে সঠিক মোবাইল নম্বর অথবা ইমেইল লিখুন।');
      return;
    }

    setLoadingOrder(true);
    try {
      const order = await api.createOrder({
        plan_id: plan.id,
        customer_name: customerName.trim(),
        customer_contact: customerContact.trim(),
        preferred_username: preferredUsername.trim() || undefined,
      });

      setCreatedOrder(order);
      setStep(2);
    } catch (err: any) {
      console.error('Order creation error:', err);
      setError(err.message || 'অর্ডার তৈরি করা সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setLoadingOrder(false);
    }
  };

  // Step 2: Verify SMS via Supabase Backend API
  const handleVerifyTrxId = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const cleanTrx = trxId.replace(/[^A-Za-z0-9]/g, '').trim().toUpperCase();
    if (!cleanTrx) {
      setError('অনুগ্রহ করে আপনার পেমেন্টের Transaction ID (TrxID) লিখুন।');
      return;
    }

    if (!createdOrder) {
      setError('অর্ডার পাওয়া যায়নি। অনুগ্রহ করে প্রথম ধাপ থেকে শুরু করুন।');
      return;
    }

    setVerifying(true);
    try {
      const res = await api.verifyPaymentSms({
        order_id: createdOrder.id,
        trx_id: cleanTrx,
        gateway: selectedGateway,
      });

      if (res.success && res.verified) {
        // Successfully verified via Supabase!
        onPaymentSuccess(createdOrder.id);
      } else {
        setError((res as any).error || 'এই ট্রানজেকশন আইডিটি এখনো পাওয়া যায়নি। অনুগ্রহ করে সঠিক TrxID লিখুন অথবা ১-২ মিনিট অপেক্ষা করে আবার চেষ্টা করুন।');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(
        err.message ||
          'এই ট্রানজেকশন আইডিটি এখনো পাওয়া যায়নি। অনুগ্রহ করে সঠিক TrxID লিখুন অথবা ১-২ মিনিট অপেক্ষা করে আবার চেষ্টা করুন।'
      );
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-5 sm:p-7 text-left my-6 sm:my-8 transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loadingOrder || verifying}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="বন্ধ করুন"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header & Step Indicator */}
        <div className="mb-4 pr-8">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>নিরাপদ পেমেন্ট গেটওয়ে</span>
            </span>
            <span className="text-xs text-slate-400">
              ধাপ {step} / ২
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {step === 1 ? 'সাবস্ক্রিপশন চেকআউট' : 'পেমেন্ট ও TrxID ভেরিফিকেশন'}
          </h3>
        </div>

        {/* Selected Plan Summary Banner */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 mb-5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400 block font-medium">নির্বাচিত প্ল্যান</span>
            <span className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>{plan.name}</span>
              <span className="text-[11px] text-emerald-400 font-normal">
                ({plan.duration_label || `${plan.duration_days} দিন`})
              </span>
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-medium">মোট প্রদেয়</span>
            <span className="text-lg font-extrabold text-emerald-400 tabular-nums">
              ৳{plan.price_bdt} <span className="text-xs font-normal text-slate-400">BDT</span>
            </span>
          </div>
        </div>

        {/* Error Notification Alert */}
        {error && (
          <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200 space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="font-semibold text-amber-300">{error}</div>
            </div>
            {step === 2 && (
              <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-[11px]">
                <span className="text-amber-200/90">পেমেন্ট করার পরও সমস্যা হলে:</span>
                <a
                  href={telegramSupportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1.5 underline underline-offset-2"
                >
                  <Send className="h-3 w-3" />
                  <span>এডমিনকে স্ক্রিনশট দিন</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 1: Customer Information Form                   */}
        {/* ==================================================== */}
        {step === 1 && (
          <form onSubmit={handleProceedToPayment} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span>আপনার নাম *</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="যেমন: মোঃ সাব্বির আহমেদ"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>মোবাইল নম্বর অথবা ইমেইল *</span>
              </label>
              <input
                type="text"
                required
                value={customerContact}
                onChange={(e) => setCustomerContact(e.target.value)}
                placeholder="যেমন: 01700000000 বা user@example.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                অ্যাকাউন্ট রিকভারি এবং পেমেন্ট সংক্রান্ত যোগাযোগের জন্য এটি প্রয়োজন।
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <AtSign className="h-3.5 w-3.5 text-slate-400" />
                <span>পছন্দের ইউজারনেম (ঐচ্ছিক)</span>
              </label>
              <input
                type="text"
                value={preferredUsername}
                onChange={(e) => setPreferredUsername(e.target.value)}
                placeholder="যেমন: sabbir_99 (খালি রাখলে স্বয়ংক্রিয় তৈরি হবে)"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loadingOrder}
                className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 disabled:opacity-50"
              >
                {loadingOrder ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>অর্ডার প্রস্তুত হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>পেমেন্ট ধাপে এগিয়ে যান (৳{plan.price_bdt})</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ==================================================== */}
        {/* STEP 2: Payment Gateway & TrxID Verification Form   */}
        {/* ==================================================== */}
        {step === 2 && createdOrder && (
          <form onSubmit={handleVerifyTrxId} className="space-y-4">
            {/* Order Info & Back Button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={verifying}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>তথ্য পরিবর্তন করুন</span>
              </button>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">অর্ডার আইডি</span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {createdOrder.id}
                </span>
              </div>
            </div>

            {/* Gateway Selector Tabs */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                পেমেন্ট মাধ্যম নির্বাচন করুন:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGateway('BKASH')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    selectedGateway === 'BKASH'
                      ? 'border-pink-500 bg-pink-500/15 text-pink-300 shadow-md shadow-pink-950/30'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-sm">বিকাশ</span>
                  <span className="text-[10px] opacity-80">bKash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedGateway('NAGAD')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    selectedGateway === 'NAGAD'
                      ? 'border-orange-500 bg-orange-500/15 text-orange-300 shadow-md shadow-orange-950/30'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-sm">নগদ</span>
                  <span className="text-[10px] opacity-80">Nagad</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedGateway('ROCKET')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    selectedGateway === 'ROCKET'
                      ? 'border-purple-500 bg-purple-500/15 text-purple-300 shadow-md shadow-purple-950/30'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-sm">রকেট</span>
                  <span className="text-[10px] opacity-80">Rocket</span>
                </button>
              </div>
            </div>

            {/* Display Active Gateway Phone Number & Copy Option */}
            <div className="rounded-xl border border-slate-700/80 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {currentGatewayName} পার্সোনাল নম্বর (Send Money):
                </span>
                <span className="text-emerald-400 font-medium text-[11px]">Send Money</span>
              </div>

              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-3">
                <span className="text-base sm:text-lg font-mono font-bold text-white tracking-wider">
                  {currentNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="px-3 py-1.5 rounded-md bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedNumber ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>কপি হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>কপি করুন</span>
                    </>
                  )}
                </button>
              </div>

              {/* Instructions bullets */}
              <div className="space-y-1.5 text-[11px] text-slate-300 pt-1">
                <div className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold shrink-0">১.</span>
                  <span>
                    আপনার {currentGatewayName} অ্যাপ থেকে উপরের নম্বরে ঠিক{' '}
                    <strong className="text-emerald-400 font-bold">৳{plan.price_bdt}</strong> টাকা Send Money করুন।
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold shrink-0">২.</span>
                  <span>
                    লেনদেন সফল হলে প্রাপ্ত SMS অথবা অ্যাপের স্টেটমেন্ট থেকে{' '}
                    <strong className="text-white">TrxID (Transaction ID)</strong> কপি করে নিচের ঘরে লিখুন।
                  </span>
                </div>
              </div>
            </div>

            {/* TrxID Input Field */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>ট্রানজেকশন আইডি (TrxID) *</span>
                <span className="text-[11px] text-slate-500 font-mono">যেমন: 9K8X7L2M1</span>
              </label>
              <input
                type="text"
                required
                value={trxId}
                onChange={(e) => {
                  setTrxId(e.target.value.toUpperCase());
                  if (error) setError(null);
                }}
                placeholder="এখানে TrxID লিখুন (যেমন: 9K8X7L2M1)"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-mono tracking-wider text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none uppercase transition-colors"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                আপনার দেওয়া TrxID মিলিয়ে স্বয়ংক্রিয়ভাবে অ্যাকাউন্ট ও পাসওয়ার্ড ডেলিভারি করা হবে।
              </span>
            </div>

            {/* Submit / Verification Button */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={verifying || !trxId.trim()}
                className="w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 disabled:opacity-50 cursor-pointer"
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>পেমেন্ট ভেরিফাই করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>পেমেন্ট ভেরিফাই করুন</span>
                  </>
                )}
              </button>

              <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <Sparkles className="h-3 w-3 text-emerald-400" />
                <span>অটোমেটিক SMS ম্যাচিং ও ইনস্ট্যান্ট অ্যাক্টিভেশন</span>
              </div>
            </div>

            {/* Direct Admin Inbox Contact / Screenshot Helper Box */}
            <div className="mt-4 p-3.5 rounded-xl border border-sky-500/30 bg-sky-950/20 text-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-sky-400" />
                  <span>ভেরিফিকেশনে কোনো সমস্যা হচ্ছে?</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-medium">
                  সরাসরি এডমিন
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                আপনার যদি ভেরিফাই করতে সমস্যা হয় অথবা SMS আসতে দেরি হয়, তাহলে নিচে এডমিনের ইনবক্সে সরাসরি পেমেন্টের স্ক্রিনশট পাঠিয়ে দিন। এডমিন নিজে তাৎক্ষণিক অ্যাকাউন্ট চালু করে দেবে।
              </p>
              <a
                href={telegramSupportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3.5 rounded-lg text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 flex items-center justify-center gap-2 transition-all shadow-md shadow-sky-950/40"
              >
                <Send className="h-3.5 w-3.5" />
                <span>এডমিন ইনবক্সে সরাসরি স্ক্রিনশট পাঠান (Contact Admin)</span>
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
