import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { imgUrl, getHistory, clearHistory, apiFetch } from '../utils/api';

const Shimmer = () => <div className="absolute top-0 bottom-0 left-0 w-[150%] animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent z-10" style={{ transform: 'translate3d(-100%,0,0) skewX(-20deg)' }} />;

const History = () => {
  const navigate = useNavigate();
  const [history, setHistory]       = useState([]);
  const [popular, setPopular]       = useState([]);
  const [isLoadingPop, setIsLoadingPop] = useState(false);

  const loadPopular = () => {
    setIsLoadingPop(true);
    apiFetch('/home')
      .then(r => setPopular(Array.isArray(r.data?.popular) ? r.data.popular : []))
      .catch(() => {})
      .finally(() => setIsLoadingPop(false));
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const h = getHistory();
    setHistory(h);
    if (h.length === 0) loadPopular();
  }, []);

  const handleClear = () => {
    clearHistory();
    setHistory([]);
    loadPopular();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] font-nunito selection:bg-[#F6CF80] selection:text-black pb-24">
      <style>{`@keyframes shimmer{0%{transform:translate3d(-100%,0,0) skewX(-20deg)}100%{transform:translate3d(200%,0,0) skewX(-20deg)}} body,html{background:#0a0a0c!important;color:white;margin:0;padding:0}`}</style>
      <Navbar />
      <div className="pt-24 max-w-4xl mx-auto px-6">

        {history.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-white font-black text-xl uppercase tracking-tight">Riwayat Baca</h2>
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{history.length} manga</span>
              </div>
              <button onClick={handleClear} className="text-white/30 hover:text-red-400 text-xs font-black uppercase tracking-widest transition-colors">Hapus Semua</button>
            </div>
            <div className="flex flex-col gap-3">
              {history.map(item => (
                <div key={item.slug} onClick={() => navigate(`/manga/${item.slug}`)}
                  className="group flex items-center gap-4 bg-[#16161a] border border-white/5 hover:border-[#F6CF80]/30 p-3 rounded-sm cursor-pointer transition-all active:scale-[0.99]">
                  {item.image
                    ? <img src={imgUrl(item.image)} alt={item.name} className="w-12 aspect-[3/4.2] object-cover rounded-sm shadow-md shrink-0" onError={e => { e.target.style.display = 'none'; }} />
                    : <div className="w-12 aspect-[3/4.2] bg-[#0a0a0c] rounded-sm shrink-0 flex items-center justify-center"><svg className="w-4 h-4 text-white/10" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg></div>
                  }
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-white font-bold text-sm line-clamp-1 group-hover:text-[#F6CF80] transition-colors">{item.name}</span>
                    <span className="text-white/40 text-[10px] font-bold mt-1">Terakhir: Chapter {item.chapterNum}</span>
                    <span className="text-white/20 text-[9px]">{new Date(item.readAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <button onClick={e => { e.stopPropagation(); navigate(`/read/${item.slug}/${item.chapterNum}`); }}
                    className="px-3 py-1.5 bg-[#F6CF80] text-black text-[10px] font-black rounded-lg hover:bg-[#ebd59b] transition-colors shrink-0">
                    Lanjut
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center py-16 text-center mb-12">
              <svg className="w-16 h-16 text-white/5 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <h2 className="text-white/30 font-black text-lg mb-2">Belum Ada Riwayat</h2>
              <p className="text-white/20 text-xs font-bold">Mulai baca manga dulu, riwayatmu akan muncul di sini.</p>
            </div>
            <div>
              <h3 className="text-white font-black text-sm uppercase tracking-wide mb-4">Populer — Mulai dari sini</h3>
              {isLoadingPop ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(95px,1fr))] gap-3">
                  {[...Array(9)].map((_, i) => <div key={i} className="aspect-[3/4.5] bg-[#16161a] rounded-sm relative overflow-hidden"><Shimmer /></div>)}
                </div>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(95px,1fr))] gap-3">
                  {popular.map((a, i) => (
                    <div key={a.slug || i} onClick={() => navigate(`/manga/${a.slug}`)} className="flex flex-col gap-2 group cursor-pointer active:scale-95 transition-transform">
                      <div className="relative aspect-[3/4.5] overflow-hidden bg-[#16161a] rounded-sm shadow-xl">
                        <img src={imgUrl(a.image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={a.name} />
                        {a.rate && <div className="absolute top-1 left-1 bg-black/60 text-[#F6CF80] text-[8px] font-black px-1.5 py-0.5 rounded-sm">★ {parseFloat(a.rate).toFixed(1)}</div>}
                      </div>
                      <h3 className="text-[9px] font-bold text-white/60 line-clamp-1 group-hover:text-[#F6CF80] transition-colors">{a.name}</h3>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default History;
