import https from 'https';

const UA = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125.0 Mobile Safari/537.36';

export default function handler(req, res) {
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Origin', '*'); res.status(204).end(); return; }
  const raw = req.query.url;
  if (!raw) { res.status(400).end('Missing ?url='); return; }

  let target;
  try { target = new URL(decodeURIComponent(raw)); } catch { res.status(400).end('Invalid URL'); return; }
  if (target.protocol !== 'https:' && target.protocol !== 'http:') { res.status(403).end(); return; }

  const request = https.request({
    hostname: target.hostname,
    path:     target.pathname + target.search,
    method:   'GET',
    headers:  {
      'User-Agent': UA,
      'Referer':    'https://keikomik.net/',
      'Accept':     'image/avif,image/webp,image/*,*/*;q=0.8',
      'sec-fetch-dest': 'image',
      'sec-fetch-mode': 'no-cors',
    },
  }, upRes => {
    res.setHeader('Content-Type',  upRes.headers['content-type'] || 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(upRes.statusCode);
    upRes.pipe(res);
  });
  request.on('error', () => { try { res.status(502).end(); } catch {} });
  request.end();
}
