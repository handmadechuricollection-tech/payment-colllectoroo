import React, { useState, useEffect } from 'react';
import { Plan, SiteSettings } from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { PlansSection } from './components/PlansSection';
import { CheckoutModal } from './components/CheckoutModal';
import { SuccessPage } from './components/SuccessPage';
import { TrackOrderModal } from './components/TrackOrderModal';
import { Footer } from './components/Footer';
import { AdminLayout } from './admin/AdminLayout';

export default function App() {
  // Navigation / Route state
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);

  // Data states
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  // Modals & Flow states
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<Plan | null>(null);
  const [trackModalOpen, setTrackModalOpen] = useState(false);

  // Sync route on popstate and query params
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      setCurrentPath(path);

      // Check URL query parameters for direct order success link e.g. ?order_id=...
      const params = new URLSearchParams(window.location.search);
      const urlOrderId = params.get('order_id');
      if (urlOrderId) {
        setSuccessOrderId(urlOrderId);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    handleLocationChange();

    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Fetch initial plans and settings
  useEffect(() => {
    loadPublicData();
  }, []);

  const loadPublicData = async () => {
    try {
      setLoadingPlans(true);
      const [fetchedPlans, fetchedSettings] = await Promise.all([
        api.getPlans(),
        api.getPublicSettings(),
      ]);
      setPlans(fetchedPlans);
      setSettings(fetchedSettings);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const handlePaymentSuccess = (orderId: string) => {
    setSelectedPlanForCheckout(null);
    setSuccessOrderId(orderId);
    window.history.pushState({}, '', `/?order_id=${encodeURIComponent(orderId)}`);
  };

  const handleBackToHome = () => {
    setSuccessOrderId(null);
    window.history.pushState({}, '', '/');
    loadPublicData();
  };

  // Render Hidden Admin Panel if route is /admin
  if (currentPath === '/admin' || currentPath.startsWith('/admin/')) {
    return <AdminLayout onBackToSite={() => navigateTo('/')} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* 1. Simple Header */}
      <Header onOpenTrack={() => setTrackModalOpen(true)} />

      {/* 2. Main Content View */}
      <main className="flex-1">
        {successOrderId ? (
          /* Payment Success & Account Credentials View */
          <SuccessPage orderId={successOrderId} onBackToHome={handleBackToHome} />
        ) : (
          /* Direct, Normal View: Instruction & Plans List */
          <PlansSection
            plans={plans}
            loading={loadingPlans}
            onSelectPlan={(plan) => setSelectedPlanForCheckout(plan)}
          />
        )}
      </main>

      {/* 3. Simple Minimal Footer */}
      <Footer settings={settings} onOpenTrack={() => setTrackModalOpen(true)} />

      {/* 4. Checkout Modal with Supabase bKash/Nagad TrxID verification */}
      {selectedPlanForCheckout && (
        <CheckoutModal
          plan={selectedPlanForCheckout}
          settings={settings}
          onClose={() => setSelectedPlanForCheckout(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* 5. Track Order Modal */}
      {trackModalOpen && (
        <TrackOrderModal
          onClose={() => setTrackModalOpen(false)}
          onViewSuccess={(orderId) => {
            setTrackModalOpen(false);
            setSuccessOrderId(orderId);
            window.history.pushState({}, '', `/?order_id=${encodeURIComponent(orderId)}`);
          }}
        />
      )}
    </div>
  );
}
