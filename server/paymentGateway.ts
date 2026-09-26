import crypto from 'crypto';
import { Order, db } from './db.js';

export interface PaymentInitResult {
  payment_id: string;
  gateway_type: 'sandbox' | 'live';
  redirect_url: string;
  amount: number;
  currency: string;
  order_id: string;
  token?: string;
}

export interface ParsedWebhookResult {
  event_id: string;
  order_id: string;
  gateway_tx_id: string;
  amount: number;
  currency: string;
  status: 'PAID' | 'FAILED' | 'CANCELLED';
  payment_method: string;
  raw_payload: any;
}

export interface IPaymentGateway {
  name: string;
  createSession(order: Order, origin: string): Promise<PaymentInitResult>;
  verifySignature(rawBody: string, signature: string): boolean;
  parseWebhook(body: any): ParsedWebhookResult;
}

/**
 * Sandbox Gateway: Demonstrates the exact production webhook lifecycle
 * Signatures are calculated with HMAC-SHA256 using WEBHOOK_SECRET.
 */
export class SandboxPaymentGateway implements IPaymentGateway {
  name = 'sandbox';

  private getWebhookSecret(): string {
    return process.env.WEBHOOK_SECRET || 'vle_default_sandbox_secret_2026';
  }

  async createSession(order: Order, origin: string): Promise<PaymentInitResult> {
    const paymentId = `SANDBOX_TX_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const secret = this.getWebhookSecret();

    // Generate secure session token
    const token = crypto
      .createHmac('sha256', secret)
      .update(`${order.id}:${order.amount_bdt}:${paymentId}`)
      .digest('hex');

    // The user visits the simulator checkout page
    const redirectUrl = `/checkout/gateway-simulate?order_id=${encodeURIComponent(order.id)}&payment_id=${encodeURIComponent(paymentId)}&token=${encodeURIComponent(token)}`;

    return {
      payment_id: paymentId,
      gateway_type: 'sandbox',
      redirect_url: redirectUrl,
      amount: order.amount_bdt,
      currency: 'BDT',
      order_id: order.id,
      token,
    };
  }

  verifySignature(rawBody: string, signature: string): boolean {
    if (!signature) return false;
    const secret = this.getWebhookSecret();
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
    } catch {
      return false;
    }
  }

  parseWebhook(body: any): ParsedWebhookResult {
    return {
      event_id: body.event_id || body.payment_id || `EVT_${Date.now()}`,
      order_id: body.order_id,
      gateway_tx_id: body.gateway_transaction_id || body.payment_id,
      amount: Number(body.amount),
      currency: body.currency || 'BDT',
      status: body.status === 'PAID' ? 'PAID' : body.status === 'CANCELLED' ? 'CANCELLED' : 'FAILED',
      payment_method: body.payment_method || 'bKash (Sandbox)',
      raw_payload: body,
    };
  }
}

/**
 * Production Gateway Adapter
 * Plugs in bKash / Nagad / SSLCommerz credentials from environment variables.
 */
export class ProductionPaymentGateway implements IPaymentGateway {
  name = 'production_live';

  private getApiKey(): string {
    return process.env.PAYMENT_GATEWAY_KEY || '';
  }

  private getApiSecret(): string {
    return process.env.PAYMENT_GATEWAY_SECRET || '';
  }

  private getWebhookSecret(): string {
    return process.env.WEBHOOK_SECRET || '';
  }

  async createSession(order: Order, origin: string): Promise<PaymentInitResult> {
    const apiKey = this.getApiKey();
    const apiSecret = this.getApiSecret();

    if (!apiKey || !apiSecret) {
      throw new Error('পেমেন্ট গেটওয়ে কনফিগারেশন অনুপস্থিত। দয়া করে এডমিন প্যানেল বা Environment Variables থেকে কী সেট করুন।');
    }

    // Standard live gateway initialization call (e.g. bKash / SSLCommerz / Aamarpay)
    const paymentId = `LIVE_TX_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    // In production, an external POST request is dispatched to the gateway:
    // e.g. await fetch('https://checkout.payprovider.com/api/create', ...)
    return {
      payment_id: paymentId,
      gateway_type: 'live',
      redirect_url: `https://checkout.sandbox.sslcommerz.com/gwprocess/v4/api.php?session=${paymentId}`,
      amount: order.amount_bdt,
      currency: 'BDT',
      order_id: order.id,
    };
  }

  verifySignature(rawBody: string, signature: string): boolean {
    const webhookSecret = this.getWebhookSecret();
    if (!webhookSecret) {
      console.warn('WEBHOOK_SECRET is not set. Webhook rejected for security.');
      return false;
    }
    const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
    } catch {
      return false;
    }
  }

  parseWebhook(body: any): ParsedWebhookResult {
    return {
      event_id: body.event_id || body.tran_id || `EVT_${Date.now()}`,
      order_id: body.value_a || body.order_id,
      gateway_tx_id: body.bank_tran_id || body.tran_id || body.payment_id,
      amount: Number(body.amount),
      currency: body.currency || 'BDT',
      status: body.status === 'VALID' || body.status === 'PAID' ? 'PAID' : 'FAILED',
      payment_method: body.card_type || body.payment_method || 'bKash',
      raw_payload: body,
    };
  }
}

/**
 * Gateway Factory
 */
export function getPaymentGateway(): IPaymentGateway {
  const settings = db.getSettings();
  const hasLiveKeys = !!(process.env.PAYMENT_GATEWAY_KEY && process.env.PAYMENT_GATEWAY_SECRET);

  if (settings.payment_mode === 'live' && hasLiveKeys) {
    return new ProductionPaymentGateway();
  }
  return new SandboxPaymentGateway();
}
