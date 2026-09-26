import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { db, AdminUser } from './db.js';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'vle_admin_master_secret_2026_super_secure_98317';

export interface AdminSession {
  userId: string;
  username: string;
  role: string;
  expiresAt: number;
}

// Simple in-memory rate-limiter for login attempts to prevent brute force
const loginAttempts = new Map<string, { count: number; firstAttempt: number; lockedUntil?: number }>();

export function checkLoginRateLimit(ip: string): { allowed: boolean; waitSec?: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return { allowed: true };

  if (record.lockedUntil && now < record.lockedUntil) {
    return { allowed: false, waitSec: Math.ceil((record.lockedUntil - now) / 1000) };
  }

  // Reset window every 15 minutes
  if (now - record.firstAttempt > 15 * 60 * 1000) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  if (record.count >= 5) {
    record.lockedUntil = now + 15 * 60 * 1000;
    return { allowed: false, waitSec: 900 };
  }

  return { allowed: true };
}

export function recordLoginAttempt(ip: string, success: boolean) {
  const now = Date.now();
  if (success) {
    loginAttempts.delete(ip);
    return;
  }
  const record = loginAttempts.get(ip) || { count: 0, firstAttempt: now };
  record.count += 1;
  loginAttempts.set(ip, record);
}

/**
 * Generate HMAC signed token
 */
export function generateAdminToken(user: AdminUser): string {
  const payload: AdminSession = {
    userId: user.id,
    username: user.username,
    role: user.role,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json).toString('base64url');
  const sig = crypto.createHmac('sha256', ADMIN_SECRET).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

/**
 * Verify HMAC signed token
 */
export function verifyAdminToken(token: string): AdminSession | null {
  if (!token || !token.includes('.')) return null;
  const [b64, sig] = token.split('.');
  const expectedSig = crypto.createHmac('sha256', ADMIN_SECRET).update(b64).digest('base64url');

  try {
    const isSigValid = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
    if (!isSigValid) return null;

    const json = Buffer.from(b64, 'base64url').toString('utf-8');
    const session: AdminSession = JSON.parse(json);

    if (Date.now() > session.expiresAt) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Express middleware to guard /api/admin/* routes
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers['x-admin-token']) {
    token = req.headers['x-admin-token'] as string;
  }

  if (!token) {
    return res.status(401).json({
      error: 'অননুমোদিত প্রবেশাধিকার। দয়া করে লগইন করুন।',
      code: 'UNAUTHORIZED',
    });
  }

  const session = verifyAdminToken(token);
  if (!session) {
    return res.status(401).json({
      error: 'সেশনের মেয়াদ উত্তীর্ণ হয়েছে বা অবৈধ টোকেন। পুনরায় লগইন করুন।',
      code: 'SESSION_EXPIRED',
    });
  }

  // Attach session to request
  (req as any).adminSession = session;
  next();
}
