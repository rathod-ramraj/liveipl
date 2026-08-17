import crypto from 'crypto';

// In-memory store for active sessions (persists across warm function invocations)
const activeSessions = new Map();
const INACTIVE_TIMEOUT_MS = 75000; // 75 seconds

function getClientIp(req) {
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp && typeof cfIp === 'string') return cfIp.split(',')[0].trim();

  const xRealIp = req.headers['x-real-ip'];
  if (xRealIp && typeof xRealIp === 'string') return xRealIp.split(',')[0].trim();

  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor && typeof xForwardedFor === 'string') {
    return xForwardedFor.split(',')[0].trim();
  }

  return req.socket?.remoteAddress || '127.0.0.1';
}

function hashIp(ip) {
  const salt = process.env.SESSION_SALT || 'playup_live_users_salt_2026';
  return crypto.createHash('sha256').update(`${ip}_${salt}`).digest('hex').substring(0, 16);
}

function cleanupInactive() {
  const now = Date.now();
  for (const [hash, lastSeen] of activeSessions.entries()) {
    if (now - lastSeen > INACTIVE_TIMEOUT_MS) {
      activeSessions.delete(hash);
    }
  }
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const rawIp = getClientIp(req);
    const ipHash = hashIp(rawIp);
    const now = Date.now();

    activeSessions.set(ipHash, now);
    cleanupInactive();

    const activeCount = activeSessions.size;

    return res.status(200).json({
      success: true,
      activeUsers: activeCount,
      timestamp: now
    });
  } catch (err) {
    return res.status(200).json({
      success: true,
      activeUsers: Math.max(1, activeSessions.size),
      timestamp: Date.now()
    });
  }
}
