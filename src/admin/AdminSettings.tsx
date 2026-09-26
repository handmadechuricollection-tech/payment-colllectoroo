import React, { useState, useEffect } from 'react';
import { SiteSettings } from '../types';
import { api } from '../services/api';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Key,
  Globe,
  CreditCard,
  Layers,
  Lock,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // General Settings Form
  const [siteName, setSiteName] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [supportWhatsapp, setSupportWhatsapp] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [telegramSupportLink, setTelegramSupportLink] = useState('');
  const [vlePlayerUrl, setVlePlayerUrl] = useState('');
  const [bkashNumber, setBkashNumber] = useState('');
  const [nagadNumber, setNagadNumber] = useState('');
  const [rocketNumber, setRocketNumber] = useState('');
  const [paymentMode, setPaymentMode] = useState<'sandbox' | 'live'>('live');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [vleApiUrl, setVleApiUrl] = useState('');

  // Password Change Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminSettings();
      setSettings(data);
      setSiteName(data.site_name || '');
      setSupportPhone(data.support_phone || '');
      setSupportWhatsapp(data.support_whatsapp || '');
      setSupportEmail(data.support_email || '');
      setTelegramSupportLink(data.telegram_support_link || '');
      setVlePlayerUrl(data.vle_player_url || '');
      setBkashNumber(data.bkash_number || '');
      setNagadNumber(data.nagad_number || '');
      setRocketNumber(data.rocket_number || '');
      setPaymentMode(data.payment_mode || 'live');
      setPaymentInstructions(data.payment_instructions_bn || '');
      setVleApiUrl(data.vle_api_url || '');
    } catch (err: any) {
      setErrorMsg(err.message || 'সেটিংস লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);
    setErrorMsg(null);

    try {
      const updated = await api.updateAdminSettings({
        site_name: siteName,
        support_phone: supportPhone,
        support_whatsapp: supportWhatsapp,
        support_email: supportEmail,
        telegram_support_link: telegramSupportLink,
        vle_player_url: vlePlayerUrl,
        bkash_number: bkashNumber,
        nagad_number: nagadNumber,
        rocket_number: rocketNumber,
        payment_mode: paymentMode,
        payment_instructions_bn: paymentInstructions,
        vle_api_url: vleApiUrl,
      });
      setSettings(updated.settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'সেটিংস সংরক্ষণ ব্যর্থ হয়েছে');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(false);

    if (newPassword.length < 8) {
      setPassError('নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('উভয় পাসওয়ার্ড একই হতে হবে।');
      return;
    }

    setPassLoading(true);
    try {
      await api.changeAdminPassword(currentPassword, newPassword);
      setPassSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccess(false), 3000);
    } catch (err: any) {
      setPassError(err.message || 'পাসওয়ার্ড পরিবর্তনে সমস্যা হয়েছে');
    } finally {
      setPassLoading(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-400 mb-2" />
        <span>সেটিংস লোড হচ্ছে...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left max-w-4xl">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">সিস্টেম ও ইন্টিগ্রেশন সেটিংস</h2>
        <p className="text-xs text-slate-400">
          ওয়েবসাইটের ব্র্যান্ডিং, পেমেন্ট গেটওয়ে মোড এবং VLE Player API সংযোগ কনফিগারেশন।
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>সেটিংস সফলভাবে সংরক্ষিত হয়েছে।</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-8">
        {/* 1. General Settings */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-sm font-bold text-white">
            <Globe className="h-4 w-4 text-emerald-400" />
            <span>সাধারণ ব্র্যান্ডিং সেটিংস (General Settings)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">সাইটের নাম (Site Name)</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">সাপোর্ট ফোন নম্বর</label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">হোয়াটসঅ্যাপ নম্বর</label>
              <input
                type="text"
                value={supportWhatsapp}
                onChange={(e) => setSupportWhatsapp(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">সাপোর্ট ইমেইল</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                এডমিন টেলিগ্রাম লিংক / সাপোর্ট লিংক (Telegram Contact Link)
              </label>
              <input
                type="text"
                value={telegramSupportLink}
                onChange={(e) => setTelegramSupportLink(e.target.value)}
                placeholder="https://t.me/your_admin_username"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                চেকআউটে পেমেন্ট ভেরিফাই বা সমস্যায় কাস্টমার এই লিংকে সরাসরি টেলিগ্রামে স্ক্রিনশট পাঠাবে।
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                VLE Player Login URL (যেখানে ইউজারকে রিডাইরেক্ট করা হবে)
              </label>
              <input
                type="url"
                value={vlePlayerUrl}
                onChange={(e) => setVlePlayerUrl(e.target.value)}
                placeholder="https://vleplayer.com/login"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* 2. Payment Gateway Settings */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-sm font-bold text-white">
            <CreditCard className="h-4 w-4 text-emerald-400" />
            <span>পেমেন্ট গেটওয়ে কনফিগারেশন (Payment Settings)</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">গেটওয়ে মোড</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    value="sandbox"
                    checked={paymentMode === 'sandbox'}
                    onChange={() => setPaymentMode('sandbox')}
                    className="text-emerald-500"
                  />
                  <span className="text-white">Sandbox / টেস্ট মোড</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    value="live"
                    checked={paymentMode === 'live'}
                    onChange={() => setPaymentMode('live')}
                    className="text-emerald-500"
                  />
                  <span className="text-white">Live Supabase SMS ভেরিফিকেশন (সক্রিয়)</span>
                </label>
              </div>
            </div>

            {/* bKash, Nagad, Rocket Phone Numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1">
                  <span className="text-pink-400 font-bold">●</span>
                  <span>বিকাশ নম্বর (Personal / Send Money)</span>
                </label>
                <input
                  type="text"
                  value={bkashNumber}
                  onChange={(e) => setBkashNumber(e.target.value)}
                  placeholder="01912-345678"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1">
                  <span className="text-orange-400 font-bold">●</span>
                  <span>নগদ নম্বর (Personal / Send Money)</span>
                </label>
                <input
                  type="text"
                  value={nagadNumber}
                  onChange={(e) => setNagadNumber(e.target.value)}
                  placeholder="01712-345678"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1">
                  <span className="text-purple-400 font-bold">●</span>
                  <span>রকেট নম্বর (Personal / Send Money)</span>
                </label>
                <input
                  type="text"
                  value={rocketNumber}
                  onChange={(e) => setRocketNumber(e.target.value)}
                  placeholder="01812-345678"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">পেমেন্ট নির্দেশাবলী (বাংলায়)</label>
              <textarea
                rows={2}
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Supabase SMS Verification Status Card */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-[11px]">
              <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Supabase SMS ভেরিফিকেশন ইন্টিগ্রেশন সক্রিয়:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400">
                <div>
                  প্রকল্প URL:{' '}
                  <span className="font-mono text-slate-200">
                    https://jzuckoovjyskadsbpuda.supabase.co
                  </span>
                </div>
                <div>
                  SMS টেবিল নাম: <span className="font-mono text-emerald-400">payment_sms</span>
                </div>
                <div>
                  TrxID কোয়েরি:{' '}
                  <span className="font-mono text-slate-300">trx_id=eq.&#123;TRX_ID&#125;&amp;status=eq.pending</span>
                </div>
                <div>
                  ভেরিফিকেশন অ্যাকশন: <span className="text-emerald-400 font-semibold">স্বয়ংক্রিয় PATCH 'verified'</span>
                </div>
              </div>
            </div>

            {/* Secret Status Display */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-[11px]">
              <div className="font-semibold text-slate-300">এনভায়রনমেন্ট সিক্রেট স্ট্যাটাস:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">PAYMENT_GATEWAY_KEY:</span>
                  <span className={settings?.gateway_key_configured ? 'text-emerald-400' : 'text-amber-400'}>
                    {settings?.gateway_key_configured ? 'কনফিগার করা আছে ✓' : 'কনফিগার করা নেই (Sandbox সক্রিয়)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">WEBHOOK_SECRET:</span>
                  <span className={settings?.webhook_secret_configured ? 'text-emerald-400' : 'text-slate-400'}>
                    {settings?.webhook_secret_configured ? 'কনফিগার করা আছে ✓' : 'ডিফল্ট সিক্রেট ব্যবহার হচ্ছে'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. VLE Player Integration Settings */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-sm font-bold text-white">
            <Layers className="h-4 w-4 text-emerald-400" />
            <span>ভবিষ্যৎ VLE Player API ইন্টিগ্রেশন (Integration Settings)</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">VLE API URL</label>
              <input
                type="text"
                value={vleApiUrl}
                onChange={(e) => setVleApiUrl(e.target.value)}
                placeholder="https://api.vleplayer.com/v1"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                ভবিষ্যতে VLE Player-এর রিয়েল API রেডি হলে শুধু এই URL এবং VLE_API_SECRET সেট করলেই অটো একাউন্ট তৈরি চালু হবে।
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
              <span className="text-slate-400">VLE_API_SECRET স্ট্যাটাস:</span>
              <span className={settings?.vle_api_secret_configured ? 'text-emerald-400' : 'text-slate-400'}>
                {settings?.vle_api_secret_configured ? 'কনফিগার করা আছে ✓' : 'কনফিগার করা নেই (স্ট্যান্ডঅ্যালন মোড)'}
              </span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-emerald-950/40"
        >
          <Save className="h-4 w-4" />
          <span>সেটিংস সংরক্ষণ করুন</span>
        </button>
      </form>

      {/* 4. Admin Security & Password Change */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-sm font-bold text-white">
          <Lock className="h-4 w-4 text-emerald-400" />
          <span>এডমিন পাসওয়ার্ড পরিবর্তন (Admin Security)</span>
        </div>

        {passSuccess && (
          <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!</span>
          </div>
        )}

        {passError && (
          <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{passError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs max-w-md">
          <div>
            <label className="block text-slate-300 font-medium mb-1">বর্তমান পাসওয়ার্ড</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">নতুন পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={passLoading}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {passLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>পাসওয়ার্ড আপডেট করুন</span>
          </button>
        </form>
      </div>
    </div>
  );
};
