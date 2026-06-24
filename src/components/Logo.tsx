import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { localizeHref } from "@/lib/i18n";

interface LogoProps {
  locale: string;
  variant?: "light" | "dark";
}

export function Logo({ locale, variant = "dark" }: LogoProps) {
  return (
    <Link
      href={localizeHref("/", locale)}
      className="font-display text-display-sm font-medium tracking-[0.2em] flex items-center gap-2 select-none group/logo logo-shine py-1 px-3 -mx-3 rounded-md transition-all"
    >
      <span className={variant === "dark" ? "text-ink" : "text-ink-inverse"}>
        M<span className="text-accent transition-colors duration-300 group-hover/logo:text-accent-hover">O</span>NDAR
      </span>
      <Sparkles className="w-3.5 h-3.5 text-accent opacity-0 group-hover/logo:opacity-100 group-hover/logo:rotate-[120deg] transition-all duration-700 ease-[var(--ease-spring)] shrink-0" />
    </Link>
  );
}
