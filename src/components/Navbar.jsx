import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { imgUrl } from '../utils/api';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen]   = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');
  const [liveResults, setLiveResults]     = useState([]);
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current)
      setTimeout(() => searchInputRef.current?.focus(), 300);
    else { setSearchQuery(''); setLiveResults([]); }
  }, [isSearchOpen]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsLiveLoading(true);
        try {
          const res  = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
          const data = await res.json();
          setLiveResults(Array.isArray(data) ? data.slice(0, 8) : []);
        } catch { setLiveResults([]); }
        setIsLiveLoading(false);
      } else setLiveResults([]);
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  const navLinks = [
    { path: '/home',    label: 'Home',
      d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/explore', label: 'Explore',
      d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { path: '/browse',  label: 'Browse',
      d: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
    { path: '/history', label: 'History',
      d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  const activeIndex = navLinks.findIndex(l => location.pathname.startsWith(l.path));
  const notchLeft   = activeIndex >= 0 ? `${activeIndex * 25 + 12.5}%` : '50%';

  return (
    <>
      <style>{`
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px) scaleY(0.95)}to{opacity:1;transform:translateY(0) scaleY(1)}}

        /* ── Bottom notch nav ── */
        .notch-nav{
          position:relative;height:68px;
          background:rgba(8,12,20,0.97);
          border:1px solid rgba(79,142,247,0.12);
          border-radius:32px;
          display:flex;align-items:flex-end;justify-content:space-around;
          box-shadow:0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(79,142,247,0.05);
          padding-bottom:8px;
          backdrop-filter:blur(20px);
        }
        /* Notch cut-out */
        .notch-nav::before{
          content:'';position:absolute;top:-1px;
          left:${notchLeft};transform:translateX(-50%);
          width:62px;height:30px;
          background:rgba(8,12,20,0.97);
          border-radius:0 0 50% 50%/0 0 100% 100%;
          border:1px solid rgba(79,142,247,0.12);
          border-top:none;
          transition:left 0.45s cubic-bezier(0.34,1.56,0.64,1);
          z-index:0;
        }
        /* Notch glow line */
        .notch-nav::after{
          content:'';position:absolute;top:0;left:0;right:0;height:1px;
          background:linear-gradient(90deg,transparent,rgba(79,142,247,0.3),transparent);
          border-radius:32px;pointer-events:none;
        }

        .notch-item{
          position:relative;display:flex;flex-direction:column;
          align-items:center;justify-content:flex-end;
          cursor:pointer;flex:1;height:100%;padding-bottom:6px;z-index:1;
        }
        .notch-icon-wrapper{
          width:42px;height:42px;
          display:flex;align-items:center;justify-content:center;
          border-radius:14px;margin-bottom:2px;
          transition:all 0.45s cubic-bezier(0.34,1.56,0.64,1);
        }
        .notch-icon-wrapper.active{
          background:linear-gradient(135deg,#4f8ef7,#3a6fd4);
          transform:translateY(-18px) scale(1.08);
          box-shadow:0 8px 28px rgba(79,142,247,0.45), 0 0 0 3px rgba(79,142,247,0.15);
          border-radius:16px;
        }
        .notch-label{
          font-size:9px;font-weight:800;letter-spacing:0.04em;
          transition:all 0.3s ease;opacity:0;
          transform:translateY(5px);position:absolute;bottom:7px;
        }
        .notch-label.active{opacity:1;transform:translateY(0);color:#4f8ef7;}

        /* Search results scroll */
        .srch-scroll::-webkit-scrollbar{width:3px}
        .srch-scroll::-webkit-scrollbar-track{background:transparent}
        .srch-scroll::-webkit-scrollbar-thumb{background:rgba(79,142,247,0.2);border-radius:4px}
      `}</style>

      {/* Top navbar */}
      <nav className="fixed top-2 inset-x-4 z-[100] max-w-7xl mx-auto">
        <div className="bg-[#080c14]/80 backdrop-blur-xl h-14 px-5 rounded-2xl flex items-center justify-between border border-[#4f8ef7]/10 shadow-[0_4px_24px_rgba(0,0,0,0.4)] relative overflow-hidden">

          {/* Brand */}
          <span
            className="text-[#4f8ef7] font-black text-xl tracking-tight cursor-pointer z-10 select-none"
            onClick={() => navigate('/home')}>
            NekoToons
          </span>

          {/* Search button */}
          <div className="flex items-center gap-2 z-10">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-9 h-9 bg-[#4f8ef7]/10 rounded-full flex items-center justify-center text-[#4f8ef7] border border-[#4f8ef7]/20 hover:bg-[#4f8ef7] hover:text-white hover:border-[#4f8ef7] transition-all duration-200 active:scale-90">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </button>
          </div>

          {/* Search overlay */}
          <div className={`absolute inset-0 bg-[#0f1520] z-20 flex items-center px-4 transition-all duration-300 rounded-2xl ${isSearchOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-3">
              <button type="submit" className="text-[#4f8ef7] shrink-0 p-1.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </button>
              <input
                ref={searchInputRef}
                type="text"
                className="flex-1 bg-transparent text-white text-sm outline-none font-semibold placeholder-white/25"
                placeholder="Cari manga, manhwa..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button type="button" onClick={() => setIsSearchOpen(false)} className="text-white/30 hover:text-white p-1.5 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* Live search results */}
        {isSearchOpen && searchQuery.length > 2 && (
          <div className="absolute top-16 left-0 right-0 md:left-auto md:right-0 md:w-96 bg-[#0f1520] border border-[#4f8ef7]/15 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.6)] z-[110] max-h-[60vh] overflow-y-auto srch-scroll animate-[slideDown_0.2s_ease-out]">
            {isLiveLoading ? (
              <div className="p-6 text-center text-[#4f8ef7] text-xs font-bold tracking-wider">Mencari...</div>
            ) : liveResults.length > 0 ? liveResults.map((r, i) => (
              <div key={r.slug}
                onClick={() => { navigate(`/manga/${r.slug}`); setIsSearchOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#4f8ef7]/5 cursor-pointer border-b border-white/5 last:border-0 transition-colors">
                <img src={imgUrl(r.image)} className="w-9 aspect-[3/4.5] object-cover rounded-md shadow-md shrink-0" alt={r.name} />
                <div className="flex flex-col min-w-0">
                  <span className="text-white font-bold text-xs line-clamp-1">{r.name}</span>
                  <span className="text-[#4f8ef7]/60 font-bold text-[9px] mt-0.5 uppercase tracking-wider">{r.type || r.status || ''}</span>
                </div>
                <svg className="w-4 h-4 text-white/15 shrink-0 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            )) : (
              <div className="p-6 text-center text-white/30 text-xs font-bold">Tidak ditemukan</div>
            )}
          </div>
        )}
      </nav>

      {/* Bottom notch nav */}
      <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-sm z-[90]">
        <div className="notch-nav">
          {navLinks.map(link => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <div key={link.path} className="notch-item" onClick={() => navigate(link.path)}>
                <div className={`notch-icon-wrapper ${isActive ? 'active' : ''}`}>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke={isActive ? 'white' : 'rgba(255,255,255,0.35)'}
                    strokeWidth="2.5"
                    viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={link.d}/>
                  </svg>
                </div>
                <span className={`notch-label ${isActive ? 'active' : ''}`}>{link.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Navbar;
