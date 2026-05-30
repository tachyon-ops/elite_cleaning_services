import React from "react";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { getTranslationsForLocale, translate as t, localizeHref } from "@/lib/i18n";
import { ShieldCheck, TrendingUp, Handshake, CheckSquare, ChevronRight } from "lucide-react";

export default async function ProvidersLandingPage() {
  const reqHeaders = await headers();
  const localeHeader = reqHeaders.get("x-locale");
  const cookieStore = await cookies();
  const locale = localeHeader || cookieStore.get("NEXT_LOCALE")?.value || "de";
  const dict = getTranslationsForLocale(locale);

  return (
    <div className="min-h-screen bg-[#080808] text-[#f2f2f2] font-body relative overflow-hidden">
      {/* Radial grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(197,160,89,0.05),transparent_60%)] pointer-events-none" />

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center border-b border-[#1f1f1f]">
        <Link href={localizeHref("/", locale)} className="font-display font-medium text-body-lg tracking-widest text-[#f2f2f2] hover:text-accent transition-colors">
          {t("providers.nav.brand", dict)}
        </Link>
        <div className="flex gap-4 items-center">
          <Link
            href={localizeHref("/providers/account/login", locale)}
            className="text-body-sm font-medium text-[#a6a6a6] hover:text-[#f2f2f2] transition-colors mr-2"
          >
            {t("providers.nav.signIn", dict)}
          </Link>
          <Link
            href={localizeHref("/providers/apply", locale)}
            className="bg-accent hover:bg-accent-hover text-ink-inverse text-button px-5 py-2.5 rounded font-semibold transition-colors"
          >
            {t("providers.nav.apply", dict)}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center py-20 px-6 space-y-6">
        <span className="text-caption text-accent uppercase tracking-widest font-semibold">{t("providers.hero.subtitle", dict)}</span>
        <h1 className="text-display-lg md:text-display-xl font-display font-medium text-[#f2f2f2] tracking-tight leading-tight">
          {t("providers.hero.title", dict)}
        </h1>
        <p className="text-body-lg text-[#a6a6a6] max-w-2xl mx-auto leading-relaxed">
          {t("providers.hero.description", dict)}
        </p>
        <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href={localizeHref("/providers/apply", locale)}
            className="bg-accent hover:bg-accent-hover text-ink-inverse text-button px-8 py-4 rounded font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {t("providers.hero.submit", dict)} <ChevronRight className="w-4 h-4" />
          </Link>
          <a
            href="#requirements"
            className="border border-[#262626] bg-[#141414] hover:bg-[#1f1f1f] text-[#f2f2f2] text-button px-8 py-4 rounded font-semibold transition-colors flex items-center justify-center"
          >
            {t("providers.hero.review", dict)}
          </a>
        </div>
      </section>

      {/* Three Columns Offer */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-[#1f1f1f] grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="border border-[#262626] bg-[#141414] p-8 rounded-lg space-y-4">
          <div className="h-12 w-12 bg-accent/10 text-accent rounded-full flex items-center justify-center border border-accent/25">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-body-lg font-semibold text-[#f2f2f2]">{t("providers.features.f1Title", dict)}</h3>
          <p className="text-body-sm text-[#a6a6a6] leading-relaxed">
            {t("providers.features.f1Desc", dict)}
          </p>
        </div>

        <div className="border border-[#262626] bg-[#141414] p-8 rounded-lg space-y-4">
          <div className="h-12 w-12 bg-accent/10 text-accent rounded-full flex items-center justify-center border border-accent/25">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-body-lg font-semibold text-[#f2f2f2]">{t("providers.features.f2Title", dict)}</h3>
          <p className="text-body-sm text-[#a6a6a6] leading-relaxed">
            {t("providers.features.f2Desc", dict)}
          </p>
        </div>

        <div className="border border-[#262626] bg-[#141414] p-8 rounded-lg space-y-4">
          <div className="h-12 w-12 bg-accent/10 text-accent rounded-full flex items-center justify-center border border-accent/25">
            <Handshake className="w-6 h-6" />
          </div>
          <h3 className="text-body-lg font-semibold text-[#f2f2f2]">{t("providers.features.f3Title", dict)}</h3>
          <p className="text-body-sm text-[#a6a6a6] leading-relaxed">
            {t("providers.features.f3Desc", dict)}
          </p>
        </div>
      </section>

      {/* Requirements Section */}
      <section id="requirements" className="max-w-4xl mx-auto px-6 py-16 space-y-10 border-t border-[#1f1f1f]">
        <div className="text-center space-y-3">
          <h2 className="text-display-md font-display font-medium text-[#f2f2f2] tracking-tight">{t("providers.compliance.title", dict)}</h2>
          <p className="text-body-md text-[#a6a6a6]">{t("providers.compliance.subtitle", dict)}</p>
        </div>

        <div className="border border-[#262626] bg-[#141414] p-8 rounded-lg space-y-6">
          <h3 className="text-body-md font-semibold text-[#f2f2f2] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent" /> {t("providers.compliance.prereqs", dict)}
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-body-sm text-[#a6a6a6]">
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 bg-accent rounded-full" /> {t("providers.compliance.item1", dict)}
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 bg-accent rounded-full" /> {t("providers.compliance.item2", dict)}
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 bg-accent rounded-full" /> {t("providers.compliance.item3", dict)}
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 bg-accent rounded-full" /> {t("providers.compliance.item4", dict)}
            </li>
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1f1f1f] bg-[#0d0d0d] py-8 text-center text-[#595959] text-body-xs font-mono">
        &copy; {new Date().getFullYear()} {t("providers.footer.copyright", dict)}
      </footer>
    </div>
  );
}
