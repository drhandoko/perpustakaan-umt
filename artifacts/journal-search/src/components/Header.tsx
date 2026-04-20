/**
 * Header component with campus/library branding.
 * Update the institution name, tagline, and logo mark to match your campus.
 */

import { BookOpen } from "lucide-react";

export function Header() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md" data-testid="header">
      <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center gap-4">
        {/* Logo mark */}
        <div className="flex items-center justify-center w-10 h-10 bg-white/15 rounded-lg">
          <BookOpen className="w-6 h-6 text-white" aria-hidden="true" />
        </div>

        {/* Branding text */}
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-widest opacity-80 leading-none">
            University Library
          </span>
          <h1 className="text-xl font-serif font-bold leading-tight tracking-tight">
            Open Access Journal Search
          </h1>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Disclaimer badge */}
        <span className="hidden sm:block text-xs bg-white/10 border border-white/20 rounded-full px-3 py-1 opacity-90">
          Metadata only &mdash; links to original sources
        </span>
      </div>
    </header>
  );
}
