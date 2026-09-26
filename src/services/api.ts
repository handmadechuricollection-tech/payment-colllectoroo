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

export const api = {
  // Public
  getPlans: async (): Promise<Plan[]> => {
    const res = await request<{ success: boolean; plans: Plan[] }>('/api/plans');
    return res.plans;
  },

  getPublicSettings: async (): Promise<SiteSettings> => {
    const res = await request<{ success: boolean; settings: SiteSettings }>('/api/settings/public');
    return res.settings;
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
