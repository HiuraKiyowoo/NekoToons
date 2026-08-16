// server.js — KanataToon Reader (Keikomik source)
// Dev  : npm run dev   (vite :5173, server :3000)
// Prod : npm run build → node server.js (semua di :3000)

import http from 'http';
import https from 'https';
import fs from 'fs';
import { URL, fileURLToPath } from 'url';
import path from 'path';

const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, 'dist');

const SITE   = 'keikomik.net';
const UA     = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125.0 Mobile Safari/537.36';
const BASE_H = {
  'User-Agent':      UA,
  'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
  'Referer':         'https://keikomik.net/',
};

// Build ID cache (10 menit)
let _bid = null, _bidAt = 0;
const BID_TTL = 10 * 60 * 1000;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.json': 'application/json', '.txt': 'text/plain',
};

// ── HTTP helper ───────────────────────────────────────────────────────────────
function httpsGet(hostname, p, extra = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path: p, method: 'GET', headers: { ...BASE_H, ...extra } }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.end();
  });
}

// ── Build ID ──────────────────────────────────────────────────────────────────
async function getBuildId(force = false) {
  const now = Date.now();
  if (!force && _bid && now - _bidAt < BID_TTL) return _bid;
  const { body } = await httpsGet(SITE, '/', { Accept: 'text/html' });
  const m = body.toString().match(/"buildId"\s*:\s*"([^"]+)"/);
  if (!m) throw new Error('Build ID tidak ditemukan');
  _bid = m[1]; _bidAt = now;
  return _bid;
}

async function nextGet(p) {
  const get = async (bid) => httpsGet(SITE, `/_next/data/${bid}/${p}.json`, { Accept: 'application/json' });
  let r = await get(await getBuildId());
  if (r.status === 404) r = await get(await getBuildId(true)); // refresh jika stale
  return { status: r.status, data: JSON.parse(r.body.toString()) };
}

// ── Field normalizer ──────────────────────────────────────────────────────────
function norm(item) {
  if (!item) return null;
  return {
    id:          item.id ?? item._id ?? '',
    slug:        item.slug ?? '',
    name:        item.name ?? '',
    image:       item.image ?? '',
    type:        item.type ?? '',
    status:      item.status ?? '',
    rate:        item.rate ?? null,
    views:       item.views ?? 0,
    name2:       item.name2 ?? '',
    author:      item.author ?? '',
    artist:      item.artist ?? '',
    description: item.description ?? '',
    genre:       Array.isArray(item.genre)  ? item.genre  : [],
    themes:      Array.isArray(item.themes) ? item.themes : [],
    demographic: Array.isArray(item.demographic) ? item.demographic : (item.demographic ? [item.demographic] : []),
    rilis:       item.rilis ?? '',
    CreateAt:    item.CreateAt ?? null,
    UpdateAt:    item.UpdateAt ?? null,
  };
}

// ── JSON response ─────────────────────────────────────────────────────────────
function json(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}
function apiErr(res, msg, status = 500) { json(res, { error: msg }, status); }

// ── API handlers ──────────────────────────────────────────────────────────────

async function apiHome(res) {
  const { data } = await nextGet('index');
  const { popular = [], articles = [], carousel = [] } = data?.pageProps ?? {};
  json(res, { popular: popular.map(norm), articles: articles.map(norm), carousel: carousel.map(norm) });
}

async function apiKomik(slug, res) {
  const { status, data } = await nextGet(`komik/${slug}`);
  if (status !== 200 || !data?.pageProps?.item) { apiErr(res, 'Tidak ditemukan', 404); return; }
  const item = data.pageProps.item;
  json(res, { ...norm(item), Komik: item.Komik ?? {} });
}

async function apiChapter(slug, num, res) {
  const { status, data } = await nextGet(`chapter/${slug}-chapter-${num}`);
  if (status !== 200 || !data?.pageProps) { apiErr(res, 'Chapter tidak ditemukan', 404); return; }
  const props   = data.pageProps;
  const subItem = props.subItem ?? {};
  const ids     = (props.komikIds ?? []).map(Number).sort((a, b) => a - b);
  const cur     = Number(num);
  const idx     = ids.indexOf(cur);
  json(res, {
    mangaName: props.data?.name ?? '',
    mangaSlug: props.slug ?? slug,
    chapter:   cur,
    img:       subItem.img ?? [],
    prevNum:   idx > 0              ? ids[idx - 1] : null,
    nextNum:   idx < ids.length - 1 ? ids[idx + 1] : null,
    UpdateAt:  subItem.UpdateAt ?? null,
  });
}

async function apiSearch(q, res) {
  if (!q) { json(res, []); return; }
  const { body, status } = await httpsGet(SITE, `/api/search?q=${encodeURIComponent(q)}`, { Accept: 'application/json' });
  if (status !== 200) { apiErr(res, 'Search gagal', status); return; }
  const raw = JSON.parse(body.toString());
  const arr = Array.isArray(raw) ? raw : (raw?.results ?? raw?.data ?? []);
  json(res, arr.map(norm));
}

async function apiList(qs, res) {
  const { body, status } = await httpsGet(SITE, `/api/list?${qs}`, { Accept: 'application/json' });
  if (status !== 200) { apiErr(res, 'List gagal', status); return; }
  const raw = JSON.parse(body.toString());
  const arr = Array.isArray(raw) ? raw : (raw?.results ?? raw?.data ?? []);
  json(res, arr.map(norm));
}

// ── Image proxy ───────────────────────────────────────────────────────────────
function proxyImg(targetUrl, res) {
  let parsed;
  try { parsed = new URL(targetUrl); } catch { res.writeHead(400); res.end('Invalid URL'); return; }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') { res.writeHead(403); res.end(); return; }
  const req = https.request({
    hostname: parsed.hostname, path: parsed.pathname + parsed.search, method: 'GET',
    headers: { 'User-Agent': UA, 'Referer': 'https://keikomik.net/', 'Accept': 'image/avif,image/webp,image/*,*/*;q=0.8', 'sec-fetch-dest': 'image', 'sec-fetch-mode': 'no-cors' },
  }, upRes => {
    res.writeHead(upRes.statusCode, {
      'Content-Type': upRes.headers['content-type'] || 'image/webp',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    });
    upRes.pipe(res);
  });
  req.on('error', () => { try { res.writeHead(502); res.end(); } catch {} });
  req.end();
}

// ── Static ────────────────────────────────────────────────────────────────────
function serveStatic(filePath, res) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000' });
    res.end(fs.readFileSync(filePath));
  } catch { serveIndex(res); }
}
function serveIndex(res) {
  const p = path.join(DIST, 'index.html');
  if (fs.existsSync(p)) { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }); res.end(fs.readFileSync(p)); }
  else { res.writeHead(503, { 'Content-Type': 'text/plain' }); res.end('Jalankan: npm run build'); }
}

const distExists = fs.existsSync(DIST);

// ── HTTP server ───────────────────────────────────────────────────────────────
http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);
  const p = u.pathname;

  if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': '*' }); res.end(); return; }

  try {
    if (p === '/img') {
      const url = u.searchParams.get('url');
      if (!url) { res.writeHead(400); res.end('Missing ?url='); return; }
      proxyImg(decodeURIComponent(url), res); return;
    }
    if (p === '/api/home')   { await apiHome(res); return; }
    if (p === '/api/search') { await apiSearch(u.searchParams.get('q') || '', res); return; }
    if (p === '/api/list')   { await apiList(u.search.slice(1), res); return; }
    const mKomik = p.match(/^\/api\/komik\/([^/]+)$/);
    if (mKomik) { await apiKomik(mKomik[1], res); return; }
    const mChap = p.match(/^\/api\/chapter\/(.+?)\/(\d+)$/);
    if (mChap) { await apiChapter(mChap[1], mChap[2], res); return; }

    if (distExists) {
      const fp = path.join(DIST, p === '/' ? 'index.html' : p);
      if (fs.existsSync(fp) && fs.statSync(fp).isFile()) serveStatic(fp, res);
      else serveIndex(res);
      return;
    }
    res.writeHead(404); res.end('Not found');
  } catch (e) {
    console.error(e.message);
    apiErr(res, e.message);
  }
}).listen(PORT, '0.0.0.0', () => {
  console.log('\n  KanataToon → http://localhost:' + PORT);
  if (!distExists) console.log('  ⚠ npm run build dulu\n');
});
