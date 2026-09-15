import https from 'https';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://ondemand.st/sport/cricket'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const matches = await fetchJson('https://ondemand.st/papi/matches/all');
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

    return res.status(200).json({
      success: true,
      count: formatted.length,
      matches: formatted
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      matches: []
    });
  }
}
