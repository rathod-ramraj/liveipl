const fallbackMap = new Map();
const FALLBACK_TTL_MS = 45000;

function cleanupFallback(now) {
  for (const [key, time] of fallbackMap.entries()) {
    if (now - time > FALLBACK_TTL_MS) fallbackMap.delete(key);
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  let action = url.searchParams.get('action');
  let sid = url.searchParams.get('sid') || '';

  if (request.method === 'POST') {
    try {
      const text = await request.text();
      if (text) {
        const body = JSON.parse(text);
        if (!action && body.action) action = body.action;
        if (!sid && body.sid) sid = body.sid;
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
    const kv = env ? env.LIVE_USERS_KV : null;
    const now = Date.now();

    if (kv) {
      const currentKey = sid ? 'session:' + sid : null;

      if (currentKey) {
        if (action === 'leave') {
          await kv.delete(currentKey);
        } else {
          await kv.put(currentKey, String(now), { expirationTtl: 60 });
        }
      }

      const list = await kv.list({ prefix: 'session:' });
      const keys = list && Array.isArray(list.keys) ? list.keys.map(k => k.name) : [];
      let activeCount = keys.length;

      if (currentKey) {
        const hasCurrent = keys.includes(currentKey);
        if (action === 'leave' && hasCurrent) {
          activeCount = Math.max(0, activeCount - 1);
        } else if (action !== 'leave' && !hasCurrent) {
          activeCount = activeCount + 1;
        }
      }

      return new Response(JSON.stringify({ activeUsers: activeCount }), {
        status: 200,
        headers
      });
    }

    if (sid) {
      if (action === 'leave') {
        fallbackMap.delete(sid);
      } else {
        fallbackMap.set(sid, now);
      }
    }
    cleanupFallback(now);

    return new Response(JSON.stringify({ activeUsers: fallbackMap.size }), {
      status: 200,
      headers
    });
  } catch (err) {
    return new Response(JSON.stringify({ activeUsers: 0 }), {
      status: 200,
      headers
    });
  }
}
