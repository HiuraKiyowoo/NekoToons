import { voraJSON, normSeries, ok, err } from './_lib.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Origin','*'); res.status(204).end(); return; }
  try {
    const page  = req.query.page  || '1';
    const limit = req.query.limit || '24';
    const data  = await voraJSON(`/series?take=${limit}&page=${page}&includeMeta=true&takeChapter=0`);
    ok(res, (Array.isArray(data?.data) ? data.data : []).map(normSeries).filter(Boolean));
  } catch (e) { err(res, e.message, e.status || 500); }
}
