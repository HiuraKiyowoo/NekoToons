import { voraJSON, normSeries, ok, err } from './_lib.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Origin','*'); res.status(204).end(); return; }
  try {
    const [bannerRes, updateRes, newRes, completeRes] = await Promise.all([
      voraJSON('/series?take=10&page=1&takeChapter=0&preset=banner'),
      voraJSON('/series?take=20&page=1&takeChapter=0&preset=rilisan_terbaru&includeMeta=true'),
      voraJSON('/series?take=20&page=1&takeChapter=0&sort=createdAt&sortOrder=desc&includeMeta=true'),
      voraJSON('/series?take=20&page=1&takeChapter=0&status=completed&includeMeta=true'),
    ]);
    ok(res, {
      carousel:  (Array.isArray(bannerRes?.data)   ? bannerRes.data   : []).map(normSeries).filter(Boolean),
      articles:  (Array.isArray(updateRes?.data)   ? updateRes.data   : []).map(normSeries).filter(Boolean),
      newSeries: (Array.isArray(newRes?.data)      ? newRes.data      : []).map(normSeries).filter(Boolean),
      completed: (Array.isArray(completeRes?.data) ? completeRes.data : []).map(normSeries).filter(Boolean),
    });
  } catch (e) { err(res, e.message, e.status || 500); }
}
