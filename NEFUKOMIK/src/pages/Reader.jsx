import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { imgUrl, apiFetch, saveHistory } from '../utils/api';

const Reader = () => {
  const { slug, chapterNum } = useParams();
  const navigate = useNavigate();
  const [chapter, setChapter]         = useState(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const hideTimer = useRef(null);

  useEffect(() => {
    if (!slug || !chapterNum) return;
    window.scrollTo(0, 0);
    setIsLoading(true);
    setLoadedCount(0);
    setChapter(null);

    apiFetch(`/chapter/${slug}/${chapterNum}`)
      .then(res => {
        const data = res.data;
        setChapter(data);
        document.title = `${data.mangaName || ''} — Ch.${data.chapter} - KanataToon`;
        if (data.mangaSlug) {
          saveHistory(
            { slug: data.mangaSlug, name: data.mangaName, image: null },
            data.chapter
          );
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [slug, chapterNum]);

  const showToolbar = () => {
    setToolbarVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setToolbarVisible(false), 3000);
  };

  const pages = chapter?.img || [];

  const goToPrev = () => {
    if (chapter?.prevNum != null) navigate(`/read/${slug}/${chapter.prevNum}`, { replace: true });
  };
  const goToNext = () => {
    if (chapter?.nextNum != null) navigate(`/read/${slug}/${chapter.nextNum}`, { replace: true });
  };
  const goBack = () => navigate(`/manga/${chapter?.mangaSlug ?? slug}`);

  return (
    <div className="min-h-screen bg-black text-white font-nunito" onClick={showToolbar}>
      <style>{`body,html{background:#000!important;margin:0;padding:0;overscroll-behavior-y:none}`}</style>

      {/* Toolbar */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${toolbarVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}>
        <div className="bg-black/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={e => { e.stopPropagation(); goBack(); }}
              className="w-9 h-9 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div className="flex flex-col min-w-0">
              <span className="text-white font-black text-xs line-clamp-1">{chapter?.mangaName || 'Memuat...'}</span>
              <span className="text-white/40 text-[10px] font-bold">Chapter {chapter?.chapter ?? chapterNum} · {loadedCount}/{pages.length} hal</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {chapter?.prevNum != null && (
              <button onClick={e => { e.stopPropagation(); goToPrev(); }}
                className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-xs font-black hover:bg-white/20 transition-colors">← Prev</button>
            )}
            {chapter?.nextNum != null && (
              <button onClick={e => { e.stopPropagation(); goToNext(); }}
                className="px-3 py-1.5 bg-[#F6CF80] text-black rounded-lg text-xs font-black hover:bg-[#ebd59b] transition-colors">Next →</button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-white/10 border-t-[#F6CF80] rounded-full animate-spin" />
            <p className="text-white/40 text-sm font-bold">Memuat chapter...</p>
          </div>
        </div>
      ) : pages.length === 0 ? (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-white/40 text-sm font-bold">Tidak ada halaman.</p>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto pt-16 pb-8">
          {pages.map((url, i) => (
            <div key={i} className="w-full relative min-h-[200px] bg-[#111] flex items-center justify-center">
              <img
                src={imgUrl(url)}
                alt={`Halaman ${i + 1}`}
                loading="lazy"
                className="w-full block"
                onLoad={() => setLoadedCount(p => p + 1)}
                onError={e => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<div style="padding:40px;text-align:center;color:rgba(255,255,255,0.3);font-size:12px;font-weight:bold;min-height:200px;display:flex;align-items:center;justify-content:center;">❌ Halaman ${i + 1} gagal</div>`;
                }}
              />
            </div>
          ))}

          <div className="flex justify-center gap-4 p-8 flex-wrap">
            {chapter?.prevNum != null && (
              <button onClick={goToPrev}
                className="px-6 py-3 bg-white/10 border border-white/20 text-white font-black text-xs rounded-lg hover:bg-white/20 transition-all uppercase">
                ← Chapter Sebelumnya
              </button>
            )}
            {chapter?.nextNum != null ? (
              <button onClick={goToNext}
                className="px-6 py-3 bg-[#F6CF80] text-black font-black text-xs rounded-lg hover:bg-[#ebd59b] transition-all uppercase">
                Chapter Selanjutnya →
              </button>
            ) : (
              <button onClick={goBack}
                className="px-6 py-3 bg-[#F6CF80] text-black font-black text-xs rounded-lg hover:bg-[#ebd59b] transition-all uppercase">
                ✓ Selesai — Kembali
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reader;
