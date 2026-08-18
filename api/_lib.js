// api/_lib.js — Voratoon shared logic untuk Vercel API routes

import https from 'https';

const VORA   = 'api.voratoon.com';
const UA     = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125.0 Mobile Safari/537.36';
const BASE_H = { 'User-Agent': UA, 'Accept': 'application/json', 'Referer': 'https://v1.voratoon.com/' };

// In-memory cache (warm Vercel instances)
const _cache   = new Map();
const _chapIdx = new Map();
const TTL_STD  =  5 * 60 * 1000;
const TTL_CHAP = 30 * 60 * 1000;

export function voraGet(p, extra = {}) {
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

function _cached(key, ttl) { const e = _cache.get(key); return (e && Date.now() - e.at < ttl) ? e.data : null; }
function _set(key, data)   { _cache.set(key, { data, at: Date.now() }); }

export async function voraJSON(p, ttl = TTL_STD) {
  const hit = _cached(p, ttl);
  if (hit) return hit;
  const { body, status } = await voraGet(p);
  if (status !== 200) throw Object.assign(new Error(`Voratoon HTTP ${status}`), { status });
  const data = JSON.parse(body.toString());
  _set(p, data);
  return data;
}

export async function getChapterIndices(slug) {
  const hit = _chapIdx.get(slug);
  if (hit && Date.now() - hit.at < TTL_CHAP) return hit.indices;
  const data    = await voraJSON(`/series/${encodeURIComponent(slug)}/chapters?page=1`, TTL_CHAP);
  const indices = (Array.isArray(data?.data) ? data.data : [])
    .map(item => Number(item.data?.index ?? 0)).filter(n => n > 0).sort((a, b) => a - b);
  _chapIdx.set(slug, { indices, at: Date.now() });
  return indices;
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

export function normSeries(item) {
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

export function normChapter(item) {
  if (!item) return null;
  const d   = item.data ?? {};
  const idx = Number(d.index ?? item.chapterIndex ?? 0);
  return {
    id:        item.id ?? null,
    chapterNum: idx,
    title:     d.title || `Chapter ${idx}`,
    isDraft:   Boolean(d.isDraft),
    thumbnail: d.thumbnail ?? null,
    views:     Number(item.views?.total ?? 0),
    createdAt: item.createdAt ?? null,
    updatedAt: item.updatedAt ?? null,
  };
}

export function ok(res, data)         { res.setHeader('Access-Control-Allow-Origin', '*'); res.status(200).json(data); }
export function err(res, msg, s = 500){ res.setHeader('Access-Control-Allow-Origin', '*'); res.status(s).json({ error: msg }); }
