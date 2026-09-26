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
}

export type OrderStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'expired';

export interface Order {
  id: string;
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

export type AccountProvisioningStatus = 'account_pending' | 'account_creating' | 'account_created' | 'account_failed';

export interface AccountProvisioning {
  id: string;
  order_id: string;
  customer_name: string;
  username: string;
  password?: string;
  password_preview?: string;
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

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface SiteSettings {
  site_name: string;
  support_phone: string;
  support_whatsapp: string;
  support_email: string;
  vle_player_url: string;
  payment_mode: 'sandbox' | 'live';
  active_gateway: string;
  payment_instructions_bn: string;
  vle_api_url: string;
  telegram_support_link?: string;
  bkash_number?: string;
  nagad_number?: string;
  rocket_number?: string;
  gateway_key_configured?: boolean;
  gateway_secret_configured?: boolean;
  webhook_secret_configured?: boolean;
  vle_api_secret_configured?: boolean;
}

export interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  paidOrders: number;
  pendingOrders: number;
  failedOrders: number;
  totalRevenueBDT: number;
  activePlans: number;
  accountSuccess: number;
  accountFailed: number;
  recentOrders: Order[];
}
