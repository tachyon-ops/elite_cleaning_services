"use client";

import React, { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { useLanguage } from "./LanguageProvider";
import { ChevronDown, Globe } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
  { code: "rm", label: "Rumantsch" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
];

export function LanguageSwitcher() {
  const { locale, changeLanguage, isPending } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const activeLang = LANGUAGES.find((lang) => lang.code === locale) || LANGUAGES[0];

  const handleSelect = async (code: string) => {
    setIsOpen(false);
    if (code !== locale) {
      await changeLanguage(code);
    }
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={isPending}
          className="inline-flex items-center justify-between gap-1.5 md:gap-2 border border-border/40 bg-bg/5 hover:bg-accent-soft/30 hover:border-accent/30 px-2 py-1 md:px-3 md:py-1.5 rounded-sm select-none transition-all cursor-pointer text-[10px] md:text-body-xs font-semibold tracking-wider text-ink-muted hover:text-ink disabled:opacity-40"
        >
          <Globe className="w-3.5 h-3.5 text-accent shrink-0" />
          <span className="uppercase">{activeLang.code}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-ink-subtle transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className="w-40 rounded-md bg-bg/95 backdrop-blur-md border border-border/60 shadow-xl ring-1 ring-black/5 focus:outline-none z-[100] data-[state=open]:animate-popover-in data-[state=closed]:animate-popover-out"
        >
          <div className="py-1" role="menu" aria-orientation="vertical">
            {LANGUAGES.map((lang) => {
              const isSelected = lang.code === locale;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full text-left px-4 py-2 text-body-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-accent/10 text-accent font-semibold"
                      : "text-ink-muted hover:bg-accent-soft/35 hover:text-ink"
                  }`}
                  role="menuitem"
                >
                  <span>{lang.label}</span>
                  <span className="text-[10px] text-ink-subtle uppercase font-mono tracking-widest">{lang.code}</span>
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
