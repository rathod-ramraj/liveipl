import crypto from 'crypto';

const activeSessions = new Map();
const INACTIVE_TIMEOUT_MS = 25000;

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
  const dateKey = new Date().toISOString().slice(0, 10);
  const salt = process.env.SESSION_SALT || `playup_salt_${dateKey}`;
  return crypto.createHash('sha256').update(`${ip}_${salt}`).digest('hex').substring(0, 16);
}

function cleanupExpired(now) {
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
    const now = Date.now();
    const rawIp = getClientIp(req);
    const ipHash = hashIp(rawIp);

    let action = req.query?.action;
    if (!action && req.body) {
      if (typeof req.body === 'string') {
        try { action = JSON.parse(req.body).action; } catch (_) {}
      } else if (req.body.action) {
        action = req.body.action;
      }
    }

    if (action === 'leave') {
      activeSessions.delete(ipHash);
    } else {
      activeSessions.set(ipHash, now);
    }

    cleanupExpired(now);

    const activeCount = Math.max(1, activeSessions.size);

    return res.status(200).json({
      activeUsers: activeCount
    });
  } catch (err) {
    return res.status(200).json({
      activeUsers: Math.max(1, activeSessions.size)
    });
  }
}
