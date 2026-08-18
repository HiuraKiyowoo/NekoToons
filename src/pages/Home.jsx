import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { imgUrl, apiFetch, fmtNum } from '../utils/api';

const Shimmer = () => <div className="absolute top-0 bottom-0 left-0 w-[150%] animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent z-10" style={{ transform: 'translate3d(-100%,0,0) skewX(-20deg)' }} />;

const CardSkeleton = () => (
  <div className="min-w-[105px] flex flex-col gap-2">
    <div className="aspect-[3/4.5] bg-[#0f1520] rounded-sm relative overflow-hidden shadow-xl"><Shimmer /></div>
    <div className="w-3/4 h-2.5 bg-[#0f1520] rounded-sm relative overflow-hidden"><Shimmer /></div>
  </div>
);

const MangaCard = ({ a, onClick, badge }) => (
  <div onClick={onClick} className="min-w-[105px] w-[105px] group cursor-pointer snap-start active:scale-95 flex flex-col gap-2 transition-transform">
    <div className="relative aspect-[3/4.5] overflow-hidden bg-[#0f1520] rounded-sm shadow-xl">
      <img src={imgUrl(a.image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={a.name} />
      {badge && <div className="absolute top-1 left-1 bg-black/70 text-[#4f8ef7] text-[8px] font-black px-1.5 py-0.5 rounded-sm">{badge}</div>}
      {a.type && (
        <div className="absolute bottom-1 right-1 bg-black/50 text-[13px] px-1 py-0.5 rounded-sm leading-none">
          {a.type === 'Manga' ? '🇯🇵' : a.type === 'Manhwa' ? '🇰🇷' : a.type === 'Manhua' ? '🇨🇳' : a.type}
        </div>
      )}
    </div>
    <h3 className="text-[9px] font-bold text-white/60 line-clamp-1 group-hover:text-[#4f8ef7] transition-colors">{a.name}</h3>
  </div>
);

const SectionHeader = ({ title, sub, onMore, scrollRef }) => (
  <div className="flex items-center justify-between mb-4 px-2">
    <div className="flex flex-col cursor-pointer group" onClick={onMore}>
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-black text-white uppercase leading-none group-hover:text-[#4f8ef7] transition-colors tracking-tight">{title}</h2>
        <svg className="w-5 h-5 text-white/40 group-hover:text-[#4f8ef7] transition-colors" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
      </div>
      <span className="text-[10px] text-white/40 mt-1 font-bold uppercase tracking-widest">{sub}</span>
    </div>
    <div className="flex gap-2">
      <button onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })} className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-full hover:bg-white/20 transition-colors">
        <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
      </button>
      <button onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })} className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-full hover:bg-white/20 transition-colors">
        <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
      </button>
    </div>
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const [carousel,  setCarousel]  = useState([]);
  const [articles,  setArticles]  = useState([]);
  const [newSeries, setNewSeries] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [heroIdx,   setHeroIdx]   = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const r1 = useRef(null), r2 = useRef(null), r3 = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    let alive = true;
    (async () => {
      setIsLoading(true);
      try {
        const res = await apiFetch('/home');
        if (!alive) return;
        const d = res.data ?? {};
        setCarousel(d.carousel  ?? []);
        setArticles(d.articles  ?? []);
        setNewSeries(d.newSeries ?? []);
        setCompleted(d.completed ?? []);
      } finally { if (alive) setIsLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const heroItems = carousel.slice(0, 10);

  useEffect(() => {
    if (!heroItems.length) return;
    const itv = setInterval(() => setHeroIdx(p => (p + 1) % heroItems.length), 5000);
    return () => clearInterval(itv);
  }, [heroItems.length]);

  return (
    <div className="min-h-screen bg-[#080c14] font-nunito selection:bg-[#4f8ef7] selection:text-white pb-24 text-white">
      <style>{`
        @keyframes shimmer{0%{transform:translate3d(-100%,0,0) skewX(-20deg)}100%{transform:translate3d(200%,0,0) skewX(-20deg)}}
        body,html{background-color:#080c14!important;color:white;margin:0;padding:0;overscroll-behavior-y:none}
        .cscroll::-webkit-scrollbar{height:4px}.cscroll::-webkit-scrollbar-track{background:transparent}.cscroll::-webkit-scrollbar-thumb{background:rgba(79,142,247,0.3);border-radius:10px}
      `}</style>
      <Navbar />

      {/* Hero Peek Carousel */}
      <header className="relative w-full overflow-hidden bg-[#080c14] pt-20 pb-4">
        <div className="relative h-[420px] md:h-[500px] flex items-center justify-center">
          {isLoading ? (
            <div className="w-[78%] max-w-sm aspect-[3/4] bg-[#0f1520] rounded-2xl relative overflow-hidden"><Shimmer /></div>
          ) : heroItems.map((item, i) => {
            const len   = heroItems.length;
            const raw   = i - heroIdx;
            const off   = ((raw % len) + len) % len;
            const norm  = off > len / 2 ? off - len : off;
            if (Math.abs(norm) > 1) return null;
            const active = norm === 0;
            return (
              <div key={item.slug + i} onClick={() => active && navigate(`/manga/${item.slug}`)}
                style={{
                  position:  'absolute',
                  width:     '78%',
                  maxWidth:  '380px',
                  transform: `translateX(${norm * 82}%) scale(${active ? 1 : 0.84})`,
                  opacity:   active ? 1 : 0.45,
                  zIndex:    active ? 3 : 1,
                  transition:'all 0.55s cubic-bezier(0.34,1.56,0.64,1)',
                  cursor:    active ? 'pointer' : 'default',
                }}>
                {/* Card */}
                <div className="relative rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.7)] aspect-[3/4.2]">
                  <img src={imgUrl(item.image)} className="w-full h-full object-cover" alt={item.name} />

                  {/* Stats row — top */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {item.rate && (
                      <div className="flex items-center gap-1 bg-amber-400/90 text-black text-[10px] font-black px-2 py-1 rounded-lg shadow-md">
                        <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        {parseFloat(item.rate).toFixed(1)}
                      </div>
                    )}
                    {item.bookmarkCount > 0 && (
                      <div className="flex items-center gap-1 bg-pink-500/90 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-md">
                        <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>
                        {fmtNum(item.bookmarkCount)}
                      </div>
                    )}
                    {item.views > 0 && (
                      <div className="flex items-center gap-1 bg-emerald-500/90 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-md">
                        <svg className="w-2.5 h-2.5 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        {fmtNum(item.views)}
                      </div>
                    )}
                    {item.ranking && (
                      <div className="flex items-center gap-1 bg-[#4f8ef7]/90 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-md">
                        <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><path d="M5 20h14v-2H5v2zm0-4h14v-2H5v2zm0-4h14v-2H5v2zm0-4h14V6H5v2zm0-6v2h14V2H5z"/></svg>
                        #{item.ranking}
                      </div>
                    )}
                  </div>

                  {/* Bottom overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 pb-3 px-3">
                    <h2 className="text-white font-black text-sm leading-tight line-clamp-2 mb-2">{item.name}</h2>
                    {item.genre?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.genre.slice(0, 3).map((g, gi) => (
                          <span key={gi} className="bg-white/15 text-white/80 text-[9px] font-bold px-2 py-0.5 rounded-full">{g}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Nav buttons + dots */}
        {!isLoading && heroItems.length > 0 && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <button onClick={() => setHeroIdx(p => (p - 1 + heroItems.length) % heroItems.length)}
              className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#4f8ef7]/30 transition-colors">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div className="flex gap-1.5">
              {heroItems.map((_, i) => (
                <button key={i} onClick={() => setHeroIdx(i)}
                  className={`rounded-full transition-all duration-300 ${i === heroIdx ? 'w-5 h-2 bg-[#4f8ef7]' : 'w-2 h-2 bg-white/20 hover:bg-white/40'}`} />
              ))}
            </div>
            <button onClick={() => setHeroIdx(p => (p + 1) % heroItems.length)}
              className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#4f8ef7]/30 transition-colors">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        )}
      </header>

      {/* Update */}
      <section className="max-w-7xl mx-auto px-6 mt-12">
        <SectionHeader title="Update" sub="Chapter terbaru" onMore={() => navigate('/browse')} scrollRef={r1} />
        <div ref={r1} className="flex overflow-x-auto gap-3 pb-4 cscroll snap-x px-2">
          {isLoading ? [...Array(8)].map((_, i) => <CardSkeleton key={i} />) :
            articles.map((a, i) => <MangaCard key={a.slug || i} a={a} onClick={() => navigate(`/manga/${a.slug}`)} badge={a.status === 'ongoing' ? 'Ongoing' : a.status} />)}
        </div>
      </section>

      {/* New Series */}
      <section className="max-w-7xl mx-auto px-6 mt-10">
        <SectionHeader title="New Series" sub="Komik baru ditambahkan" onMore={() => navigate('/explore')} scrollRef={r2} />
        <div ref={r2} className="flex overflow-x-auto gap-3 pb-4 cscroll snap-x px-2">
          {isLoading ? [...Array(8)].map((_, i) => <CardSkeleton key={i} />) :
            newSeries.map((a, i) => <MangaCard key={a.slug || i} a={a} onClick={() => navigate(`/manga/${a.slug}`)} badge="New" />)}
        </div>
      </section>

      {/* Completed */}
      <section className="max-w-7xl mx-auto px-6 mt-10">
        <SectionHeader title="Complete" sub="Sudah tamat" onMore={() => navigate('/browse')} scrollRef={r3} />
        <div ref={r3} className="flex overflow-x-auto gap-3 pb-4 cscroll snap-x px-2">
          {isLoading ? [...Array(8)].map((_, i) => <CardSkeleton key={i} />) :
            completed.map((a, i) => <MangaCard key={a.slug || i} a={a} onClick={() => navigate(`/manga/${a.slug}`)} badge="✓" />)}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
