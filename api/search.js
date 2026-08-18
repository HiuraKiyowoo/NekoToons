import { voraJSON, normSeries, ok, err } from './_lib.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Origin','*'); res.status(204).end(); return; }
  const q = (req.query.q || '').trim();
  if (!q) { ok(res, []); return; }
  try {
    const data = await voraJSON(`/series?take=20&page=1&includeMeta=true&takeChapter=0&title=${encodeURIComponent(q)}`);
    ok(res, (Array.isArray(data?.data) ? data.data : []).map(normSeries).filter(Boolean));
  } catch (e) { err(res, e.message, e.status || 500); }
}
