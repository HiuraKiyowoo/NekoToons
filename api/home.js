import { voraJSON, normSeries, ok, err } from './_lib.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Origin','*'); res.status(204).end(); return; }
  try {
    const [popRes, latestRes] = await Promise.all([
      voraJSON('/popular?take=20&page=1'),
      voraJSON('/series?take=20&page=1&takeChapter=0&preset=rilisan_terbaru&includeMeta=true'),
    ]);
    const popular  = (Array.isArray(popRes?.data)    ? popRes.data    : []).map(normSeries).filter(Boolean);
    const articles = (Array.isArray(latestRes?.data)  ? latestRes.data : []).map(normSeries).filter(Boolean);
    ok(res, { popular, articles, carousel: popular.slice(0, 10) });
  } catch (e) { err(res, e.message, e.status || 500); }
}
