import React from "react";
import { headers, cookies } from "next/headers";
import { getTranslationsForLocale, translate } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { InteractiveDusting } from "@/components/InteractiveDusting";

export default async function NotFound() {
  const reqHeaders = await headers();
  const localeHeader = reqHeaders.get("x-locale");
  const cookieStore = await cookies();
  const locale = localeHeader || cookieStore.get("NEXT_LOCALE")?.value || "de";
  const dictionary = getTranslationsForLocale(locale);
  const t = (key: string) => translate(key, dictionary);

  return (
    <div className="flex flex-col min-h-screen bg-bg text-ink">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-16 md:py-24 px-6 bg-bg">
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
          <span className="text-caption text-accent uppercase tracking-[0.2em] block mb-4 font-semibold">
            Error 404
          </span>
          
          <h1 className="font-display text-display-md md:text-display-lg text-ink mb-6 text-center leading-tight max-w-xl">
            {t("error404.title")}
          </h1>
          
          <p className="text-body-md md:text-body-lg text-ink-muted mb-12 text-center max-w-lg leading-relaxed">
            {t("error404.description")}
          </p>
          
          <InteractiveDusting />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
