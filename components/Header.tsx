'use client';

import Image from 'next/image';

interface HeaderProps {
  onExport?: () => void;
}

export default function Header({ onExport }: HeaderProps) {
  return (
    <div
      className="border-b border-white/60 sticky top-0 z-50 shadow-md"
      style={{
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
      }}
    >
      <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">

        {/* Left — Export button */}
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-5 py-2.5 glass-soft rounded-xl text-sm font-semibold text-gray-700 hover:bg-white/70 active:scale-95 transition border border-white/60"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>

        {/* Center — wordmark */}
        <div className="text-center absolute left-1/2 -translate-x-1/2">
          <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent leading-none">
            PULSE
          </h1>
          <p className="text-[12px] font-bold tracking-[0.18em] text-gray-500 uppercase mt-1">
            MCT Department
          </p>
        </div>

        {/* Right — Logo */}
        <div className="glass-soft rounded-xl p-2 border border-white/60">
          <Image
            src="/AT-Logo.png"
            alt="Axestrack"
            width={240}
            height={120}
            className="object-contain h-28 w-auto"
          />
        </div>
      </div>
    </div>
  );
}
