import crypto from 'crypto';

// Server-side in-memory active session store (persists across warm serverless invocations)
const activeSessions = new Map(); // key: hashedIp, value: lastSeenTimestamp
const INACTIVE_TIMEOUT_MS = 45000; // 45 seconds TTL

/**
 * Safely extract client IP from trusted proxy headers in Vercel / Cloudflare environments.
 */
function getClientIp(req) {
  // Cloudflare trusted header
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp && typeof cfIp === 'string') return cfIp.split(',')[0].trim();

  // Vercel / Reverse proxy trusted header
  const xRealIp = req.headers['x-real-ip'];
  if (xRealIp && typeof xRealIp === 'string') return xRealIp.split(',')[0].trim();

  // Standard X-Forwarded-For header (take left-most IP)
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor && typeof xForwardedFor === 'string') {
    return xForwardedFor.split(',')[0].trim();
  }

  return req.socket?.remoteAddress || '127.0.0.1';
}

/**
 * Anonymize IP using SHA-256 with a rotating daily salt to guarantee privacy.
 */
function hashIp(ip) {
  const dateKey = new Date().toISOString().slice(0, 10);
  const salt = process.env.SESSION_SALT || `playup_salt_${dateKey}`;
  return crypto.createHash('sha256').update(`${ip}_${salt}`).digest('hex').substring(0, 16);
}

/**
 * Purge expired sessions based on server-side timestamp TTL.
 */
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

    // Support leave signal (sent on tab close / beacon)
    const action = req.query?.action || (req.body && req.body.action);
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
