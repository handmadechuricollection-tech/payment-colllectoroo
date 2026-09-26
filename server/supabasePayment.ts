import { db } from './db.js';
import { createVLEAccount } from './vleService.js';
import { syncOrderToSupabase } from './supabaseSync.js';

const DEFAULT_SUPABASE_URL = 'https://jzuckoovjyskadsbpuda.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dWNrb292anlza2Fkc2JwdWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MjIwMTEsImV4cCI6MjEwNTk5ODAxMX0.dMGndDS-Yk0c_UDpNw6oeokyn5eDnkLybCb4FTxeoJM';

export interface VerifySmsResult {
  success: boolean;
  verified?: boolean;
  order_id?: string;
  trx_id?: string;
  error?: string;
  gateway?: string;
  code?: string;
}

export async function verifyPaymentWithSupabase(
  orderId: string,
  rawTrxId: string,
  gatewayInput?: string
): Promise<VerifySmsResult> {
  const cleanTrxId = rawTrxId.replace(/\s+/g, '').trim().toUpperCase();
  if (!cleanTrxId) {
    return { success: false, error: 'অনুগ্রহ করে সঠিক Transaction ID (TrxID) লিখুন।' };
  }

  const order = db.getOrderByIdOrUuid(orderId);
  if (!order) {
    return { success: false, error: 'অর্ডারটি খুঁজে পাওয়া যায়নি।' };
  }

  if (order.payment_status === 'paid') {
    return {
      success: true,
      verified: true,
      order_id: order.id,
      trx_id: cleanTrxId,
      gateway: order.payment_method,
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  try {
    // 1. Query Supabase for payments matching this trx_id using case-insensitive 'ilike'
    let records: any[] = [];

    const directQueryUrl = `${supabaseUrl}/rest/v1/payment_sms?trx_id=ilike.${encodeURIComponent(
      cleanTrxId
    )}&order=created_at.desc&limit=5`;

    const response = await fetch(directQueryUrl, {
      method: 'GET',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      records = await response.json();
    }

    // Fallback: If not found in trx_id column, search inside raw_message text
    if (!records || records.length === 0) {
      const rawMsgQueryUrl = `${supabaseUrl}/rest/v1/payment_sms?raw_message=ilike.*${encodeURIComponent(
        cleanTrxId
      )}*&order=created_at.desc&limit=5`;

      const rawMsgRes = await fetch(rawMsgQueryUrl, {
        method: 'GET',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (rawMsgRes.ok) {
        records = await rawMsgRes.json();
      }
    }

    // 2. Check if records found
    if (records && records.length > 0) {
      // Find an unverified record (where status is NOT 'verified')
      const unverifiedRecord = records.find(
        (r) => !r.status || r.status.toLowerCase() !== 'verified'
      );

      if (!unverifiedRecord) {
        // All records with this TrxID are already verified
        return {
          success: false,
          error: 'এই ট্রানজেকশন আইডিটি ইতিমধ্যে ব্যবহৃত ও ভেরিফাই হয়ে গেছে। নতুন পেমেন্টের TrxID দিন।',
          code: 'ALREADY_VERIFIED',
        };
      }

      const paymentRecord = unverifiedRecord;
      const paidAmount = Number(paymentRecord.amount);
      const orderAmount = Number(order.amount_bdt);

      // Verify customer paid sufficient amount (paidAmount >= orderAmount)
      if (paidAmount < orderAmount - 0.01) {
        console.warn(
          `[Supabase SMS] Insufficient Amount! Order: ${orderAmount}, Paid: ${paidAmount}, TrxID: ${cleanTrxId}`
        );
        return {
          success: false,
          error: `পেমেন্টের পরিমাণ কম হয়েছে। আপনার প্ল্যানের নির্ধারিত মূল্য ৳${orderAmount}, কিন্তু SMS-এ প্রাপ্ত পেমেন্ট ৳${paidAmount}।`,
          code: 'AMOUNT_MISMATCH',
        };
      }

      // 3. Mark status in Supabase as 'verified' via PATCH (using row id or trx_id)
      const patchUrl = paymentRecord.id
        ? `${supabaseUrl}/rest/v1/payment_sms?id=eq.${paymentRecord.id}`
        : `${supabaseUrl}/rest/v1/payment_sms?trx_id=ilike.${encodeURIComponent(cleanTrxId)}`;

      const patchRes = await fetch(patchUrl, {
        method: 'PATCH',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ status: 'verified' }),
      });

      if (!patchRes.ok) {
        console.error('[Supabase SMS Patch Error]:', patchRes.status, await patchRes.text());
      }

      const gatewayName = paymentRecord.gateway || gatewayInput || 'BKASH';
      const finalTrxId = paymentRecord.trx_id || cleanTrxId;

      // 4. Mark Order as Paid in local database
      db.updateOrderStatus(order.id, 'paid', 'paid', finalTrxId, gatewayName);
      const paidOrder = db.getOrderByIdOrUuid(order.id);
      if (paidOrder) {
        syncOrderToSupabase(paidOrder).catch(console.error);
      }
      db.recordPayment({
        order_id: order.id,
        order_uuid: order.order_uuid,
        gateway_transaction_id: finalTrxId,
        amount_bdt: orderAmount,
        currency: 'BDT',
        gateway_name: gatewayName,
        payment_status: 'PAID',
        raw_payload: paymentRecord,
      });

      console.log(
        `[Supabase SMS Verified] Order ${order.id} verified via SMS TrxID: ${finalTrxId}. Triggering VLE account provisioning.`
      );

      // 5. Trigger VLE Account Provisioning Service
      try {
        await createVLEAccount({
          order_id: order.id,
          payment_id: finalTrxId,
          plan_id: order.plan_id,
          plan_name: order.plan_name,
          duration_days: order.duration_days,
          customer_name: order.customer_name,
          preferred_username: order.preferred_username,
        });
      } catch (err: any) {
        console.error('Account provisioning error:', err);
      }

      return {
        success: true,
        verified: true,
        order_id: order.id,
        trx_id: finalTrxId,
        gateway: gatewayName,
      };
    }

    // 4. If TrxID not found in Supabase yet
    return {
      success: false,
      error: 'আপনার ট্রানজেকশন আইডি এখনো প্রসেস হয়নি, ৩০ সেকেন্ড পর আবার চেষ্টা করুন বা সঠিক TrxID দিন।',
      code: 'TRX_NOT_FOUND',
    };
  } catch (err: any) {
    console.error('[Supabase SMS Verify Exception]:', err);
    return {
      success: false,
      error: 'পেমেন্ট সার্ভারের সাথে সংযোগে সাময়িক সমস্যা হয়েছে। ৩০ সেকেন্ড পর আবার চেষ্টা করুন।',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Helper to simulate an incoming payment SMS into Supabase for test orders
 */
export async function simulateSmsPayment(orderId: string, gatewayInput?: string): Promise<{
  success: boolean;
  trx_id?: string;
  amount?: number;
  gateway?: string;
  error?: string;
}> {
  const order = db.getOrderByIdOrUuid(orderId);
  if (!order) {
    return { success: false, error: 'অর্ডারটি খুঁজে পাওয়া যায়নি।' };
  }

  const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  const gateway = (gatewayInput || 'BKASH').toUpperCase();
  const prefix = gateway.startsWith('NAG') ? 'NG' : gateway.startsWith('ROC') ? 'RK' : 'BK';
  const randomSuffix = Math.floor(10000000 + Math.random() * 90000000);
  const testTrxId = `${prefix}${randomSuffix}`;

  const payload = {
    trx_id: testTrxId,
    amount: order.amount_bdt,
    sender: order.customer_contact || '01711000000',
    gateway: gateway,
    raw_message: `You have received Tk ${order.amount_bdt}.00 from ${order.customer_contact || '01711000000'}. TrxID ${testTrxId}`,
    status: 'pending',
  };

  try {
    const postRes = await fetch(`${supabaseUrl}/rest/v1/payment_sms`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    });

    if (!postRes.ok) {
      const err = await postRes.text();
      console.error('[Simulate SMS Error]:', postRes.status, err);
      return { success: false, error: 'টেস্ট এসএমএস পাঠাতে ব্যর্থ হয়েছে।' };
    }

    return {
      success: true,
      trx_id: testTrxId,
      amount: order.amount_bdt,
      gateway: gateway,
    };
  } catch (err: any) {
    console.error('[Simulate SMS Exception]:', err);
    return { success: false, error: err.message || 'টেস্ট এসএমএস পাঠানো যায়নি।' };
  }
}

/**
 * Fetch recent pending SMS from Supabase for live inspection/troubleshooting
 */
export async function getRecentSupabaseSms(limit: number = 5): Promise<any[]> {
  const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/payment_sms?select=id,trx_id,amount,gateway,status,created_at&order=created_at.desc&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('getRecentSupabaseSms error:', err);
    return [];
  }
}
