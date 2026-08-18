import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { imgUrl, apiFetch, saveHistory, getLastChapter, fmtNum } from '../utils/api';

const Shimmer = () => <div className="absolute top-0 bottom-0 left-0 w-[150%] animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent z-10" style={{ transform: 'translate3d(-100%,0,0) skewX(-20deg)' }} />;

const EyeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
  </svg>
);

const StarIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const MangaDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [manga, setManga]         = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortDesc, setSortDesc]   = useState(true);
  const [lastRead, setLastRead]   = useState(null);

  useEffect(() => {
    if (!slug) return;
    window.scrollTo(0, 0);
    setIsLoading(true);
    setLastRead(getLastChapter(slug));
    apiFetch(`/komik/${slug}`)
      .then(res => {
        setManga(res.data);
        document.title = `${res.data.name} - NekoToons`;
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [slug]);

  // Voratoon: manga.chapters sudah berupa array terurut dari server
  const allChapters = manga?.chapters ?? [];
  const chapters    = sortDesc ? [...allChapters].reverse() : [...allChapters];
  const genres      = manga ? (Array.isArray(manga.genre) ? manga.genre : []) : [];

  const handleRead = (chapter) => {
    if (!manga) return;
    saveHistory({ slug: manga.slug, name: manga.name, image: manga.image }, chapter.chapterNum);
    navigate(`/read/${manga.slug}/${chapter.chapterNum}`);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#080c14] pb-24">
      <style>{`@keyframes shimmer{0%{transform:translate3d(-100%,0,0) skewX(-20deg)}100%{transform:translate3d(200%,0,0) skewX(-20deg)}} body,html{background:#080c14!important;color:white;margin:0;padding:0}`}</style>
      <Navbar />
      <div className="pt-20 max-w-4xl mx-auto px-4 md:px-6 animate-pulse">
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="w-48 mx-auto md:mx-0 aspect-[3/4] bg-[#0f1520] rounded-lg relative overflow-hidden shrink-0"><Shimmer /></div>
          <div className="flex-1 flex flex-col gap-4 pt-2">
            <div className="h-8 w-3/4 bg-[#0f1520] rounded-sm relative overflow-hidden"><Shimmer /></div>
            <div className="h-4 w-1/2 bg-[#0f1520] rounded-sm relative overflow-hidden"><Shimmer /></div>
            <div className="h-24 w-full bg-[#0f1520] rounded-sm relative overflow-hidden"><Shimmer /></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!manga) return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
      <Navbar /><div className="text-white/40 text-sm font-bold">Tidak ditemukan.</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080c14] font-nunito selection:bg-[#4f8ef7] selection:text-white pb-24 text-white">
      <style>{`@keyframes shimmer{0%{transform:translate3d(-100%,0,0) skewX(-20deg)}100%{transform:translate3d(200%,0,0) skewX(-20deg)}} body,html{background:#080c14!important;color:white;margin:0;padding:0}`}</style>
      <Navbar />

      {manga.image && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <img src={imgUrl(manga.image)} className="w-full h-full object-cover blur-3xl opacity-10 scale-110" alt="" />
          <div className="absolute inset-0 bg-[#080c14]/80" />
        </div>
      )}

      <div className="relative z-10 pt-20 max-w-4xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row gap-6 mb-8">

          {/* Cover */}
          <div className="w-full md:w-48 shrink-0 flex justify-center md:justify-start">
            <img src={imgUrl(manga.image)} alt={manga.name}
              className="w-44 md:w-48 aspect-[3/4] object-cover rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.7)]" />
          </div>

          {/* Info */}
          <div className="flex flex-col flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-4xl font-black text-white mb-1 leading-tight tracking-tighter">{manga.name}</h1>
            {manga.name2 && <p className="text-white/30 text-xs mb-4 font-medium italic">{manga.name2}</p>}

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-5">
              {manga.type && <span className="bg-[#4f8ef7] text-white text-[9px] px-2.5 py-1 rounded-md uppercase font-black tracking-widest">{manga.type}</span>}
              {manga.status && <span className="bg-white/10 text-white/80 text-[9px] px-2.5 py-1 rounded-md uppercase font-bold border border-white/10">{manga.status}</span>}
              {manga.rate && (
                <span className="flex items-center gap-1 bg-amber-400/10 text-amber-400 text-[9px] px-2.5 py-1 rounded-md font-bold border border-amber-400/20">
                  <StarIcon className="w-2.5 h-2.5" />{parseFloat(manga.rate).toFixed(1)}
                </span>
              )}
              {manga.views > 0 && (
                <span className="flex items-center gap-1 bg-white/5 text-white/50 text-[9px] px-2.5 py-1 rounded-md font-bold border border-white/10">
                  <EyeIcon className="w-2.5 h-2.5" />{fmtNum(manga.views)}
                </span>
              )}
              {manga.rilis && <span className="bg-white/5 text-white/50 text-[9px] px-2.5 py-1 rounded-md font-bold border border-white/10">{manga.rilis}</span>}
              {manga.totalChapters > 0 && <span className="bg-white/5 text-white/50 text-[9px] px-2.5 py-1 rounded-md font-bold border border-white/10">{manga.totalChapters} ch</span>}
            </div>

            {/* Author / Artist */}
            {manga.author && (
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-5">
                <div className="flex items-center gap-2 bg-[#0f1520] border border-white/8 px-3 py-2 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-[#4f8ef7]/20 flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-[#4f8ef7]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                    </svg>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-white/30 text-[8px] uppercase font-black tracking-wider">Author</span>
                    <span className="text-white text-[11px] font-bold leading-tight">{manga.author}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Genre */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center md:justify-start mb-4">
                {genres.map((g, i) => (
                  <span key={i} onClick={() => navigate(`/explore?q=${encodeURIComponent(g)}`)}
                    className="bg-[#4f8ef7]/10 border border-[#4f8ef7]/20 px-3 py-1 rounded-full text-[10px] font-bold text-[#4f8ef7]/80 cursor-pointer hover:bg-[#4f8ef7] hover:text-white hover:border-[#4f8ef7] transition-all">
                    {g}
                  </span>
                ))}
              </div>
            )}

            {manga.description && <p className="text-white/50 text-xs leading-relaxed line-clamp-4 mb-5">{manga.description}</p>}

            {/* Buttons */}
            {allChapters.length > 0 && (
              <div className="flex gap-2.5 justify-center md:justify-start flex-wrap">
                <button onClick={() => handleRead(allChapters[0])}
                  className="px-5 py-2.5 bg-[#4f8ef7] text-white font-black text-xs rounded-lg hover:bg-[#3a7ef5] active:scale-95 transition-all uppercase tracking-widest shadow-[0_4px_20px_rgba(79,142,247,0.35)]">
                  Baca Ch.{allChapters[0]?.chapterNum}
                </button>
                {lastRead?.chapterNum && (
                  <button onClick={() => navigate(`/read/${manga.slug}/${lastRead.chapterNum}`)}
                    className="px-5 py-2.5 bg-white/10 border border-white/20 text-white font-black text-xs rounded-lg hover:bg-white/20 active:scale-95 transition-all">
                    Lanjut Ch.{lastRead.chapterNum}
                  </button>
                )}
                <button onClick={() => handleRead(allChapters[allChapters.length - 1])}
                  className="px-5 py-2.5 bg-[#0f1520] border border-white/10 text-white/70 font-black text-xs rounded-lg hover:bg-white/10 active:scale-95 transition-all uppercase tracking-widest">
                  Ch.{allChapters[allChapters.length - 1]?.chapterNum} →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chapter list */}
        <div className="bg-[#0f1520] rounded-xl border border-white/5 p-4 md:p-6 shadow-xl mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-black uppercase text-sm tracking-wider">
              Chapters ({allChapters.length})
            </h3>
            <button onClick={() => setSortDesc(p => !p)}
              className="text-white/30 hover:text-[#4f8ef7] text-[10px] font-black uppercase tracking-widest transition-colors">
              {sortDesc ? 'Terbaru ↓' : 'Terlama ↑'}
            </button>
          </div>
          <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto pr-1">
            {chapters.map(ch => {
              const isLast = lastRead?.chapterNum === ch.chapterNum;
              return (
                <div key={ch.chapterNum} onClick={() => handleRead(ch)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all active:scale-[0.99] ${
                    isLast ? 'bg-[#4f8ef7]/10 border border-[#4f8ef7]/30' : 'bg-[#080c14] border border-white/5 hover:border-white/15 hover:bg-white/5'
                  }`}>
                  <div className="flex items-center gap-3">
                    <span className={`font-black text-sm ${isLast ? 'text-[#4f8ef7]' : 'text-white/80'}`}>Ch. {ch.chapterNum}</span>
                    {isLast && <span className="text-[#4f8ef7] text-[8px] font-black uppercase bg-[#4f8ef7]/10 px-1.5 py-0.5 rounded">Terakhir</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    {ch.views > 0 && (
                      <span className="flex items-center gap-1 text-white/20 text-[9px] font-bold">
                        <EyeIcon className="w-3 h-3" />{fmtNum(ch.views)}
                      </span>
                    )}
                    <svg className="w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
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
