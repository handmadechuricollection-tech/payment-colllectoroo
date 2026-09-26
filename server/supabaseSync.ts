import { Order, AccountProvisioning, db } from './db.js';

const DEFAULT_SUPABASE_URL = 'https://jzuckoovjyskadsbpuda.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dWNrb292anlza2Fkc2JwdWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MjIwMTEsImV4cCI6MjEwNTk5ODAxMX0.dMGndDS-Yk0c_UDpNw6oeokyn5eDnkLybCb4FTxeoJM';

function getSupabaseConfig() {
  return {
    url: process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY,
  };
}

/**
 * Upsert an Order record into Supabase customer_orders table
 */
export async function syncOrderToSupabase(order: Order): Promise<boolean> {
  const { url, key } = getSupabaseConfig();

  const payload = {
    id: order.id,
    customer_name: order.customer_name,
    customer_contact: order.customer_contact,
    preferred_username: order.preferred_username || null,
    plan_id: order.plan_id,
    plan_name: order.plan_name,
    amount: order.amount_bdt,
    trx_id: order.payment_id || null,
    gateway: order.payment_method || null,
    status: order.status,
    payment_status: order.payment_status,
    updated_at: order.updated_at || new Date().toISOString(),
  };

  try {
    const res = await fetch(`${url}/rest/v1/customer_orders`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn(`[Supabase Sync] Failed to sync order ${order.id}:`, res.status, err);
      return false;
    }

    return true;
  } catch (err: any) {
    console.warn(`[Supabase Sync] Network error syncing order ${order.id}:`, err.message);
    return false;
  }
}

/**
 * Sync / insert a VLE Account into Supabase vle_accounts table
 */
export async function syncAccountToSupabase(account: AccountProvisioning): Promise<boolean> {
  const { url, key } = getSupabaseConfig();

  // First check if an account with this order_id already exists to prevent duplicate rows
  try {
    const checkRes = await fetch(
      `${url}/rest/v1/vle_accounts?order_id=eq.${encodeURIComponent(account.order_id)}&select=id`,
      {
        method: 'GET',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      }
    );

    let existingId: string | null = null;
    if (checkRes.ok) {
      const existing: any[] = await checkRes.json();
      if (existing && existing.length > 0) {
        existingId = existing[0].id;
      }
    }

    const payload: any = {
      order_id: account.order_id,
      customer_name: account.customer_name,
      username: account.username,
      password_preview: account.password_preview,
      plan_name: account.plan_name,
      duration_days: account.duration_days,
      account_status: account.account_status,
      subscription_start: account.subscription_start || null,
      subscription_end: account.subscription_end || null,
    };

    if (existingId) {
      // Update existing record
      const patchRes = await fetch(`${url}/rest/v1/vle_accounts?id=eq.${existingId}`, {
        method: 'PATCH',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      return patchRes.ok;
    } else {
      // Insert new record
      const postRes = await fetch(`${url}/rest/v1/vle_accounts`, {
        method: 'POST',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      return postRes.ok;
    }
  } catch (err: any) {
    console.warn(`[Supabase Sync] Network error syncing VLE account for order ${account.order_id}:`, err.message);
    return false;
  }
}

/**
 * Sync all existing orders and VLE accounts to Supabase
 */
export async function syncAllExistingToSupabase(): Promise<{ ordersSynced: number; accountsSynced: number }> {
  const { orders } = db.getAllOrders();
  const accounts = db.getAllProvisionings();

  let ordersSynced = 0;
  let accountsSynced = 0;

  for (const order of orders) {
    const success = await syncOrderToSupabase(order);
    if (success) ordersSynced++;
  }

  for (const account of accounts) {
    const success = await syncAccountToSupabase(account);
    if (success) accountsSynced++;
  }

  console.log(`[Supabase Initial Sync] Synced ${ordersSynced}/${orders.length} orders, ${accountsSynced}/${accounts.length} accounts.`);
  return { ordersSynced, accountsSynced };
}
