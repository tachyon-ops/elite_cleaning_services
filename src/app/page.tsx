import React from "react";
import Link from "next/link";
import { Sparkles, Plane, Ship, Building2, Home, Shield, Check, ChevronDown, Award, Clock } from "lucide-react";
import { checkAndSeedDb } from "@/lib/db/seed-checker";
import { db } from "@/lib/db";
import { cookies, headers } from "next/headers";
import { getTranslationsForLocale, translate, localizeHref } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { COMPANY_CONFIG } from "@/lib/config";

export const dynamic = "force-dynamic";

const verticalMeta: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  subtitle: string;
  title: string;
  description: string;
  priceText: string;
  link: string;
}> = {
  domestic: {
    icon: Sparkles,
    subtitle: "DOMESTIC",
    title: "Home & Villa Cleaning",
    description: "Regular upkeep, deep cleaning, and move-out servicing for premium apartments and villas.",
    priceText: "FROM CHF 80",
    link: "/book/domestic",
  },
  aviation: {
    icon: Plane,
    subtitle: "AVIATION",
    title: "Private Jets & Helicopters",
    description: "Exterior wash, deep interior detailing, and cabin restocking in Swiss hangars and FBOs.",
    priceText: "QUOTE ON REQUEST",
    link: "/book/aviation",
  },
  yacht: {
    icon: Ship,
    subtitle: "YACHT & MARINE",
    title: "Vessels & Yacht Decks",
    description: "Teak cleaning, interior detail, end-of-season decommissioning, and marina access.",
    priceText: "QUOTE ON REQUEST",
    link: "/book/yacht",
  },
  commercial: {
    icon: Building2,
    subtitle: "COMMERCIAL",
    title: "Offices & Co-working",
    description: "Standard cleanups, after-hours deep cleans, and tailored frequencies for office suites.",
    priceText: "FROM CHF 150",
    link: "/book/commercial",
  },
  hospitality: {
    icon: Home,
    subtitle: "HOSPITALITY",
    title: "Airbnb Turnover & B&Bs",
    description: "Fast turnover schedules, linen management, and smartlock key handovers.",
    priceText: "FROM CHF 120",
    link: "/book/hospitality",
  },
  special: {
    icon: Shield,
    subtitle: "SPECIAL SERVICES",
    title: "Biohazard & Post-Incident",
    description: "Restorative cleaning, trauma-incident assistance, and hoarding support. Confidential booking.",
    priceText: "PHONE ONLY",
    link: "/book/special-services",
  }
};

interface CategoryType {
  slug: string;
  customPriceText: string | null;
}

export default async function HomePage() {
  await checkAndSeedDb();

  const reqHeaders = await headers();
  const localeHeader = reqHeaders.get("x-locale");
  const cookieStore = await cookies();
  const locale = localeHeader || cookieStore.get("NEXT_LOCALE")?.value || "de";
  const dictionary = getTranslationsForLocale(locale);
  const t = (key: string) => translate(key, dictionary);

  const activeCategories = await db.serviceCategory.findMany({
    where: { active: true }
  }) as CategoryType[];

  const displayOrder = ["domestic", "aviation", "yacht", "commercial", "hospitality", "special"];

  const sortedCategories = activeCategories.sort((a: CategoryType, b: CategoryType) => {
    const indexA = displayOrder.indexOf(a.slug);
    const indexB = displayOrder.indexOf(b.slug);
    const orderA = indexA === -1 ? 999 : indexA;
    const orderB = indexB === -1 ? 999 : indexB;
    return orderA - orderB;
  });

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col font-body">
      {/* 4.6 Navigation Bar */}
      <Header />

      {/* 5.1 Hero Section */}
      <section className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)] lg:min-h-[720px] bg-bg border-b border-border">
        {/* Left Half: Copy */}
        <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-16 lg:py-0 max-w-4xl">
          <span className="text-caption text-accent uppercase mb-3">{t("hero.division")}</span>
          <h1 className="text-display-md md:text-display-xl text-ink font-display font-medium leading-none tracking-tight mb-6">
            {t("hero.title").split(". ").map((s, i) => (
              <React.Fragment key={i}>
                {s}{i < 2 ? "." : ""}<br />
              </React.Fragment>
            ))}
          </h1>
          <p className="text-body-lg text-ink-muted mb-8 max-w-[55ch]">
            {t("hero.description")}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={localizeHref("/book/general", locale)}
              className="bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3 px-8 rounded-md transition-all shadow-sm hover:shadow-md"
            >
              {t("hero.ctaQuote")}
            </Link>
            <Link
              href="#how-it-works"
              className="border border-ink hover:bg-ink hover:text-ink-inverse text-ink text-button font-semibold py-3 px-8 rounded-md transition-all"
            >
              {t("hero.ctaHow")}
            </Link>
          </div>
        </div>

        {/* Right Half: Editorial Imagery Block (Line-Art & Fallback Graphic per §6.3) */}
        <div className="flex-1 bg-bg-subtle border-t lg:border-t-0 lg:border-l border-border flex items-center justify-center p-8 lg:p-16 relative overflow-hidden select-none">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#926c15_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="border border-border p-8 md:p-12 bg-bg max-w-md w-full relative z-10 rounded-lg shadow-md">
            <span className="text-caption text-accent block mb-2">{t("preview.title")}</span>
            <span className="font-display text-display-lg text-ink font-bold block leading-none mb-1">CHF 0.00</span>
            <span className="text-body-sm text-ink-subtle block mb-6">{t("preview.subtitle")}</span>
            
            <div className="space-y-4 border-t border-border pt-6">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-accent"></div>
                <span className="text-body-sm font-medium text-ink-muted">{t("preview.aviationDetailing")}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-accent"></div>
                <span className="text-body-sm font-medium text-ink-muted">{t("preview.yachtTeakCare")}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-accent"></div>
                <span className="text-body-sm font-medium text-ink-muted">{t("preview.commercialOffices")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="bg-bg-subtle border-b border-border py-6 px-6 md:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            <span className="text-caption text-ink-muted">{t("trust.fullyInsured")}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Award className="w-4 h-4 text-accent" />
            <span className="text-caption text-ink-muted">{t("trust.swissBased")}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-accent" />
            <span className="text-caption text-ink-muted">{t("trust.gdprCompliant")}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            <span className="text-caption text-ink-muted">{t("trust.vettedPartners")}</span>
          </div>
          <div className="flex items-center justify-center gap-2 col-span-2 md:col-span-1">
            <Clock className="w-4 h-4 text-accent" />
            <span className="text-caption text-ink-muted">{t("trust.riskFreeTrial")}</span>
          </div>
        </div>
      </section>

      {/* Vertical Grid Section */}
      <section className="py-24 px-6 md:px-16 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <span className="text-caption text-accent uppercase block mb-3">{t("portfolio.subtitle")}</span>
          <h2 className="text-display-md text-ink font-display font-medium mb-4">{sortedCategories.length} {t("portfolio.title")}</h2>
          <p className="text-body-md text-ink-muted max-w-[60ch] mx-auto">
            {t("portfolio.description")}
          </p>
        </div>

        {/* Dynamic Cards Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedCategories.map((cat: CategoryType, idx: number) => {
            const meta = verticalMeta[cat.slug];
            if (!meta) return null;
            const IconComponent = meta.icon;

            const isDomestic = cat.slug === "domestic";
            const isLast = idx === sortedCategories.length - 1;
            const isOddTotal = sortedCategories.length % 2 !== 0;
            
            const cardColClass = isLast && isOddTotal
              ? `border ${isDomestic ? "border-accent bg-accent-soft/30 hover:bg-accent-soft/45" : "border-border hover:bg-bg-subtle"} p-8 transition-colors flex flex-col justify-between min-h-[300px] md:col-span-2 lg:col-span-1 relative`
              : `border ${isDomestic ? "border-accent bg-accent-soft/30 hover:bg-accent-soft/45" : "border-border hover:bg-bg-subtle"} p-8 transition-colors flex flex-col justify-between min-h-[300px] relative`;

            return (
              <div key={cat.slug} className={cardColClass}>
                {isDomestic && (
                  <span className="absolute top-4 right-4 bg-accent text-ink-inverse text-[9px] uppercase px-2 py-0.5 rounded-sm font-semibold tracking-wider">
                    {t("portfolio.primaryService")}
                  </span>
                )}
                <div>
                  <div className="h-12 w-12 bg-accent-soft rounded-sm flex items-center justify-center text-accent mb-6">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <span className="text-caption text-accent uppercase block mb-1">{t(`categories.${cat.slug}.subtitle`)}</span>
                  <h3 className="text-display-sm text-ink font-medium mb-3">{t(`categories.${cat.slug}.title`)}</h3>
                  <p className="text-body-sm text-ink-muted">
                    {t(`categories.${cat.slug}.description`)}
                  </p>
                </div>
                <div className="pt-6 border-t border-border flex items-center justify-between mt-6">
                  <span className="text-caption text-ink-subtle uppercase">{cat.customPriceText || t(`categories.${cat.slug}.priceText`)}</span>
                  <Link href={localizeHref(meta.link, locale)} className="text-body-sm font-semibold text-accent hover:text-accent-hover transition-colors">{t("portfolio.book")}</Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* WhatsApp Concierge Banner Section */}
      <section className="bg-ink text-ink-inverse py-24 px-6 md:px-16 border-y border-accent/25 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#926c15_1px,transparent_1px)] [background-size:24px_24px]"></div>
        <div className="max-w-7xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <span className="text-caption text-accent uppercase tracking-wider block">{t("concierge.subtitle")}</span>
            <h2 className="text-display-md md:text-display-lg text-ink-inverse font-display font-medium leading-tight">
              {t("concierge.title").split(". ").map((s, i) => (
                <React.Fragment key={i}>
                  {s}{i === 0 ? "." : ""}<br />
                </React.Fragment>
              ))}
            </h2>
            <p className="text-body-md text-ink-subtle max-w-[55ch]">
              {t("concierge.description")}
            </p>
            <div className="flex flex-wrap gap-8 pt-4">
              <div className="flex flex-col">
                <span className="text-display-xs text-accent font-serif font-bold">&lt; 5 Min</span>
                <span className="text-caption text-ink-subtle uppercase">{t("concierge.responseTime")}</span>
              </div>
              <div className="flex flex-col border-l border-ink-muted/30 pl-8">
                <span className="text-display-xs text-accent font-serif font-bold">24 / 7</span>
                <span className="text-caption text-ink-subtle uppercase">{t("concierge.coverage")}</span>
              </div>
              <div className="flex flex-col border-l border-ink-muted/30 pl-8">
                <span className="text-display-xs text-accent font-serif font-bold">Vetted</span>
                <span className="text-caption text-ink-subtle uppercase">{t("concierge.matching")}</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 lg:pl-8">
            <div className="border border-accent/25 bg-bg/5 p-8 rounded-lg backdrop-blur-sm space-y-6">
              <h3 className="text-body-lg font-display text-ink-inverse font-semibold">{t("concierge.howToBook")}</h3>
              <ul className="space-y-4 text-body-sm text-ink-subtle">
                <li className="flex gap-3">
                  <span className="text-accent font-semibold font-serif">1.</span>
                  <span>{t("concierge.step1")}</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent font-semibold font-serif">2.</span>
                  <span>{t("concierge.step2")}</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent font-semibold font-serif">3.</span>
                  <span>{t("concierge.step3")}</span>
                </li>
              </ul>
              <div className="pt-6 border-t border-accent/15">
                <a
                  href={`https://wa.me/${COMPANY_CONFIG.whatsappNumber}?text=Hello%20Elite%20Concierge,%20I'd%20like%20to%20inquire%20about%20a%20specialty%20clean.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3 px-6 rounded-md transition-colors flex items-center justify-center gap-3 shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5 fill-currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span>{t("concierge.cta")}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="bg-bg-subtle border-y border-border py-24 px-6 md:px-16">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <span className="text-caption text-accent uppercase block mb-3">{t("how.subtitle")}</span>
            <h2 className="text-display-md text-ink font-display font-medium mb-4">{t("how.title")}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="flex flex-col">
              <span className="font-display text-display-lg text-accent-soft mb-4">01</span>
              <h3 className="text-display-sm text-ink font-semibold mb-2">{t("how.step1Title")}</h3>
              <p className="text-body-md text-ink-muted">
                {t("how.step1Desc")}
              </p>
            </div>
            <div className="flex flex-col border-t md:border-t-0 md:border-l border-border pt-8 md:pt-0 md:pl-8">
              <span className="font-display text-display-lg text-accent-soft mb-4">02</span>
              <h3 className="text-display-sm text-ink font-semibold mb-2">{t("how.step2Title")}</h3>
              <p className="text-body-md text-ink-muted">
                {t("how.step2Desc")}
              </p>
            </div>
            <div className="flex flex-col border-t md:border-t-0 md:border-l border-border pt-8 md:pt-0 md:pl-8">
              <span className="font-display text-display-lg text-accent-soft mb-4">03</span>
              <h3 className="text-display-sm text-ink font-semibold mb-2">{t("how.step3Title")}</h3>
              <p className="text-body-md text-ink-muted">
                {t("how.step3Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recurring Pitch Section */}
      <section className="py-24 px-6 md:px-16 max-w-4xl mx-auto w-full text-center">
        <span className="text-caption text-accent uppercase block mb-3">{t("recurringSection.subtitle")}</span>
        <h2 className="text-display-md text-ink font-display font-medium mb-4">{t("recurringSection.title")}</h2>
        <p className="text-body-lg text-ink-muted mb-8 max-w-[65ch] mx-auto">
          {t("recurringSection.description")}
        </p>
        <Link
          href={localizeHref("/book/general", locale)}
          className="bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3 px-8 rounded-md transition-colors"
        >
          {t("recurringSection.cta")}
        </Link>
      </section>

      {/* FAQ Section */}
      <section className="bg-bg-subtle border-t border-border py-24 px-6 md:px-16">
        <div className="max-w-3xl mx-auto w-full">
          <div className="text-center mb-16">
            <span className="text-caption text-accent uppercase block mb-3">{t("faqSection.subtitle")}</span>
            <h2 className="text-display-md text-ink font-display font-medium mb-4">{t("faqSection.title")}</h2>
          </div>

          <div className="space-y-6">
            <details className="group border-b border-border pb-6">
              <summary className="list-none flex items-center justify-between cursor-pointer font-semibold text-body-lg text-ink">
                <span>{t("faqSection.q1")}</span>
                <ChevronDown className="w-5 h-5 text-ink-muted group-open:rotate-180 transition-transform duration-base" />
              </summary>
              <p className="text-body-md text-ink-muted mt-4">
                {t("faqSection.a1")}
              </p>
            </details>

            <details className="group border-b border-border pb-6">
              <summary className="list-none flex items-center justify-between cursor-pointer font-semibold text-body-lg text-ink">
                <span>{t("faqSection.q2")}</span>
                <ChevronDown className="w-5 h-5 text-ink-muted group-open:rotate-180 transition-transform duration-base" />
              </summary>
              <p className="text-body-md text-ink-muted mt-4">
                {t("faqSection.a2")}
              </p>
            </details>

            <details className="group border-b border-border pb-6">
              <summary className="list-none flex items-center justify-between cursor-pointer font-semibold text-body-lg text-ink">
                <span>{t("faqSection.q3")}</span>
                <ChevronDown className="w-5 h-5 text-ink-muted group-open:rotate-180 transition-transform duration-base" />
              </summary>
              <p className="text-body-md text-ink-muted mt-4">
                {t("faqSection.a3")}
              </p>
            </details>

            <details className="group border-b border-border pb-6">
              <summary className="list-none flex items-center justify-between cursor-pointer font-semibold text-body-lg text-ink">
                <span>{t("faqSection.q4")}</span>
                <ChevronDown className="w-5 h-5 text-ink-muted group-open:rotate-180 transition-transform duration-base" />
              </summary>
              <p className="text-body-md text-ink-muted mt-4">
                {t("faqSection.a4")}
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Floating WhatsApp Concierge Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        <a
          href={`https://wa.me/${COMPANY_CONFIG.whatsappNumber}?text=Hello%20Elite%20Concierge,%20I'd%20like%20to%20inquire%20about%20a%20specialty%20clean.`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-ink hover:bg-ink-muted text-accent hover:text-accent-hover border border-accent/35 hover:border-accent h-12 w-12 hover:w-[210px] focus:w-[210px] active:w-[210px] rounded-full flex items-center justify-center hover:justify-start hover:px-4 focus:justify-start focus:px-4 active:justify-start active:px-4 transition-all duration-300 shadow-[0_4px_20px_rgba(146,108,21,0.25)] hover:shadow-[0_6px_25px_rgba(146,108,21,0.4)] group overflow-hidden select-none"
        >
          <div className="relative shrink-0 flex items-center justify-center">
            <svg className="w-5 h-5 fill-currentColor animate-pulse" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
          </div>
          <span className="max-w-0 opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 group-hover:ml-3 group-focus:max-w-[150px] group-focus:opacity-100 group-focus:ml-3 group-active:max-w-[150px] group-active:opacity-100 group-active:ml-3 transition-all duration-300 ease-out whitespace-nowrap text-caption tracking-wider font-semibold text-ink-inverse group-hover:text-accent group-focus:text-accent group-active:text-accent">
            CONCIERGE ON-CALL
          </span>
        </a>
      </div>
    </div>
  );
}
