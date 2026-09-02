"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { localizeHref } from "@/lib/i18n";
import { ShieldCheck, X } from "lucide-react";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

function setCookie(name: string, value: string, days: number) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = "expires=" + d.toUTCString();
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`;
}

export function CookieBanner() {
  const { locale, t } = useLanguage();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  // Never display cookie banner in backoffice admin pages
  if (pathname?.startsWith("/admin") || pathname?.includes("/admin")) {
    return null;
  }

  useEffect(() => {
    // Check if consent has already been given
    const consent = getCookie("cookie_consent");
    if (!consent) {
      // Delay showing the banner slightly for better visual entry
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (level: "necessary" | "accepted") => {
    setCookie("cookie_consent", level, 365); // Store for 1 year
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const cookiesLink = localizeHref("/legal/cookies", locale);

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md bg-bg/95 backdrop-blur-md border border-accent/20 rounded-md p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[100] animate-popover-in flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-body-sm font-semibold tracking-wider text-ink uppercase mb-1 flex items-center justify-between">
            <span>Cookie Settings</span>
            <button
              onClick={() => handleConsent("necessary")}
              className="text-ink-subtle hover:text-ink transition-colors p-0.5 rounded-full hover:bg-accent-soft/20 md:hidden cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </h3>
          <p className="text-body-xs text-ink-subtle leading-relaxed">
            {t("cookieBanner.text")}{" "}
            <Link
              href={cookiesLink}
              className="text-accent hover:underline font-semibold transition-all inline-flex items-center gap-0.5"
            >
              {t("cookieBanner.policyLinkText")}
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="flex gap-3 justify-end items-center mt-2">
        <button
          type="button"
          onClick={() => handleConsent("necessary")}
          className="px-4 py-2 border border-border/60 hover:bg-accent-soft/25 text-ink-muted hover:text-accent rounded text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer"
        >
          {t("cookieBanner.necessary")}
        </button>
        <button
          type="button"
          onClick={() => handleConsent("accepted")}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-ink-inverse rounded text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
        >
          {t("cookieBanner.accept")}
        </button>
      </div>
    </div>
  );
}
