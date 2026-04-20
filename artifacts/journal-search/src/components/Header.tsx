/**
 * Header component — Universitas Murni Teguh library branding.
 */

import { BookOpen } from "lucide-react";

export function Header() {
  return (
    <header className="bg-primary text-primary-foreground" data-testid="header">
      {/* Top micro-bar */}
      <div className="border-b border-white/10 bg-black/15">
        <div className="max-w-screen-xl mx-auto px-8 py-1.5 flex items-center justify-between">
          <span className="text-[11px] font-medium tracking-widest uppercase opacity-75">
            Universitas Murni Teguh
          </span>
          <span className="text-[11px] opacity-60 hidden sm:block">
            Library &amp; Information Services
          </span>
        </div>
      </div>

      {/* Main header row */}
      <div className="max-w-screen-xl mx-auto px-8 py-5 flex items-center gap-5">
        {/* Logo mark */}
        <div className="flex items-center justify-center w-12 h-12 bg-white/15 rounded-xl border border-white/20 shrink-0">
          <BookOpen className="w-6 h-6 text-white" aria-hidden="true" />
        </div>

        {/* Title block */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-serif font-bold leading-tight tracking-tight">
            Open Access Journal Search
          </h1>
          <p className="text-sm opacity-70 mt-0.5">
            Discover freely available scholarly literature
          </p>
        </div>

        <div className="flex-1" />

        {/* Metadata-only notice */}
        <span className="hidden md:flex items-center gap-1.5 text-xs bg-white/10 border border-white/15 rounded-full px-4 py-1.5 opacity-90">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block" />
          Metadata only &mdash; links to original sources
        </span>
      </div>
    </header>
  );
}
