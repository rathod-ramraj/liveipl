export async function onRequest() {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=60, s-maxage=60',
    'Content-Type': 'application/json'
  });

  try {
    const res = await fetch('https://ondemand.st/papi/matches/all', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://ondemand.st/sport/cricket'
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const matches = await res.json();
    const cricketItems = (Array.isArray(matches) ? matches : []).filter(m => {
      const cat = (m.category || '').toLowerCase();
      const lgn = (m.league || '').toLowerCase();
      const ttl = (m.title || '').toLowerCase();
      return cat === 'cricket' || lgn.includes('cricket') || ttl.includes('cricket');
    });

    const formatted = cricketItems.map(m => {
      const streams = [];
      if (m.embedUrl) {
        streams.push({
          id: m.id,
          name: m.title || 'Main Stream',
          iframe: m.embedUrl
        });
      }
      if (m.substreams && Array.isArray(m.substreams)) {
        m.substreams.forEach(sub => {
          if (sub.iframe) {
            streams.push({
              id: sub.id || `${m.id}-${sub.name}`,
              name: sub.name || 'Stream',
              iframe: sub.iframe
            });
          }
        });
      }

      return {
        id: m.id,
        title: m.title,
        league: m.league || 'Cricket',
        status: m.status || 'live',
        poster: m.poster || '',
        teams: m.teams || {},
        viewers: m.viewers || m.viewerCount || 0,
        streams: streams
      };
    });

    return new Response(JSON.stringify({
      success: true,
      count: formatted.length,
      matches: formatted
    }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message,
      matches: []
    }), { status: 500, headers });
  }
}
