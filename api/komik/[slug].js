import { nextGet, norm, ok, err } from '../_lib.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Origin', '*'); res.status(204).end(); return; }
  const { slug } = req.query;
  if (!slug) { err(res, 'Slug diperlukan', 400); return; }
  try {
    const data = await nextGet(`komik/${slug}`);
    if (!data?.pageProps?.item) { err(res, 'Tidak ditemukan', 404); return; }
    const item = data.pageProps.item;
    ok(res, { ...norm(item), Komik: item.Komik ?? {} });
  } catch (e) { err(res, e.message); }
}
