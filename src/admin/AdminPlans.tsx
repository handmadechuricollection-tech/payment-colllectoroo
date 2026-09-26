import React, { useState, useEffect } from 'react';
import { Plan } from '../types';
import { api } from '../services/api';
import { Plus, Edit2, Trash2, Check, X, Loader2, Sparkles, Layers } from 'lucide-react';

export const AdminPlans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [durationLabel, setDurationLabel] = useState('৩০ দিন');
  const [priceBdt, setPriceBdt] = useState(80);
  const [description, setDescription] = useState('');
  const [featuresStr, setFeaturesStr] = useState('হাই-স্পিড ভিডিও স্ট্রিমিং\nফুল এইচডি (1080p)\nসিঙ্গেল ডিভাইস');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(1);
  const [isPopular, setIsPopular] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminPlans();
      setPlans(data);
    } catch (err) {
      console.error('Fetch admin plans error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setName('');
    setDurationDays(30);
    setDurationLabel('৩০ দিন');
    setPriceBdt(80);
    setDescription('');
    setFeaturesStr('হাই-স্পিড ভিডিও স্ট্রিমিং\nফুল এইচডি (1080p) প্লেব্যাক\nসিঙ্গেল ডিভাইস সাপোর্ট');
    setIsActive(true);
    setSortOrder(plans.length + 1);
    setIsPopular(false);
    setModalOpen(true);
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setDurationDays(plan.duration_days);
    setDurationLabel(plan.duration_label || `${plan.duration_days} দিন`);
    setPriceBdt(plan.price_bdt);
    setDescription(plan.description);
    setFeaturesStr(plan.features.join('\n'));
    setIsActive(plan.is_active);
    setSortOrder(plan.sort_order);
    setIsPopular(!!plan.is_popular);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const features = featuresStr
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      const payload = {
        name: name.trim(),
        duration_days: Number(durationDays),
        duration_label: durationLabel.trim() || `${durationDays} দিন`,
        price_bdt: Number(priceBdt),
        description: description.trim(),
        features,
        is_active: isActive,
        sort_order: Number(sortOrder),
        is_popular: isPopular,
      };

      if (editingPlan) {
        await api.updatePlan(editingPlan.id, payload);
      } else {
        await api.createPlan(payload);
      }

      setModalOpen(false);
      fetchPlans();
    } catch (err: any) {
      alert(err.message || 'প্ল্যান সংরক্ষণ করা যায়নি');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, planName: string) => {
    if (!window.confirm(`আপনি কি "${planName}" প্ল্যানটি মুছে ফেলতে চান?`)) return;

    try {
      await api.deletePlan(id);
      fetchPlans();
    } catch (err: any) {
      alert(err.message || 'প্ল্যান মুছতে ব্যর্থ হয়েছে');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            সাবস্ক্রিপশন প্ল্যান ম্যানেজমেন্ট
          </h2>
          <p className="text-xs text-slate-400">
            প্ল্যানের নাম, মূল্য, মেয়াদ এবং ফিচারসমূহ ডাইনামিকালি পরিবর্তন করুন।
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-950/40"
        >
          <Plus className="h-4 w-4" />
          <span>নতুন প্ল্যান তৈরি করুন</span>
        </button>
      </div>

      {/* Plans List Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 font-semibold text-[11px] uppercase">
              <tr>
                <th className="py-3.5 px-4">ক্রম</th>
                <th className="py-3.5 px-4">প্ল্যান নাম</th>
                <th className="py-3.5 px-4">মেয়াদ</th>
                <th className="py-3.5 px-4">মূল্য (টাকা)</th>
                <th className="py-3.5 px-4">জনপ্রিয় ট্যাগ</th>
                <th className="py-3.5 px-4">স্ট্যাটাস</th>
                <th className="py-3.5 px-4 text-right">একশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    <span>লোড হচ্ছে...</span>
                  </td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    কোনো প্ল্যান পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                plans.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                      #{p.sort_order}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{p.name}</div>
                      <div className="text-[11px] text-slate-400">{p.description}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {p.duration_label || `${p.duration_days} দিন`}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400 text-sm tabular-nums">
                      ৳{p.price_bdt}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.is_popular ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <Sparkles className="h-3 w-3" />
                          <span>জনপ্রিয়</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          p.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {p.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                          title="এডিট"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Edit / Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 sm:p-7 text-left my-8 space-y-5">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-xl font-bold text-white">
                {editingPlan ? 'প্ল্যান এডিট করুন' : 'নতুন প্ল্যান তৈরি করুন'}
              </h3>
              <p className="text-xs text-slate-400">
                গ্রাহক ওয়েবসাইটে এই তথ্যগুলো সরাসরি প্রদর্শিত হবে।
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">প্ল্যানের নাম *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: ৩০ দিন মান্থলি"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">মেয়াদ (দিন) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">মেয়াদ লেবেল</label>
                  <input
                    type="text"
                    value={durationLabel}
                    onChange={(e) => setDurationLabel(e.target.value)}
                    placeholder="যেমন: ৩০ দিন"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">মূল্য (টাকা / BDT) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={priceBdt}
                    onChange={(e) => setPriceBdt(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">সাজানোর ক্রম</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">সংক্ষিপ্ত বিবরণ</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="যেমন: মাসিক সেরা ভ্যালু প্ল্যান, সবচেয়ে জনপ্রিয় প্যাকেজ"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  ফিচারসমূহ (প্রতি লাইনে একটি করে লিখুন)
                </label>
                <textarea
                  rows={4}
                  value={featuresStr}
                  onChange={(e) => setFeaturesStr(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Toggles */}
              <div className="pt-2 flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400"
                  />
                  <span className="text-white font-medium">প্ল্যান সক্রিয় রাখুন</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400"
                  />
                  <span className="text-white font-medium">জনপ্রিয় ব্যাজ প্রদর্শন করুন</span>
                </label>
              </div>

              {/* Submit button */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
