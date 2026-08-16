// api/_lib.js — shared logic untuk semua Vercel API routes
// File ini tidak di-expose sebagai route (prefix _)

import https from 'https';

const SITE   = 'keikomik.net';
const UA     = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125.0 Mobile Safari/537.36';
const BASE_H = {
  'User-Agent':      UA,
  'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
  'Referer':         'https://keikomik.net/',
};

// In-memory cache — bekerja selama Vercel instance masih warm
let _bid = null, _bidAt = 0;
const BID_TTL   = 10 * 60 * 1000;
const _cache    = new Map();
const CACHE_TTL =  5 * 60 * 1000;

export function httpsGet(hostname, path, extra = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname, path, method: 'GET',
      headers: { ...BASE_H, ...extra },
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.end();
  });
}

export async function getBuildId(force = false) {
  const now = Date.now();
  if (!force && _bid && now - _bidAt < BID_TTL) return _bid;
  const { body } = await httpsGet(SITE, '/', { Accept: 'text/html' });
  const m = body.toString().match(/"buildId"\s*:\s*"([^"]+)"/);
  if (!m) throw new Error('Build ID tidak ditemukan');
  _bid = m[1]; _bidAt = now;
  return _bid;
}

export async function nextGet(p) {
  const key    = `next:${p}`;
  const cached = _cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.data;

  const get = async (bid) =>
    httpsGet(SITE, `/_next/data/${bid}/${p}.json`, { Accept: 'application/json' });

  let r = await get(await getBuildId());
  if (r.status === 404) r = await get(await getBuildId(true));

  const data = JSON.parse(r.body.toString());
  _cache.set(key, { data, at: Date.now() });
  return data;
}

export async function siteGet(path, extra = {}) {
  return httpsGet(SITE, path, { Accept: 'application/json', ...extra });
}

export function norm(item) {
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

export function ok(res, data) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(data);
}

export function err(res, msg, status = 500) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(status).json({ error: msg });
}
