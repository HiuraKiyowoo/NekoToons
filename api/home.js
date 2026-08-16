import { nextGet, norm, ok, err } from './_lib.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Origin', '*'); res.status(204).end(); return; }
  try {
    const data = await nextGet('index');
    const { popular = [], articles = [], carousel = [] } = data?.pageProps ?? {};
    ok(res, { popular: popular.map(norm), articles: articles.map(norm), carousel: carousel.map(norm) });
  } catch (e) { err(res, e.message); }
}
