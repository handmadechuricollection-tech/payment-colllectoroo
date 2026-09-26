import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  salt: string;
  role: 'super_admin' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  duration_days: number;
  duration_label: string;
  price_bdt: number;
  description: string;
  features: string[];
  is_active: boolean;
  sort_order: number;
  is_popular?: boolean;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'expired';

export interface Order {
  id: string; // Readable format e.g. VLE-2026-94812
  order_uuid: string;
  plan_id: string;
  plan_name: string;
  duration_days: number;
  amount_bdt: number;
  customer_name: string;
  customer_contact: string;
  preferred_username?: string;
  status: OrderStatus;
  payment_status: OrderStatus;
  payment_id?: string;
  payment_method?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  order_uuid: string;
  gateway_transaction_id: string;
  amount_bdt: number;
  currency: string;
  gateway_name: string;
  payment_status: 'PAID' | 'FAILED' | 'PENDING';
  signature?: string;
  raw_payload?: any;
  created_at: string;
  updated_at: string;
}

export type AccountProvisioningStatus = 'account_pending' | 'account_creating' | 'account_created' | 'account_failed';

export interface AccountProvisioning {
  id: string;
  order_id: string;
  order_uuid: string;
  customer_name: string;
  username: string;
  password_preview: string; // Generated masked secure access credential
  plan_id: string;
  plan_name: string;
  duration_days: number;
  account_status: AccountProvisioningStatus;
  vle_response?: any;
  retry_count: number;
  last_retry_at?: string;
  subscription_start?: string;
  subscription_end?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminNote {
  id: string;
  order_id: string;
  admin_username: string;
  note: string;
  created_at: string;
}

export interface SiteSettings {
  site_name: string;
  support_phone: string;
  support_whatsapp: string;
  support_email: string;
  vle_player_url: string;
  payment_mode: 'sandbox' | 'live';
  active_gateway: 'sandbox' | 'bkash' | 'nagad' | 'sslcommerz' | 'generic';
  payment_instructions_bn: string;
  vle_api_url: string;
  telegram_support_link?: string;
  bkash_number?: string;
  nagad_number?: string;
  rocket_number?: string;
  vle_api_secret_configured: boolean;
  webhook_secret_configured: boolean;
  gateway_key_configured: boolean;
}

export interface WebhookEvent {
  id: string;
  event_id: string;
  idempotency_key: string;
  gateway_name: string;
  event_type: string;
  payload: any;
  status: 'processed' | 'duplicate' | 'failed';
  processed_at: string;
  created_at: string;
}

export interface DatabaseSchema {
  admin_users: AdminUser[];
  plans: Plan[];
  orders: Order[];
  payments: Payment[];
  account_provisioning: AccountProvisioning[];
  admin_notes: AdminNote[];
  site_settings: SiteSettings;
  webhook_events: WebhookEvent[];
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DB_DIR, 'vle_database.json');

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function getInitialData(): DatabaseSchema {
  const adminSalt = crypto.randomBytes(16).toString('hex');
  const defaultAdminPass = process.env.ADMIN_DEFAULT_PASSWORD || 'admin@vle2026#secure';
  const adminHash = hashPassword(defaultAdminPass, adminSalt);
  const now = new Date().toISOString();

  return {
    admin_users: [
      {
        id: crypto.randomUUID(),
        username: 'admin',
        email: 'admin@vleplayer.com',
        password_hash: adminHash,
        salt: adminSalt,
        role: 'super_admin',
        created_at: now,
        updated_at: now,
      },
    ],
    plans: [
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
        created_at: now,
        updated_at: now,
      },
      {
        id: 'plan_15d',
        name: '১৫ দিন রেগুলার',
        duration_days: 15,
        duration_label: '১৫ দিন',
        price_bdt: 49,
        description: 'পাক্ষিক সাবস্ক্রিপশন, নিয়মিত ভিউয়ারদের জন্য উপযুক্ত',
        features: [
          'হাই-স্পিড বাফারিং-মুক্ত স্ট্রিমিং',
          'ফুল এইচডি ও অরিজিনাল সাউন্ড',
          'সিঙ্গেল ডিভাইস সাপোর্ট',
          'তাৎক্ষণিক অ্যাকাউন্ট অ্যাক্টিভেশন',
        ],
        is_active: true,
        sort_order: 2,
        is_popular: false,
        created_at: now,
        updated_at: now,
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
        created_at: now,
        updated_at: now,
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
        created_at: now,
        updated_at: now,
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
          'প্রাইমারি প্রোভিশনিং ও ডেডিকেটেড সাপোর্ট',
        ],
        is_active: true,
        sort_order: 5,
        is_popular: true,
        created_at: now,
        updated_at: now,
      },
    ],
    orders: [],
    payments: [],
    account_provisioning: [],
    admin_notes: [],
    site_settings: {
      site_name: 'VLE Player - অফিসিয়াল পেমেন্ট পোর্টাল',
      support_phone: '+880 1700-000000',
      support_whatsapp: '+880 1700-000000',
      support_email: 'support@vleplayer.com',
      vle_player_url: 'https://vleplayer.com/login',
      telegram_support_link: process.env.TELEGRAM_SUPPORT_LINK || 'https://t.me/admin_support',
      payment_mode: 'sandbox',
      active_gateway: 'sandbox',
      bkash_number: '01700-000000',
      nagad_number: '01700-000000',
      rocket_number: '01700-000000',
      payment_instructions_bn: 'পেমেন্ট সম্পন্ন করার পর কয়েক সেকেন্ডের মধ্যে স্বয়ংক্রিয়ভাবে আপনার অ্যাকাউন্ট ও লগইন তথ্য প্রস্তুত হবে।',
      vle_api_url: process.env.VLE_API_URL || '',
      vle_api_secret_configured: !!process.env.VLE_API_SECRET,
      webhook_secret_configured: !!process.env.WEBHOOK_SECRET,
      gateway_key_configured: !!process.env.PAYMENT_GATEWAY_KEY,
    },
    webhook_events: [],
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure all arrays exist
        if (!this.data.admin_users) this.data.admin_users = [];
        if (!this.data.plans) this.data.plans = [];
        if (!this.data.orders) this.data.orders = [];
        if (!this.data.payments) this.data.payments = [];
        if (!this.data.account_provisioning) this.data.account_provisioning = [];
        if (!this.data.admin_notes) this.data.admin_notes = [];
        if (!this.data.webhook_events) this.data.webhook_events = [];
        if (!this.data.site_settings) this.data.site_settings = getInitialData().site_settings;
      } catch (err) {
        console.error('Error reading db file, re-initializing', err);
        this.data = getInitialData();
        this.save();
      }
    } else {
      this.data = getInitialData();
      this.save();
    }
  }

  private save() {
    try {
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (e) {
      console.error('DB save error:', e);
    }
  }

  // Admin users
  getAdminByUsername(username: string): AdminUser | undefined {
    return this.data.admin_users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  getAdminById(id: string): AdminUser | undefined {
    return this.data.admin_users.find((u) => u.id === id);
  }

  updateAdminPassword(id: string, newPassword: string): boolean {
    const admin = this.getAdminById(id);
    if (!admin) return false;
    const newSalt = crypto.randomBytes(16).toString('hex');
    admin.password_hash = hashPassword(newPassword, newSalt);
    admin.salt = newSalt;
    admin.updated_at = new Date().toISOString();
    this.save();
    return true;
  }

  verifyPassword(user: AdminUser, plain: string): boolean {
    const testHash = hashPassword(plain, user.salt);
    return testHash === user.password_hash;
  }

  // Plans
  getPlans(onlyActive = true): Plan[] {
    const list = onlyActive ? this.data.plans.filter((p) => p.is_active) : [...this.data.plans];
    return list.sort((a, b) => a.sort_order - b.sort_order);
  }

  getPlanById(id: string): Plan | undefined {
    return this.data.plans.find((p) => p.id === id);
  }

  createPlan(planData: Omit<Plan, 'id' | 'created_at' | 'updated_at'>): Plan {
    const now = new Date().toISOString();
    const newPlan: Plan = {
      ...planData,
      id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: now,
      updated_at: now,
    };
    this.data.plans.push(newPlan);
    this.save();
    return newPlan;
  }

  updatePlan(id: string, updates: Partial<Plan>): Plan | null {
    const idx = this.data.plans.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.data.plans[idx] = {
      ...this.data.plans[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.plans[idx];
  }

  deletePlan(id: string): boolean {
    const idx = this.data.plans.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    // Soft delete or remove
    this.data.plans.splice(idx, 1);
    this.save();
    return true;
  }

  // Orders
  createOrder(data: {
    plan_id: string;
    customer_name: string;
    customer_contact: string;
    preferred_username?: string;
  }): Order {
    const plan = this.getPlanById(data.plan_id);
    if (!plan) throw new Error('প্ল্যান খুঁজে পাওয়া যায়নি');

    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderId = `VLE-${new Date().getFullYear()}-${randomSuffix}`;
    const now = new Date().toISOString();

    const order: Order = {
      id: orderId,
      order_uuid: crypto.randomUUID(),
      plan_id: plan.id,
      plan_name: plan.name,
      duration_days: plan.duration_days,
      amount_bdt: plan.price_bdt, // Always trusted from database!
      customer_name: data.customer_name.trim(),
      customer_contact: data.customer_contact.trim(),
      preferred_username: data.preferred_username?.trim() || undefined,
      status: 'pending',
      payment_status: 'pending',
      created_at: now,
      updated_at: now,
    };

    this.data.orders.push(order);
    this.save();
    return order;
  }

  getOrderByIdOrUuid(idOrUuid: string): Order | undefined {
    return this.data.orders.find((o) => o.id === idOrUuid || o.order_uuid === idOrUuid);
  }

  updateOrderStatus(orderId: string, status: OrderStatus, paymentStatus: OrderStatus, paymentId?: string, paymentMethod?: string): Order | null {
    const order = this.getOrderByIdOrUuid(orderId);
    if (!order) return null;

    order.status = status;
    order.payment_status = paymentStatus;
    if (paymentId) order.payment_id = paymentId;
    if (paymentMethod) order.payment_method = paymentMethod;
    order.updated_at = new Date().toISOString();
    this.save();
    return order;
  }

  getAllOrders(options?: {
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): { orders: Order[]; total: number; page: number; totalPages: number } {
    let list = [...this.data.orders];

    if (options?.status && options.status !== 'all') {
      list = list.filter((o) => o.payment_status.toLowerCase() === options.status?.toLowerCase());
    }

    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_contact.toLowerCase().includes(q) ||
          (o.preferred_username && o.preferred_username.toLowerCase().includes(q)) ||
          (o.payment_id && o.payment_id.toLowerCase().includes(q))
      );
    }

    if (options?.startDate) {
      const start = new Date(options.startDate).getTime();
      list = list.filter((o) => new Date(o.created_at).getTime() >= start);
    }

    if (options?.endDate) {
      const end = new Date(options.endDate).getTime();
      list = list.filter((o) => new Date(o.created_at).getTime() <= end);
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = list.length;
    const page = Math.max(1, options?.page || 1);
    const limit = Math.max(1, options?.limit || 15);
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return { orders: paginated, total, page, totalPages };
  }

  // Payments
  recordPayment(paymentData: Omit<Payment, 'id' | 'created_at' | 'updated_at'>): Payment {
    const now = new Date().toISOString();
    const payment: Payment = {
      ...paymentData,
      id: `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      created_at: now,
      updated_at: now,
    };
    this.data.payments.push(payment);
    this.save();
    return payment;
  }

  getPaymentByOrderId(orderId: string): Payment | undefined {
    return this.data.payments.find((p) => p.order_id === orderId || p.order_uuid === orderId);
  }

  // Account Provisioning
  getProvisioningByOrderId(orderId: string): AccountProvisioning | undefined {
    return this.data.account_provisioning.find((p) => p.order_id === orderId || p.order_uuid === orderId);
  }

  getProvisioningById(id: string): AccountProvisioning | undefined {
    return this.data.account_provisioning.find((p) => p.id === id);
  }

  saveProvisioning(record: Omit<AccountProvisioning, 'id' | 'created_at' | 'updated_at'>): AccountProvisioning {
    const existing = this.getProvisioningByOrderId(record.order_id);
    const now = new Date().toISOString();

    if (existing) {
      Object.assign(existing, record, { updated_at: now });
      this.save();
      return existing;
    }

    const created: AccountProvisioning = {
      ...record,
      id: `PROV-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: now,
      updated_at: now,
    };
    this.data.account_provisioning.push(created);
    this.save();
    return created;
  }

  updateProvisioning(id: string, updates: Partial<AccountProvisioning>): AccountProvisioning | null {
    const item = this.getProvisioningById(id);
    if (!item) return null;
    Object.assign(item, updates, { updated_at: new Date().toISOString() });
    this.save();
    return item;
  }

  getAllProvisionings(): AccountProvisioning[] {
    return [...this.data.account_provisioning].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Admin notes
  addAdminNote(orderId: string, adminUsername: string, note: string): AdminNote {
    const entry: AdminNote = {
      id: crypto.randomUUID(),
      order_id: orderId,
      admin_username: adminUsername,
      note,
      created_at: new Date().toISOString(),
    };
    this.data.admin_notes.push(entry);
    this.save();
    return entry;
  }

  getAdminNotesByOrderId(orderId: string): AdminNote[] {
    return this.data.admin_notes.filter((n) => n.order_id === orderId).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Webhook Events (Idempotency)
  getWebhookEvent(idempotencyKey: string): WebhookEvent | undefined {
    return this.data.webhook_events.find((e) => e.idempotency_key === idempotencyKey);
  }

  recordWebhookEvent(event: Omit<WebhookEvent, 'id' | 'created_at'>): WebhookEvent {
    const entry: WebhookEvent = {
      ...event,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    this.data.webhook_events.push(entry);
    this.save();
    return entry;
  }

  // Settings
  getSettings(): SiteSettings {
    const s = this.data.site_settings || {} as SiteSettings;
    return {
      ...s,
      bkash_number: s.bkash_number || '01912-345678',
      nagad_number: s.nagad_number || '01712-345678',
      rocket_number: s.rocket_number || '01812-345678',
    };
  }

  updateSettings(updates: Partial<SiteSettings>): SiteSettings {
    this.data.site_settings = {
      ...this.data.site_settings,
      ...updates,
    };
    this.save();
    return this.data.site_settings;
  }

  // Dashboard Stats
  getDashboardStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const orders = this.data.orders;
    const totalOrders = orders.length;
    const todayOrders = orders.filter((o) => new Date(o.created_at).getTime() >= todayStart).length;
    const paidOrders = orders.filter((o) => o.payment_status === 'paid').length;
    const pendingOrders = orders.filter((o) => o.payment_status === 'pending' || o.payment_status === 'processing').length;
    const failedOrders = orders.filter((o) => o.payment_status === 'failed' || o.payment_status === 'cancelled').length;

    const totalRevenueBDT = orders
      .filter((o) => o.payment_status === 'paid')
      .reduce((sum, o) => sum + (o.amount_bdt || 0), 0);

    const activePlans = this.data.plans.filter((p) => p.is_active).length;

    const prov = this.data.account_provisioning;
    const accountSuccess = prov.filter((p) => p.account_status === 'account_created').length;
    const accountFailed = prov.filter((p) => p.account_status === 'account_failed').length;

    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8);

    return {
      totalOrders,
      todayOrders,
      paidOrders,
      pendingOrders,
      failedOrders,
      totalRevenueBDT,
      activePlans,
      accountSuccess,
      accountFailed,
      recentOrders,
    };
  }
}

export const db = new Database();
