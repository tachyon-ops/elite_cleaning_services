"use client";

import React from "react";
import { useLanguage } from "./LanguageProvider";

export function LanguageSwitcher() {
  const { locale, changeLanguage, isPending } = useLanguage();

  return (
    <div className="inline-flex items-center gap-1 border border-border/40 bg-bg/5 p-1 rounded-sm select-none">
      <button
        type="button"
        onClick={() => changeLanguage("en")}
        disabled={isPending}
        className={`px-2 py-0.5 text-[9px] font-semibold tracking-wider rounded-xs transition-all cursor-pointer ${
          locale === "en"
            ? "bg-accent text-ink-inverse"
            : "text-ink-muted hover:text-ink hover:bg-accent-soft/40"
        } disabled:opacity-40`}
      >
        EN
      </button>
      <span className="text-[9px] text-border/60 select-none">|</span>
      <button
        type="button"
        onClick={() => changeLanguage("de")}
        disabled={isPending}
        className={`px-2 py-0.5 text-[9px] font-semibold tracking-wider rounded-xs transition-all cursor-pointer ${
          locale === "de"
            ? "bg-accent text-ink-inverse"
            : "text-ink-muted hover:text-ink hover:bg-accent-soft/40"
        } disabled:opacity-40`}
      >
        DE
      </button>
    </div>
  );
}
