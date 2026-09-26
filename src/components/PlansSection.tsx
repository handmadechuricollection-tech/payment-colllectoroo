import React from 'react';
import { Plan } from '../types';
import { ArrowRight, Sparkles, CheckCircle2, Clock, Info } from 'lucide-react';

interface PlansSectionProps {
  plans: Plan[];
  loading: boolean;
  onSelectPlan: (plan: Plan) => void;
}

export const PlansSection: React.FC<PlansSectionProps> = ({ plans, loading, onSelectPlan }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 text-left">
      {/* 1. Clear & Normal Instruction Box */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 sm:p-5 space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm sm:text-base">
          <Info className="h-4 w-4 shrink-0" />
          <span>সাবস্ক্রিপশন নেওয়ার নিয়মাবলী:</span>
        </div>
        <ul className="text-xs sm:text-sm text-slate-300 space-y-1.5 list-none pl-0">
          <li className="flex items-start gap-2">
            <span className="font-bold text-emerald-400">১.</span>
            <span>নিচের তালিকা থেকে আপনার পছন্দের প্ল্যান নির্বাচন করে <strong>"কিনুন"</strong> বোতামে ক্লিক করুন।</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-emerald-400">২.</span>
            <span>আপনার নাম ও মোবাইল নম্বর প্রদান করে <strong>"পেমেন্ট করুন"</strong> নির্বাচন করুন।</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-emerald-400">৩.</span>
            <span>পেমেন্ট সফল হওয়ার সাথে সাথে স্ক্রিনে আপনার <strong>VLE Player ইউজারনেম ও পাসওয়ার্ড</strong> প্রদর্শিত হবে।</span>
          </li>
        </ul>
      </div>

      {/* Section Title */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            প্ল্যানসমূহ বেছে নিন
          </h2>
          <p className="text-xs text-slate-400">
            আপনার পছন্দের মেয়াদের প্যাকেজটিতে "কিনুন" চাপুন।
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-slate-900 border border-slate-800 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && plans.length === 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-xs text-slate-400">
          কোনো প্ল্যান পাওয়া যায়নি।
        </div>
      )}

      {/* Normal, Clean, Super Easy Plans List */}
      {!loading && plans.length > 0 && (
        <div className="space-y-3">
          {plans.map((plan) => {
            const isPopular = plan.is_popular;
            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  isPopular
                    ? 'border-emerald-500/50 bg-slate-900 shadow-md shadow-emerald-950/20'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                {/* Left side: Duration, Title & Description */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-bold text-white">
                      {plan.name}
                    </span>
                    {isPopular && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <Sparkles className="h-3 w-3" />
                        <span>জনপ্রিয়</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>মেয়াদ: <strong className="text-slate-200">{plan.duration_label || `${plan.duration_days} দিন`}</strong></span>
                    </span>
                    {plan.description && (
                      <>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="text-slate-400">{plan.description}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right side: Price & Action */}
                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                  <div className="text-left sm:text-right">
                    <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 tabular-nums">
                      ৳{plan.price_bdt}
                    </div>
                    <span className="text-[10px] text-slate-400">এককালীন মূল্য</span>
                  </div>

                  <button
                    onClick={() => onSelectPlan(plan)}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-400 hover:bg-emerald-300 text-slate-950 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/30 whitespace-nowrap"
                  >
                    <span>কিনুন</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Simple security footer note */}
      <div className="pt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        <span>বিকাশ, নগদ, রকেট ও কার্ডে তাৎক্ষণিক নিরাপদ পেমেন্ট</span>
      </div>
    </div>
  );
};
