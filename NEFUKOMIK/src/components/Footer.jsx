import React from 'react';

const Footer = () => (
  <footer className="mt-16 bg-[#0a0a0c] border-t border-white/5 pt-12 pb-0 px-6">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 mb-12 items-start">
      <div className="flex flex-col">
        <span className="text-[#F6CF80] font-black text-2xl mb-3 tracking-tight">DoujinDesu</span>
        <p className="text-[10px] md:text-xs text-white/50 leading-relaxed font-medium max-w-xs">
          Platform baca manga, manhwa & doujinshi. Kami tidak mengunggah atau menyimpan konten di server kami. Semua konten disediakan oleh pihak ketiga.
        </p>
      </div>
      <div className="flex flex-col gap-3 md:ml-auto text-right">
        <h4 className="text-white font-black text-sm tracking-wide">Jelajahi</h4>
        <div className="flex flex-col gap-2 items-end">
          {[['Manga', '/browse?type=manga'], ['Manhwa', '/browse?type=manhwa'], ['Doujinshi', '/browse?type=doujinshi'], ['Semua Genre', '/explore']].map(([label, href]) => (
            <a key={href} href={href} className="text-white/40 hover:text-[#F6CF80] text-xs font-bold transition-colors">{label}</a>
          ))}
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto border-t border-white/5 py-6 text-center">
      <p className="text-[10px] text-white/30 font-black tracking-widest uppercase">© {new Date().getFullYear()} DoujinDesu Reader · All Rights Reserved</p>
    </div>
  </footer>
);

export default Footer;
