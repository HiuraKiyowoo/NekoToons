import { nextGet, ok, err } from '../../_lib.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Origin', '*'); res.status(204).end(); return; }
  const { slug, num } = req.query;
  if (!slug || !num) { err(res, 'slug dan num diperlukan', 400); return; }
  try {
    const data = await nextGet(`chapter/${slug}-chapter-${num}`);
    if (!data?.pageProps) { err(res, 'Chapter tidak ditemukan', 404); return; }
    const props   = data.pageProps;
    const subItem = props.subItem ?? {};
    const ids     = (props.komikIds ?? []).map(Number).sort((a, b) => a - b);
    const cur     = Number(num);
    const idx     = ids.indexOf(cur);
    ok(res, {
      mangaName: props.data?.name ?? '',
    mangaImage: props.data?.image ?? '',
      mangaSlug: props.slug ?? slug,
      chapter:   cur,
      img:       subItem.img ?? [],
      prevNum:   idx > 0              ? ids[idx - 1] : null,
      nextNum:   idx < ids.length - 1 ? ids[idx + 1] : null,
      UpdateAt:  subItem.UpdateAt ?? null,
    });
  } catch (e) { err(res, e.message); }
}
