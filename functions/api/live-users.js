const SESSION_TIMEOUT_MS = 30000; // 30 seconds global inactivity timeout

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  let action = url.searchParams.get('action') || '';
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
    const db = env ? env.playup_db : null;
    const now = Date.now();
    const cutoff = now - SESSION_TIMEOUT_MS;

    let cleanSid = '';
    if (typeof sid === 'string') {
      const trimmed = sid.trim();
      if (trimmed.length >= 8 && trimmed.length <= 128) {
        cleanSid = trimmed;
      }
    }

    if (db) {
      const statements = [];

      if (cleanSid) {
        if (action === 'leave') {
          statements.push(db.prepare('DELETE FROM live_sessions WHERE sid = ?').bind(cleanSid));
        } else if (action !== 'read') {
          statements.push(
            db.prepare(
              'INSERT INTO live_sessions (sid, last_seen) VALUES (?, ?) ON CONFLICT(sid) DO UPDATE SET last_seen = excluded.last_seen'
            ).bind(cleanSid, now)
          );
        }
      }

      statements.push(db.prepare('DELETE FROM live_sessions WHERE last_seen <= ?').bind(cutoff));
      statements.push(db.prepare('SELECT COUNT(*) AS activeCount FROM live_sessions WHERE last_seen > ?').bind(cutoff));

      const results = await db.batch(statements);
      const lastResult = results[results.length - 1];
      const countRow = lastResult && lastResult.results && lastResult.results[0];
      const activeUsers = countRow ? Math.max(0, Number(countRow.activeCount) || 0) : 0;

      return new Response(JSON.stringify({ activeUsers }), {
        status: 200,
        headers
      });
    }

    return new Response(JSON.stringify({ activeUsers: 0 }), {
      status: 200,
      headers
    });
  } catch (err) {
    return new Response(JSON.stringify({ activeUsers: 0, error: err.message }), {
      status: 200,
      headers
    });
  }
}
