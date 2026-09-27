import { Plan, Order, AccountProvisioning, DashboardStats, SiteSettings, AdminUser } from '../types';

const ADMIN_TOKEN_KEY = 'vle_admin_token';

export const authStorage = {
  getToken: () => localStorage.getItem(ADMIN_TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(ADMIN_TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(ADMIN_TOKEN_KEY),
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = authStorage.getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'অনুরোধ সম্পন্ন করা যায়নি');
  }

  return data;
}

const DEFAULT_FALLBACK_PLANS: Plan[] = [
  {
    id: 'plan_7d',
    name: '৭ দিন আনলিমিটেড',
    duration_days: 7,
    duration_label: '৭ দিন',
    price_bdt: 30,
    description: 'অল্প সময়ের জন্য ট্রায়াল বা দ্রুত অ্যাক্সেসের সেরা প্ল্যান',
    features: [
      'হাই-স্পিড ভিডিও স্ট্রিমিং',
      'ফুল এইচডি (1080p) প্লেব্যাক',
      'সিঙ্গেল ডিভাইস সাপোর্ট',
      '২৪/৭ কাস্টমার সাপোর্ট',
    ],
    is_active: true,
    sort_order: 1,
    is_popular: false,
  },
  {
    id: 'plan_15d',
    name: '১৫ দিন স্পেশাল',
    duration_days: 15,
    duration_label: '১৫ দিন',
    price_bdt: 50,
    description: 'পাক্ষিক সেরা প্যাকেজ, বাজেট ফ্রেন্ডলি সাবস্ক্রিপশন',
    features: [
      'হাই-স্পিড বাফারিং-মুক্ত স্ট্রিমিং',
      'ফুল এইচডি ও অরিজিনাল সাউন্ড',
      'সিঙ্গেল ডিভাইস সাপোর্ট',
      'তাৎক্ষণিক অ্যাকাউন্ট অ্যাক্টিভেশন',
    ],
    is_active: true,
    sort_order: 2,
    is_popular: false,
  },
  {
    id: 'plan_30d',
    name: '৩০ দিন মান্থলি',
    duration_days: 30,
    duration_label: '৩০ দিন',
    price_bdt: 80,
    description: 'মাসিক সেরা ভ্যালু প্ল্যান, সবচেয়ে জনপ্রিয় প্যাকেজ',
    features: [
      'আল্ট্রা এইচডি (4K/1080p) সাপোর্ট',
      'সীমাহীন স্ট্রিমিং ও প্লেলিস্ট',
      'মাল্টিপল ফরম্যাট সাপোর্ট (HLS/DASH)',
      'অগ্রাধিকার গ্রাহক সহায়তা',
    ],
    is_active: true,
    sort_order: 3,
    is_popular: true,
  },
  {
    id: 'plan_6m',
    name: '৬ মাস প্রিমিয়াম',
    duration_days: 180,
    duration_label: '৬ মাস',
    price_bdt: 280,
    description: 'অর্ধবার্ষিক প্রিমিয়াম সেভার প্যাক, বাড়তি সাশ্রয়',
    features: [
      'সর্বোচ্চ গতি ও নো-বাফারিং গ্যারান্টি',
      '৪কে আল্ট্রা এইচডি ও ডলবি অডিও',
      'যেকোনো ডিভাইসে সিমলেস সুইচিং',
      'ভিআইপি কাস্টমার সাপোর্ট',
    ],
    is_active: true,
    sort_order: 4,
    is_popular: false,
  },
  {
    id: 'plan_1y',
    name: '১ বছর / ৩৫৬ দিন আল্টিমেট',
    duration_days: 356,
    duration_label: '১ বছর (৩৫৬ দিন)',
    price_bdt: 499,
    description: 'সারা বছরের জন্য নিশ্চিন্ত সম্পূর্ণ ভিআইপি সাবস্ক্রিপশন',
    features: [
      '৩৫৬ দিন ফুল ভিআইপি এক্সেস',
      'সর্বোচ্চ সাশ্রয়ী প্ল্যান',
      'আনলিমিটেড ব্যান্ডউইথ ও হাই-রেজুলেশন',
      '২৪/৭ ডেডিকেটেড ভিআইপি সাপোর্ট',
    ],
    is_active: true,
    sort_order: 5,
    is_popular: true,
  },
];

const DEFAULT_FALLBACK_SETTINGS: SiteSettings = {
  site_name: 'VLE Player - অফিসিয়াল পেমেন্ট পোর্টাল',
  support_phone: '+880 1700-000000',
  support_whatsapp: '+880 1700-000000',
  support_email: 'support@vleplayer.com',
  vle_player_url: 'https://vleplayer.com/login',
  telegram_support_link: 'https://t.me/admin_support',
  payment_mode: 'live',
  active_gateway: 'bkash',
  bkash_number: '01923361996',
  nagad_number: '01341723065',
  rocket_number: '01341723065',
  payment_instructions_bn: 'পেমেন্ট সম্পন্ন করার পর কয়েক সেকেন্ডের মধ্যে স্বয়ংক্রিয়ভাবে আপনার অ্যাকাউন্ট ও লগইন তথ্য প্রস্তুত হবে।',
  vle_api_url: '',
};

export const api = {
  // Public
  getPlans: async (): Promise<Plan[]> => {
    try {
      const res = await request<{ success: boolean; plans: Plan[] }>('/api/plans');
      if (res && res.plans && res.plans.length > 0) {
        return res.plans;
      }
      return DEFAULT_FALLBACK_PLANS;
    } catch (err) {
      console.warn('[API] Could not fetch plans from server, using default plans:', err);
      return DEFAULT_FALLBACK_PLANS;
    }
  },

  getPublicSettings: async (): Promise<SiteSettings> => {
    try {
      const res = await request<{ success: boolean; settings: SiteSettings }>('/api/settings/public');
      return res.settings || DEFAULT_FALLBACK_SETTINGS;
    } catch (err) {
      console.warn('[API] Could not fetch settings from server, using default settings:', err);
      return DEFAULT_FALLBACK_SETTINGS;
    }
  },

  createOrder: async (data: {
    customer_name: string;
    customer_contact: string;
    plan_id: string;
    preferred_username?: string;
  }): Promise<Order> => {
    const res = await request<{ success: boolean; order: Order }>('/api/order/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.order;
  },

  getOrder: async (
    id: string
  ): Promise<{ order: Order; provisioning: AccountProvisioning | null; payment: any }> => {
    return request(`/api/order/${encodeURIComponent(id)}`);
  },

  createPayment: async (orderId: string): Promise<{ payment_id: string; redirect_url: string; amount: number }> => {
    const res = await request<{ success: boolean; session: any }>('/api/payment/create', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId }),
    });
    return res.session;
  },

  getPaymentStatus: async (
    orderId: string
  ): Promise<{ order_id: string; status: string; payment_status: string; account_status: string }> => {
    return request(`/api/payment/status?order_id=${encodeURIComponent(orderId)}`);
  },

  verifyPaymentSms: async (data: {
    order_id: string;
    trx_id: string;
    gateway?: string;
  }): Promise<{ success: boolean; verified: boolean; order_id: string; trx_id: string; gateway?: string; code?: string }> => {
    return request('/api/payment/verify-sms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  simulateSmsPayment: async (data: {
    order_id: string;
    gateway?: string;
  }): Promise<{ success: boolean; trx_id: string; amount: number; gateway: string }> => {
    return request('/api/payment/simulate-sms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getRecentSms: async (): Promise<{ success: boolean; records: any[] }> => {
    return request('/api/payment/recent-sms');
  },

  simulateSandboxCallback: async (data: {
    order_id: string;
    payment_id: string;
    action: 'success' | 'failed';
    payment_method: string;
  }) => {
    return request('/api/payment/simulate-sandbox-callback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Admin
  adminLogin: async (credentials: { username: string; password: string }) => {
    const res = await request<{ success: boolean; token: string; admin: AdminUser }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    authStorage.setToken(res.token);
    return res;
  },

  adminMe: async (): Promise<AdminUser> => {
    const res = await request<{ success: boolean; admin: AdminUser }>('/api/admin/me');
    return res.admin;
  },

  adminLogout: () => {
    authStorage.clearToken();
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await request<{ success: boolean; stats: DashboardStats }>('/api/admin/dashboard');
    return res.stats;
  },

  getAdminOrders: async (params?: {
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    return request<{ success: boolean; orders: Order[]; total: number; page: number; totalPages: number }>(
      `/api/admin/orders?${query.toString()}`
    );
  },

  getAdminOrderDetails: async (id: string) => {
    return request<{ success: boolean; order: Order; payment: any; provisioning: AccountProvisioning | null; notes: any[] }>(
      `/api/admin/orders/${encodeURIComponent(id)}`
    );
  },

  addAdminNote: async (orderId: string, note: string) => {
    return request(`/api/admin/orders/${encodeURIComponent(orderId)}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },

  getAdminPlans: async (): Promise<Plan[]> => {
    const res = await request<{ success: boolean; plans: Plan[] }>('/api/admin/plans');
    return res.plans;
  },

  createPlan: async (planData: Partial<Plan>) => {
    return request<{ success: boolean; plan: Plan }>('/api/admin/plans', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  },

  updatePlan: async (id: string, updates: Partial<Plan>) => {
    return request<{ success: boolean; plan: Plan }>(`/api/admin/plans/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deletePlan: async (id: string) => {
    return request<{ success: boolean }>(`/api/admin/plans/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  getAdminProvisionings: async (): Promise<AccountProvisioning[]> => {
    const res = await request<{ success: boolean; provisionings: AccountProvisioning[] }>('/api/admin/provisioning');
    return res.provisionings;
  },

  retryProvisioning: async (id: string) => {
    return request<{ success: boolean; result: any }>(`/api/admin/provisioning/${encodeURIComponent(id)}/retry`, {
      method: 'POST',
    });
  },

  getAdminSettings: async (): Promise<SiteSettings> => {
    const res = await request<{ success: boolean; settings: SiteSettings }>('/api/admin/settings');
    return res.settings;
  },

  updateAdminSettings: async (settings: Partial<SiteSettings>) => {
    return request<{ success: boolean; settings: SiteSettings }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  changeAdminPassword: async (currentPassword: string, newPassword: string) => {
    return request<{ success: boolean; message: string }>('/api/admin/change-password', {
      method: 'PUT',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
  },
};
