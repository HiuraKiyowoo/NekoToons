import { voraJSON, normSeries, normChapter, ok, err } from '../_lib.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Origin','*'); res.status(204).end(); return; }
  const { slug } = req.query;
  if (!slug) { err(res, 'Slug diperlukan', 400); return; }
  try {
    const [detailRes, chapRes] = await Promise.all([
      voraJSON(`/series/${encodeURIComponent(slug)}`),
      voraJSON(`/series/${encodeURIComponent(slug)}/chapters?page=1`),
    ]);
    const series = normSeries(detailRes?.data);
    if (!series?.slug) { err(res, 'Tidak ditemukan', 404); return; }
    const chapters = (Array.isArray(chapRes?.data) ? chapRes.data : [])
      .map(normChapter).filter(Boolean)
      .sort((a, b) => a.chapterNum - b.chapterNum);
    ok(res, { ...series, chapters });
  } catch (e) { err(res, e.message, e.status || 500); }
}
