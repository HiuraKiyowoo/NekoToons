import { voraGet, getChapterIndices, err, ok } from '../../_lib.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Origin','*'); res.status(204).end(); return; }
  const { slug, num } = req.query;
  if (!slug || !num) { err(res, 'slug dan num diperlukan', 400); return; }
  const cur = Number(num);
  try {
    const [chapRes, indices] = await Promise.all([
      voraGet(`/series/${encodeURIComponent(slug)}/chapters/${cur}`),
      getChapterIndices(slug),
    ]);
    const data = JSON.parse(chapRes.body.toString());
    if (chapRes.status !== 200 || !data?.data) { err(res, 'Chapter tidak ditemukan', 404); return; }
    const d      = data.data;
    const images = Array.isArray(d.images) ? d.images : (Array.isArray(d.data?.images) ? d.data.images : []);
    const idx    = indices.indexOf(cur);
    ok(res, {
      mangaSlug: slug,
      chapter:   cur,
      img:       images,
      prevNum:   idx > 0              ? indices[idx - 1] : null,
      nextNum:   idx < indices.length - 1 ? indices[idx + 1] : null,
    });
  } catch (e) { err(res, e.message, e.status || 500); }
}
