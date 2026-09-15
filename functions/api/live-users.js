const activeSessions = new Map();
const INACTIVE_TIMEOUT_MS = 25000;

function cleanupExpired(now) {
  for (const [hash, lastSeen] of activeSessions.entries()) {
    if (now - lastSeen > INACTIVE_TIMEOUT_MS) {
      activeSessions.delete(hash);
    }
  }
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  let action = url.searchParams.get('action');

  if (!action && request.method === 'POST') {
    try {
      const text = await request.text();
      if (text) {
        const body = JSON.parse(text);
        action = body.action;
      }
    } catch (_) {}
  }

  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Content-Type': 'application/json'
  });

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const rawIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || '127.0.0.1';

    const dateKey = new Date().toISOString().slice(0, 10);
    const salt = `playup_salt_${dateKey}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(`${rawIp}_${salt}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const ipHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);

    const now = Date.now();

    if (action === 'leave') {
      activeSessions.delete(ipHash);
    } else {
      activeSessions.set(ipHash, now);
    }

    cleanupExpired(now);

    const activeCount = Math.max(1, activeSessions.size);

    return new Response(JSON.stringify({ activeUsers: activeCount }), {
      status: 200,
      headers
    });
  } catch (err) {
    return new Response(JSON.stringify({ activeUsers: Math.max(1, activeSessions.size) }), {
      status: 200,
      headers
    });
  }
}
