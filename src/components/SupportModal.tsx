import React from 'react';
import { X, MessageSquare, Phone, Mail, Clock, ShieldCheck, Send } from 'lucide-react';
import { SiteSettings } from '../types';

interface SupportModalProps {
  settings?: SiteSettings | null;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ settings, onClose }) => {
  const phone = settings?.support_phone || '+880 1700-000000';
  const whatsapp = settings?.support_whatsapp || '+880 1700-000000';
  const email = settings?.support_email || 'support@vleplayer.com';
  const telegram = settings?.telegram_support_link || 'https://t.me/admin_support';
  const telegramUrl = telegram.startsWith('http') ? telegram : `https://t.me/${telegram.replace('@', '')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 sm:p-7 text-left my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-1 mb-6">
          <h3 className="text-xl font-bold text-white tracking-tight">গ্রাহক সহায়তা ও হেল্পডেস্ক</h3>
          <p className="text-xs text-slate-400">
            পেমেন্ট বা সাবস্ক্রিপশন সংক্রান্ত যেকোনো বিষয়ে আমরা আপনাকে সহায়তা করতে প্রস্তুত।
          </p>
        </div>

        <div className="space-y-3">
          {/* Telegram Admin */}
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 p-3.5 rounded-xl border border-sky-500/30 bg-sky-950/20 hover:border-sky-500 hover:bg-sky-950/40 transition-all group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 group-hover:scale-105 transition-transform">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors flex items-center gap-1.5">
                <span>টেলিগ্রাম এডমিন সাপোর্ট</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300">ইনস্ট্যান্ট</span>
              </div>
              <div className="text-[11px] text-slate-400">পেমেন্ট স্ক্রিনশট ও ডিরেক্ট সাপোর্ট</div>
            </div>
          </a>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-emerald-500/50 hover:bg-slate-950 transition-all group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                হোয়াটসঅ্যাপ সাপোর্ট
              </div>
              <div className="text-[11px] text-slate-400">{whatsapp}</div>
            </div>
          </a>

          {/* Phone */}
          <a
            href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
            className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-cyan-500/50 hover:bg-slate-950 transition-all group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                সরাসরি হটলাইন
              </div>
              <div className="text-[11px] text-slate-400">{phone}</div>
            </div>
          </a>

          {/* Email */}
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-purple-500/50 hover:bg-slate-950 transition-all group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">
                ইমেইল সাপোর্ট
              </div>
              <div className="text-[11px] text-slate-400">{email}</div>
            </div>
          </a>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-emerald-400" />
            <span>সাপোর্ট সময়: ২৪/৭ অনলাইন</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>অফিসিয়াল সার্ভিস</span>
          </div>
        </div>
      </div>
    </div>
  );
};
