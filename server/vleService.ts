import crypto from 'crypto';
import { db, AccountProvisioning } from './db.js';
import { syncAccountToSupabase } from './supabaseSync.js';

export interface VLEAccountCreationParams {
  order_id: string;
  payment_id: string;
  plan_id: string;
  plan_name: string;
  duration_days: number;
  customer_name: string;
  preferred_username?: string;
}

export interface VLEAccountCreationResult {
  success: boolean;
  account_status: 'account_created' | 'account_failed';
  username: string;
  password?: string;
  subscription_start: string;
  subscription_end: string;
  vle_response: any;
  error?: string;
}

/**
 * Generate clean username from customer name or preferred username
 */
function generateUsername(customerName: string, preferred?: string): string {
  if (preferred && preferred.trim().length >= 3) {
    const sanitized = preferred.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (sanitized.length >= 3) return sanitized;
  }
  const cleanName = customerName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 8);
  const base = cleanName || 'vle_user';
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${base}_${rand}`;
}

/**
 * Generate secure high-entropy random password for the user's VLE subscription
 */
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let pass = '';
  const bytes = crypto.randomBytes(12);
  for (let i = 0; i < 12; i++) {
    pass += chars[bytes[i] % chars.length];
  }
  return pass;
}

/**
 * Core Account Provisioning Service Abstraction: createVLEAccount
 * Designed for future real VLE Player API connection via HTTP/Webhook.
 */
export async function createVLEAccount(params: VLEAccountCreationParams): Promise<AccountProvisioning> {
  const settings = db.getSettings();
  const vleApiUrl = process.env.VLE_API_URL || settings.vle_api_url;
  const vleApiSecret = process.env.VLE_API_SECRET;

  const now = new Date();
  const startDate = now.toISOString();
  const endDate = new Date(now.getTime() + params.duration_days * 24 * 60 * 60 * 1000).toISOString();

  const username = generateUsername(params.customer_name, params.preferred_username);
  const password = generateSecurePassword();

  // Initial state: account_creating
  let provisioningRecord = db.saveProvisioning({
    order_id: params.order_id,
    order_uuid: params.order_id,
    customer_name: params.customer_name,
    username,
    password_preview: password, // For display on verified checkout success
    plan_id: params.plan_id,
    plan_name: params.plan_name,
    duration_days: params.duration_days,
    account_status: 'account_creating',
    retry_count: 0,
    subscription_start: startDate,
    subscription_end: endDate,
  });

  // Future external VLE Player API connection check
  if (vleApiUrl && vleApiUrl.startsWith('http')) {
    try {
      console.log(`[VLE Provisioning] Calling external VLE API: ${vleApiUrl}/accounts/provision`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${vleApiUrl}/accounts/provision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${vleApiSecret || ''}`,
          'X-VLE-Signature': crypto
            .createHmac('sha256', vleApiSecret || 'vle_default_key')
            .update(JSON.stringify({ order_id: params.order_id, username }))
            .digest('hex'),
        },
        body: JSON.stringify({
          order_id: params.order_id,
          payment_id: params.payment_id,
          plan_id: params.plan_id,
          customer_name: params.customer_name,
          username,
          password,
          subscription_start: startDate,
          subscription_end: endDate,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const resData = await response.json().catch(() => ({}));

      if (response.ok) {
        db.updateProvisioning(provisioningRecord.id, {
          account_status: 'account_created',
          vle_response: {
            status_code: response.status,
            data: resData,
            connected: true,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        db.updateProvisioning(provisioningRecord.id, {
          account_status: 'account_failed',
          vle_response: {
            status_code: response.status,
            error: resData,
            connected: true,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (err: any) {
      console.warn('[VLE Provisioning] API call failed or timed out:', err.message);
      db.updateProvisioning(provisioningRecord.id, {
        account_status: 'account_failed',
        vle_response: {
          error: err.message,
          note: 'VLE Player API endpoint unreachable or timed out. Retry available in Admin Panel.',
          timestamp: new Date().toISOString(),
        },
      });
    }
  } else {
    // VLE API is not configured yet. Complete provisioning internally so users can obtain valid credentials immediately.
    db.updateProvisioning(provisioningRecord.id, {
      account_status: 'account_created',
      vle_response: {
        mode: 'standalone_provisioning',
        note: 'Internal account credentials generated. Ready for VLE Player activation.',
        provisioned_at: new Date().toISOString(),
      },
    });
  }

  const finalRecord = db.getProvisioningById(provisioningRecord.id)!;
  syncAccountToSupabase(finalRecord).catch(console.error);

  return finalRecord;
}

/**
 * Retry account provisioning from admin panel or automated worker
 */
export async function retryVLEAccount(provisioningId: string): Promise<{ success: boolean; record: AccountProvisioning; message: string }> {
  const record = db.getProvisioningById(provisioningId);
  if (!record) {
    throw new Error('প্রোভিশনিং রেকর্ড পাওয়া যায়নি');
  }

  const settings = db.getSettings();
  const vleApiUrl = process.env.VLE_API_URL || settings.vle_api_url;
  const vleApiSecret = process.env.VLE_API_SECRET;

  const currentRetry = (record.retry_count || 0) + 1;
  db.updateProvisioning(record.id, {
    account_status: 'account_creating',
    retry_count: currentRetry,
    last_retry_at: new Date().toISOString(),
  });

  if (vleApiUrl && vleApiUrl.startsWith('http')) {
    try {
      const response = await fetch(`${vleApiUrl}/accounts/provision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${vleApiSecret || ''}`,
        },
        body: JSON.stringify({
          order_id: record.order_id,
          username: record.username,
          password: record.password_preview,
          plan_id: record.plan_id,
          subscription_start: record.subscription_start,
          subscription_end: record.subscription_end,
        }),
      });

      const resData = await response.json().catch(() => ({}));

      if (response.ok) {
        const updated = db.updateProvisioning(record.id, {
          account_status: 'account_created',
          vle_response: {
            retry_success: true,
            status_code: response.status,
            data: resData,
            timestamp: new Date().toISOString(),
          },
        })!;
        return { success: true, record: updated, message: 'অ্যাকাউন্ট সফলভাবে প্রস্তুত ও কানেক্ট হয়েছে।' };
      } else {
        const updated = db.updateProvisioning(record.id, {
          account_status: 'account_failed',
          vle_response: {
            retry_attempt: currentRetry,
            status_code: response.status,
            error: resData,
            timestamp: new Date().toISOString(),
          },
        })!;
        return { success: false, record: updated, message: 'VLE সার্ভার থেকে ত্রুটি এসেছে।' };
      }
    } catch (err: any) {
      const updated = db.updateProvisioning(record.id, {
        account_status: 'account_failed',
        vle_response: {
          retry_attempt: currentRetry,
          error: err.message,
          timestamp: new Date().toISOString(),
        },
      })!;
      return { success: false, record: updated, message: `সার্ভার সংযোগ ত্রুটি: ${err.message}` };
    }
  } else {
    // Offline simulation/ready
    const updated = db.updateProvisioning(record.id, {
      account_status: 'account_created',
      vle_response: {
        retry_success: true,
        mode: 'standalone_provisioning',
        note: 'ক্রেডেনশিয়াল নিশ্চিত করা হয়েছে।',
        timestamp: new Date().toISOString(),
      },
    })!;
    return { success: true, record: updated, message: 'অ্যাকাউন্ট সফলভাবে রিফ্রেশ ও প্রস্তুত হয়েছে।' };
  }
}
