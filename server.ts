import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { db } from './server/db.js';
import { getPaymentGateway, SandboxPaymentGateway } from './server/paymentGateway.js';
import { createVLEAccount, retryVLEAccount } from './server/vleService.js';
import {
  verifyPaymentWithSupabase,
  simulateSmsPayment,
  getRecentSupabaseSms,
} from './server/supabasePayment.js';
import { syncOrderToSupabase, syncAllExistingToSupabase } from './server/supabaseSync.js';
import {
  requireAdminAuth,
  checkLoginRateLimit,
  recordLoginAttempt,
  generateAdminToken,
} from './server/adminAuth.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Capture raw body for webhook HMAC signature verification
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString('utf-8');
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Normalize URL for Vercel Serverless Function rewrites if /api prefix is stripped
app.use((req, _res, next) => {
  if (
    !req.url.startsWith('/api') &&
    ['/plans', '/settings', '/order', '/payment', '/admin', '/status', '/track'].some((prefix) =>
      req.url.startsWith(prefix)
    )
  ) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  next();
});

// ==========================================
// 1. PUBLIC API ROUTES
// ==========================================

// Get active subscription plans for user-facing website
app.get('/api/plans', (_req: Request, res: Response) => {
  try {
    const plans = db.getPlans(true);
    res.json({ success: true, plans });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'প্ল্যান লোড করতে সমস্যা হয়েছে' });
  }
});

// Get public site branding and settings
app.get('/api/settings/public', (_req: Request, res: Response) => {
  try {
    const settings = db.getSettings();
    res.json({
      success: true,
      settings: {
        site_name: settings.site_name,
        support_phone: settings.support_phone,
        support_whatsapp: settings.support_whatsapp,
        support_email: settings.support_email,
        vle_player_url: settings.vle_player_url,
        payment_instructions_bn: settings.payment_instructions_bn,
        payment_mode: settings.payment_mode,
        bkash_number: settings.bkash_number || '01700-000000',
        nagad_number: settings.nagad_number || '01700-000000',
        rocket_number: settings.rocket_number || '01700-000000',
        telegram_support_link: settings.telegram_support_link || 'https://t.me/admin_support',
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'সেটিংস লোড করা যায়নি' });
  }
});

// Create new customer order
app.post('/api/order/create', (req: Request, res: Response) => {
  try {
    const { customer_name, customer_contact, plan_id, preferred_username } = req.body;

    if (!customer_name || typeof customer_name !== 'string' || customer_name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'দয়া করে আপনার সঠিক নাম প্রদান করুন।' });
    }

    if (!customer_contact || typeof customer_contact !== 'string' || customer_contact.trim().length < 6) {
      return res.status(400).json({ success: false, error: 'দয়া করে সঠিক মোবাইল নম্বর অথবা ইমেইল প্রদান করুন।' });
    }

    if (!plan_id) {
      return res.status(400).json({ success: false, error: 'একটি সাবস্ক্রিপশন প্ল্যান নির্বাচন করুন।' });
    }

    const plan = db.getPlanById(plan_id);
    if (!plan || !plan.is_active) {
      return res.status(400).json({ success: false, error: 'নির্বাচিত প্ল্যানটি বর্তমানে উপলব্ধ নেই।' });
    }

    const order = db.createOrder({
      plan_id: plan.id,
      customer_name,
      customer_contact,
      preferred_username,
    });

    // Asynchronously sync order to Supabase customer_orders table
    syncOrderToSupabase(order).catch(console.error);

    res.json({
      success: true,
      order: {
        id: order.id,
        order_uuid: order.order_uuid,
        plan_id: order.plan_id,
        plan_name: order.plan_name,
        duration_days: order.duration_days,
        amount_bdt: order.amount_bdt,
        customer_name: order.customer_name,
        customer_contact: order.customer_contact,
        preferred_username: order.preferred_username,
        status: order.status,
        payment_status: order.payment_status,
        created_at: order.created_at,
      },
    });
  } catch (err: any) {
    console.error('Order creation error:', err);
    res.status(500).json({ success: false, error: err.message || 'অর্ডার তৈরি করা সম্ভব হয়নি।' });
  }
});

// Get order details & status
app.get('/api/order/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const order = db.getOrderByIdOrUuid(id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'অর্ডার খুঁজে পাওয়া যায়নি।' });
    }

    // Get provisioning info if order is paid
    const provisioning = db.getProvisioningByOrderId(order.id);
    const payment = db.getPaymentByOrderId(order.id);

    res.json({
      success: true,
      order: {
        id: order.id,
        order_uuid: order.order_uuid,
        plan_id: order.plan_id,
        plan_name: order.plan_name,
        duration_days: order.duration_days,
        amount_bdt: order.amount_bdt,
        customer_name: order.customer_name,
        customer_contact: order.customer_contact,
        preferred_username: order.preferred_username,
        status: order.status,
        payment_status: order.payment_status,
        payment_id: order.payment_id,
        payment_method: order.payment_method,
        created_at: order.created_at,
        updated_at: order.updated_at,
      },
      provisioning: provisioning
        ? {
            account_status: provisioning.account_status,
            username: provisioning.username,
            password: provisioning.account_status === 'account_created' ? provisioning.password_preview : undefined,
            subscription_start: provisioning.subscription_start,
            subscription_end: provisioning.subscription_end,
            updated_at: provisioning.updated_at,
          }
        : null,
      payment: payment
        ? {
            gateway_transaction_id: payment.gateway_transaction_id,
            gateway_name: payment.gateway_name,
            amount_bdt: payment.amount_bdt,
            created_at: payment.created_at,
          }
        : null,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'অর্ডার বিবরণ লোড করা যায়নি।' });
  }
});

// Initialize payment session with gateway
app.post('/api/payment/create', async (req: Request, res: Response) => {
  try {
    const { order_id } = req.body;
    if (!order_id) {
      return res.status(400).json({ success: false, error: 'Order ID প্রয়োজন।' });
    }

    const order = db.getOrderByIdOrUuid(order_id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'অর্ডার খুঁজে পাওয়া যায়নি।' });
    }

    if (order.payment_status === 'paid') {
      return res.status(400).json({ success: false, error: 'এই অর্ডারটি ইতিমধ্যেই পরিশোধিত।' });
    }

    // Set order status to processing
    db.updateOrderStatus(order.id, 'processing', 'processing');

    const origin = req.protocol + '://' + req.get('host');
    const gateway = getPaymentGateway();
    const session = await gateway.createSession(order, origin);

    res.json({
      success: true,
      session,
    });
  } catch (err: any) {
    console.error('Payment init error:', err);
    res.status(500).json({ success: false, error: err.message || 'পেমেন্ট গেটওয়ে শুরু করা সম্ভব হয়নি।' });
  }
});

// Real Gateway Webhook endpoint - SERVER-SIDE VERIFICATION & IDEMPOTENCY
app.post('/api/payment/webhook', async (req: Request, res: Response) => {
  try {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const signature =
      (req.headers['x-webhook-signature'] as string) ||
      (req.headers['x-signature'] as string) ||
      (req.body && req.body.signature) ||
      '';

    const gateway = getPaymentGateway();

    // 1. Signature Verification
    const isValidSignature = gateway.verifySignature(rawBody, signature);
    if (!isValidSignature) {
      console.warn('[Webhook Security Alert] Invalid webhook signature received.');
      return res.status(401).json({ success: false, error: 'Invalid webhook signature' });
    }

    // 2. Parse payload
    const parsed = gateway.parseWebhook(req.body);
    const idempotencyKey = `WH_${parsed.event_id}_${parsed.order_id}`;

    // 3. Idempotency Check
    const existingEvent = db.getWebhookEvent(idempotencyKey);
    if (existingEvent) {
      console.log(`[Webhook Idempotency] Duplicate event detected: ${idempotencyKey}`);
      return res.status(200).json({ success: true, message: 'Event already processed' });
    }

    // 4. Server-Side Validation: Match Order & Amount
    const order = db.getOrderByIdOrUuid(parsed.order_id);
    if (!order) {
      console.warn(`[Webhook Alert] Order not found for id: ${parsed.order_id}`);
      db.recordWebhookEvent({
        event_id: parsed.event_id,
        idempotency_key: idempotencyKey,
        gateway_name: gateway.name,
        event_type: 'payment_notification',
        payload: req.body,
        status: 'failed',
        processed_at: new Date().toISOString(),
      });
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Server-side amount validation against database price
    if (order.amount_bdt !== parsed.amount) {
      console.error(
        `[Webhook Security Alert] Amount tampering detected! Order amount: ${order.amount_bdt}, Paid: ${parsed.amount}`
      );
      db.updateOrderStatus(order.id, 'failed', 'failed', parsed.gateway_tx_id, parsed.payment_method);
      db.recordWebhookEvent({
        event_id: parsed.event_id,
        idempotency_key: idempotencyKey,
        gateway_name: gateway.name,
        event_type: 'amount_mismatch',
        payload: req.body,
        status: 'failed',
        processed_at: new Date().toISOString(),
      });
      return res.status(400).json({ success: false, error: 'Amount mismatch' });
    }

    // 5. Process Payment State
    if (parsed.status === 'PAID') {
      // Mark as PAID
      db.updateOrderStatus(order.id, 'paid', 'paid', parsed.gateway_tx_id, parsed.payment_method);

      // Record in payments table
      db.recordPayment({
        order_id: order.id,
        order_uuid: order.order_uuid,
        gateway_transaction_id: parsed.gateway_tx_id,
        amount_bdt: parsed.amount,
        currency: parsed.currency,
        gateway_name: gateway.name,
        payment_status: 'PAID',
        signature,
        raw_payload: req.body,
      });

      // Record webhook event as processed
      db.recordWebhookEvent({
        event_id: parsed.event_id,
        idempotency_key: idempotencyKey,
        gateway_name: gateway.name,
        event_type: 'payment_success',
        payload: req.body,
        status: 'processed',
        processed_at: new Date().toISOString(),
      });

      console.log(`[Payment Success] Order ${order.id} marked as PAID. Triggering VLE account provisioning.`);

      // 6. Trigger Future VLE Account Creation Service
      try {
        await createVLEAccount({
          order_id: order.id,
          payment_id: parsed.gateway_tx_id,
          plan_id: order.plan_id,
          plan_name: order.plan_name,
          duration_days: order.duration_days,
          customer_name: order.customer_name,
          preferred_username: order.preferred_username,
        });
      } catch (err: any) {
        console.error('Account provisioning error:', err);
      }

      return res.status(200).json({
        success: true,
        order_id: order.id,
        status: 'PAID',
        message: 'Payment verified and processed successfully',
      });
    } else {
      // Failed or cancelled
      db.updateOrderStatus(order.id, 'failed', 'failed', parsed.gateway_tx_id, parsed.payment_method);
      db.recordPayment({
        order_id: order.id,
        order_uuid: order.order_uuid,
        gateway_transaction_id: parsed.gateway_tx_id,
        amount_bdt: parsed.amount,
        currency: parsed.currency,
        gateway_name: gateway.name,
        payment_status: 'FAILED',
        signature,
        raw_payload: req.body,
      });
      db.recordWebhookEvent({
        event_id: parsed.event_id,
        idempotency_key: idempotencyKey,
        gateway_name: gateway.name,
        event_type: 'payment_failed',
        payload: req.body,
        status: 'processed',
        processed_at: new Date().toISOString(),
      });

      return res.status(200).json({
        success: true,
        order_id: order.id,
        status: 'FAILED',
      });
    }
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ success: false, error: 'Webhook processing error' });
  }
});

// Check payment status endpoint
app.get('/api/payment/status', (req: Request, res: Response) => {
  try {
    const orderId = req.query.order_id as string;
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'order_id প্রয়োজন' });
    }

    const order = db.getOrderByIdOrUuid(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'অর্ডার পাওয়া যায়নি' });
    }

    const provisioning = db.getProvisioningByOrderId(order.id);

    res.json({
      success: true,
      order_id: order.id,
      payment_status: order.payment_status,
      status: order.status,
      account_status: provisioning ? provisioning.account_status : 'account_pending',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'স্ট্যাটাস চেক ব্যর্থ হয়েছে' });
  }
});

// Sandbox gateway helper: sends verified HMAC signed webhook to simulate real payment
app.post('/api/payment/simulate-sandbox-callback', async (req: Request, res: Response) => {
  try {
    const { order_id, payment_id, action, payment_method } = req.body;
    const order = db.getOrderByIdOrUuid(order_id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'অর্ডার পাওয়া যায়নি' });
    }

    const secret = process.env.WEBHOOK_SECRET || 'vle_default_sandbox_secret_2026';
    const eventId = `EVT_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const payload = {
      event_id: eventId,
      order_id: order.id,
      gateway_transaction_id: payment_id || `SANDBOX_TX_${Date.now()}`,
      amount: order.amount_bdt,
      currency: 'BDT',
      status: action === 'success' ? 'PAID' : 'FAILED',
      payment_method: payment_method || 'bKash (Sandbox)',
      timestamp: new Date().toISOString(),
    };

    const rawBody = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    // Call webhook internally with exact HMAC signature
    const origin = req.protocol + '://' + req.get('host');
    const webhookRes = await fetch(`${origin}/api/payment/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
      },
      body: rawBody,
    });

    const result = await webhookRes.json();
    res.json({ success: true, webhook_result: result });
  } catch (err: any) {
    console.error('Sandbox callback simulation error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Verify bKash / Nagad / Rocket payment SMS via Supabase
app.post('/api/payment/verify-sms', async (req: Request, res: Response) => {
  try {
    const { order_id, trx_id, gateway } = req.body;

    if (!order_id) {
      return res.status(400).json({ success: false, error: 'Order ID প্রয়োজন।' });
    }

    if (!trx_id || typeof trx_id !== 'string' || !trx_id.trim()) {
      return res.status(400).json({
        success: false,
        error: 'অনুগ্রহ করে সঠিক Transaction ID (TrxID) প্রদান করুন।',
      });
    }

    const verificationResult = await verifyPaymentWithSupabase(order_id, trx_id, gateway);

    if (verificationResult.success) {
      return res.json({
        success: true,
        verified: true,
        order_id: verificationResult.order_id,
        trx_id: verificationResult.trx_id,
        gateway: verificationResult.gateway,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: verificationResult.error || 'ভেরিফিকেশন সম্পন্ন হয়নি।',
        code: verificationResult.code,
      });
    }
  } catch (err: any) {
    console.error('Verify SMS route error:', err);
    res.status(500).json({
      success: false,
      error: 'পেমেন্ট ভেরিফিকেশনে সার্ভার ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
    });
  }
});

// Helper endpoint for instant testing / demo flow with Supabase
app.post('/api/payment/simulate-sms', async (req: Request, res: Response) => {
  try {
    const { order_id, gateway } = req.body;
    if (!order_id) {
      return res.status(400).json({ success: false, error: 'Order ID প্রয়োজন।' });
    }

    const simResult = await simulateSmsPayment(order_id, gateway);
    if (!simResult.success) {
      return res.status(400).json(simResult);
    }

    res.json(simResult);
  } catch (err: any) {
    console.error('Simulate SMS route error:', err);
    res.status(500).json({ success: false, error: err.message || 'টেস্ট এসএমএস সিমুলেশন ব্যর্থ হয়েছে।' });
  }
});

// Helper endpoint to check recent SMS records in Supabase
app.get('/api/payment/recent-sms', async (_req: Request, res: Response) => {
  try {
    const records = await getRecentSupabaseSms(5);
    res.json({ success: true, records });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2. ADMIN AUTH & PROTECTED APIS
// ==========================================

// Admin Login
app.post('/api/admin/login', (req: Request, res: Response) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const rateCheck = checkLoginRateLimit(clientIp);

    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: `অনেকবার ভুল চেষ্টা করা হয়েছে। অনুগ্রহ করে ${rateCheck.waitSec || 900} সেকেন্ড পর আবার চেষ্টা করুন।`,
      });
    }

    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'ইউজারনেম এবং পাসওয়ার্ড প্রদান করুন।' });
    }

    const user = db.getAdminByUsername(username);
    if (!user) {
      recordLoginAttempt(clientIp, false);
      return res.status(401).json({ success: false, error: 'ভুল ইউজারনেম বা পাসওয়ার্ড।' });
    }

    const isValid = db.verifyPassword(user, password);
    if (!isValid) {
      recordLoginAttempt(clientIp, false);
      return res.status(401).json({ success: false, error: 'ভুল ইউজারনেম বা পাসওয়ার্ড।' });
    }

    recordLoginAttempt(clientIp, true);
    const token = generateAdminToken(user);

    res.json({
      success: true,
      token,
      admin: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, error: 'লগইন প্রক্রিয়ায় সমস্যা হয়েছে।' });
  }
});

// Admin Me
app.get('/api/admin/me', requireAdminAuth, (req: Request, res: Response) => {
  const session = (req as any).adminSession;
  res.json({ success: true, admin: session });
});

// Admin Dashboard stats
app.get('/api/admin/dashboard', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const stats = db.getDashboardStats();
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ড্যাশবোর্ড ডেটা লোড করা যায়নি' });
  }
});

// Admin Orders list with filtering, searching, pagination
app.get('/api/admin/orders', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { status, search, startDate, endDate, page, limit } = req.query;
    const result = db.getAllOrders({
      status: status as string,
      search: search as string,
      startDate: startDate as string,
      endDate: endDate as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 15,
    });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'অর্ডার তালিকা লোড করা যায়নি' });
  }
});

// Admin Order details
app.get('/api/admin/orders/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const order = db.getOrderByIdOrUuid(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'অর্ডার পাওয়া যায়নি' });
    }
    const payment = db.getPaymentByOrderId(order.id);
    const provisioning = db.getProvisioningByOrderId(order.id);
    const notes = db.getAdminNotesByOrderId(order.id);

    res.json({
      success: true,
      order,
      payment: payment || null,
      provisioning: provisioning || null,
      notes,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'অর্ডার বিবরণ পাওয়া যায়নি' });
  }
});

// Admin Add Note to Order
app.post('/api/admin/orders/:id/notes', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { note } = req.body;
    if (!note || typeof note !== 'string' || !note.trim()) {
      return res.status(400).json({ success: false, error: 'নোট লিখুন' });
    }
    const session = (req as any).adminSession;
    const added = db.addAdminNote(req.params.id, session.username, note.trim());
    res.json({ success: true, note: added });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'নোট যোগ করা যায়নি' });
  }
});

// Admin Plans list (all active and inactive)
app.get('/api/admin/plans', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const plans = db.getPlans(false);
    res.json({ success: true, plans });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'প্ল্যান তালিকা পাওয়া যায়নি' });
  }
});

// Admin Create Plan
app.post('/api/admin/plans', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { name, duration_days, duration_label, price_bdt, description, features, is_active, sort_order, is_popular } =
      req.body;

    if (!name || !duration_days || !price_bdt) {
      return res.status(400).json({ success: false, error: 'নাম, মেয়াদ এবং মূল্য আবশ্যক।' });
    }

    const created = db.createPlan({
      name,
      duration_days: Number(duration_days),
      duration_label: duration_label || `${duration_days} দিন`,
      price_bdt: Number(price_bdt),
      description: description || '',
      features: Array.isArray(features) ? features : [],
      is_active: is_active !== false,
      sort_order: Number(sort_order) || 1,
      is_popular: !!is_popular,
    });

    res.json({ success: true, plan: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Update Plan
app.put('/api/admin/plans/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const updated = db.updatePlan(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'প্ল্যান পাওয়া যায়নি' });
    }
    res.json({ success: true, plan: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Delete Plan
app.delete('/api/admin/plans/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const deleted = db.deletePlan(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'প্ল্যান পাওয়া যায়নি' });
    }
    res.json({ success: true, message: 'প্ল্যান মুছে ফেলা হয়েছে' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Account Provisioning History
app.get('/api/admin/provisioning', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const list = db.getAllProvisionings();
    res.json({ success: true, provisionings: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'প্রোভিশনিং ইতিহাস পাওয়া যায়নি' });
  }
});

// Admin Retry Account Provisioning
app.post('/api/admin/provisioning/:id/retry', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const result = await retryVLEAccount(req.params.id);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Settings
app.get('/api/admin/settings', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const settings = db.getSettings();
    res.json({
      success: true,
      settings: {
        ...settings,
        // Mask confidential values for security
        gateway_key_configured: !!process.env.PAYMENT_GATEWAY_KEY,
        gateway_secret_configured: !!process.env.PAYMENT_GATEWAY_SECRET,
        webhook_secret_configured: !!process.env.WEBHOOK_SECRET,
        vle_api_secret_configured: !!process.env.VLE_API_SECRET,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'সেটিংস পাওয়া যায়নি' });
  }
});

// Admin Update Settings
app.put('/api/admin/settings', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const {
      site_name,
      support_phone,
      support_whatsapp,
      support_email,
      vle_player_url,
      payment_mode,
      active_gateway,
      payment_instructions_bn,
      vle_api_url,
      bkash_number,
      nagad_number,
      rocket_number,
    } = req.body;

    const updated = db.updateSettings({
      site_name,
      support_phone,
      support_whatsapp,
      support_email,
      vle_player_url,
      payment_mode,
      active_gateway,
      payment_instructions_bn,
      vle_api_url,
      bkash_number,
      nagad_number,
      rocket_number,
    });

    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Change Password
app.put('/api/admin/change-password', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const session = (req as any).adminSession;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password || new_password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।',
      });
    }

    const admin = db.getAdminById(session.userId);
    if (!admin) {
      return res.status(404).json({ success: false, error: 'এডমিন পাওয়া যায়নি' });
    }

    const isCurrentValid = db.verifyPassword(admin, current_password);
    if (!isCurrentValid) {
      return res.status(400).json({ success: false, error: 'বর্তমান পাসওয়ার্ড সঠিক নয়।' });
    }

    db.updateAdminPassword(admin.id, new_password);
    res.json({ success: true, message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 3. VITE DEV SERVER / PRODUCTION STATIC
// ==========================================

async function startServer() {
  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VLE Server] Running on http://0.0.0.0:${PORT} (${isProd ? 'Production' : 'Development'})`);
    // Sync existing orders and credentials to Supabase
    syncAllExistingToSupabase().catch(console.error);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
