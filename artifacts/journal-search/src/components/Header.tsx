/**
 * Header component — Universitas Murni Teguh library branding.
 */

import { BookOpen } from "lucide-react";

export function Header() {
  return (
    <header className="bg-primary text-primary-foreground" data-testid="header">
      {/* Top micro-bar */}
      <div className="border-b border-primary/15 bg-white">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-8 py-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-medium tracking-widest uppercase text-primary">
            <img
              src="/logo.png"
              alt="Universitas Murni Teguh logo"
              className="h-4 w-auto"
            />
            <span className="hidden xs:inline">Universitas Murni Teguh</span>
            <span className="xs:hidden">UMT</span>
          </span>
          <span className="text-[11px] text-primary/60 hidden sm:block">
            Library &amp; Information Services
          </span>
        </div>
      </div>

      {/* Main header row */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-8 py-4 sm:py-5 flex items-center gap-3 sm:gap-5">
        {/* Logo mark */}
        <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white/15 rounded-xl border border-white/20 shrink-0">
          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" aria-hidden="true" />
        </div>

        {/* Title block */}
        <div className="flex flex-col min-w-0">
          <h1 className="text-lg sm:text-2xl font-serif font-bold leading-tight tracking-tight">
            Perpustakaan UMT
          </h1>
          <p className="text-xs sm:text-sm opacity-70 mt-0.5 hidden sm:block">
            Discover freely available scholarly literature
          </p>
        </div>

        <div className="flex-1" />

        {/* Metadata-only notice */}
        <span className="hidden md:flex items-center gap-1.5 text-xs bg-white/10 border border-white/15 rounded-full px-4 py-1.5 opacity-90 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block" />
          Metadata only &mdash; links to original sources
        </span>
      </div>
    </header>
  );
}
