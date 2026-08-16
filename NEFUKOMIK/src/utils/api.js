// Semua API call → vite proxy → server.js
// Images → /img?url= proxy (server.js tambah Referer keikomik.net)

export const imgUrl = (url) => {
  if (!url) return '';
  return '/img?url=' + encodeURIComponent(url);
};

export async function apiFetch(path) {
  const res = await fetch('/api' + path);
  if (!res.ok && res.status !== 404) throw new Error('HTTP ' + res.status);
  const text = await res.text();
  try {
    return { data: JSON.parse(text), status: res.status, headers: res.headers };
  } catch {
    return { data: text, status: res.status, headers: res.headers };
  }
}

export function fmtNum(n) {
  if (!n) return '';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

// History — key baru agar tidak konflik dengan data lama (format berbeda)
const HISTORY_KEY = 'keikomik_history_v2';

/**
 * Simpan progress baca.
 * @param {{ slug: string, name: string, image: string }} manga
 * @param {number} chapterNum
 */
export function saveHistory({ slug, name, image }, chapterNum) {
  try {
    const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const filtered = existing.filter(h => h.slug !== slug);
    const entry = { slug, name, image, chapterNum, readAt: Date.now() };
    localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...filtered].slice(0, 100)));
  } catch {}
}

export function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}

export function clearHistory() {
  try { localStorage.removeItem(HISTORY_KEY); } catch {}
}

/** Return entry history untuk slug tertentu, atau null */
export function getLastChapter(slug) {
  try {
    const all = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return all.find(h => h.slug === slug) || null;
  } catch { return null; }
}
