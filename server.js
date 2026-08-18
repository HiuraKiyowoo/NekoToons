// server.js — NekoToons Reader (Voratoon API)
import http from 'http';
import https from 'https';
import fs from 'fs';
import { URL, fileURLToPath } from 'url';
import path from 'path';

const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, 'dist');

const VORA   = 'api.voratoon.com';
const UA     = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125.0 Mobile Safari/537.36';
const BASE_H = { 'User-Agent': UA, 'Accept': 'application/json', 'Referer': 'https://v1.voratoon.com/' };

// In-memory cache
const _cache      = new Map();
const _chapIdx    = new Map(); // slug → { indices: number[], at }
const TTL_STD     = 5  * 60 * 1000;
const TTL_CHAP    = 30 * 60 * 1000;

const MIME = {
  '.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript',
  '.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg',
  '.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon',
  '.woff':'font/woff','.woff2':'font/woff2','.json':'application/json','.txt':'text/plain',
};

// ── HTTP ──────────────────────────────────────────────────────────────────────
function voraGet(p, extra = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname: VORA, path: p, method: 'GET', headers: { ...BASE_H, ...extra } }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.end();
  });
}

function cached(key, ttl = TTL_STD) {
  const e = _cache.get(key);
  return (e && Date.now() - e.at < ttl) ? e.data : null;
}
function setCache(key, data) { _cache.set(key, { data, at: Date.now() }); }

async function voraJSON(p, ttl = TTL_STD) {
  const hit = cached(p, ttl);
  if (hit) return hit;
  const { body, status } = await voraGet(p);
  if (status !== 200) throw Object.assign(new Error(`Voratoon ${status}`), { status });
  const data = JSON.parse(body.toString());
  setCache(p, data);
  return data;
}

// ── Normalizers ───────────────────────────────────────────────────────────────
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

function normSeries(item) {
  if (!item) return null;
  const d    = item.data ?? {};
  const meta = item.dataMetadata ?? {};
  return {
    id:           String(item.id ?? ''),
    slug:         d.slug ?? '',
    name:         d.title ?? '',
    name2:        d.nativeTitle ?? '',
    image:        d.coverImage ?? '',
    background:   d.backgroundImage ?? '',
    type:         cap(d.format ?? ''),
    status:       d.status ?? '',
    rate:         d.rating ?? null,
    views:        Number(meta.analyticsViews ?? d.totalViews ?? 0),
    author:       d.author ?? '',
    description:  d.synopsis ?? '',
    genre:        (d.genres ?? []).map(g => g.data?.name).filter(Boolean),
    genreIds:     d.genreIds ?? [],
    rilis:        d.releaseDate ?? '',
    totalChapters: Number(d.totalChapters ?? 0),
    isHot:        Boolean(d.isHot),
    ranking:      meta.ranking ?? null,
    bookmarkCount: Number(meta.bookmarkCount ?? d.bookmarkCount ?? 0),
  };
}

function normChapter(item) {
  if (!item) return null;
  const d = item.data ?? {};
  const idx = Number(d.index ?? item.chapterIndex ?? 0);
  return {
    id:         item.id ?? null,
    chapterNum: idx,
    title:      d.title || `Chapter ${idx}`,
    isDraft:    Boolean(d.isDraft),
    thumbnail:  d.thumbnail ?? null,
    views:      Number(item.views?.total ?? 0),
    createdAt:  item.createdAt ?? null,
    updatedAt:  item.updatedAt ?? null,
  };
}

// Get sorted chapter indices (cached 30 min)
async function getChapterIndices(slug) {
  const hit = _chapIdx.get(slug);
  if (hit && Date.now() - hit.at < TTL_CHAP) return hit.indices;
  const data = await voraJSON(`/series/${encodeURIComponent(slug)}/chapters?page=1`, TTL_CHAP);
  const indices = (Array.isArray(data?.data) ? data.data : [])
    .map(item => Number(item.data?.index ?? 0))
    .filter(n => n > 0)
    .sort((a, b) => a - b);
  _chapIdx.set(slug, { indices, at: Date.now() });
  return indices;
}

// ── JSON response ─────────────────────────────────────────────────────────────
function json(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  res.end(body);
}
function apiErr(res, msg, status = 500) { json(res, { error: msg }, status); }

// ── API handlers ──────────────────────────────────────────────────────────────

async function apiHome(res) {
  const [bannerRes, updateRes, newRes, completeRes] = await Promise.all([
    voraJSON('/series?take=10&page=1&takeChapter=0&preset=banner'),
    voraJSON('/series?take=20&page=1&takeChapter=0&preset=rilisan_terbaru&includeMeta=true'),
    voraJSON('/series?take=20&page=1&takeChapter=0&sort=createdAt&sortOrder=desc&includeMeta=true'),
    voraJSON('/series?take=20&page=1&takeChapter=0&status=completed&includeMeta=true'),
  ]);
  json(res, {
    carousel:  (Array.isArray(bannerRes?.data)   ? bannerRes.data   : []).map(normSeries).filter(Boolean),
    articles:  (Array.isArray(updateRes?.data)   ? updateRes.data   : []).map(normSeries).filter(Boolean),
    newSeries: (Array.isArray(newRes?.data)      ? newRes.data      : []).map(normSeries).filter(Boolean),
    completed: (Array.isArray(completeRes?.data) ? completeRes.data : []).map(normSeries).filter(Boolean),
  });
}

async function apiKomik(slug, res) {
  const [detailRes, chapRes] = await Promise.all([
    voraJSON(`/series/${encodeURIComponent(slug)}`),
    voraJSON(`/series/${encodeURIComponent(slug)}/chapters?page=1`, TTL_CHAP),
  ]);
  const series = normSeries(detailRes?.data);
  if (!series) { apiErr(res, 'Tidak ditemukan', 404); return; }
  const chapters = (Array.isArray(chapRes?.data) ? chapRes.data : [])
    .map(normChapter).filter(Boolean)
    .sort((a, b) => a.chapterNum - b.chapterNum);
  json(res, { ...series, chapters });
}

async function apiChapter(slug, num, res) {
  const cur = Number(num);
  const [chapRes, indices] = await Promise.all([
    voraGet(`/series/${encodeURIComponent(slug)}/chapters/${cur}`),
    getChapterIndices(slug),
  ]);
  const data = JSON.parse(chapRes.body.toString());
  if (chapRes.status !== 200 || !data?.data) { apiErr(res, 'Chapter tidak ditemukan', 404); return; }
  const d      = data.data;
  const images = Array.isArray(d.images) ? d.images : (Array.isArray(d.data?.images) ? d.data.images : []);
  const idx    = indices.indexOf(cur);
  json(res, {
    mangaName: '',   // kosongkan — reader fetch dari MangaDetail history
    mangaSlug: slug,
    chapter:   cur,
    img:       images,
    prevNum:   idx > 0              ? indices[idx - 1] : null,
    nextNum:   idx < indices.length - 1 ? indices[idx + 1] : null,
    views:     d.views ?? null,
  });
}

async function apiSearch(q, res) {
  if (!q) { json(res, []); return; }
  const data = await voraJSON(`/series?take=20&page=1&includeMeta=true&takeChapter=0&title=${encodeURIComponent(q)}`);
  const arr  = Array.isArray(data?.data) ? data.data : [];
  json(res, arr.map(normSeries).filter(Boolean));
}

async function apiList(qs, res) {
  const params = new URLSearchParams(qs);
  const page   = params.get('page') || '1';
  const limit  = params.get('limit') || '24';
  const data   = await voraJSON(`/series?take=${limit}&page=${page}&includeMeta=true&takeChapter=0`);
  const arr    = Array.isArray(data?.data) ? data.data : [];
  json(res, arr.map(normSeries).filter(Boolean));
}

async function apiGenres(res) {
  const data = await voraJSON('/genres');
  const arr  = Array.isArray(data?.data) ? data.data : [];
  json(res, arr.map(g => ({ id: g.id, name: g.data?.name ?? '', description: g.data?.description ?? '' })));
}

// ── Image proxy ───────────────────────────────────────────────────────────────
function proxyImg(targetUrl, res) {
  let parsed;
  try { parsed = new URL(decodeURIComponent(targetUrl)); }
  catch { res.writeHead(400); res.end('Invalid URL'); return; }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') { res.writeHead(403); res.end(); return; }
  const req = https.request({
    hostname: parsed.hostname, path: parsed.pathname + parsed.search, method: 'GET',
    headers: { 'User-Agent': UA, 'Referer': 'https://v1.voratoon.com/', 'Accept': 'image/avif,image/webp,image/*,*/*;q=0.8' },
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
function serveStatic(fp, res) {
  try {
    const ext = path.extname(fp).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000' });
    res.end(fs.readFileSync(fp));
  } catch { serveIndex(res); }
}
function serveIndex(res) {
  const p = path.join(DIST, 'index.html');
  if (fs.existsSync(p)) { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }); res.end(fs.readFileSync(p)); }
  else { res.writeHead(503); res.end('Jalankan: npm run build'); }
}

const distExists = fs.existsSync(DIST);

// ── Server ────────────────────────────────────────────────────────────────────
http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);
  const p = u.pathname;
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': '*' }); res.end(); return; }
  try {
    if (p === '/img') { proxyImg(u.searchParams.get('url') || '', res); return; }
    if (p === '/api/home')   { await apiHome(res); return; }
    if (p === '/api/search') { await apiSearch(u.searchParams.get('q') || '', res); return; }
    if (p === '/api/list')   { await apiList(u.search.slice(1), res); return; }
    if (p === '/api/genres') { await apiGenres(res); return; }
    const mK = p.match(/^\/api\/komik\/([^/]+)$/);
    if (mK) { await apiKomik(decodeURIComponent(mK[1]), res); return; }
    const mC = p.match(/^\/api\/chapter\/(.+?)\/(\d+)$/);
    if (mC) { await apiChapter(decodeURIComponent(mC[1]), mC[2], res); return; }
    if (distExists) {
      const fp = path.join(DIST, p === '/' ? 'index.html' : p);
      if (fs.existsSync(fp) && fs.statSync(fp).isFile()) serveStatic(fp, res);
      else serveIndex(res);
      return;
    }
    res.writeHead(404); res.end('Not found');
  } catch (e) { console.error(e.message); apiErr(res, e.message, e.status || 500); }
}).listen(PORT, '0.0.0.0', () => {
  console.log('\n  NekoToons → http://localhost:' + PORT + ' (Voratoon API)');
  if (!distExists) console.log('  ⚠ npm run build dulu\n');
});
