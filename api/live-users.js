import crypto from 'crypto';

const globalSessions = global._playupPresenceStore || new Map();
global._playupPresenceStore = globalSessions;

const INACTIVE_TIMEOUT_MS = 45000;

function cleanupExpired(now) {
  for (const [key, time] of globalSessions.entries()) {
    if (now - time > INACTIVE_TIMEOUT_MS) {
      globalSessions.delete(key);
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
    let action = req.query?.action;
    let sid = req.query?.sid || '';

    if (req.body) {
      if (typeof req.body === 'string') {
        try {
          const parsed = JSON.parse(req.body);
          if (!action && parsed.action) action = parsed.action;
          if (!sid && parsed.sid) sid = parsed.sid;
        } catch (_) {}
      } else {
        if (!action && req.body.action) action = req.body.action;
        if (!sid && req.body.sid) sid = req.body.sid;
      }
    }

    if (sid) {
      if (action === 'leave') {
        globalSessions.delete(sid);
      } else {
        globalSessions.set(sid, now);
      }
    }

    cleanupExpired(now);

    return res.status(200).json({
      activeUsers: globalSessions.size
    });
  } catch (err) {
    return res.status(200).json({
      activeUsers: globalSessions.size
    });
  }
}
