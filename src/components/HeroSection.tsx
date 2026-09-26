import React from 'react';
import { Play, ShieldCheck, Zap, MonitorPlay, CheckCircle2 } from 'lucide-react';
import heroImg from '../assets/images/hero_vle_player_1790418367921.jpg';
import shieldImg from '../assets/images/vle_shield_verified_1790418381409.jpg';

interface HeroSectionProps {
  onSelectPlans: () => void;
  onOpenTrack: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSelectPlans, onOpenTrack }) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-slate-900">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-blue-500/5 blur-[100px] pointer-events-none rounded-full" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Bengali Headline & Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Zero-Pill Unboxed Quiet Kicker */}
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>VLE Player অফিসিয়াল পেমেন্ট গেটওয়ে</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-400">তাৎক্ষণিক অ্যাক্টিভেশন</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight text-balance">
              পছন্দের VLE Player প্ল্যান বেছে নিয়ে <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                সহজেই সাবস্ক্রিপশন সম্পন্ন করুন
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              বাফারিং-মুক্ত হাই-স্পিড ভিডিও স্ট্রিমিং, ফুল এইচডি ও ৪কে প্লেব্যাকের জন্য আপনার উপযুক্ত মেয়াদের প্ল্যান বেছে নিন। সুরক্ষিত পেমেন্ট ভেরিফিকেশনের মাধ্যমে পান তাৎক্ষণিক অ্যাকাউন্ট ডেলিভারি।
            </p>

            {/* Proof points with unboxed typography */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
                <Zap className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="font-medium">জিরো বাফারিং স্পিড</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
                <MonitorPlay className="h-4 w-4 text-cyan-400 shrink-0" />
                <span className="font-medium">1080p ও 4K রেজুলেশন</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="font-medium">১০০% ভেরিফাইড গেটওয়ে</span>
              </div>
            </div>

            {/* CTA action buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={onSelectPlans}
                className="px-6 py-3.5 text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-2"
              >
                <span>প্ল্যান দেখুন ও কিনুন</span>
                <Play className="h-3.5 w-3.5 fill-slate-950" />
              </button>
              <button
                onClick={onOpenTrack}
                className="px-5 py-3.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
              >
                বিদ্যমান অর্ডার ট্র্যাক করুন
              </button>
            </div>

            {/* Quiet security assurance line */}
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>বিকাশ, নগদ, রকেট এবং কার্ডের মাধ্যমে নিরাপদ স্বয়ংক্রিয় পেমেন্ট</span>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900/40 group">
              <img
                src={heroImg}
                alt="VLE Player স্ট্রিমিং ইন্টারফেস"
                className="w-full h-auto object-cover aspect-video sm:aspect-[16/10] group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

              {/* Floating Verified Badge Overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={shieldImg}
                    alt="সিকিউরিটি ভেরিফিকেশন"
                    className="h-10 w-10 rounded-lg object-cover border border-emerald-500/30"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">স্বয়ংক্রিয় প্রোভিশনিং</div>
                    <div className="text-[11px] text-slate-400">পেমেন্ট ভেরিফাই হতেই ক্রেডেনশিয়াল জেনারেট</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-emerald-400 font-semibold block">ইনস্ট্যান্ট ডেলিভারি</span>
                  <span className="text-[10px] text-slate-500">২৪/৭ অনলাইন</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
