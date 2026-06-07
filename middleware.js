/**
 * Vercel Edge Middleware — block AI crawlers and common scraper user-agents.
 */
const ALLOWED_BOTS = [/Googlebot/i, /Bingbot/i, /DuckDuckBot/i, /Applebot(?!-Extended)/i];

const BLOCKED_UA = [
  /GPTBot/i, /ChatGPT-User/i, /ClaudeBot/i, /Claude-Web/i, /anthropic-ai/i,
  /Google-Extended/i, /CCBot/i, /cohere-ai/i, /PerplexityBot/i, /Bytespider/i,
  /meta-externalagent/i, /Applebot-Extended/i, /Diffbot/i, /Omgilibot/i,
  /ImagesiftBot/i, /img2dataset/i, /Amazonbot/i, /FacebookBot/i,
  /SemrushBot/i, /AhrefsBot/i, /DotBot/i, /PetalBot/i, /BLEXBot/i,
  /DataForSeoBot/i, /Scrapy/i, /HeadlessChrome/i, /PhantomJS/i,
  /Puppeteer/i, /Playwright/i, /Selenium/i, /python-requests/i,
  /httpx\//i, /aiohttp/i, /curl\//i, /wget\//i, /Go-http-client/i,
  /libwww-perl/i, /axios\//i, /node-fetch/i,
  /\bbot\b/i, /\bcrawler\b/i, /\bspider\b/i, /\bscraper\b/i,
];

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.png).*)'],
};

function isBlockedUA(ua) {
  if (ALLOWED_BOTS.some((re) => re.test(ua))) return false;
  return BLOCKED_UA.some((re) => re.test(ua));
}

export default function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  if (isBlockedUA(ua)) {
    return new Response('Access denied — automated access is not permitted.', {
      status: 403,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
