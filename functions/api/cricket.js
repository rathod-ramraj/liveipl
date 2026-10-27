export async function onRequest() {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=60, s-maxage=60',
    'Content-Type': 'application/json'
  });

  try {
    const res = await fetch('https://tflix.site/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const cardRegex = /<article[\s\S]*?class="[^"]*match-card[^"]*"[\s\S]*?<\/article>/g;
    const cards = html.match(cardRegex) || [];

    const cricketCards = cards.filter(c => /data-sport="cricket"/i.test(c));

    const matches = await Promise.all(
      cricketCards.map(async (card, i) => {
        const watchUrl = (card.match(/data-url="([^"]*)"/) || [])[1] || "";
        const eventMs = Number((card.match(/data-event-ms="([^"]*)"/) || [])[1] || 0);
        const titleMatch = card.match(/class="event-title-text"[^>]*>([\s\S]*?)<\/span>/);
        const title = titleMatch ? titleMatch[1].trim() : "";

        const teamBlocks = card.match(/<div class="team">[\s\S]*?<\/div>\s*<\/div>/g) || [];
        let teamA = "Team 1", teamB = "Team 2", flagA = "favicon.png", flagB = "favicon.png";
        if (teamBlocks.length >= 2) {
          const nameA = teamBlocks[0].match(/class="team-name"[^>]*>([\s\S]*?)<\/div>/);
          const nameB = teamBlocks[1].match(/class="team-name"[^>]*>([\s\S]*?)<\/div>/);
          const imgA = teamBlocks[0].match(/src="([^"]+)"/);
          const imgB = teamBlocks[1].match(/src="([^"]+)"/);
          if (nameA) teamA = nameA[1].trim();
          if (nameB) teamB = nameB[1].trim();
          if (imgA) flagA = imgA[1];
          if (imgB) flagB = imgB[1];
        }

        const streams = [];
        if (watchUrl) {
          try {
            const wRes = await fetch(watchUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              }
            });
            if (wRes.ok) {
              const wHtml = await wRes.text();
              const btnMatches = [...wHtml.matchAll(/<button[^>]*data-stream-button[\s\S]*?>/g)];
              btnMatches.forEach((bm, sIdx) => {
                const bStr = bm[0];
                const streamUrl = (bStr.match(/data-stream-url="([^"]*)"/) || [])[1] || "";
                const streamType = (bStr.match(/data-stream-type="([^"]*)"/) || [])[1] || "embed";
                const kid = (bStr.match(/data-stream-kid="([^"]*)"/) || [])[1] || "";
                const key = (bStr.match(/data-stream-key="([^"]*)"/) || [])[1] || "";
                if (streamUrl) {
                  streams.push({
                    title: "Server " + (sIdx + 1),
                    url: streamUrl,
                    type: streamType,
                    key: (kid && key) ? `${kid}:${key}` : (key || "")
                  });
                }
              });
            }
          } catch (_) {}
        }

        return {
          id: i + 1,
          title: title || `${teamA} vs ${teamB}`,
          event: {
            name: title,
            teamA,
            teamB,
            teamAFlag: flagA,
            teamBFlag: flagB,
            startTimeIST: eventMs
              ? new Date(eventMs).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
              : "Live Now"
          },
          dashStreams: streams
        };
      })
    );

    return new Response(JSON.stringify(matches), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
