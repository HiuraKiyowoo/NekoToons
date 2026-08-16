import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { imgUrl, apiFetch, saveHistory, getLastChapter, fmtNum } from '../utils/api';

const Shimmer = () => <div className="absolute top-0 bottom-0 left-0 w-[150%] animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent z-10" style={{ transform: 'translate3d(-100%,0,0) skewX(-20deg)' }} />;

/**
 * Normalisasi item.Komik (object keyed by chapter number) → array terurut
 * Contoh: { "711": { img, CreateAt, ... }, "712": {...} }
 */
function normalizeChapters(komik) {
  if (!komik || typeof komik !== 'object') return [];
  return Object.entries(komik)
    .map(([num, data]) => ({ chapterNum: Number(num), ...data }))
    .sort((a, b) => a.chapterNum - b.chapterNum);
}

const MangaDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [manga, setManga]       = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortDesc, setSortDesc] = useState(true);
  const [lastRead, setLastRead] = useState(null);

  useEffect(() => {
    if (!slug) return;
    window.scrollTo(0, 0);
    setIsLoading(true);
    setLastRead(getLastChapter(slug));
    apiFetch(`/komik/${slug}`)
      .then(res => {
        setManga(res.data);
        document.title = `${res.data.name} - KanataToon`;
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [slug]);

  // genre: array of strings ["Action", "Adventure", ...]
  const genres = manga ? (Array.isArray(manga.genre) ? manga.genre : []) : [];

  // chapters dari Komik object
  const allChapters = manga ? normalizeChapters(manga.Komik) : [];
  const chapters = sortDesc ? [...allChapters].reverse() : allChapters;

  const handleRead = (chapter) => {
    if (!manga) return;
    saveHistory({ slug: manga.slug, name: manga.name, image: manga.image }, chapter.chapterNum);
    navigate(`/read/${manga.slug}/${chapter.chapterNum}`);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#0a0a0c] pb-24">
      <style>{`@keyframes shimmer{0%{transform:translate3d(-100%,0,0) skewX(-20deg)}100%{transform:translate3d(200%,0,0) skewX(-20deg)}} body,html{background:#0a0a0c!important;color:white;margin:0;padding:0}`}</style>
      <Navbar />
      <div className="pt-20 max-w-4xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row gap-6 mb-8 animate-pulse">
          <div className="w-48 mx-auto md:mx-0 aspect-[3/4] bg-[#16161a] rounded-sm relative overflow-hidden shrink-0"><Shimmer /></div>
          <div className="flex-1 flex flex-col gap-4 pt-2">
            <div className="h-8 w-3/4 bg-[#16161a] rounded-sm relative overflow-hidden"><Shimmer /></div>
            <div className="h-4 w-1/2 bg-[#16161a] rounded-sm relative overflow-hidden"><Shimmer /></div>
            <div className="h-24 w-full bg-[#16161a] rounded-sm relative overflow-hidden"><Shimmer /></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!manga) return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
      <Navbar />
      <div className="text-white/40 text-sm font-bold">Manga tidak ditemukan.</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0c] font-nunito selection:bg-[#F6CF80] selection:text-black pb-24 text-white">
      <style>{`@keyframes shimmer{0%{transform:translate3d(-100%,0,0) skewX(-20deg)}100%{transform:translate3d(200%,0,0) skewX(-20deg)}} body,html{background:#0a0a0c!important;color:white;margin:0;padding:0}`}</style>
      <Navbar />

      {manga.image && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <img src={imgUrl(manga.image)} className="w-full h-full object-cover blur-3xl opacity-10 scale-110" alt="" />
          <div className="absolute inset-0 bg-[#0a0a0c]/80" />
        </div>
      )}

      <div className="relative z-10 pt-20 max-w-4xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="w-full md:w-48 shrink-0">
            <img src={imgUrl(manga.image)} alt={manga.name} className="w-48 mx-auto md:mx-0 aspect-[3/4] object-cover rounded-sm shadow-[0_20px_60px_rgba(0,0,0,0.6)]" />
          </div>
          <div className="flex flex-col flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-4xl font-black text-white mb-2 leading-tight tracking-tighter">{manga.name}</h1>
            {manga.name2 && <p className="text-white/40 text-xs mb-4 font-medium">{manga.name2}</p>}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
              {manga.type   && <span className="bg-[#F6CF80] text-black text-[9px] px-2.5 py-1 rounded-sm uppercase font-black tracking-widest">{manga.type}</span>}
              {manga.status && <span className="bg-white/10 text-white/80 text-[9px] px-2.5 py-1 rounded-sm uppercase font-bold border border-white/5">{manga.status}</span>}
              {manga.rate   && <span className="bg-[#fbbf24]/10 text-[#fbbf24] text-[9px] px-2.5 py-1 rounded-sm font-bold border border-[#fbbf24]/20">★ {parseFloat(manga.rate).toFixed(2)}</span>}
              {manga.views  && <span className="bg-white/5 text-white/60 text-[9px] px-2.5 py-1 rounded-sm font-bold border border-white/5">👁 {fmtNum(manga.views)}</span>}
              {manga.rilis  && <span className="bg-white/5 text-white/60 text-[9px] px-2.5 py-1 rounded-sm font-bold border border-white/5">{manga.rilis}</span>}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
              {manga.author && <div className="bg-white/5 rounded-sm px-3 py-2 border border-white/5"><span className="text-white/40 text-[9px] uppercase font-black block">Author</span><span className="text-white font-bold">{manga.author}</span></div>}
              {manga.artist && <div className="bg-white/5 rounded-sm px-3 py-2 border border-white/5"><span className="text-white/40 text-[9px] uppercase font-black block">Artist</span><span className="text-white font-bold">{manga.artist}</span></div>}
            </div>

            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                {genres.map((g, i) => (
                  <span key={i}
                    onClick={() => navigate(`/explore?q=${encodeURIComponent(g)}`)}
                    className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-white/70 cursor-pointer hover:bg-[#F6CF80] hover:text-black hover:border-[#F6CF80] transition-all">{g}</span>
                ))}
              </div>
            )}

            {manga.description && <p className="text-white/60 text-xs leading-relaxed line-clamp-4 mb-4">{manga.description}</p>}

            {chapters.length > 0 && (
              <div className="flex gap-3 justify-center md:justify-start flex-wrap">
                {/* Baca Ch.1 = chapter pertama (index terakhir karena sort desc) */}
                <button onClick={() => handleRead(allChapters[0])} className="px-6 py-3 bg-[#F6CF80] text-black font-black text-xs rounded-lg hover:bg-[#ebd59b] active:scale-95 transition-all uppercase tracking-widest">
                  Baca Ch.{allChapters[0]?.chapterNum}
                </button>
                {lastRead?.chapterNum && (
                  <button onClick={() => navigate(`/read/${manga.slug}/${lastRead.chapterNum}`)} className="px-6 py-3 bg-white/10 border border-white/20 text-white font-black text-xs rounded-lg hover:bg-white/20 active:scale-95 transition-all">
                    Lanjut Ch.{lastRead.chapterNum}
                  </button>
                )}
                {/* Baca chapter terbaru */}
                <button onClick={() => handleRead(allChapters[allChapters.length - 1])} className="px-6 py-3 bg-white/5 border border-white/10 text-white font-black text-xs rounded-lg hover:bg-white/10 active:scale-95 transition-all uppercase tracking-widest">
                  Ch.{allChapters[allChapters.length - 1]?.chapterNum} →
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#16161a] rounded-sm border border-white/5 p-4 md:p-6 shadow-xl mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-black uppercase text-sm tracking-wider">Chapters ({chapters.length})</h3>
            <button onClick={() => setSortDesc(p => !p)} className="text-white/40 hover:text-[#F6CF80] text-[10px] font-black uppercase tracking-widest transition-colors">
              {sortDesc ? 'Terbaru ↓' : 'Terlama ↑'}
            </button>
          </div>
          <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto pr-1">
            {chapters.map(ch => {
              const isLast = lastRead?.chapterNum === ch.chapterNum;
              return (
                <div key={ch.chapterNum} onClick={() => handleRead(ch)}
                  className={`flex items-center justify-between px-4 py-3 rounded-sm cursor-pointer transition-all active:scale-[0.99] ${isLast ? 'bg-[#F6CF80]/10 border border-[#F6CF80]/30' : 'bg-[#0a0a0c] border border-white/5 hover:border-white/20 hover:bg-white/5'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`font-black text-sm ${isLast ? 'text-[#F6CF80]' : 'text-white/80'}`}>Ch. {ch.chapterNum}</span>
                    {isLast && <span className="text-[#F6CF80] text-[8px] font-black uppercase">Terakhir Dibaca</span>}
                    {ch.img?.length > 0 && <span className="text-white/20 text-[9px] font-bold">{ch.img.length} hal</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    {ch.viewsChil > 0 && <span className="text-white/30 text-[9px] font-bold">{fmtNum(ch.viewsChil)}</span>}
                    <svg className="w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MangaDetail;
