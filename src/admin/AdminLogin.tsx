import React, { useState } from 'react';
import { api } from '../services/api';
import { AdminUser } from '../types';
import { Lock, User, Loader2, AlertCircle, ShieldCheck, Key } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (admin: AdminUser) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.adminLogin({ username, password });
      onLoginSuccess(res.admin);
    } catch (err: any) {
      setError(err.message || 'ভুল ইউজারনেম বা পাসওয়ার্ড।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl p-7 sm:p-8 space-y-6 text-left">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            VLE Admin Control Panel
          </h2>
          <p className="text-xs text-slate-400">
            সুরক্ষিত এডমিন সিস্টেমে প্রবেশ করতে আপনার ক্রেডেনশিয়াল প্রদান করুন।
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span>ইউজারনেম</span>
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-slate-400" />
              <span>পাসওয়ার্ড</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>যাচাই করা হচ্ছে...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>লগইন করুন</span>
              </>
            )}
          </button>
        </form>

        {/* Security and Seed Helper Notice */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-1.5 text-[11px] text-slate-400">
          <div className="font-semibold text-slate-300 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>এডমিন ক্রেডেনশিয়াল তথ্য:</span>
          </div>
          <div className="text-slate-400">
            প্রাথমিক এডমিন ইউজারনেম: <span className="font-mono text-emerald-400">admin</span>
            <br />
            ডিফল্ট পাসওয়ার্ড: <span className="font-mono text-emerald-400">admin@vle2026#secure</span>
          </div>
          <div className="text-[10px] text-slate-500">
            * লগইন করার পর সেটিংস থেকে আপনার পাসওয়ার্ড পরিবর্তন করে নিন।
          </div>
        </div>
      </div>
    </div>
  );
};
