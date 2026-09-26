import React from 'react';
import { Play, Search } from 'lucide-react';

interface HeaderProps {
  onOpenTrack: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenTrack }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <a href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Play className="h-4 w-4 fill-emerald-400 text-emerald-400 ml-0.5" />
          </span>
          <div>
            <div className="font-extrabold text-base sm:text-lg text-white tracking-wide">
              VLE Player
            </div>
            <div className="text-[10px] text-emerald-400 font-medium">
              অফিসিয়াল সাবস্ক্রিপশন পোর্টাল
            </div>
          </div>
        </a>

        {/* Action: Track order */}
        <button
          onClick={onOpenTrack}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 rounded-lg hover:border-slate-600 transition-colors flex items-center gap-1.5"
        >
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <span>অর্ডার যাচাই</span>
        </button>
      </div>
    </header>
  );
};
