"use client";

import React, { createContext, useContext, useTransition } from "react";
import { translate } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { updateUserLocale } from "@/app/actions/locale";

interface LanguageContextProps {
  locale: string;
  t: (key: string) => string;
  changeLanguage: (newLocale: string) => Promise<void>;
  isPending: boolean;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({
  children,
  locale,
  dictionary,
}: {
  children: React.ReactNode;
  locale: string;
  dictionary: any;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const t = (key: string) => translate(key, dictionary);

  const changeLanguage = async (newLocale: string) => {
    if (newLocale === locale) return;
    
    startTransition(async () => {
      await updateUserLocale(newLocale);
      
      const pathname = window.location.pathname;
      const parts = pathname.split("/");
      const firstSegment = parts[1];
      const locales = ["de", "en", "fr", "it", "rm", "es", "pt"];
      
      let newPathname = pathname;
      if (locales.includes(firstSegment)) {
        if (newLocale === "de") {
          // Remove prefix for default locale
          newPathname = pathname.replace(`/${firstSegment}`, "") || "/";
        } else {
          // Replace prefix
          parts[1] = newLocale;
          newPathname = parts.join("/");
        }
      } else {
        if (newLocale !== "de") {
          // Add prefix
          newPathname = `/${newLocale}${pathname === "/" ? "" : pathname}`;
        }
      }
      
      window.location.href = newPathname;
    });
  };

  return (
    <LanguageContext.Provider value={{ locale, t, changeLanguage, isPending }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
