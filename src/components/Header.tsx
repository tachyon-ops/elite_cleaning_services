import React from "react";
import Link from "next/link";
import { Sparkles, Plane, Ship, Building2, Home, Shield, ChevronDown, Key, Building, ChefHat } from "lucide-react";
import { db } from "@/lib/db";
import { cookies, headers } from "next/headers";
import { getTranslationsForLocale, translate, localizeHref } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";

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
  moveout: {
    icon: Key,
    subtitle: "END OF TENANCY",
    title: "Move-Out & End Clean",
    description: "Deep cleaning with a handover guarantee for apartment and house returns to landlords.",
    priceText: "QUOTE ON REQUEST",
    link: "/book/moveout",
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
  },
  "building-care": {
    icon: Building,
    subtitle: "BUILDING CARE",
    title: "Building Care",
    description: "Common-area cleaning, entrances, and staircase care for premium residential buildings.",
    priceText: "QUOTE ON REQUEST",
    link: "/book/building-care",
  },
  restaurant: {
    icon: ChefHat,
    subtitle: "RESTAURANT & KITCHEN",
    title: "Restaurant & Kitchen",
    description: "Certified kitchen extraction compliance (Tier A) and nightly after-hours maintenance (Tier B).",
    priceText: "QUOTE ON REQUEST",
    link: "/book/restaurant",
  }
};

interface CategoryType {
  slug: string;
  customPriceText: string | null;
}

export async function Header() {
  const reqHeaders = await headers();
  const localeHeader = reqHeaders.get("x-locale");
  const cookieStore = await cookies();
  const locale = localeHeader || cookieStore.get("NEXT_LOCALE")?.value || "de";
  const dictionary = getTranslationsForLocale(locale);
  const t = (key: string) => translate(key, dictionary);

  const activeCategories = await db.serviceCategory.findMany({
    where: { active: true }
  }) as CategoryType[];

  const displayOrder = ["domestic", "moveout", "aviation", "yacht", "commercial", "hospitality", "special", "building-care", "restaurant"];

  const sortedCategories = activeCategories.sort((a: CategoryType, b: CategoryType) => {
    const indexA = displayOrder.indexOf(a.slug);
    const indexB = displayOrder.indexOf(b.slug);
    const orderA = indexA === -1 ? 999 : indexA;
    const orderB = indexB === -1 ? 999 : indexB;
    return orderA - orderB;
  });

  return (
    <header className="h-[80px] bg-bg/85 backdrop-blur-md border-b border-border/30 flex items-center justify-between px-6 md:px-16 sticky top-0 z-50">
      <div className="flex items-center">
        <Logo locale={locale} variant="dark" />
      </div>
      <nav className="hidden md:flex gap-8 items-center">
        {/* Services Dropdown */}
        <div className="relative group/dropdown py-2">
          <button className="flex items-center gap-1.5 text-body-sm font-medium text-ink-muted hover:text-ink transition-colors cursor-pointer">
            {t("nav.services")}
            <ChevronDown className="w-3.5 h-3.5 transition-transform duration-300 group-hover/dropdown:rotate-180 text-ink-subtle" />
          </button>
          <div className="absolute top-[calc(100%-4px)] left-1/2 -translate-x-1/2 pt-3 opacity-0 pointer-events-none group-hover/dropdown:opacity-100 group-hover/dropdown:pointer-events-auto transition-all duration-300 ease-out translate-y-2 group-hover/dropdown:translate-y-0 z-50">
            <div className="bg-bg/95 backdrop-blur-md border border-border/60 rounded-lg shadow-xl p-4 w-72 grid grid-cols-1 gap-1">
              <span className="text-[10px] text-accent font-semibold tracking-wider px-3 pb-2 uppercase border-b border-border/20 mb-1 block">
                Mondar Divisions
              </span>
              {sortedCategories.map((cat: CategoryType) => {
                const meta = verticalMeta[cat.slug];
                if (!meta) return null;
                const IconComponent = meta.icon;
                return (
                  <Link
                    key={cat.slug}
                    href={localizeHref(meta.link || `/book/${cat.slug}`, locale)}
                    className="flex items-center gap-3.5 px-3 py-2 rounded-md hover:bg-accent-soft/45 transition-colors group/item"
                  >
                    <div className="h-8 w-8 bg-accent-soft text-accent rounded-sm flex items-center justify-center border border-accent/10 group-hover/item:border-accent/25 transition-colors shrink-0">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-body-sm font-semibold text-ink group-hover/item:text-accent transition-colors">
                        {t(`categories.${cat.slug}.title`)}
                      </span>
                      <span className="text-[10px] text-ink-subtle uppercase tracking-wider group-hover/item:text-accent/70 transition-colors">
                        {t(`categories.${cat.slug}.subtitle`)} • {cat.customPriceText || t(`categories.${cat.slug}.priceText`)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        <Link href={localizeHref("/#how-it-works", locale)} className="text-body-sm font-medium text-ink-muted hover:text-ink transition-colors">{t("nav.howItWorks")}</Link>
        <Link href={localizeHref("/providers", locale)} className="text-body-sm font-medium text-ink-muted hover:text-ink transition-colors">{t("nav.partnerPortal")}</Link>
      </nav>
      <div className="flex items-center gap-6 pr-12 md:pr-0 lg:pr-24">
        <LanguageSwitcher />
        <Link
          href={localizeHref("/book/general", locale)}
          className="bg-accent hover:bg-accent-hover text-ink-inverse text-body-xs tracking-wider uppercase font-semibold py-3 px-6 rounded-sm shadow-sm transition-all hover:shadow-md cursor-pointer"
        >
          {t("nav.getQuote")}
        </Link>
      </div>
    </header>
  );
}
