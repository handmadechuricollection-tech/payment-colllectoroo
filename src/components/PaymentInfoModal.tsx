import React from 'react';
import { X, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface PaymentInfoModalProps {
  onClose: () => void;
}

export const PaymentInfoModal: React.FC<PaymentInfoModalProps> = ({ onClose }) => {
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
          <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            <span>নিরাপদ লেনদেন পদ্ধতি</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">পেমেন্ট করার নিয়মাবলী</h3>
          <p className="text-xs text-slate-400">
            সহজ ৩টি ধাপে আপনার সাবস্ক্রিপশন সম্পন্ন করুন।
          </p>
        </div>

        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs">
              ১
            </span>
            <div>
              <div className="font-bold text-white mb-0.5">প্ল্যান পছন্দ ও তথ্য পূরণ</div>
              <p className="text-slate-400">
                আপনার কাঙ্ক্ষিত মেয়াদের প্ল্যানে "কিনুন" চাপুন। আপনার নাম ও যোগাযোগের তথ্য প্রদান করে "পেমেন্ট করুন" নির্বাচন করুন।
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs">
              ২
            </span>
            <div>
              <div className="font-bold text-white mb-0.5">বিকাশ/নগদ/কার্ডে পেমেন্ট</div>
              <p className="text-slate-400">
                নিরাপদ গেটওয়ে পেজে বিকাশ, নগদ, রকেট অথবা কার্ড সিলেক্ট করে পেমেন্ট সম্পন্ন করুন।
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs">
              ৩
            </span>
            <div>
              <div className="font-bold text-white mb-0.5">তাৎক্ষণিক অ্যাকাউন্ট ডেলিভারি</div>
              <p className="text-slate-400">
                পেমেন্ট যাচাইয়ের সাথে সাথেই স্ক্রিনে আপনার ইউজারনেম ও পাসওয়ার্ড প্রদর্শিত হবে। কোনো অপেক্ষার প্রয়োজন নেই!
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>১০০% অটোমেটেড ভেরিফিকেশন</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            বুঝেছি
          </button>
        </div>
      </div>
    </div>
  );
};
