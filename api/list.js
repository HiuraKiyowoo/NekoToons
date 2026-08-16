import { siteGet, norm, ok, err } from './_lib.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Origin', '*'); res.status(204).end(); return; }
  try {
    const qs   = new URLSearchParams(req.query).toString();
    const { body, status } = await siteGet(`/api/list?${qs}`);
    if (status !== 200) { err(res, 'List gagal', status); return; }
    const raw  = JSON.parse(body.toString());
    const arr  = Array.isArray(raw) ? raw : (raw?.results ?? raw?.data ?? []);
    ok(res, arr.map(norm));
  } catch (e) { err(res, e.message); }
}
