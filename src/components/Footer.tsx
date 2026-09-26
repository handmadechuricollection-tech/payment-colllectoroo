import React from 'react';
import { ShieldCheck, MessageSquare, Phone } from 'lucide-react';
import { SiteSettings } from '../types';

interface FooterProps {
  settings?: SiteSettings | null;
  onOpenTrack: () => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onOpenTrack }) => {
  const phone = settings?.support_phone || '+880 1700-000000';
  const whatsapp = settings?.support_whatsapp || '+880 1700-000000';

  return (
    <footer className="border-t border-slate-900 bg-slate-950 py-8 px-4 sm:px-6 text-center text-xs text-slate-500 space-y-3 max-w-4xl mx-auto">
      {/* Quick Support Links */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
        <button
          onClick={onOpenTrack}
          className="hover:text-emerald-400 transition-colors"
        >
          অর্ডার স্ট্যাটাস যাচাই
        </button>
        <span aria-hidden="true" className="text-slate-700">·</span>
        <a
          href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
        >
          <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
          <span>হোয়াটসঅ্যাপ সাপোর্ট</span>
        </a>
        <span aria-hidden="true" className="text-slate-700">·</span>
        <a
          href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
          className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1"
        >
          <Phone className="h-3.5 w-3.5 text-cyan-400" />
          <span>হেল্পলাইন: {phone}</span>
        </a>
      </div>

      <div className="flex items-center justify-center gap-1 text-[11px] text-slate-600">
        <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
        <span>VLE Player অফিসিয়াল সাবস্ক্রিপশন পোর্টাল · সর্বস্বত্ব সংরক্ষিত</span>
      </div>
    </footer>
  );
};
