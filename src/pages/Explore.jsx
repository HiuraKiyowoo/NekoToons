import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { imgUrl, apiFetch } from '../utils/api';

const Shimmer = () => <div className="absolute top-0 bottom-0 left-0 w-[150%] animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent z-10" style={{ transform: 'translate3d(-100%,0,0) skewX(-20deg)' }} />;
const CardSkeleton = () => <div className="w-full flex flex-col gap-2"><div className="aspect-[3/4.5] bg-[#16161a] rounded-sm relative overflow-hidden"><Shimmer /></div><div className="w-3/4 h-2.5 bg-[#16161a] rounded-sm relative overflow-hidden"><Shimmer /></div></div>;

const MangaCard = ({ a, onClick, index }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), (index % 15) * 40); return () => clearTimeout(t); }, [index]);
  return (
    <div onClick={onClick} className={`w-full flex flex-col gap-2 group cursor-pointer active:scale-95 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="relative aspect-[3/4.5] w-full overflow-hidden bg-[#16161a] rounded-sm shadow-xl">
        <img src={imgUrl(a.image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={a.name} />
        {a.rate && <div className="absolute top-1 left-1 bg-black/60 text-[#F6CF80] text-[8px] font-black px-1.5 py-0.5 rounded-sm">★ {parseFloat(a.rate).toFixed(1)}</div>}
        {a.type && <div className="absolute bottom-1 right-1 bg-white/10 text-white/80 text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase">{a.type}</div>}
      </div>
      <h3 className="text-[9px] font-bold text-white/60 line-clamp-1 group-hover:text-[#F6CF80] transition-colors">{a.name}</h3>
    </div>
  );
};

const LIMIT = 24;

const Explore = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  const [results, setResults]     = useState([]);
  const [page, setPage]           = useState(1);
  const [hasNext, setHasNext]     = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    setPage(1);
    setResults([]);
  }, [query]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setIsLoading(true);
      try {
        let list = [];
        if (query) {
          // Search mode: gunakan /api/search
          const res = await apiFetch(`/search?q=${encodeURIComponent(query)}`);
          list = Array.isArray(res.data) ? res.data : [];
          if (alive) { setResults(list); setHasNext(false); }
        } else {
          // Browse mode: /api/list dengan paginasi
          const res  = await apiFetch(`/list?page=${page}&limit=${LIMIT}`);
          list = Array.isArray(res.data) ? res.data : [];
          if (alive) {
            setResults(prev => page === 1 ? list : [...prev, ...list]);
            setHasNext(list.length >= LIMIT);
          }
        }
      } catch { if (alive) setResults([]); }
      finally { if (alive) setIsLoading(false); }
    };
    load();
    return () => { alive = false; };
  }, [page, query]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] font-nunito selection:bg-[#F6CF80] selection:text-black pb-24">
      <style>{`@keyframes shimmer{0%{transform:translate3d(-100%,0,0) skewX(-20deg)}100%{transform:translate3d(200%,0,0) skewX(-20deg)}} body,html{background:#0a0a0c!important;color:white;margin:0;padding:0} .no-scrollbar::-webkit-scrollbar{display:none}`}</style>
      <Navbar />
      <div className="pt-24 max-w-7xl mx-auto px-6">

        {query ? (
          <div className="mb-8">
            <h2 className="text-white/40 text-xs font-bold uppercase tracking-widest">Hasil untuk:</h2>
            <span className="text-[#F6CF80] text-2xl font-black uppercase tracking-tighter">"{query}"</span>
          </div>
        ) : (
          <div className="mb-8">
            <h2 className="text-white font-black text-lg uppercase tracking-tight">Semua Komik</h2>
            <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Jelajahi katalog lengkap</span>
          </div>
        )}

        <div className="grid grid-cols-[repeat(auto-fill,minmax(95px,1fr))] gap-3 px-2">
          {isLoading && results.length === 0
            ? [...Array(18)].map((_, i) => <CardSkeleton key={i} />)
            : results.map((a, i) => <MangaCard key={a.slug || i} a={a} index={i} onClick={() => navigate(`/manga/${a.slug}`)} />)}
        </div>

        {!isLoading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-white/40 font-bold text-sm">Tidak ditemukan</p>
          </div>
        )}

        {!query && hasNext && !isLoading && (
          <div className="flex justify-center mt-10">
            <button onClick={() => setPage(p => p + 1)} disabled={isLoading}
              className="px-8 py-3 bg-[#16161a] border border-white/10 hover:border-[#F6CF80] hover:text-[#F6CF80] text-white font-black text-xs uppercase tracking-widest rounded-lg transition-all disabled:opacity-50">
              Muat Lebih Banyak
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
